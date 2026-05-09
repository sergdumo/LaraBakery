"use client";

import { useEffect, useState } from "react";
import { Product, products as fallbackProducts } from "@/lib/data";
import { getProducts } from "@/lib/firebase-store";
import { ProductCard } from "@/components/product-card";

export function ProductGrid({ featuredOnly = false }: { featuredOnly?: boolean }) {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch(() => setProducts(fallbackProducts));
  }, []);

  const visibleProducts = products.filter((product) => product.isAvailable && (!featuredOnly || product.isFeatured));

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {visibleProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
