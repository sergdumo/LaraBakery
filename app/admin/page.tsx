"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { StatusPill } from "@/components/status-pill";
import { formatCurrency, formatStatus, Order, OrderStatus, orderTotal, PaymentStatus } from "@/lib/data";
import { getAllOrders, getProductCosts, ProductCostEntry } from "@/lib/firebase-store";

const monthNames = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre"
];

const orderStatuses: OrderStatus[] = ["pendiente", "confirmado", "en_preparacion", "listo_para_entrega", "entregado", "cancelado"];
const paymentStatuses: PaymentStatus[] = ["pendiente", "parcial", "pagado", "cancelado"];

function currentBogotaMonth() {
  const date = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Bogota" }));
  return {
    month: date.getMonth() + 1,
    year: date.getFullYear()
  };
}

function isSameMonth(order: Order, month: number, year: number) {
  if (!order.requestedDeliveryDate) return false;
  const [orderYear, orderMonth] = order.requestedDeliveryDate.split("-").map(Number);
  return orderYear === year && orderMonth === month;
}

function getStatusTone(status: string) {
  if (status === "entregado" || status === "listo_para_entrega" || status === "pagado") return "green";
  if (status === "cancelado") return "sand";
  return undefined;
}

function costTotal(cost?: ProductCostEntry) {
  if (!cost) return 0;
  return cost.ingredients + cost.packaging + cost.labor + cost.other;
}

function daysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate();
}

