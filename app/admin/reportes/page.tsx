"use client";

import { useEffect, useState } from "react";
import { formatCurrency, Order, orderTotal, OrderStatus } from "@/lib/data";
import { getAllOrders } from "@/lib/firebase-store";
import { StatusPill } from "@/components/status-pill";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  en_preparacion: "En preparación",
  listo_para_entrega: "Listo para entrega",
  entregado: "Entregado",
  cancelado: "Cancelado"
};

export default function AdminReportsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllOrders()
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  const activeOrders = orders.filter((o) => o.status !== "cancelado");
  const totalSales = activeOrders.reduce((sum, o) => sum + orderTotal(o), 0);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthOrders = activeOrders.filter((o) => o.requestedDeliveryDate.startsWith(currentMonth));
  const monthlySales = monthOrders.reduce((sum, o) => sum + orderTotal(o), 0);

  const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const productQty = activeOrders.reduce<Record<string, { name: string; qty: number }>>((acc, o) => {
    o.items.forEach((item) => {
      if (!acc[item.productId]) acc[item.productId] = { name: item.productName, qty: 0 };
      acc[item.productId].qty += item.quantity;
    });
    return acc;
  }, {});
  const topProducts = Object.values(productQty).sort((a, b) => b.qty - a.qty).slice(0, 5);

  const paidOrders = orders.filter((o) => o.paymentStatus === "pagado");
  const pendingPayment = orders.filter((o) => o.paymentStatus === "pendiente" && o.status !== "cancelado");

  return (
    <section>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#c9657e]">Reportes</p>
        <h1 className="mt-2 text-3xl font-semibold">Resumen del negocio</h1>
      </div>

      {loading && (
        <p className="mb-4 rounded-lg border border-[#ead8c7] bg-white p-4 text-sm text-[#74635c]">Cargando datos...</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Ventas este mes", value: formatCurrency(monthlySales), sub: `${monthOrders.length} pedidos` },
          { label: "Ventas totales", value: formatCurrency(totalSales), sub: `${activeOrders.length} pedidos activos` },
          { label: "Cobros confirmados", value: paidOrders.length.toString(), sub: "pedidos pagados" },
          { label: "Cobros pendientes", value: pendingPayment.length.toString(), sub: "por confirmar pago" }
        ].map(({ label, value, sub }) => (
          <article key={label} className="rounded-lg border border-[#ead8c7] bg-white p-5 soft-shadow">
            <p className="text-sm text-[#74635c]">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
            <p className="mt-1 text-xs text-[#74635c]">{sub}</p>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <article className="rounded-lg border border-[#ead8c7] bg-white p-5 soft-shadow">
          <h2 className="font-semibold">Pedidos por estado</h2>
          {!loading && orders.length === 0 && (
            <p className="mt-4 text-sm text-[#74635c]">Aún no hay pedidos.</p>
          )}
          <div className="mt-4 grid gap-2">
            {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((status) => {
              const count = statusCounts[status] || 0;
              if (count === 0) return null;
              return (
                <div key={status} className="flex items-center justify-between rounded-md bg-[#fff9f3] px-3 py-2">
                  <StatusPill label={status} tone={status === "entregado" || status === "listo_para_entrega" ? "green" : status === "cancelado" ? "sand" : undefined} />
                  <span className="text-sm font-semibold">{count}</span>
                </div>
              );
            })}
          </div>
        </article>

        <article className="rounded-lg border border-[#ead8c7] bg-white p-5 soft-shadow">
          <h2 className="font-semibold">Productos más pedidos</h2>
          {topProducts.length === 0 && !loading && (
            <p className="mt-4 text-sm text-[#74635c]">Aún no hay datos de productos.</p>
          )}
          <div className="mt-4 grid gap-2">
            {topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center justify-between rounded-md bg-[#fff9f3] px-3 py-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-[#74635c]">#{i + 1}</span>
                  <span className="text-sm font-medium">{p.name}</span>
                </div>
                <span className="text-sm font-semibold">{p.qty} und.</span>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
