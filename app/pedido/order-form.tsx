"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Product, formatCurrency } from "@/lib/data";
import { darkActionStyle } from "@/lib/styles";
import { useAuth } from "@/components/auth-provider";
import { createOrder, getProducts } from "@/lib/firebase-store";
import { logEvent } from "@/lib/analytics";

type CartItem = {
  productId: string;
  variantId?: string;
  quantity: number;
  notes: string;
};

function getSelectedVariant(product: Product | undefined, variantId?: string) {
  return product?.variants?.find((variant) => variant.id === variantId) || product?.variants?.[0];
}

export function OrderForm({
  products: initialProducts
}: {
  products: Product[];
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [items, setItems] = useState<CartItem[]>([
    { productId: initialProducts[0]?.id || "", quantity: 1, notes: "" }
  ]);
  const [deliveryMethod, setDeliveryMethod] = useState<"recoger" | "domicilio">("recoger");
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const [confirmedName, setConfirmedName] = useState("");
  const [confirmedItems, setConfirmedItems] = useState<Array<{ name: string; quantity: number }>>([]);
  const [confirmedDelivery, setConfirmedDelivery] = useState<{ method: string; date: string }>({ method: "", date: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const submittingRef = useRef(false);
  const { user, loading, signInWithGoogle } = useAuth();

  useEffect(() => {
    getProducts()
      .then((nextProducts) => {
        const availableProducts = nextProducts.filter((product) => product.isAvailable);
        if (!availableProducts.length) {
          return;
        }
        setProducts(availableProducts);
        setItems((current) =>
          current.map((item) => (availableProducts.some((product) => product.id === item.productId) ? item : { ...item, productId: availableProducts[0].id }))
        );
      })
      .catch(() => setProducts(initialProducts));
  }, [initialProducts]);

  useEffect(() => {
    const selectedProductId = new URLSearchParams(window.location.search).get("producto");
    if (!selectedProductId || !products.some((product) => product.id === selectedProductId)) {
      return;
    }

    setItems((current) =>
      current.map((item, index) => (index === 0 ? { ...item, productId: selectedProductId } : item))
    );
  }, [products]);

  const minDate = useMemo(() => {
    const nowCO = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Bogota" }));
    nowCO.setDate(nowCO.getDate() + 2);
    const yy = nowCO.getFullYear();
    const mm = String(nowCO.getMonth() + 1).padStart(2, "0");
    const dd = String(nowCO.getDate()).padStart(2, "0");
    return `${yy}-${mm}-${dd}`;
  }, []);

  const total = useMemo(
    () =>
      items.reduce((sum, item) => {
        const product = products.find((entry) => entry.id === item.productId);
        const variant = getSelectedVariant(product, item.variantId);
        return sum + (variant?.price || product?.price || 0) * item.quantity;
      }, deliveryMethod === "domicilio" ? 6000 : 0),
    [deliveryMethod, items, products]
  );

  function updateItem(index: number, nextItem: Partial<CartItem>) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              ...nextItem,
              variantId: nextItem.productId && nextItem.productId !== item.productId ? undefined : nextItem.variantId ?? item.variantId,
              quantity: Math.max(1, nextItem.quantity ?? item.quantity)
            }
          : item
      )
    );
  }

  function removeItem(index: number) {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  async function confirmOrder(formData: FormData) {
    if (!user) {
      setError("Inicia sesion con Google para guardar tu pedido.");
      return;
    }

    if (submittingRef.current) {
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setError("");

    const orderItems = items.map((item) => {
      const product = products.find((entry) => entry.id === item.productId);
      const variant = getSelectedVariant(product, item.variantId);
      return {
        productId: variant ? `${item.productId}:${variant.id}` : item.productId,
        productName: variant ? `${product?.name || "Producto"} - ${variant.name}` : product?.name || "Producto",
        quantity: item.quantity,
        unitPrice: variant?.price || product?.price || 0,
        notes: item.notes
      };
    });

    try {
      const orderId = await createOrder({
        user,
        customerName: String(formData.get("customerName") || ""),
        customerEmail: String(formData.get("customerEmail") || user.email || ""),
        customerPhone: String(formData.get("customerPhone") || ""),
        requestedDeliveryDate: String(formData.get("requestedDeliveryDate") || ""),
        deliveryMethod,
        deliveryAddress: String(formData.get("deliveryAddress") || ""),
        customerNotes: String(formData.get("customerNotes") || ""),
        items: orderItems,
        subtotal: total - (deliveryMethod === "domicilio" ? 6000 : 0),
        deliveryFee: deliveryMethod === "domicilio" ? 6000 : 0,
        total
      });
      setConfirmedId(orderId);
      setConfirmedName(String(formData.get("customerName") || ""));
      logEvent("purchase", { transaction_id: orderId, value: total, currency: "COP" }).catch(() => {});
      setConfirmedItems(orderItems.map((item) => ({ name: item.productName, quantity: item.quantity })));
      setConfirmedDelivery({
        method: deliveryMethod === "domicilio" ? "Domicilio" : "Recoger en tienda",
        date: String(formData.get("requestedDeliveryDate") || "")
      });
    } catch (currentError) {
      submittingRef.current = false;
      setError(currentError instanceof Error ? currentError.message : "No se pudo guardar el pedido.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (confirmedId) {
    const whatsappBase = process.env.NEXT_PUBLIC_WHATSAPP_URL;
    const nequiNumber = process.env.NEXT_PUBLIC_PAYMENT_NEQUI;
    const paymentName = process.env.NEXT_PUBLIC_PAYMENT_NAME || "Lara Bakery";
    const itemsList = confirmedItems.map((item) => `  - ${item.quantity}x ${item.name}`).join("\n");
    const comprobanteMsgUrl =
      whatsappBase?.startsWith("https://wa.me/")
        ? `${whatsappBase}?text=${encodeURIComponent(
            `Hola Lara Bakery! Acabo de registrar un pedido.\n\n` +
            `Pedido: ${confirmedId}\n` +
            `Cliente: ${confirmedName}\n` +
            `Productos:\n${itemsList}\n` +
            `Entrega: ${confirmedDelivery.method} — ${confirmedDelivery.date}\n` +
            `Total: ${formatCurrency(total)}\n\n` +
            `Quedo pendiente de confirmación. ¡Gracias!`
          )}`
        : whatsappBase;

    return (
      <section className="rounded-lg border border-[#b8d8c0] bg-white p-6 soft-shadow">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#4f8a5f]">Pedido recibido</p>
        <h1 className="mt-2 text-3xl font-semibold">Pedido registrado</h1>
        <p className="mt-1 text-sm text-[#74635c]">
          Número de pedido: <strong className="text-[#3b2924]">{confirmedId}</strong>
        </p>
        <p className="mt-4 leading-7 text-[#74635c]">
          Lara Bakery revisará la disponibilidad y te confirmará por WhatsApp. Estado inicial: pendiente.
        </p>

        <div className="mt-6 rounded-lg border border-[#ead8c7] bg-[#fff9f3] p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#74635c]">Cómo pagar</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col items-center justify-between gap-3 rounded-md border border-[#ead8c7] bg-white p-4">
              <span className="text-sm font-semibold text-[#3b2924]">Bre-b</span>
              <Image src="/images/QR.jpeg" alt="QR Bre-b Lara Bakery" width={140} height={140} className="rounded" />
              <p className="text-center text-xs text-[#74635c]">Escanea el QR con Bre-b</p>
            </div>
            {nequiNumber && (
              <div className="flex flex-col items-center justify-between gap-3 rounded-md border border-[#ead8c7] bg-white p-4">
                <span className="text-sm font-semibold text-[#3b2924]">Nequi</span>
                <div className="flex flex-1 flex-col items-center justify-center gap-2">
                  <Image src="/images/nequi-logo.png" alt="Nequi" width={120} height={40} className="object-contain" />
                  <p className="text-lg font-semibold tracking-wide text-[#3b2924]">{nequiNumber}</p>
                </div>
                <p className="text-center text-xs text-[#74635c]">A nombre de: {paymentName}</p>
              </div>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-[#ead8c7] pt-4">
            <span className="text-sm text-[#74635c]">Total a pagar</span>
            <strong className="text-2xl">{formatCurrency(total)}</strong>
          </div>
          {comprobanteMsgUrl && (
            <a
              href={comprobanteMsgUrl}
              target="_blank"
              rel="noreferrer"
              className="focus-ring mt-4 block rounded-full bg-[#2fbf71] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#249b5b]"
            >
              Enviar comprobante por WhatsApp
            </a>
          )}
        </div>
      </section>
    );
  }

  return (
    <form action={confirmOrder} className="grid gap-6 pb-24 md:pb-0 lg:grid-cols-[1fr_0.72fr]">
      <section className="space-y-4">
        {items.map((item, index) => {
          const product = products.find((entry) => entry.id === item.productId) || products[0];
          const variant = getSelectedVariant(product, item.variantId);
          const unitPrice = variant?.price || product.price;

          return (
            <div key={`${item.productId}-${index}`} className="rounded-lg border border-[#ead8c7] bg-white p-4 soft-shadow">
              <div className="grid gap-4 sm:grid-cols-[92px_1fr]">
                <div className="relative h-24 w-full overflow-hidden rounded-md sm:w-24">
                  <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                </div>
                <div className="grid gap-3">
                  <label className="grid gap-1 text-sm font-semibold">
                    Producto
                    <select
                      value={item.productId}
                      onChange={(event) => updateItem(index, { productId: event.target.value })}
                      className="focus-ring rounded-md border border-[#ead8c7] bg-[#fff9f3] px-3 py-2 font-normal"
                    >
                      {products.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  {product.variants?.length ? (
                    <label className="grid gap-1 text-sm font-semibold">
                      Tamaño
                      <select
                        value={variant?.id || product.variants[0].id}
                        onChange={(event) => updateItem(index, { variantId: event.target.value })}
                        className="focus-ring rounded-md border border-[#ead8c7] bg-[#fff9f3] px-3 py-2 font-normal"
                      >
                        {product.variants.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.name} - {formatCurrency(option.price)}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
                    <div className="grid gap-1 text-sm font-semibold">
                      Cantidad
                      <div className="flex items-center gap-1 rounded-md border border-[#ead8c7] bg-[#fff9f3] p-1">
                        <button
                          type="button"
                          onClick={() => updateItem(index, { quantity: item.quantity - 1 })}
                          className="focus-ring flex h-8 w-8 items-center justify-center rounded text-base font-bold text-[#74635c] hover:bg-[#ead8c7]"
                        >
                          −
                        </button>
                        <span className="flex-1 text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateItem(index, { quantity: item.quantity + 1 })}
                          className="focus-ring flex h-8 w-8 items-center justify-center rounded-md bg-[#f4b6c4] text-base font-bold text-[#3b2924] hover:bg-[#ef9eb2]"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <label className="grid gap-1 text-sm font-semibold">
                      Observaciones
                      <input
                        value={item.notes}
                        onChange={(event) => updateItem(index, { notes: event.target.value })}
                        placeholder="Sin coco, mensaje especial..."
                        className="focus-ring rounded-md border border-[#ead8c7] bg-[#fff9f3] px-3 py-2 font-normal"
                      />
                    </label>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-[#74635c]">{formatCurrency(unitPrice)} por unidad</p>
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(index)} className="focus-ring rounded-md px-3 py-2 text-sm font-semibold text-[#c9657e]">
                        Quitar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => setItems((current) => [...current, { productId: products[0].id, quantity: 1, notes: "" }])}
          className="focus-ring rounded-full border border-[#c9657e] px-5 py-3 text-sm font-semibold"
        >
          Agregar otro producto
        </button>
      </section>

      <aside className="h-fit rounded-lg border border-[#ead8c7] bg-white p-5 soft-shadow">
        <h1 className="text-2xl font-semibold">Confirmar pedido</h1>
        <div className="mt-5 grid gap-4">
          <label className="grid gap-1 text-sm font-semibold">
            Nombre
            <input name="customerName" required className="focus-ring rounded-md border border-[#ead8c7] bg-[#fff9f3] px-3 py-2 font-normal" />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Email
            <input name="customerEmail" type="text" inputMode="email" required className="focus-ring rounded-md border border-[#ead8c7] bg-[#fff9f3] px-3 py-2 font-normal" />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            WhatsApp
            <input name="customerPhone" required className="focus-ring rounded-md border border-[#ead8c7] bg-[#fff9f3] px-3 py-2 font-normal" />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Fecha deseada
            <input
              name="requestedDeliveryDate"
              type="date"
              min={minDate}
              required
              className="focus-ring rounded-md border border-[#ead8c7] bg-[#fff9f3] px-3 py-2 font-normal"
            />
            <span className="text-xs font-normal text-[#74635c]">Mínimo 48 h de anticipación</span>
          </label>
          <fieldset className="grid gap-2">
            <legend className="text-sm font-semibold">Método de entrega</legend>
            <div className="grid grid-cols-2 gap-2">
              {(["recoger", "domicilio"] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setDeliveryMethod(method)}
                  className={`focus-ring rounded-md border px-3 py-2 text-sm font-semibold ${
                    deliveryMethod === method ? "border-[#c9657e] bg-[#f4b6c4]" : "border-[#ead8c7] bg-[#fff9f3]"
                  }`}
                >
                  {method === "recoger" ? "Recoger" : "Domicilio"}
                </button>
              ))}
            </div>
          </fieldset>
          {deliveryMethod === "domicilio" && (
            <label className="grid gap-1 text-sm font-semibold">
              Dirección
              <input name="deliveryAddress" className="focus-ring rounded-md border border-[#ead8c7] bg-[#fff9f3] px-3 py-2 font-normal" />
            </label>
          )}
          <label className="grid gap-1 text-sm font-semibold">
            Observaciones generales
            <textarea name="customerNotes" rows={3} className="focus-ring rounded-md border border-[#ead8c7] bg-[#fff9f3] px-3 py-2 font-normal" />
          </label>
        </div>
        {/* total + botón — solo visible en desktop */}
        <div className="hidden md:block">
          <div className="my-5 border-t border-[#ead8c7]" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#74635c]">Total estimado</span>
            <strong className="text-2xl">{formatCurrency(total)}</strong>
          </div>
          {!user && !loading && (
            <button
              type="button"
              onClick={signInWithGoogle}
              className="focus-ring mt-5 w-full rounded-full border border-[#c9657e] px-5 py-3 text-sm font-semibold"
            >
              Iniciar sesión con Google
            </button>
          )}
          {error && <p className="mt-4 rounded-md bg-[#ffd3bc] p-3 text-sm text-[#3b2924]">{error}</p>}
          <button
            type="submit"
            disabled={!user || isSubmitting}
            className="focus-ring dark-action mt-5 w-full rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            style={darkActionStyle}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? "Registrando pedido..." : "Confirmar pedido"}
          </button>
        </div>
      </aside>

      {/* Barra sticky mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-[#ead8c7] bg-white/95 px-4 py-3 backdrop-blur md:hidden">
        {error && <p className="mb-2 rounded-md bg-[#ffd3bc] px-3 py-2 text-sm text-[#3b2924]">{error}</p>}
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-[#74635c]">Total estimado</p>
            <strong className="text-xl">{formatCurrency(total)}</strong>
          </div>
          {!user && !loading ? (
            <button
              type="button"
              onClick={signInWithGoogle}
              className="focus-ring rounded-full border border-[#c9657e] px-5 py-2.5 text-sm font-semibold"
            >
              Ingresar para pedir
            </button>
          ) : (
            <button
              type="submit"
              disabled={!user || isSubmitting}
              className="focus-ring dark-action min-w-[154px] rounded-full px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              style={darkActionStyle}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? "Registrando..." : "Confirmar pedido"}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
