import type { Metadata } from "next";
import { ProductGrid } from "@/components/product-grid";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Productos de repostería artesanal en Medellín | Lara Bakery",
  description:
    "Catálogo de alfajores, tortas y postres artesanales por encargo en Medellín. Elige productos, cantidades y fecha de entrega online.",
  path: "/productos"
});

export default function ProductsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#c9657e]">Catalogo</p>
          <h1 className="mt-2 text-3xl font-semibold">Productos disponibles en Medellín</h1>
          <p className="mt-3 leading-7 text-[#74635c]">
            Elige alfajores artesanales, tortas por encargo y postres hechos con cuidado para recoger o recibir a domicilio.
          </p>
        </div>
        <div className="rounded-lg border border-[#ead8c7] bg-white px-4 py-3 text-sm text-[#74635c]">
          Minimo 48h de anticipacion
        </div>
      </div>
      <ProductGrid />
    </main>
  );
}
