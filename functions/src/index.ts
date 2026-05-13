import { setGlobalOptions } from "firebase-functions";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import { initializeApp } from "firebase-admin/app";
import { FieldValue, Firestore, getFirestore } from "firebase-admin/firestore";
import * as nodemailer from "nodemailer";
import * as logger from "firebase-functions/logger";

setGlobalOptions({ maxInstances: 10 });
initializeApp();

const gmailUser = defineSecret("GMAIL_USER");
const gmailPass = defineSecret("GMAIL_PASS");

const ADMIN_EMAILS = ["saralaracorrea@gmail.com", "serdumo@gmail.com"];
const SENDING_LOCK_TTL_MS = 10 * 60 * 1000;

function timestampToMillis(value: unknown): number {
  if (
    typeof value === "object" &&
    value !== null &&
    "toMillis" in value &&
    typeof (value as { toMillis: () => number }).toMillis === "function"
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }

  return 0;
}

async function claimNotificationSend(db: Firestore, orderId: string): Promise<boolean> {
  const logRef = db.collection("notification_logs").doc(`order-${orderId}-admin-email`);
  const now = Date.now();

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(logRef);
    const existing = snapshot.exists ? snapshot.data() || {} : {};
    const status = String(existing.status || "");
    const updatedAt = timestampToMillis(existing.updated_at);
    const attempts = Number(existing.attempts || 0);

    if (status === "sent") {
      return false;
    }

    if (status === "sending" && now - updatedAt < SENDING_LOCK_TTL_MS) {
      return false;
    }

    transaction.set(
      logRef,
      {
        type: "admin_new_order_email",
        order_id: orderId,
        status: "sending",
        attempts: attempts + 1,
        created_at: existing.created_at || FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp()
      },
      { merge: true }
    );

    return true;
  });
}

async function markNotificationSent(db: Firestore, orderId: string) {
  await db.collection("notification_logs").doc(`order-${orderId}-admin-email`).set(
    {
      status: "sent",
      sent_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp()
    },
    { merge: true }
  );
}

async function markNotificationFailed(db: Firestore, orderId: string, err: unknown) {
  const message = err instanceof Error ? err.message : String(err);

  await db.collection("notification_logs").doc(`order-${orderId}-admin-email`).set(
    {
      status: "failed",
      error: message,
      updated_at: FieldValue.serverTimestamp()
    },
    { merge: true }
  );
}

export const notifyAdminOnNewOrder = onDocumentCreated(
  { document: "orders/{orderId}", secrets: [gmailUser, gmailPass] },
  async (event) => {
    const orderId = event.params.orderId;
    const order = event.data?.data();
    if (!order) return;

    const db = getFirestore();
    const shouldSend = await claimNotificationSend(db, orderId);

    if (!shouldSend) {
      logger.info(`Notificación omitida para pedido ${orderId}: ya existe un envío activo o completado.`);
      return;
    }

    const itemsSnap = await db.collection("orders").doc(orderId).collection("items").get();
    const items = itemsSnap.docs.map((doc) => doc.data());

    const itemsText = items
      .map((item) => `  • ${item.quantity}x ${item.product_name} — $${Number(item.unit_price).toLocaleString("es-CO")}`)
      .join("\n");

    const deliveryInfo = order.delivery_method === "domicilio"
      ? `Domicilio: ${order.delivery_address || "sin dirección"}`
      : "Recoger en tienda";

    const source = order.source === "manual" ? " (manual)" : "";

    const body = [
      `Nuevo pedido en Lara Bakery${source}`,
      ``,
      `Pedido:   ${orderId}`,
      `Cliente:  ${order.customer_name}`,
      `WhatsApp: ${order.customer_phone}`,
      `Email:    ${order.customer_email}`,
      ``,
      `Productos:`,
      itemsText || "  (sin items)",
      ``,
      `Entrega:  ${deliveryInfo}`,
      `Fecha:    ${order.requested_delivery_date}`,
      `Total:    $${Number(order.total).toLocaleString("es-CO")}`,
      order.customer_notes ? `\nObservaciones: ${order.customer_notes}` : "",
    ].join("\n");

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: gmailUser.value(), pass: gmailPass.value() }
    });

    try {
      await transporter.sendMail({
        from: `"Lara Bakery" <${gmailUser.value()}>`,
        to: ADMIN_EMAILS.join(", "),
        subject: `Nuevo pedido ${orderId} — ${order.customer_name}`,
        text: body
      });
      await markNotificationSent(db, orderId);
      logger.info(`Notificación enviada para pedido ${orderId}`);
    } catch (err) {
      await markNotificationFailed(db, orderId, err);
      logger.error(`Error enviando notificación para pedido ${orderId}`, err);
      throw err;
    }
  }
);
