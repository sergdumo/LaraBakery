"use client";

import { useEffect, useState } from "react";
import { Product, products as fallbackProducts } from "@/lib/data";
import { getProducts } from "@/lib/firebase-store";
import { ProductCard } from "@/components/product-card";

export function ProductGrid({ featuredOnly = false }: { featuredOnly?: boolean }) {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch(() => { setProducts(fallbackProducts); setError(true); })
      .finally(() => setLoading(false));
  }, []);

  const visibleProducts = products.filter((product) => product.isAvailable && (!featuredOnly || product.isFeatured));

  if (loading) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 animate-pulse rounded-lg bg-[#ead8c7]" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {error && (
        <p className="col-span-full rounded-lg border border-[#ead8c7] bg-white px-4 py-3 text-sm text-[#74635c]">
          No pudimos cargar los productos actualizados. Mostrando catálogo base.
        </p>
      )}
      {visibleProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
