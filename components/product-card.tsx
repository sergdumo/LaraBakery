import Link from "next/link";
import Image from "next/image";
import { Product, formatCurrency } from "@/lib/data";

export function ProductCard({ product }: { product: Product }) {
  const hasSizes = Boolean(product.variants?.length);

  return (
    <article className="group overflow-hidden rounded-lg border border-[#ead8c7] bg-white soft-shadow">
      <Link href={`/productos/${product.id}`} className="focus-ring block">
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
          <span className="absolute left-3 top-3 rounded-full bg-white/92 px-3 py-1 text-xs font-semibold text-[#3b2924]">
            {product.category}
          </span>
        </div>
      </Link>
      <div className="space-y-4 p-4">
        <div>
          <h2 className="text-lg font-semibold">{product.name}</h2>
          <p className="mt-1 text-sm leading-6 text-[#74635c]">{product.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-[#fff9f3] px-3 py-1 text-xs font-semibold text-[#74635c]">
            {hasSizes ? `${product.variants?.length} tamaños` : product.presentation}
          </span>
          <span className="rounded-full bg-[#fff9f3] px-3 py-1 text-xs font-semibold text-[#74635c]">
            {product.prepHours}h anticipacion
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#c9657e]">Desde</p>
            <p className="text-lg font-semibold">{formatCurrency(product.price)}</p>
          </div>
          <Link
            href={`/pedido?producto=${product.id}`}
            className="focus-ring rounded-full bg-[#f4b6c4] px-4 py-2 text-sm font-semibold text-[#3b2924] transition hover:bg-[#ef9eb2]"
          >
            Pedir
          </Link>
        </div>
      </div>
    </article>
  );
}
