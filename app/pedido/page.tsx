import type { Metadata } from "next";
import { OrderForm } from "@/app/pedido/order-form";
import { products } from "@/lib/data";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Hacer pedido de repostería artesanal en Medellín | Lara Bakery",
  description:
    "Arma tu pedido de alfajores, tortas y postres artesanales en Medellín. Elige productos, cantidades, fecha de entrega y método de entrega.",
  path: "/pedido"
});

export default function OrderPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#c9657e]">Pedido</p>
        <h1 className="mt-2 text-3xl font-semibold">Arma tu pedido en Medellín</h1>
        <p className="mt-3 leading-7 text-[#74635c]">
          Los pedidos deben hacerse con minimo 24 horas de anticipacion. Lara Bakery confirmara disponibilidad por WhatsApp.
        </p>
      </div>
      <OrderForm products={products.filter((product) => product.isAvailable)} />
    </main>
  );
}
