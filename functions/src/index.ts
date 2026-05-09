import { setGlobalOptions } from "firebase-functions";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as nodemailer from "nodemailer";
import * as logger from "firebase-functions/logger";

setGlobalOptions({ maxInstances: 10 });
initializeApp();

const gmailUser = defineSecret("GMAIL_USER");
const gmailPass = defineSecret("GMAIL_PASS");

const ADMIN_EMAILS = ["saralaracorrea@gmail.com", "serdumo@gmail.com"];

export const notifyAdminOnNewOrder = onDocumentCreated(
  { document: "orders/{orderId}", secrets: [gmailUser, gmailPass] },
  async (event) => {
    const orderId = event.params.orderId;
    const order = event.data?.data();
    if (!order) return;

    const db = getFirestore();
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
      logger.info(`Notificación enviada para pedido ${orderId}`);
    } catch (err) {
      logger.error(`Error enviando notificación para pedido ${orderId}`, err);
    }
  }
);
