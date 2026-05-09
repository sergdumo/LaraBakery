"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { StatusPill } from "@/components/status-pill";
import { formatCurrency, Product } from "@/lib/data";
import { getProducts, updateProduct, createProduct } from "@/lib/firebase-store";
import { darkActionStyle } from "@/lib/styles";

const EMPTY_NEW: Omit<Product, "id"> = {
  name: "",
  description: "",
  longDescription: "",
  price: 0,
  category: "",
  presentation: "",
  ingredients: [],
  imageUrl: "",
  isAvailable: true,
  isFeatured: false,
  prepHours: 24
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<Product>>({});
  const [savingId, setSavingId] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newDraft, setNewDraft] = useState<Omit<Product, "id">>(EMPTY_NEW);
  const [savingNew, setSavingNew] = useState(false);
  const [message, setMessage] = useState("");

  async function loadProducts() {
    setLoading(true);
    setProducts(await getProducts());
    setLoading(false);
  }

  useEffect(() => { loadProducts(); }, []);

  function startEdit(product: Product) {
    setEditingId(product.id);
    setEditDraft({
      name: product.name,
      description: product.description,
      price: product.price,
      presentation: product.presentation,
      category: product.category,
      imageUrl: product.imageUrl,
      prepHours: product.prepHours,
      isFeatured: product.isFeatured,
      isAvailable: product.isAvailable
    });
  }

  async function saveEdit(productId: string) {
    setSavingId(productId);
    await updateProduct(productId, editDraft);
    setEditingId(null);
    setEditDraft({});
    await loadProducts();
    setSavingId("");
  }

  async function toggleAvailability(product: Product) {
    setSavingId(product.id);
    await updateProduct(product.id, { isAvailable: !product.isAvailable });
    await loadProducts();
    setSavingId("");
  }

  async function saveNewProduct() {
    if (!newDraft.name || !newDraft.price) return;
    setSavingNew(true);
    await createProduct(newDraft);
    setNewDraft(EMPTY_NEW);
    setShowNew(false);
    await loadProducts();
    setSavingNew(false);
    setMessage("Producto creado.");
    setTimeout(() => setMessage(""), 3000);
  }

  return (
    <section>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#c9657e]">Catálogo</p>
          <h1 className="mt-2 text-3xl font-semibold">Gestión de productos</h1>
        </div>
        <button
          onClick={() => setShowNew((v) => !v)}
          className="focus-ring dark-action rounded-full px-5 py-3 text-sm font-semibold"
          style={darkActionStyle}
        >
          {showNew ? "Cancelar" : "Nuevo producto"}
        </button>
      </div>

      {message && <p className="mb-4 rounded-lg bg-[#b8d8c0] p-4 text-sm text-[#24432d]">{message}</p>}

      {showNew && (
        <article className="mb-6 rounded-lg border border-[#c9657e]/30 bg-white p-5 soft-shadow">
          <h2 className="mb-4 font-semibold">Nuevo producto</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-semibold">
              Nombre *
              <input
                value={newDraft.name}
                onChange={(e) => setNewDraft((d) => ({ ...d, name: e.target.value }))}
                className="focus-ring rounded-md border border-[#ead8c7] bg-[#fff9f3] px-3 py-2 font-normal"
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Precio (COP) *
              <input
                type="number"
                value={newDraft.price || ""}
                onChange={(e) => setNewDraft((d) => ({ ...d, price: Number(e.target.value) }))}
                className="focus-ring rounded-md border border-[#ead8c7] bg-[#fff9f3] px-3 py-2 font-normal"
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Descripción
              <input
                value={newDraft.description}
                onChange={(e) => setNewDraft((d) => ({ ...d, description: e.target.value }))}
                className="focus-ring rounded-md border border-[#ead8c7] bg-[#fff9f3] px-3 py-2 font-normal"
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Presentación
              <input
                value={newDraft.presentation}
                onChange={(e) => setNewDraft((d) => ({ ...d, presentation: e.target.value }))}
                placeholder="Caja x18, 8 porciones..."
                className="focus-ring rounded-md border border-[#ead8c7] bg-[#fff9f3] px-3 py-2 font-normal"
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Categoría
              <input
                value={newDraft.category}
                onChange={(e) => setNewDraft((d) => ({ ...d, category: e.target.value }))}
                className="focus-ring rounded-md border border-[#ead8c7] bg-[#fff9f3] px-3 py-2 font-normal"
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              URL imagen
              <input
                value={newDraft.imageUrl}
                onChange={(e) => setNewDraft((d) => ({ ...d, imageUrl: e.target.value }))}
                className="focus-ring rounded-md border border-[#ead8c7] bg-[#fff9f3] px-3 py-2 font-normal"
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Horas preparación
              <input
                type="number"
                value={newDraft.prepHours}
                onChange={(e) => setNewDraft((d) => ({ ...d, prepHours: Number(e.target.value) }))}
                className="focus-ring rounded-md border border-[#ead8c7] bg-[#fff9f3] px-3 py-2 font-normal"
              />
            </label>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={newDraft.isFeatured}
                  onChange={(e) => setNewDraft((d) => ({ ...d, isFeatured: e.target.checked }))}
                />
                Destacado
              </label>
            </div>
          </div>
          <button
            type="button"
            onClick={saveNewProduct}
            disabled={savingNew || !newDraft.name || !newDraft.price}
            className="focus-ring mt-4 rounded-full bg-[#3b2924] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {savingNew ? "Guardando..." : "Crear producto"}
          </button>
        </article>
      )}

      {loading && <p className="mb-4 rounded-lg border border-[#ead8c7] bg-white p-4 text-sm text-[#74635c]">Cargando productos...</p>}
      <div className="grid gap-4">
        {products.map((product) => {
          const isEditing = editingId === product.id;
          const isSaving = savingId === product.id;

          return (
            <article key={product.id} className="rounded-lg border border-[#ead8c7] bg-white p-4 soft-shadow">
              {isEditing ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1 text-sm font-semibold">
                    Nombre
                    <input
                      value={editDraft.name ?? ""}
                      onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                      className="focus-ring rounded-md border border-[#ead8c7] bg-[#fff9f3] px-3 py-2 font-normal"
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-semibold">
                    Precio (COP)
                    <input
                      type="number"
                      value={editDraft.price ?? ""}
                      onChange={(e) => setEditDraft((d) => ({ ...d, price: Number(e.target.value) }))}
                      className="focus-ring rounded-md border border-[#ead8c7] bg-[#fff9f3] px-3 py-2 font-normal"
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-semibold">
                    Descripción
                    <input
                      value={editDraft.description ?? ""}
                      onChange={(e) => setEditDraft((d) => ({ ...d, description: e.target.value }))}
                      className="focus-ring rounded-md border border-[#ead8c7] bg-[#fff9f3] px-3 py-2 font-normal"
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-semibold">
                    Presentación
                    <input
                      value={editDraft.presentation ?? ""}
                      onChange={(e) => setEditDraft((d) => ({ ...d, presentation: e.target.value }))}
                      className="focus-ring rounded-md border border-[#ead8c7] bg-[#fff9f3] px-3 py-2 font-normal"
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-semibold">
                    URL imagen
                    <input
                      value={editDraft.imageUrl ?? ""}
                      onChange={(e) => setEditDraft((d) => ({ ...d, imageUrl: e.target.value }))}
                      className="focus-ring rounded-md border border-[#ead8c7] bg-[#fff9f3] px-3 py-2 font-normal"
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-semibold">
                    Horas preparación
                    <input
                      type="number"
                      value={editDraft.prepHours ?? 24}
                      onChange={(e) => setEditDraft((d) => ({ ...d, prepHours: Number(e.target.value) }))}
                      className="focus-ring rounded-md border border-[#ead8c7] bg-[#fff9f3] px-3 py-2 font-normal"
                    />
                  </label>
                  <div className="flex items-center gap-5">
                    <label className="flex items-center gap-2 text-sm font-semibold">
                      <input
                        type="checkbox"
                        checked={editDraft.isAvailable ?? true}
                        onChange={(e) => setEditDraft((d) => ({ ...d, isAvailable: e.target.checked }))}
                      />
                      Disponible
                    </label>
                    <label className="flex items-center gap-2 text-sm font-semibold">
                      <input
                        type="checkbox"
                        checked={editDraft.isFeatured ?? false}
                        onChange={(e) => setEditDraft((d) => ({ ...d, isFeatured: e.target.checked }))}
                      />
                      Destacado
                    </label>
                  </div>
                  <div className="flex gap-2 sm:col-span-2">
                    <button
                      onClick={() => saveEdit(product.id)}
                      disabled={isSaving}
                      className="focus-ring rounded-full bg-[#3b2924] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {isSaving ? "Guardando..." : "Guardar"}
                    </button>
                    <button
                      onClick={() => { setEditingId(null); setEditDraft({}); }}
                      className="focus-ring rounded-full border border-[#ead8c7] px-5 py-2 text-sm font-semibold"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-[96px_1fr_auto] sm:items-center">
                  <div className="relative h-24 w-full overflow-hidden rounded-md sm:w-24">
                    <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                  </div>
                  <div>
                    <h2 className="font-semibold">{product.name}</h2>
                    <p className="mt-1 text-sm text-[#74635c]">{product.presentation} · {formatCurrency(product.price)}</p>
                    <p className="mt-1 text-sm text-[#74635c]">{product.description}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <StatusPill label={product.isAvailable ? "Disponible" : "No disponible"} />
                      {product.isFeatured && <StatusPill label="Destacado" />}
                    </div>
                  </div>
                  <div className="flex gap-2 sm:flex-col">
                    <button
                      onClick={() => toggleAvailability(product)}
                      disabled={isSaving}
                      className="focus-ring rounded-full border border-[#ead8c7] bg-[#fff9f3] px-4 py-2 text-sm font-semibold disabled:opacity-60"
                    >
                      {isSaving ? "..." : product.isAvailable ? "Desactivar" : "Activar"}
                    </button>
                    <button
                      onClick={() => startEdit(product)}
                      className="focus-ring rounded-full border border-[#ead8c7] bg-[#fff9f3] px-4 py-2 text-sm font-semibold"
                    >
                      Editar
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
