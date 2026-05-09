import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatCurrency, getProduct, products } from "@/lib/data";
import { darkActionStyle } from "@/lib/styles";
import { absoluteUrl, createPageMetadata, siteName } from "@/lib/seo";

type Props = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return products.map((product) => ({ id: product.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = getProduct(id);

  if (!product) {
    return createPageMetadata({
      title: "Producto no encontrado | Lara Bakery",
      description: "Producto no encontrado en el catálogo de Lara Bakery.",
      path: "/productos",
      noIndex: true
    });
  }

  const title = `${product.name} en Medellín | Lara Bakery`;
  const description = `${product.longDescription} Pide ${product.name.toLowerCase()} por encargo en Medellín con atención personalizada por WhatsApp.`;

  return createPageMetadata({
    title,
    description,
    path: `/productos/${product.id}`,
    image: product.imageUrl
  });
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = getProduct(id);

  if (!product) {
    notFound();
  }

  const hasSizes = Boolean(product.variants?.length);
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: absoluteUrl(product.imageUrl),
    description: product.longDescription,
    brand: {
      "@type": "Brand",
      name: siteName
    },
    category: product.category,
    offers: {
      "@type": "Offer",
      priceCurrency: "COP",
      price: product.price,
      availability: product.isAvailable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: absoluteUrl(`/productos/${product.id}`)
    },
    areaServed: ["Medellín", "Envigado", "Sabaneta", "Laureles", "El Poblado"]
  };

  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_0.9fr]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <img
        src={product.imageUrl}
        alt={product.name}
        className="aspect-[4/3] w-full rounded-lg object-cover soft-shadow"
      />
      <section className="rounded-lg border border-[#ead8c7] bg-white p-6 soft-shadow">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#c9657e]">{product.category}</p>
        <h1 className="mt-2 text-3xl font-semibold">{product.name}</h1>
        <p className="mt-4 leading-7 text-[#74635c]">
          {product.longDescription} Disponible por encargo en Medellín con confirmación personalizada por WhatsApp.
        </p>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#74635c]">Precio</dt>
            <dd className="mt-1 text-xl font-semibold">{hasSizes ? `Desde ${formatCurrency(product.price)}` : formatCurrency(product.price)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#74635c]">Presentacion</dt>
            <dd className="mt-1">{product.presentation}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#74635c]">Anticipacion</dt>
            <dd className="mt-1">{product.prepHours} horas</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#74635c]">Disponibilidad</dt>
            <dd className="mt-1">{product.isAvailable ? "Disponible" : "No disponible"}</dd>
          </div>
        </dl>
        {hasSizes && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold">Tamaños disponibles</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {product.variants?.map((variant) => (
                <div key={variant.id} className="rounded-md border border-[#ead8c7] bg-[#fff9f3] px-3 py-2">
                  <p className="text-sm font-semibold">{variant.name}</p>
                  <p className="text-sm text-[#74635c]">{formatCurrency(variant.price)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="mt-6">
          <h2 className="text-sm font-semibold">Ingredientes principales</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.ingredients.map((ingredient) => (
              <span key={ingredient} className="rounded-full bg-[#fff9f3] px-3 py-1 text-sm text-[#5f4b44]">
                {ingredient}
              </span>
            ))}
          </div>
        </div>
        <Link
          href={`/pedido?producto=${product.id}`}
          className="focus-ring dark-action mt-8 block rounded-full px-6 py-3 text-center text-sm font-semibold transition"
          style={darkActionStyle}
        >
          Agregar al pedido
        </Link>
      </section>
    </main>
  );
}
