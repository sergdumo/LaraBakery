import Link from "next/link";
import type { Metadata } from "next";
import { ProductGrid } from "@/components/product-grid";
import { darkActionStyle } from "@/lib/styles";
import { absoluteUrl, createPageMetadata, siteName, siteUrl } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Alfajores artesanales en Medellín | Lara Bakery",
  description:
    "Alfajores artesanales, tortas y detalles dulces hechos por encargo en Medellín. Pide online con mínimo 24 horas de anticipación.",
  path: "/"
});

const categories = [
  {
    title: "Para regalar",
    text: "Cajas listas para sorprender con un detalle dulce y cuidado.",
    image: "/images/lara-alfajores.jpeg"
  },
  {
    title: "Para compartir",
    text: "Alfajores, galletas y bocados para reuniones pequeñas.",
    image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Por encargo",
    text: "Pedidos especiales con fecha, cantidad y observaciones.",
    image: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=900&q=80"
  }
];

const trustItems = [
  ["Artesanal", "Preparaciones en pequeños lotes, con sabor casero y presentación delicada."],
  ["Fresco", "Cada pedido se agenda con anticipación para cuidar textura, empaque y entrega."],
  ["Cercano", "Confirmación por WhatsApp sin perder trazabilidad dentro de la plataforma."]
];

export default function Home() {
  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "Bakery",
    name: siteName,
    url: siteUrl,
    image: absoluteUrl("/images/lara-alfajores.jpeg"),
    description:
      "Repostería artesanal en Medellín: alfajores, tortas y postres por encargo con atención personalizada.",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Medellín",
      addressRegion: "Antioquia",
      addressCountry: "CO"
    },
    areaServed: ["Medellín", "Envigado", "Sabaneta", "Laureles", "El Poblado"],
    servesCuisine: "Repostería artesanal",
    sameAs: ["https://www.instagram.com/lara.bakeryy/"]
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
      <section className="border-b border-[#ead8c7] bg-[#fff9f3]">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-[0.92fr_1fr] md:items-center md:py-14">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#c9657e]">
              Repostería artesanal en casa
            </p>
            <h1 className="text-3xl font-semibold leading-tight text-[#3b2924] md:text-6xl">
              Lara Bakery
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-[#5f4b44] md:text-lg md:leading-8">
              Detalles dulces, alfajores y tortas por encargo en Medellín, preparados con calma, cuidado y sabor casero.
            </p>
            <div className="mt-6 flex flex-row flex-wrap gap-3">
              <Link
                href="/pedido"
                className="focus-ring dark-action rounded-full px-6 py-3 text-center text-sm font-semibold transition"
                style={darkActionStyle}
              >
                Hacer pedido
              </Link>
              <Link
                href="/productos"
                className="focus-ring rounded-full border border-[#c9657e] px-6 py-3 text-center text-sm font-semibold text-[#3b2924] transition hover:bg-white"
              >
                Ver productos
              </Link>
            </div>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1 text-sm text-[#74635c]">
              <span>24h mínimo</span>
              <span>Recoger o domicilio</span>
              <span>Confirmación por WhatsApp</span>
            </div>
          </div>
          <div className="hidden overflow-hidden rounded-lg bg-white p-2 soft-shadow md:block">
            <img
              src="/images/lara-alfajores.jpeg"
              alt="Alfajores Lara Bakery"
              className="aspect-[4/5] w-full rounded-md object-cover"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <div className="mb-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#c9657e]">Elige por ocasión</p>
          <h2 className="mt-2 text-2xl font-semibold md:text-3xl">Dulces para regalar, compartir o encargar</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.title}
              href="/productos"
              className="focus-ring group overflow-hidden rounded-lg bg-white soft-shadow"
            >
              <div className="relative">
                <img src={category.image} alt={category.title} className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#3b2924]/62 to-transparent" />
                <h3 className="absolute bottom-4 left-4 text-2xl font-semibold text-white">{category.title}</h3>
              </div>
              <p className="p-4 text-sm leading-6 text-[#74635c]">{category.text}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-[0.8fr_1fr] md:items-center md:py-12">
          <img
            src="https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=900&q=80"
            alt="Mesa con postres artesanales"
            className="aspect-[4/3] w-full rounded-lg object-cover soft-shadow"
          />
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#c9657e]">Hecho con cuidado</p>
            <h2 className="mt-2 text-3xl font-semibold">Un detalle dulce también puede sentirse personal</h2>
            <p className="mt-4 leading-7 text-[#74635c]">
              Lara Bakery nace para preparar pedidos pequeños, bonitos y memorables. Cada caja se piensa como un detalle:
              sabor casero, empaque limpio y una confirmación cercana para que el pedido llegue como lo imaginaste en Medellín,
              Envigado, Sabaneta, Laureles o El Poblado.
            </p>
            <Link href="/pedido" className="focus-ring mt-6 inline-block rounded-full border border-[#c9657e] px-5 py-3 text-sm font-semibold">
              Crear pedido especial
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#c9657e]">Destacados</p>
            <h2 className="mt-2 text-2xl font-semibold">Productos listos para pedir</h2>
          </div>
          <Link href="/productos" className="focus-ring rounded-md px-3 py-2 text-sm font-semibold text-[#c9657e]">
            Ver todo
          </Link>
        </div>
        <ProductGrid featuredOnly />
      </section>

      <section className="border-t border-[#ead8c7] bg-white">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-10 md:grid-cols-3">
          {trustItems.map(([title, text]) => (
            <div key={title} className="rounded-lg border border-[#ead8c7] p-5">
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#74635c]">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