function chartPath(values: number[], width: number, height: number) {
  const maxValue = Math.max(...values, 1);
  const step = values.length > 1 ? width / (values.length - 1) : width;
  return values
    .map((value, index) => {
      const x = index * step;
      const y = height - (value / maxValue) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function chartAreaPath(values: number[], width: number, height: number) {
  if (!values.length) return "";
  return `${chartPath(values, width, height)} L ${width} ${height} L 0 ${height} Z`;
}

function doughnutGradient(items: Array<{ count: number; color: string }>) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  if (!total) return "#ead8c7";

  let cursor = 0;
  return `conic-gradient(${items
    .filter((item) => item.count > 0)
    .map((item) => {
      const start = cursor;
      const end = cursor + (item.count / total) * 360;
      cursor = end;
      return `${item.color} ${start}deg ${end}deg`;
    })
    .join(", ")})`;
}

function segmentColor(index: number) {
  return ["#c9657e", "#4f8a5f", "#b4835d", "#3b2924", "#f4b6c4", "#ead8c7"][index % 6];
}

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [productCosts, setProductCosts] = useState<ProductCostEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const currentPeriod = useMemo(() => currentBogotaMonth(), []);
  const [selectedMonth, setSelectedMonth] = useState(currentPeriod.month);
  const [selectedYear, setSelectedYear] = useState(currentPeriod.year);

  useEffect(() => {
    async function loadDashboard() {
      const [allOrders, costs] = await Promise.all([getAllOrders(), getProductCosts()]);
      setOrders(allOrders);
      setProductCosts(costs);
      setLoading(false);
    }

    loadDashboard();
  }, []);

  const availableYears = useMemo(() => {
    const years = new Set([currentPeriod.year]);
    orders.forEach((order) => {
      const year = Number(order.requestedDeliveryDate?.slice(0, 4));
      if (year) years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [currentPeriod.year, orders]);

  const dashboard = useMemo(() => {
    const costsByProduct = new Map(productCosts.map((cost) => [cost.productId, cost]));
    const periodOrders = orders.filter((order) => isSameMonth(order, selectedMonth, selectedYear));
    const activeOrders = periodOrders.filter((order) => order.status !== "cancelado");
    const deliveredOrders = activeOrders.filter((order) => order.status === "entregado");
    const paidOrders = activeOrders.filter((order) => order.paymentStatus === "pagado");
    const pendingPaymentOrders = activeOrders.filter((order) => order.paymentStatus === "pendiente" || order.paymentStatus === "parcial");

    const revenue = activeOrders.reduce((sum, order) => sum + orderTotal(order), 0);
    const paidRevenue = paidOrders.reduce((sum, order) => sum + orderTotal(order), 0);
    let estimatedCost = 0;
    let unitsWithRegisteredCost = 0;
    let totalUnits = 0;
    const productMap = new Map<string, { id: string; name: string; qty: number; revenue: number; cost: number }>();
    const dailyMap = new Map<number, { orders: number; revenue: number }>();

    activeOrders.forEach((order) => {
      const day = Number(order.requestedDeliveryDate.slice(8, 10));
      const daySummary = dailyMap.get(day) || { orders: 0, revenue: 0 };
      daySummary.orders += 1;
      daySummary.revenue += orderTotal(order);
      dailyMap.set(day, daySummary);

      order.items.forEach((item) => {
        const itemRevenue = item.quantity * item.unitPrice;
        const unitCost = costTotal(costsByProduct.get(item.productId.split(":")[0]));
        const itemCost = unitCost * item.quantity;
        totalUnits += item.quantity;
        estimatedCost += itemCost;
        if (unitCost > 0) unitsWithRegisteredCost += item.quantity;

        const product = productMap.get(item.productId) || {
          id: item.productId,
          name: item.productName,
          qty: 0,
          revenue: 0,
          cost: 0
        };
        product.qty += item.quantity;
        product.revenue += itemRevenue;
        product.cost += itemCost;
        productMap.set(item.productId, product);
      });
    });

    const statusCounts = orderStatuses.map((status) => ({
      status,
      count: periodOrders.filter((order) => order.status === status).length
    }));
    const paymentCounts = paymentStatuses.map((status) => ({
      status,
      count: periodOrders.filter((order) => order.paymentStatus === status).length
    }));
    const topProducts = Array.from(productMap.values()).sort((a, b) => b.qty - a.qty).slice(0, 5);
    const topRevenueProducts = Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 4);
    const dailySales = Array.from(dailyMap.entries())
      .map(([day, value]) => ({ day, ...value }))
      .sort((a, b) => a.day - b.day);
    const dailySeries = Array.from({ length: daysInMonth(selectedMonth, selectedYear) }, (_, index) => {
      const day = index + 1;
      return { day, orders: dailyMap.get(day)?.orders || 0, revenue: dailyMap.get(day)?.revenue || 0 };
    });
    const maxDailyRevenue = Math.max(...dailySales.map((day) => day.revenue), 1);

    return {
      periodOrders,
      activeOrders,
      deliveredOrders,
      paidOrders,
      pendingPaymentOrders,
      revenue,
      paidRevenue,
      estimatedCost,
      estimatedProfit: revenue - estimatedCost,
      unitsWithRegisteredCost,
      totalUnits,
      statusCounts,
      paymentCounts,
      topProducts,
      topRevenueProducts,
      dailySales,
      dailySeries,
      maxDailyRevenue
    };
  }, [orders, productCosts, selectedMonth, selectedYear]);

  const averageTicket = dashboard.activeOrders.length ? dashboard.revenue / dashboard.activeOrders.length : 0;
  const profitMargin = dashboard.revenue ? Math.round((dashboard.estimatedProfit / dashboard.revenue) * 100) : 0;
  const costCoverage = dashboard.totalUnits ? Math.round((dashboard.unitsWithRegisteredCost / dashboard.totalUnits) * 100) : 0;
  const paymentProgress = dashboard.revenue ? Math.round((dashboard.paidRevenue / dashboard.revenue) * 100) : 0;
  const deliveredProgress = dashboard.activeOrders.length ? Math.round((dashboard.deliveredOrders.length / dashboard.activeOrders.length) * 100) : 0;
  const dailyRevenueValues = dashboard.dailySeries.map((day) => day.revenue);
  const linePath = chartPath(dailyRevenueValues, 640, 190);
  const areaPath = chartAreaPath(dailyRevenueValues, 640, 190);
  const activeStatusCounts = dashboard.statusCounts.filter((item) => item.count > 0);
  const activePaymentCounts = dashboard.paymentCounts.filter((item) => item.count > 0);
  const statusChartItems = activeStatusCounts.map((item, index) => ({ ...item, color: segmentColor(index) }));
  const paymentChartItems = activePaymentCounts.map((item, index) => ({ ...item, color: segmentColor(index + 2) }));

  return (
    <section className="grid gap-6">
      <div className="flex flex-col justify-between gap-4 rounded-lg border border-[#ead8c7] bg-[#3b2924] p-5 text-white soft-shadow lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#ffd3bc]">Operación</p>
          <h1 className="mt-2 text-3xl font-semibold">Dashboard administrativo</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#f7e7d8]">
            Resumen de pedidos, ventas, ganancias estimadas y productos más pedidos para el periodo seleccionado.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-[#ffd3bc]">
            Mes
            <select
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(Number(event.target.value))}
              className="focus-ring rounded-md border border-white/20 bg-white px-3 py-2 text-sm font-semibold text-[#3b2924]"
            >
              {monthNames.map((month, index) => (
                <option key={month} value={index + 1}>{month}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-[#ffd3bc]">
            Año
            <select
              value={selectedYear}
              onChange={(event) => setSelectedYear(Number(event.target.value))}
              className="focus-ring rounded-md border border-white/20 bg-white px-3 py-2 text-sm font-semibold text-[#3b2924]"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {loading && <p className="mb-4 rounded-lg border border-[#ead8c7] bg-white p-4 text-sm text-[#74635c]">Cargando datos...</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Ventas del mes", value: formatCurrency(dashboard.revenue), sub: `${dashboard.activeOrders.length} pedidos activos`, progress: paymentProgress, hint: "cobrado" },
          { label: "Ganancia estimada", value: formatCurrency(dashboard.estimatedProfit), sub: `${profitMargin}% de margen estimado`, progress: Math.max(0, Math.min(100, profitMargin)), hint: "margen" },
          { label: "Ticket promedio", value: formatCurrency(averageTicket), sub: "promedio por pedido activo", progress: deliveredProgress, hint: "entregado" },
          { label: "Pedidos del mes", value: dashboard.periodOrders.length.toString(), sub: `${dashboard.deliveredOrders.length} entregados`, progress: deliveredProgress, hint: "avance" }
        ].map(({ label, value, sub, progress, hint }) => (
          <article key={label} className="rounded-lg border border-[#ead8c7] bg-white p-5 soft-shadow">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-[#74635c]">{label}</p>
              <span className="rounded-full bg-[#fff9f3] px-2 py-1 text-xs font-semibold text-[#c9657e]">{progress}%</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-[#3b2924]">{value}</p>
            <p className="mt-1 text-xs text-[#74635c]">{sub}</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#ead8c7]">
              <div className="h-full rounded-full bg-[#c9657e]" style={{ width: `${Math.max(4, Math.min(100, progress))}%` }} />
            </div>
            <p className="mt-1 text-right text-[11px] font-semibold uppercase text-[#74635c]">{hint}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.45fr_0.55fr]">
        <article className="rounded-lg border border-[#ead8c7] bg-white p-5 soft-shadow">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-[#c9657e]">Ritmo del mes</p>
              <h2 className="mt-1 text-xl font-semibold">Ventas diarias</h2>
            </div>
            <p className="text-sm text-[#74635c]">{monthNames[selectedMonth - 1]} {selectedYear}</p>
          </div>
          <div className="mt-5 rounded-lg bg-[#fff9f3] p-4">
            {dashboard.dailySeries.some((day) => day.revenue > 0) ? (
              <div>
                <svg viewBox="0 0 640 220" role="img" aria-label="Ventas diarias del mes" className="h-64 w-full overflow-visible">
                  <defs>
                    <linearGradient id="salesArea" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#c9657e" stopOpacity="0.28" />
                      <stop offset="100%" stopColor="#c9657e" stopOpacity="0.03" />
                    </linearGradient>
                  </defs>
                  {[0, 1, 2, 3].map((line) => (
                    <line key={line} x1="0" x2="640" y1={line * 56 + 18} y2={line * 56 + 18} stroke="#ead8c7" strokeWidth="1" />
                  ))}
                  <path d={areaPath} transform="translate(0 18)" fill="url(#salesArea)" />
                  <path d={linePath} transform="translate(0 18)" fill="none" stroke="#c9657e" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
                  {dashboard.dailySeries.map((day, index) => {
                    if (day.revenue === 0) return null;
                    const x = dashboard.dailySeries.length > 1 ? (index * 640) / (dashboard.dailySeries.length - 1) : 0;
                    const y = 208 - (day.revenue / Math.max(...dailyRevenueValues, 1)) * 190;
                    return <circle key={day.day} cx={x} cy={y} r="4" fill="#3b2924" />;
                  })}
                </svg>
                <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-[#74635c]">Mejor día</p>
                    <p className="font-semibold">
                      {dashboard.dailySales.length
                        ? `Día ${dashboard.dailySales.reduce((best, day) => day.revenue > best.revenue ? day : best, dashboard.dailySales[0]).day}`
                        : "Sin ventas"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#74635c]">Pico</p>
                    <p className="font-semibold">{formatCurrency(dashboard.maxDailyRevenue)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#74635c]">Días activos</p>
                    <p className="font-semibold">{dashboard.dailySales.length}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="p-4 text-sm text-[#74635c]">No hay ventas registradas para este mes.</p>
            )}
          </div>
        </article>

        <article className="rounded-lg border border-[#ead8c7] bg-white p-5 soft-shadow">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#c9657e]">Estados</p>
          <h2 className="mt-1 text-xl font-semibold">Pedidos y pagos</h2>
          <div className="mt-5 grid gap-5">
            <div>
              <div
                className="mx-auto grid h-44 w-44 place-items-center rounded-full"
                style={{ background: doughnutGradient(statusChartItems) }}
              >
                <div className="grid h-24 w-24 place-items-center rounded-full bg-white text-center">
                  <span className="text-2xl font-semibold">{dashboard.periodOrders.length}</span>
                </div>
              </div>
              <div className="mt-4 grid gap-2">
                {statusChartItems.map((item) => (
                  <div key={item.status} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      {formatStatus(item.status)}
                    </span>
                    <strong>{item.count}</strong>
                  </div>
                ))}
                {!statusChartItems.length && <p className="text-sm text-[#74635c]">Sin pedidos en el periodo.</p>}
              </div>
            </div>
            <div className="border-t border-[#ead8c7] pt-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#74635c]">Pagos</p>
              <div className="grid gap-2">
                {paymentChartItems.map((item) => (
                  <div key={item.status} className="grid grid-cols-[1fr_auto] items-center gap-3 text-sm">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span>{formatStatus(item.status)}</span>
                      </div>
                    </div>
                    <strong>{item.count}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <article className="rounded-lg border border-[#ead8c7] bg-white p-5 soft-shadow">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-[#c9657e]">Productos</p>
              <h2 className="mt-1 text-xl font-semibold">Más pedidos</h2>
            </div>
            <p className="text-sm text-[#74635c]">{dashboard.totalUnits} unidades vendidas</p>
          </div>

          <div className="mt-5 grid gap-3">
            {dashboard.topProducts.map((product, index) => {
              const maxQty = Math.max(dashboard.topProducts[0]?.qty || 1, 1);
              return (
                <div key={product.id} className="rounded-md bg-[#fff9f3] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#3b2924]">#{index + 1} {product.name}</p>
                      <p className="mt-1 text-xs text-[#74635c]">{formatCurrency(product.revenue)} vendidos</p>
                    </div>
                    <p className="text-sm font-semibold">{product.qty} und.</p>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#ead8c7]">
                    <div className="h-full rounded-full bg-[#c9657e]" style={{ width: `${Math.max(8, (product.qty / maxQty) * 100)}%` }} />
                  </div>
                </div>
              );
            })}
            {!dashboard.topProducts.length && !loading && (
              <p className="rounded-md bg-[#fff9f3] p-4 text-sm text-[#74635c]">No hay productos vendidos en este periodo.</p>
            )}
          </div>
        </article>

        <article className="rounded-lg border border-[#ead8c7] bg-white p-5 soft-shadow">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#c9657e]">Rentabilidad</p>
          <h2 className="mt-1 text-xl font-semibold">Ganancias y cobros</h2>
          <div className="mt-5 grid gap-3">
            <div className="rounded-md bg-[#fff9f3] p-3">
              <p className="text-xs text-[#74635c]">Ventas cobradas</p>
              <p className="mt-1 text-lg font-semibold">{formatCurrency(dashboard.paidRevenue)}</p>
            </div>
            <div className="rounded-md bg-[#fff9f3] p-3">
              <p className="text-xs text-[#74635c]">Costos estimados</p>
              <p className="mt-1 text-lg font-semibold">{formatCurrency(dashboard.estimatedCost)}</p>
            </div>
            <div className="rounded-md bg-[#fff9f3] p-3">
              <p className="text-xs text-[#74635c]">Cobertura de costos</p>
              <p className="mt-1 text-lg font-semibold">{costCoverage}%</p>
              <p className="mt-1 text-xs text-[#74635c]">
                {dashboard.unitsWithRegisteredCost} de {dashboard.totalUnits} unidades tienen costo configurado.
              </p>
            </div>
            {costCoverage < 100 && (
              <Link href="/admin/costos" className="focus-ring rounded-md border border-[#ead8c7] px-3 py-2 text-center text-sm font-semibold text-[#74635c] hover:bg-[#fff9f3]">
                Completar costos
              </Link>
            )}
          </div>
        </article>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-lg border border-[#ead8c7] bg-white p-5 soft-shadow">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#c9657e]">Ingresos</p>
          <h2 className="mt-1 text-xl font-semibold">Productos por venta</h2>
          <div className="mt-5 grid gap-3">
            {dashboard.topRevenueProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between gap-4 rounded-md bg-[#fff9f3] p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{product.name}</p>
                  <p className="mt-1 text-xs text-[#74635c]">{product.qty} unidades</p>
                </div>
                <p className="text-sm font-semibold">{formatCurrency(product.revenue)}</p>
              </div>
            ))}
            {!dashboard.topRevenueProducts.length && !loading && (
              <p className="rounded-md bg-[#fff9f3] p-4 text-sm text-[#74635c]">No hay ingresos por producto en este periodo.</p>
            )}
          </div>
        </article>

        <article className="rounded-lg border border-[#ead8c7] bg-white p-5 soft-shadow">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-[#c9657e]">Actividad</p>
              <h2 className="mt-1 text-xl font-semibold">Últimos pedidos</h2>
            </div>
            <Link href="/admin/pedidos" className="focus-ring rounded-md px-3 py-2 text-sm font-semibold text-[#c9657e] hover:bg-[#fff9f3]">
              Ver todos
            </Link>
          </div>
          <div className="mt-5 grid gap-3">
            {dashboard.periodOrders.slice(0, 5).map((order) => (
              <Link key={order.id} href={`/admin/pedidos/${order.id}`} className="focus-ring flex items-center justify-between gap-4 rounded-md bg-[#fff9f3] p-3 hover:bg-[#f8ecdf]">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{order.customerName || order.id}</p>
                  <p className="mt-1 text-xs text-[#74635c]">{order.id} · {order.requestedDeliveryDate}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatCurrency(orderTotal(order))}</p>
                  <StatusPill label={formatStatus(order.status)} tone={getStatusTone(order.status)} />
                </div>
              </Link>
            ))}
            {!dashboard.periodOrders.length && !loading && (
              <p className="rounded-md bg-[#fff9f3] p-4 text-sm text-[#74635c]">No hay pedidos en el periodo seleccionado.</p>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
