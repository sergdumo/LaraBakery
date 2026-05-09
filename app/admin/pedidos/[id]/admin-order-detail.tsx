"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusPill } from "@/components/status-pill";
import { formatCurrency, formatStatus, Order, OrderStatus, PaymentStatus, orderTotal } from "@/lib/data";
import { deleteOrder, getOrderById, updateOrderDetails, updateOrderState, updateOrderInternalNotes } from "@/lib/firebase-store";

const orderStatuses: OrderStatus[] = ["pendiente", "confirmado", "en_preparacion", "listo_para_entrega", "entregado", "cancelado"];
const paymentStatuses: PaymentStatus[] = ["pendiente", "pagado", "parcial", "cancelado"];

export function AdminOrderDetail({ id }: { id: string }) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingDetails, setEditingDetails] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [internalNotes, setInternalNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [savingState, setSavingState] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getOrderById(id).then((result) => {
      setOrder(result);
      setInternalNotes(result?.internalNotes || "");
      setLoading(false);
    });
  }, [id]);

  async function saveNotes() {
    if (!order) return;
    setSavingNotes(true);
    await updateOrderInternalNotes(order.id, internalNotes);
    setSavingNotes(false);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2500);
  }

  async function changeState(status: OrderStatus, paymentStatus: PaymentStatus) {
    if (!order) return;
    setSavingState(true);
    await updateOrderState(order.id, status, paymentStatus);
    setOrder((prev) => prev ? { ...prev, status, paymentStatus } : prev);
    setSavingState(false);
  }

  async function saveDetails(formData: FormData) {
    if (!order) return;

    setError("");
    setSavingDetails(true);
    const deliveryMethod: "recoger" | "domicilio" = String(formData.get("deliveryMethod")) === "domicilio" ? "domicilio" : "recoger";
    const items = order.items.map((item, index) => ({
      productId: item.productId,
      productName: String(formData.get(`item-${index}-name`) || item.productName),
      quantity: Math.max(1, Number(formData.get(`item-${index}-quantity`) || item.quantity)),
      unitPrice: Math.max(0, Number(formData.get(`item-${index}-unitPrice`) || item.unitPrice)),
      notes: String(formData.get(`item-${index}-notes`) || item.notes || "")
    }));
    const nextOrder: Order = {
      ...order,
      customerName: String(formData.get("customerName") || ""),
      customerEmail: String(formData.get("customerEmail") || ""),
      customerPhone: String(formData.get("customerPhone") || ""),
      requestedDeliveryDate: String(formData.get("requestedDeliveryDate") || ""),
      deliveryMethod,
      deliveryAddress: String(formData.get("deliveryAddress") || ""),
      customerNotes: String(formData.get("customerNotes") || ""),
      items
    };

    try {
      await updateOrderDetails(order.id, {
        ...nextOrder,
        items,
        deliveryFee: deliveryMethod === "domicilio" ? 6000 : 0
      });
      setOrder(nextOrder);
      setEditingDetails(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos actualizar el pedido.");
    } finally {
      setSavingDetails(false);
    }
  }

  async function removeOrder() {
    if (!order || !window.confirm(`¿Eliminar el pedido ${order.id}? Esta acción no se puede deshacer.`)) {
      return;
    }

    setError("");
    setDeleting(true);
    try {
      await deleteOrder(order.id);
      router.push("/admin/pedidos");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos eliminar el pedido.");
      setDeleting(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-[#74635c]">Cargando pedido...</p>;
  }

  if (!order) {
    return (
      <section className="rounded-lg border border-[#ead8c7] bg-white p-6 soft-shadow">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#c9657e]">No encontrado</p>
        <h1 className="mt-2 text-2xl font-semibold">Pedido no existe</h1>
        <p className="mt-3 text-sm text-[#74635c]">El ID <strong>{id}</strong> no corresponde a ningún pedido.</p>
        <Link href="/admin/pedidos" className="focus-ring mt-5 inline-block rounded-full border border-[#ead8c7] px-5 py-3 text-sm font-semibold">
          Volver a pedidos
        </Link>
      </section>
    );
  }

  return (
    <section className="grid gap-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#c9657e]">Detalle</p>
          <h1 className="mt-1 text-3xl font-semibold">Pedido {order.id}</h1>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" onClick={() => setEditingDetails((current) => !current)} className="focus-ring rounded-md border border-[#ead8c7] px-3 py-2 text-sm font-semibold text-[#74635c] hover:bg-[#fff9f3]">
            {editingDetails ? "Cancelar edición" : "Editar pedido"}
          </button>
          <button type="button" onClick={removeOrder} disabled={deleting} className="focus-ring rounded-md border border-[#c9657e] px-3 py-2 text-sm font-semibold text-[#c9657e] hover:bg-[#fff9f3] disabled:opacity-60">
            {deleting ? "Eliminando..." : "Eliminar"}
          </button>
          <Link href="/admin/pedidos" className="focus-ring rounded-md px-3 py-2 text-sm font-semibold text-[#74635c] hover:bg-[#fff9f3]">
            ← Volver
          </Link>
        </div>
      </div>

      {error && <p className="rounded-lg bg-[#ffd3bc] p-4 text-sm text-[#3b2924]">{error}</p>}

      {editingDetails && (
        <form action={saveDetails} className="rounded-lg border border-[#ead8c7] bg-white p-5 soft-shadow">
          <h2 className="font-semibold">Editar pedido</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-semibold">
              Nombre
              <input name="customerName" defaultValue={order.customerName} required className="focus-ring rounded-md border border-[#ead8c7] bg-[#fff9f3] px-3 py-2 font-normal" />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              WhatsApp
              <input name="customerPhone" defaultValue={order.customerPhone} required className="focus-ring rounded-md border border-[#ead8c7] bg-[#fff9f3] px-3 py-2 font-normal" />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Email
              <input name="customerEmail" defaultValue={order.customerEmail} required className="focus-ring rounded-md border border-[#ead8c7] bg-[#fff9f3] px-3 py-2 font-normal" />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Fecha deseada
              <input name="requestedDeliveryDate" type="date" defaultValue={order.requestedDeliveryDate} required className="focus-ring rounded-md border border-[#ead8c7] bg-[#fff9f3] px-3 py-2 font-normal" />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Entrega
              <select name="deliveryMethod" defaultValue={order.deliveryMethod} className="focus-ring rounded-md border border-[#ead8c7] bg-[#fff9f3] px-3 py-2 font-normal">
                <option value="recoger">Recoger</option>
                <option value="domicilio">Domicilio</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Dirección
              <input name="deliveryAddress" defaultValue={order.deliveryAddress || ""} className="focus-ring rounded-md border border-[#ead8c7] bg-[#fff9f3] px-3 py-2 font-normal" />
            </label>
          </div>
          <label className="mt-3 grid gap-1 text-sm font-semibold">
            Observaciones del cliente
            <textarea name="customerNotes" defaultValue={order.customerNotes} rows={3} className="focus-ring rounded-md border border-[#ead8c7] bg-[#fff9f3] px-3 py-2 font-normal" />
          </label>
          <div className="mt-5 grid gap-3">
            <h3 className="text-sm font-semibold">Productos</h3>
            {order.items.map((item, index) => (
              <div key={`${item.productId}-${index}`} className="grid gap-3 rounded-md bg-[#fff9f3] p-3 md:grid-cols-[1fr_90px_140px]">
                <label className="grid gap-1 text-sm font-semibold">
                  Producto
                  <input name={`item-${index}-name`} defaultValue={item.productName} required className="focus-ring rounded-md border border-[#ead8c7] bg-white px-3 py-2 font-normal" />
                </label>
                <label className="grid gap-1 text-sm font-semibold">
                  Cantidad
                  <input name={`item-${index}-quantity`} type="number" min="1" defaultValue={item.quantity} required className="focus-ring rounded-md border border-[#ead8c7] bg-white px-3 py-2 font-normal" />
                </label>
                <label className="grid gap-1 text-sm font-semibold">
                  Valor unidad
                  <input name={`item-${index}-unitPrice`} type="number" min="0" defaultValue={item.unitPrice} required className="focus-ring rounded-md border border-[#ead8c7] bg-white px-3 py-2 font-normal" />
                </label>
                <label className="grid gap-1 text-sm font-semibold md:col-span-3">
                  Nota del producto
                  <input name={`item-${index}-notes`} defaultValue={item.notes || ""} className="focus-ring rounded-md border border-[#ead8c7] bg-white px-3 py-2 font-normal" />
                </label>
              </div>
            ))}
          </div>
          <button type="submit" disabled={savingDetails} className="focus-ring mt-4 rounded-full bg-[#3b2924] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {savingDetails ? "Guardando..." : "Guardar edición"}
          </button>
        </form>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
        <article className="rounded-lg border border-[#ead8c7] bg-white p-5 soft-shadow">
          <h2 className="font-semibold">Productos</h2>
          <div className="mt-4 grid gap-3">
            {order.items.map((item) => (
              <div key={item.productId} className="flex items-center justify-between rounded-md bg-[#fff9f3] p-3">
                <span className="text-sm">{item.quantity} × {item.productName}</span>
                <span className="font-semibold">{formatCurrency(item.quantity * item.unitPrice)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-[#ead8c7] pt-4">
            <span className="text-sm text-[#74635c]">Total</span>
            <strong className="text-xl">{formatCurrency(orderTotal(order))}</strong>
          </div>
        </article>

        <article className="rounded-lg border border-[#ead8c7] bg-white p-5 soft-shadow">
          <h2 className="font-semibold">Cliente</h2>
          <dl className="mt-4 grid gap-2 text-sm">
            <div><dt className="font-semibold">Nombre</dt><dd className="text-[#74635c]">{order.customerName}</dd></div>
            <div><dt className="font-semibold">Email</dt><dd className="text-[#74635c]">{order.customerEmail}</dd></div>
            <div><dt className="font-semibold">Teléfono</dt><dd className="text-[#74635c]">{order.customerPhone}</dd></div>
            <div><dt className="font-semibold">Entrega</dt><dd className="text-[#74635c]">{order.deliveryMethod} — {order.requestedDeliveryDate}</dd></div>
            {order.deliveryAddress && (
              <div><dt className="font-semibold">Dirección</dt><dd className="text-[#74635c]">{order.deliveryAddress}</dd></div>
            )}
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusPill label={formatStatus(order.status)} />
            <StatusPill label={formatStatus(order.paymentStatus)} />
          </div>
        </article>
      </div>

      <article className="rounded-lg border border-[#ead8c7] bg-white p-5 soft-shadow">
        <h2 className="font-semibold">Cambiar estado</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-semibold">
            Estado pedido
            <select
              value={order.status}
              onChange={(e) => changeState(e.target.value as OrderStatus, order.paymentStatus)}
              disabled={savingState}
              className="focus-ring rounded-md border border-[#ead8c7] bg-[#fff9f3] px-3 py-2 font-normal"
            >
              {orderStatuses.map((s) => <option key={s} value={s}>{formatStatus(s)}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Estado pago
            <select
              value={order.paymentStatus}
              onChange={(e) => changeState(order.status, e.target.value as PaymentStatus)}
              disabled={savingState}
              className="focus-ring rounded-md border border-[#ead8c7] bg-[#fff9f3] px-3 py-2 font-normal"
            >
              {paymentStatuses.map((s) => <option key={s} value={s}>{formatStatus(s)}</option>)}
            </select>
          </label>
        </div>
        {savingState && <p className="mt-2 text-xs text-[#74635c]">Guardando...</p>}
      </article>

      <article className="rounded-lg border border-[#ead8c7] bg-white p-5 soft-shadow">
        <h2 className="font-semibold">Notas del cliente</h2>
        <p className="mt-2 text-sm leading-6 text-[#74635c]">{order.customerNotes || "—"}</p>
        <h2 className="mt-5 font-semibold">Notas internas</h2>
        <textarea
          rows={3}
          value={internalNotes}
          onChange={(e) => { setInternalNotes(e.target.value); setNotesSaved(false); }}
          placeholder="Anotaciones privadas del pedido..."
          className="focus-ring mt-2 w-full rounded-md border border-[#ead8c7] bg-[#fff9f3] px-3 py-2 text-sm font-normal"
        />
        <button
          type="button"
          onClick={saveNotes}
          disabled={savingNotes}
          className="focus-ring mt-2 rounded-full bg-[#3b2924] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {savingNotes ? "Guardando..." : notesSaved ? "✓ Guardado" : "Guardar notas"}
        </button>
      </article>
    </section>
  );
}
