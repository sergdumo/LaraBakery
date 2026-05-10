"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { StatusPill } from "@/components/status-pill";
import { useAuth } from "@/components/auth-provider";
import { formatCurrency, formatStatus, Order, OrderStatus, PaymentStatus, Product, orderTotal } from "@/lib/data";
import { createManualOrder, deleteOrder, getAllOrders, getProducts, updateOrderState } from "@/lib/firebase-store";

const orderStatuses: OrderStatus[] = ["pendiente", "confirmado", "en_preparacion", "listo_para_entrega", "entregado", "cancelado"];
const paymentStatuses: PaymentStatus[] = ["pendiente", "pagado", "parcial", "cancelado"];

type ManualItem = {
  productId: string;
  variantId: string;
  quantity: number;
  notes: string;
};

function selectedVariant(product?: Product, variantId?: string) {
  return product?.variants?.find((variant) => variant.id === variantId) || product?.variants?.[0];
}

export default function AdminOrdersPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [creatingManual, setCreatingManual] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualDeliveryMethod, setManualDeliveryMethod] = useState<"recoger" | "domicilio">("recoger");
  const [manualItems, setManualItems] = useState<ManualItem[]>([]);
  const [quantityTexts, setQuantityTexts] = useState<Record<number, string>>({});
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");

  async function loadOrders() {
    setLoading(true);
    setOrders(await getAllOrders());
    setLoading(false);
  }

  useEffect(() => {
    loadOrders();
    getProducts().then((nextProducts) => {
      const availableProducts = nextProducts.filter((product) => product.isAvailable);
      setProducts(availableProducts);
      setManualItems([
        { productId: availableProducts[0]?.id || "", variantId: availableProducts[0]?.variants?.[0]?.id || "", quantity: 1, notes: "" }
      ]);
    });
  }, []);

  useEffect(() => {
    if (searchParams.get("nuevo") === "1") {
      setShowManualForm(true);
    }
  }, [searchParams]);

  async function saveState(order: Order, status: OrderStatus, paymentStatus: PaymentStatus) {
    setError("");
    setSavingId(order.id);
    try {
      await updateOrderState(order.id, status, paymentStatus);
      setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, status, paymentStatus } : o));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos actualizar el estado.");
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

  function updateManualItem(index: number, nextItem: Partial<ManualItem>) {
    setManualItems((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        const nextProduct = products.find((product) => product.id === nextItem.productId);
        return {
          ...item,
          ...nextItem,
          variantId: nextItem.productId && nextItem.productId !== item.productId ? nextProduct?.variants?.[0]?.id || "" : nextItem.variantId ?? item.variantId,
          quantity: Math.max(1, nextItem.quantity ?? item.quantity)
        };
      })
    );
  }

  function stepQuantity(index: number, delta: number) {
    const next = Math.max(1, manualItems[index].quantity + delta);
    updateManualItem(index, { quantity: next });
    setQuantityTexts((q) => ({ ...q, [index]: String(next) }));
  }

  function addManualItem() {
    const product = products[0];
    if (!product) return;
    setManualItems((current) => [
      ...current,
      { productId: product.id, variantId: product.variants?.[0]?.id || "", quantity: 1, notes: "" }
    ]);
  }

  async function saveManualOrder(formData: FormData) {
    if (!user) {
      setError("Debes iniciar sesión como admin para crear pedidos manuales.");
      return;
    }

    const items = manualItems.map((item) => {
      const product = products.find((entry) => entry.id === item.productId);
      const variant = selectedVariant(product, item.variantId);
      return {
        productId: variant ? `${item.productId}:${variant.id}` : item.productId,
        productName: variant ? `${product?.name || "Producto"} - ${variant.name}` : product?.name || "Producto",
        quantity: item.quantity,
        unitPrice: variant?.price || product?.price || 0,
        notes: item.notes
      };
    }).filter((item) => item.productId && item.unitPrice > 0);

    if (!items.length) {
      setError("Agrega al menos un producto al pedido manual.");
      return;
    }

    setError("");
    setCreatingManual(true);
    try {
      await createManualOrder({
        createdByUid: user.uid,
        customerName: String(formData.get("customerName") || ""),
        customerEmail: String(formData.get("customerEmail") || ""),
        customerPhone: String(formData.get("customerPhone") || ""),
        requestedDeliveryDate: String(formData.get("requestedDeliveryDate") || ""),
        deliveryMethod: manualDeliveryMethod,
        deliveryAddress: String(formData.get("deliveryAddress") || ""),
        customerNotes: String(formData.get("customerNotes") || ""),
        internalNotes: String(formData.get("internalNotes") || "Pedido creado manualmente."),
        status: String(formData.get("status") || "pendiente") as OrderStatus,
        paymentStatus: String(formData.get("paymentStatus") || "pendiente") as PaymentStatus,
        items,
        deliveryFee: manualDeliveryMethod === "domicilio" ? 6000 : 0
      });
      setShowManualForm(false);
      setManualDeliveryMethod("recoger");
      setManualItems([{ productId: products[0]?.id || "", variantId: products[0]?.variants?.[0]?.id || "", quantity: 1, notes: "" }]);
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos crear el pedido manual.");
    } finally {
      setCreatingManual(false);
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return orders.filter((o) => {
      const matchesSearch = !q || o.id.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q) || o.customerPhone.includes(q);
      const matchesStatus = !statusFilter || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  return (
    <section>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#c9657e]">Pedidos</p>
          <h1 className="mt-2 text-3xl font-semibold">Gestión de pedidos</h1>
        </div>
        <button
          type="button"
          onClick={() => setShowManualForm((current) => !current)}
          className="focus-ring rounded-full bg-[#3b2924] px-5 py-3 text-sm font-semibold text-white"
        >
          {showManualForm ? "Cerrar formulario" : "Nuevo pedido manual"}
        </button>
      </div>

      {showManualForm && (
        <form action={saveManualOrder} className="mb-6 rounded-lg border border-[#ead8c7] bg-white p-5 soft-shadow">
          <h2 className="font-semibold">Pedido manual</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-semibold">
              Cliente *
              <input name="customerName" required className="focus-ring rounded-md border border-[#ead8c7] bg-[#fff9f3] px-3 py-2 font-normal" />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              WhatsApp
              <input name="customerPhone" placeholder="Opcional" className="focus-ring rounded-md border border-[#ead8c7] bg-[#fff9f3] px-3 py-2 font-normal" />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Email
              <input name="customerEmail" type="text" inputMode="email" placeholder="Opcional" className="focus-ring rounded-md border border-[#ead8c7] bg-[#fff9f3] px-3 py-2 font-normal" />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Fecha de entrega *
              <input name="requestedDeliveryDate" type="date" required className="focus-ring rounded-md border border-[#ead8c7] bg-[#fff9f3] px-3 py-2 font-normal" />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Entrega
              <select value={manualDeliveryMethod} onChange={(event) => setManualDeliveryMethod(event.target.value as "recoger" | "domicilio")} className="focus-ring rounded-md border border-[#ead8c7] bg-[#fff9f3] px-3 py-2 font-normal">
                <option value="recoger">Recoger</option>
                <option value="domicilio">Domicilio</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Dirección
              <input name="deliveryAddress" placeholder="Solo si aplica" className="focus-ring rounded-md border border-[#ead8c7] bg-[#fff9f3] px-3 py-2 font-normal" />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Estado
              <select name="status" defaultValue="pendiente" className="focus-ring rounded-md border border-[#ead8c7] bg-[#fff9f3] px-3 py-2 font-normal">
                {orderStatuses.map((status) => <option key={status} value={status}>{formatStatus(status)}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Pago
              <select name="paymentStatus" defaultValue="pendiente" className="focus-ring rounded-md border border-[#ead8c7] bg-[#fff9f3] px-3 py-2 font-normal">
                {paymentStatuses.map((status) => <option key={status} value={status}>{formatStatus(status)}</option>)}
              </select>
            </label>
          </div>

          <div className="mt-5 grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold">Productos</h3>
              <button type="button" onClick={addManualItem} className="focus-ring rounded-full border border-[#ead8c7] px-4 py-2 text-sm font-semibold">
                Agregar producto
              </button>
            </div>
            {manualItems.map((item, index) => {
              const product = products.find((entry) => entry.id === item.productId);
              const variant = selectedVariant(product, item.variantId);
              const unitPrice = variant?.price || product?.price || 0;
              return (
                <div key={`manual-${index}`} className="grid gap-3 rounded-md bg-[#fff9f3] p-3 md:grid-cols-[1fr_180px_90px]">
                  <label className="grid gap-1 text-sm font-semibold">
                    Producto
                    <select value={item.productId} onChange={(event) => updateManualItem(index, { productId: event.target.value })} className="focus-ring rounded-md border border-[#ead8c7] bg-white px-3 py-2 font-normal">
                      {products.map((productOption) => <option key={productOption.id} value={productOption.id}>{productOption.name}</option>)}
                    </select>
                  </label>
                  {product?.variants?.length ? (
                    <label className="grid gap-1 text-sm font-semibold">
                      Tamaño
                      <select value={variant?.id || ""} onChange={(event) => updateManualItem(index, { variantId: event.target.value })} className="focus-ring rounded-md border border-[#ead8c7] bg-white px-3 py-2 font-normal">
                        {product.variants.map((variantOption) => (
                          <option key={variantOption.id} value={variantOption.id}>{variantOption.name}</option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <div className="grid gap-1 text-sm font-semibold">
                      Tamaño
                      <span className="rounded-md border border-[#ead8c7] bg-white px-3 py-2 font-normal text-[#74635c]">No aplica</span>
                    </div>
                  )}
                  <div className="grid gap-1 text-sm font-semibold">
                    Cant.
                    <div className="flex items-center gap-1 rounded-md border border-[#ead8c7] bg-white p-1">
                      <button type="button" onClick={() => stepQuantity(index, -1)} className="focus-ring flex h-7 w-7 flex-shrink-0 items-center justify-center rounded text-base font-bold text-[#74635c] hover:bg-[#ead8c7]">−</button>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={quantityTexts[index] ?? String(item.quantity)}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/[^0-9]/g, "");
                          setQuantityTexts((q) => ({ ...q, [index]: raw }));
                          if (raw !== "" && Number(raw) >= 1) updateManualItem(index, { quantity: Number(raw) });
                        }}
                        onBlur={() => {
                          const num = Math.max(1, Number(quantityTexts[index]) || 1);
                          setQuantityTexts((q) => ({ ...q, [index]: String(num) }));
                          updateManualItem(index, { quantity: num });
                        }}
                        className="w-10 min-w-0 bg-transparent text-center text-sm font-semibold outline-none"
                      />
                      <button type="button" onClick={() => stepQuantity(index, 1)} className="focus-ring flex h-7 w-7 flex-shrink-0 items-center justify-center rounded bg-[#f4b6c4] text-base font-bold text-[#3b2924] hover:bg-[#ef9eb2]">+</button>
                    </div>
                  </div>
                  <label className="grid gap-1 text-sm font-semibold md:col-span-2">
                    Nota del producto
                    <input value={item.notes} onChange={(event) => updateManualItem(index, { notes: event.target.value })} placeholder="Dedicatoria, sabor, detalle..." className="focus-ring rounded-md border border-[#ead8c7] bg-white px-3 py-2 font-normal" />
                  </label>
                  <div className="flex items-end justify-between gap-2">
                    <p className="pb-2 text-sm font-semibold">{formatCurrency(unitPrice * item.quantity)}</p>
                    {manualItems.length > 1 && (
                      <button type="button" onClick={() => setManualItems((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="focus-ring rounded-md px-3 py-2 text-sm font-semibold text-[#c9657e]">
                        Quitar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-semibold">
              Observaciones del cliente
              <textarea name="customerNotes" rows={3} className="focus-ring rounded-md border border-[#ead8c7] bg-[#fff9f3] px-3 py-2 font-normal" />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Notas internas
              <textarea name="internalNotes" rows={3} placeholder="Canal, abono, pendientes..." className="focus-ring rounded-md border border-[#ead8c7] bg-[#fff9f3] px-3 py-2 font-normal" />
            </label>
          </div>
          <button type="submit" disabled={creatingManual || !products.length} className="focus-ring mt-4 rounded-full bg-[#3b2924] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
            {creatingManual ? "Creando..." : "Crear pedido manual"}
          </button>
        </form>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          placeholder="Buscar por ID, nombre o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="focus-ring flex-1 rounded-md border border-[#ead8c7] bg-white px-3 py-2 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "")}
          className="focus-ring rounded-md border border-[#ead8c7] bg-white px-3 py-2 text-sm"
        >
          <option value="">Todos los estados</option>
          {orderStatuses.map((s) => (
            <option key={s} value={s}>{formatStatus(s)}</option>
          ))}
        </select>
      </div>

      {loading && <p className="mb-4 rounded-lg border border-[#ead8c7] bg-white p-4 text-sm text-[#74635c]">Cargando pedidos...</p>}
      {error && <p className="mb-4 rounded-lg bg-[#ffd3bc] p-4 text-sm text-[#3b2924]">{error}</p>}
      <div className="grid gap-4">
        {filtered.map((order) => (
          <article key={order.id} className="rounded-lg border border-[#ead8c7] bg-white p-5 soft-shadow">
            <div className="flex flex-col justify-between gap-3 xl:flex-row">
              <div>
                <Link href={`/admin/pedidos/${order.id}`} className="font-semibold hover:text-[#c9657e] hover:underline">
                  {order.id}
                </Link>
                <p className="mt-1 text-sm text-[#74635c]">{order.customerName} · {order.customerPhone}</p>
                <p className="mt-1 text-sm text-[#74635c]">Entrega: {order.requestedDeliveryDate} / {order.deliveryMethod}</p>
              </div>
              <div className="text-left xl:text-right">
                <p className="font-semibold">{formatCurrency(orderTotal(order))}</p>
                <div className="mt-2 flex gap-2 xl:justify-end">
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
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto]">
              <label className="grid gap-1 text-sm font-semibold">
                Estado
                <select
                  value={order.status}
                  onChange={(e) => saveState(order, e.target.value as OrderStatus, order.paymentStatus)}
                  disabled={savingId === order.id}
                  className="focus-ring rounded-md border border-[#ead8c7] bg-[#fff9f3] px-3 py-2 font-normal"
                >
                  {orderStatuses.map((s) => <option key={s} value={s}>{formatStatus(s)}</option>)}
                </select>
              </label>
              <label className="grid gap-1 text-sm font-semibold">
                Pago
                <select
                  value={order.paymentStatus}
                  onChange={(e) => saveState(order, order.status, e.target.value as PaymentStatus)}
                  disabled={savingId === order.id}
                  className="focus-ring rounded-md border border-[#ead8c7] bg-[#fff9f3] px-3 py-2 font-normal"
                >
                  {paymentStatuses.map((s) => <option key={s} value={s}>{formatStatus(s)}</option>)}
                </select>
              </label>
              <Link
                href={`/admin/pedidos/${order.id}`}
                className="focus-ring self-end rounded-md border border-[#ead8c7] px-3 py-2 text-sm font-semibold text-[#74635c] hover:bg-[#fff9f3]"
              >
                Ver / editar
              </Link>
              <button
                type="button"
                onClick={() => removeOrder(order)}
                disabled={deletingId === order.id}
                className="focus-ring self-end rounded-md border border-[#c9657e] px-3 py-2 text-sm font-semibold text-[#c9657e] hover:bg-[#fff9f3] disabled:opacity-60"
              >
                {deletingId === order.id ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </article>
        ))}
        {!loading && !filtered.length && (
          <p className="rounded-lg border border-[#ead8c7] bg-white p-5 text-sm text-[#74635c]">
            {orders.length ? "No hay pedidos que coincidan con el filtro." : "Aún no hay pedidos."}
          </p>
        )}
      </div>
    </section>
  );
}
