"use client";

import { useEffect, useState } from "react";
import { formatCurrency, Product } from "@/lib/data";
import { getProducts, getProductCosts, saveProductCost, ProductCostEntry } from "@/lib/firebase-store";

type CostFields = Omit<ProductCostEntry, "productId">;

const COST_FIELDS: { key: keyof CostFields; label: string }[] = [
  { key: "ingredients", label: "Ingredientes" },
  { key: "packaging", label: "Empaque" },
  { key: "labor", label: "Mano de obra" },
  { key: "other", label: "Otros" }
];

function marginColor(pct: number) {
  if (pct >= 50) return "text-[#4f8a5f]";
  if (pct >= 30) return "text-[#b4835d]";
  return "text-[#c9657e]";
}

export default function AdminCostsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [costs, setCosts] = useState<Record<string, CostFields>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [prods, productCosts] = await Promise.all([getProducts(), getProductCosts()]);
      setProducts(prods);
      const map: Record<string, CostFields> = {};
      prods.forEach((p) => {
        const found = productCosts.find((c) => c.productId === p.id);
        map[p.id] = found
          ? { ingredients: found.ingredients, packaging: found.packaging, labor: found.labor, other: found.other }
          : { ingredients: 0, packaging: 0, labor: 0, other: 0 };
      });
      setCosts(map);
      setLoading(false);
    }
    load();
  }, []);

  function update(productId: string, field: keyof CostFields, raw: string) {
    const value = Math.max(0, Number(raw) || 0);
    setCosts((prev) => ({ ...prev, [productId]: { ...prev[productId], [field]: value } }));
    setSaved((prev) => ({ ...prev, [productId]: false }));
  }

  async function handleSave(productId: string) {
    setSaving((prev) => ({ ...prev, [productId]: true }));
    await saveProductCost(productId, costs[productId]);
    setSaving((prev) => ({ ...prev, [productId]: false }));
    setSaved((prev) => ({ ...prev, [productId]: true }));
  }

  const totalCostAll = products.reduce((sum, p) => {
    const c = costs[p.id];
    return sum + (c ? c.ingredients + c.packaging + c.labor + c.other : 0);
  }, 0);
  const totalRevenueAll = products.reduce((sum, p) => sum + p.price, 0);

  return (
    <section>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#c9657e]">Rentabilidad</p>
        <h1 className="mt-2 text-3xl font-semibold">Gestión de costos</h1>
        <p className="mt-2 text-sm text-[#74635c]">Edita los costos por producto y guarda. El margen se calcula automáticamente.</p>
      </div>

      {loading && (
        <p className="mb-4 rounded-lg border border-[#ead8c7] bg-white p-4 text-sm text-[#74635c]">Cargando...</p>
      )}

      <div className="grid gap-4">
        {products.map((product) => {
          const cost = costs[product.id] ?? { ingredients: 0, packaging: 0, labor: 0, other: 0 };
          const totalCost = cost.ingredients + cost.packaging + cost.labor + cost.other;
          const margin = product.price - totalCost;
          const marginPct = product.price ? Math.round((margin / product.price) * 100) : 0;

          return (
            <article key={product.id} className="rounded-lg border border-[#ead8c7] bg-white p-5 soft-shadow">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                <div>
                  <h2 className="font-semibold">{product.name}</h2>
                  <p className="mt-1 text-sm text-[#74635c]">Precio de venta: {formatCurrency(product.price)}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className={`text-lg font-semibold ${marginColor(marginPct)}`}>
                    {marginPct}% — {formatCurrency(margin)}
                  </p>
                  <p className="text-xs text-[#74635c]">Costo total: {formatCurrency(totalCost)}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                {COST_FIELDS.map(({ key, label }) => (
                  <label key={key} className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-[#74635c]">
                    {label}
                    <input
                      type="number"
                      min="0"
                      value={cost[key] || ""}
                      placeholder="0"
                      onChange={(e) => update(product.id, key, e.target.value)}
                      className="focus-ring rounded-md border border-[#ead8c7] bg-[#fff9f3] px-3 py-2 text-sm font-normal text-[#3b2924]"
                    />
                  </label>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-[#74635c]">
                  {saved[product.id] ? "✓ Guardado en Firestore" : ""}
                </p>
                <button
                  onClick={() => handleSave(product.id)}
                  disabled={saving[product.id]}
                  className="focus-ring rounded-full bg-[#3b2924] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {saving[product.id] ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {!loading && products.length > 0 && (
        <div className="mt-6 rounded-lg border border-[#ead8c7] bg-white p-5 soft-shadow">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#c9657e]">Resumen general</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-md bg-[#fff9f3] p-3">
              <p className="text-xs text-[#74635c]">Costo total catálogo</p>
              <p className="mt-1 font-semibold">{formatCurrency(totalCostAll)}</p>
            </div>
            <div className="rounded-md bg-[#fff9f3] p-3">
              <p className="text-xs text-[#74635c]">Precio total catálogo</p>
              <p className="mt-1 font-semibold">{formatCurrency(totalRevenueAll)}</p>
            </div>
            <div className="rounded-md bg-[#fff9f3] p-3">
              <p className="text-xs text-[#74635c]">Margen promedio catálogo</p>
              <p className={`mt-1 font-semibold ${marginColor(totalRevenueAll ? Math.round(((totalRevenueAll - totalCostAll) / totalRevenueAll) * 100) : 0)}`}>
                {totalRevenueAll ? Math.round(((totalRevenueAll - totalCostAll) / totalRevenueAll) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
