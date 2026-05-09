"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { StatusPill } from "@/components/status-pill";
import { formatCurrency, formatStatus, Order, orderTotal } from "@/lib/data";
import { deleteOrder, getOrdersForUser, updateOrderDetails } from "@/lib/firebase-store";

export default function MyOrdersPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [savingId, setSavingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }

    setIsLoadingOrders(true);
    getOrdersForUser(user.uid)
      .then(setOrders)
      .catch((err) => setError(err instanceof Error ? err.message : "No pudimos cargar tus pedidos."))
      .finally(() => setIsLoadingOrders(false));
  }, [user]);

  async function saveOrder(order: Order, formData: FormData) {
    setError("");
    setSavingId(order.id);

    try {
      const deliveryMethod: "recoger" | "domicilio" = String(formData.get("deliveryMethod")) === "domicilio" ? "domicilio" : "recoger";
      const nextOrder = {
        ...order,
        customerName: String(formData.get("customerName") || ""),
        customerEmail: String(formData.get("customerEmail") || ""),
        customerPhone: String(formData.get("customerPhone") || ""),
        requestedDeliveryDate: String(formData.get("requestedDeliveryDate") || ""),
        deliveryMethod,
        deliveryAddress: String(formData.get("deliveryAddress") || ""),
        customerNotes: String(formData.get("customerNotes") || ""),
        items: order.items.map((item, index) => ({
          ...item,
          quantity: Math.max(1, Number(formData.get(`item-${index}-quantity`) || item.quantity)),
          notes: String(formData.get(`item-${index}-notes`) || item.notes || "")
        }))
      };

      await updateOrderDetails(order.id, {
        ...nextOrder,
        items: nextOrder.items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          notes: item.notes || ""
        })),
        deliveryFee: deliveryMethod === "domicilio" ? 6000 : 0
      });
      setOrders((prev) => prev.map((current) => current.id === order.id ? nextOrder : current));
      setEditingId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos actualizar el pedido.");
    } finally {
      setSavingId("");
    }
  }

  async function removeOrder(order: Order) {
    if (!window.confirm(`¿Eliminar el pedido ${order.id}? Esta acción no se puede deshacer.`)) {
      return;
    }

    setError("");
    setDeletingId(order.id);
    try {
      await deleteOrder(order.id);
      setOrders((prev) => prev.filter((current) => current.id !== order.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos eliminar el pedido.");
    } finally {
      setDeletingId("");
    }
  }

  if (!user && !loading) {
    return (
      <main className="mx-auto max-w-md px-4 py-10">
        <section className="rounded-lg border border-[#ead8c7] bg-white p-6 text-center soft-shadow">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#c9657e]">Cliente</p>
          <h1 className="mt-2 text-2xl font-semibold">Ingresa para ver tus pedidos</h1>
          <p className="mt-3 text-sm leading-6 text-[#74635c]">Solo tu cuenta puede consultar el historial de tus pedidos.</p>
          <button
            onClick={signInWithGoogle}
            className="focus-ring mt-6 w-full rounded-full border border-[#ead8c7] bg-[#fff9f3] px-5 py-3 text-sm font-semibold"
          >
            Continuar con Google
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#c9657e]">Cliente</p>
        <h1 className="mt-2 text-3xl font-semibold">Mis pedidos</h1>
        <p className="mt-3 leading-7 text-[#74635c]">Consulta el estado de tus pedidos en Lara Bakery.</p>
      </div>
      {isLoadingOrders && <p className="rounded-lg border border-[#ead8c7] bg-white p-5 text-sm text-[#74635c]">Cargando pedidos...</p>}
      {error && <p className="rounded-lg bg-[#ffd3bc] p-5 text-sm text-[#3b2924]">{error}</p>}
      {!isLoadingOrders && !orders.length && !error && (
        <p className="rounded-lg border border-[#ead8c7] bg-white p-5 text-sm text-[#74635c]">Aún no tienes pedidos guardados.</p>
      )}
      <div className="grid gap-4">
        {orders.map((order) => (
          <article key={order.id} className="rounded-lg border border-[#ead8c7] bg-white p-5 soft-shadow">
            <div className="flex flex-col justify-between gap-3 sm:flex-row">
              <div>
                <h2 className="font-semibold">{order.id}</h2>
                <p className="mt-1 text-sm text-[#74635c]">Entrega: {order.requestedDeliveryDate}</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="font-semibold">{formatCurrency(orderTotal(order))}</p>
                <div className="mt-2 flex flex-wrap gap-2 sm:justify-end">
                  <StatusPill label={formatStatus(order.status)} />
                  <StatusPill label={formatStatus(order.paymentStatus)} />
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {order.items.map((item) => (
                <span key={`${order.id}-${item.productId}`} className="rounded-full bg-[#fff9f3] px-3 py-1 text-sm text-[#5f4b44]">
                  {item.quantity} × {item.productName}
                </span>
              ))}
            </div>
            {order.status === "pendiente" ? (
              <div className="mt-4 border-t border-[#ead8c7] pt-4">
                {editingId === order.id ? (
                  <form action={(formData) => saveOrder(order, formData)} className="grid gap-3">
                    <div className="grid gap-3 sm:grid-cols-2">
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
                    <label className="grid gap-1 text-sm font-semibold">
                      Observaciones
                      <textarea name="customerNotes" defaultValue={order.customerNotes} rows={3} className="focus-ring rounded-md border border-[#ead8c7] bg-[#fff9f3] px-3 py-2 font-normal" />
                    </label>
                    <div className="grid gap-3">
                      <p className="text-sm font-semibold">Productos</p>
                      {order.items.map((item, index) => (
                        <div key={`${order.id}-edit-${item.productId}-${index}`} className="grid gap-3 rounded-md bg-[#fff9f3] p-3 sm:grid-cols-[1fr_100px]">
                          <p className="self-end text-sm font-semibold">{item.productName}</p>
                          <label className="grid gap-1 text-sm font-semibold">
                            Cantidad
                            <input name={`item-${index}-quantity`} type="number" min="1" defaultValue={item.quantity} required className="focus-ring rounded-md border border-[#ead8c7] bg-white px-3 py-2 font-normal" />
                          </label>
                          <label className="grid gap-1 text-sm font-semibold sm:col-span-2">
                            Nota del producto
                            <input name={`item-${index}-notes`} defaultValue={item.notes || ""} className="focus-ring rounded-md border border-[#ead8c7] bg-white px-3 py-2 font-normal" />
                          </label>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="submit" disabled={savingId === order.id} className="focus-ring rounded-full bg-[#3b2924] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
                        {savingId === order.id ? "Guardando..." : "Guardar cambios"}
                      </button>
                      <button type="button" onClick={() => setEditingId("")} className="focus-ring rounded-full border border-[#ead8c7] px-5 py-2 text-sm font-semibold">
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setEditingId(order.id)} className="focus-ring rounded-full border border-[#ead8c7] px-5 py-2 text-sm font-semibold">
                      Editar datos
                    </button>
                    <button type="button" onClick={() => removeOrder(order)} disabled={deletingId === order.id} className="focus-ring rounded-full border border-[#c9657e] px-5 py-2 text-sm font-semibold text-[#c9657e] disabled:opacity-60">
                      {deletingId === order.id ? "Eliminando..." : "Eliminar"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-4 border-t border-[#ead8c7] pt-4 text-sm text-[#74635c]">
                Para modificar pedidos ya confirmados, escríbenos por WhatsApp.
              </p>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}
