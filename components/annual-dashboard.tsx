"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/data";
import type { AnnualDashboardData } from "@/lib/dashboard-analytics";

const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const shortMonthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

type AnnualDashboardProps = {
  data: AnnualDashboardData;
  previousData?: AnnualDashboardData;
  onSelectMonth: (month: number) => void;
};

function compactCurrency(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

function changeFrom(current: number, previous?: number) {
  if (!previous) return null;
  return Math.round(((current - previous) / previous) * 100);
}

function ChangeBadge({ value, previousYear }: { value: number | null; previousYear?: number }) {
  if (value === null || previousYear === undefined) return <span className="text-xs text-[#8f7b73]">Sin comparación anterior</span>;
  const positive = value >= 0;
  return (
    <span className={`inline-flex w-fit items-center rounded-full px-2 py-1 text-xs font-semibold ${positive ? "bg-[#e7f3e9] text-[#356844]" : "bg-[#fbe8e8] text-[#9b4646]"}`}>
      {positive ? "↑" : "↓"} {Math.abs(value)}% vs. {previousYear}
    </span>
  );
}

function MonthlyPerformanceChart({ data, onSelectMonth }: Pick<AnnualDashboardProps, "data" | "onSelectMonth">) {
  const width = 840;
  const height = 310;
  const left = 54;
  const right = 18;
  const top = 28;
  const bottom = 52;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const maxValue = Math.max(...data.months.flatMap((month) => [month.revenue, month.estimatedProfit]), 1);
  const slot = plotWidth / 12;
  const barWidth = Math.min(36, slot * 0.58);
  const y = (value: number) => top + plotHeight - (value / maxValue) * plotHeight;
  const profitPoints = data.months.map((month, index) => `${left + slot * index + slot / 2},${y(month.estimatedProfit)}`).join(" ");

  return (
    <div className="overflow-x-auto pb-2">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Ventas y ganancia mensual de ${data.year}`} className="min-w-[720px] w-full">
        <defs>
          <linearGradient id="annualBars" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#c9657e" />
            <stop offset="100%" stopColor="#e7a5b6" />
          </linearGradient>
          <filter id="annualBarShadow" x="-30%" y="-20%" width="160%" height="160%">
            <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#6f3947" floodOpacity="0.14" />
          </filter>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const gridY = top + plotHeight - ratio * plotHeight;
          return (
            <g key={ratio}>
              <line x1={left} x2={width - right} y1={gridY} y2={gridY} stroke="#ead8c7" strokeDasharray={ratio === 0 ? undefined : "4 7"} />
              <text x={left - 10} y={gridY + 4} textAnchor="end" fontSize="10" fill="#8f7b73">{compactCurrency(maxValue * ratio)}</text>
            </g>
          );
        })}

        {data.months.map((month, index) => {
          const center = left + slot * index + slot / 2;
          const barY = y(month.revenue);
          const barHeight = Math.max(month.revenue ? 3 : 0, top + plotHeight - barY);
          return (
            <g
              key={month.month}
              role="button"
              tabIndex={0}
              aria-label={`Ver detalle de ${monthNames[index]}: ${formatCurrency(month.revenue)} en ventas`}
              onClick={() => onSelectMonth(month.month)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") onSelectMonth(month.month);
              }}
              className="cursor-pointer outline-none"
            >
              <rect x={center - slot / 2 + 3} y={top} width={slot - 6} height={plotHeight + 34} rx="8" fill="transparent" className="hover:fill-[#fff4ed] focus:fill-[#fff4ed]" />
              <rect x={center - barWidth / 2} y={barY} width={barWidth} height={barHeight} rx="9" fill="url(#annualBars)" filter="url(#annualBarShadow)" />
              <text x={center} y={height - 20} textAnchor="middle" fontSize="11" fontWeight="700" fill="#59433b">{shortMonthNames[index]}</text>
              <title>{monthNames[index]}: {formatCurrency(month.revenue)} vendidos · {formatCurrency(month.estimatedProfit)} de ganancia estimada</title>
            </g>
          );
        })}

        <polyline points={profitPoints} fill="none" stroke="#3f7650" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {data.months.map((month, index) => {
          const center = left + slot * index + slot / 2;
          return <circle key={month.month} cx={center} cy={y(month.estimatedProfit)} r="5" fill="#fff" stroke="#3f7650" strokeWidth="3" pointerEvents="none" />;
        })}
      </svg>
    </div>
  );
}

function CumulativeChart({ data }: { data: AnnualDashboardData }) {
  const width = 620;
  const height = 190;
  const inset = 14;
  const values = data.months.map((month) => month.cumulativeRevenue);
  const maxValue = Math.max(...values, 1);
  const step = (width - inset * 2) / 11;
  const points = values.map((value, index) => `${inset + index * step},${height - inset - (value / maxValue) * (height - inset * 2)}`).join(" ");
  const area = `${inset},${height - inset} ${points} ${width - inset},${height - inset}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Ventas acumuladas de ${data.year}`} className="mt-5 w-full overflow-visible">
      <defs>
        <linearGradient id="cumulativeArea" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#b4835d" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#b4835d" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#cumulativeArea)" />
      <polyline points={points} fill="none" stroke="#b4835d" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      {values.map((value, index) => (
        <circle key={index} cx={inset + index * step} cy={height - inset - (value / maxValue) * (height - inset * 2)} r="3.5" fill="#3b2924">
          <title>{monthNames[index]}: {formatCurrency(value)} acumulados</title>
        </circle>
      ))}
    </svg>
  );
}

function ActivityHeatmap({ data }: { data: AnnualDashboardData }) {
  const activityByDate = new Map(data.activity.map((day) => [day.date, day]));
  const maxRevenue = Math.max(...data.activity.map((day) => day.revenue), 1);

  return (
    <div className="mt-5 overflow-x-auto pb-2">
      <div className="min-w-[720px] space-y-2">
        <div className="grid grid-cols-[44px_repeat(31,minmax(13px,1fr))] gap-1 px-1 text-[9px] text-[#8f7b73]">
          <span />
          {Array.from({ length: 31 }, (_, index) => <span key={index} className="text-center">{index + 1}</span>)}
        </div>
        {data.months.map((month) => (
          <div key={month.month} className="grid grid-cols-[44px_repeat(31,minmax(13px,1fr))] gap-1">
            <span className="self-center text-[10px] font-semibold uppercase tracking-wide text-[#74635c]">{shortMonthNames[month.month - 1]}</span>
            {Array.from({ length: 31 }, (_, index) => {
              const day = index + 1;
              const validDay = day <= new Date(data.year, month.month, 0).getDate();
              const key = `${data.year}-${String(month.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const activity = activityByDate.get(key);
              const intensity = activity ? 0.18 + (activity.revenue / maxRevenue) * 0.82 : 0;
              return (
                <span
                  key={day}
                  className={`aspect-square rounded-[4px] border ${validDay ? "border-[#ead8c7]" : "border-transparent"}`}
                  style={{ backgroundColor: activity ? `rgba(201, 101, 126, ${intensity})` : validDay ? "#fff9f3" : "transparent" }}
                  aria-label={activity ? `${key}: ${activity.orders} pedidos, ${formatCurrency(activity.revenue)}` : undefined}
                  title={activity ? `${key}: ${activity.orders} pedidos · ${formatCurrency(activity.revenue)}` : undefined}
                >
                  {activity && <span className="sr-only">{activity.orders} pedidos</span>}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AnnualDashboard({ data, previousData, onSelectMonth }: AnnualDashboardProps) {
  const revenueChange = changeFrom(data.revenue, previousData?.revenue);
  const profitChange = changeFrom(data.estimatedProfit, previousData?.estimatedProfit);
  const orderChange = changeFrom(data.orders, previousData?.orders);
  const ticketChange = changeFrom(data.averageTicket, previousData?.averageTicket);
  const bestMonth = data.months.reduce((best, month) => month.revenue > best.revenue ? month : best, data.months[0]);
  const topProducts = data.products.slice(0, 5);
  const maxProductRevenue = Math.max(...topProducts.map((product) => product.revenue), 1);
  const topCustomers = data.customers.slice(0, 5);
  const maxCustomerRevenue = Math.max(...topCustomers.map((customer) => customer.revenue), 1);

  return (
    <div className="grid min-w-0 grid-cols-1 gap-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { eyebrow: "Ventas del año", value: formatCurrency(data.revenue), detail: `${Math.round(data.revenue ? (data.paidRevenue / data.revenue) * 100 : 0)}% cobrado`, change: revenueChange },
          { eyebrow: "Ganancia estimada", value: formatCurrency(data.estimatedProfit), detail: `${data.profitMargin}% de margen`, change: profitChange },
          { eyebrow: "Pedidos activos", value: data.orders.toString(), detail: `${data.totalUnits} unidades`, change: orderChange },
          { eyebrow: "Ticket promedio", value: formatCurrency(data.averageTicket), detail: data.orders ? `Mejor mes: ${monthNames[bestMonth.month - 1]}` : "Sin actividad", change: ticketChange }
        ].map((metric) => (
          <article key={metric.eyebrow} className="group relative overflow-hidden rounded-2xl border border-[#ead8c7] bg-white p-5 soft-shadow">
            <span className="absolute -right-7 -top-7 h-24 w-24 rounded-full bg-[#fbe3e8] transition-transform duration-500 group-hover:scale-125" />
            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a35166]">{metric.eyebrow}</p>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-[#3b2924]">{metric.value}</p>
              <p className="mt-1 text-xs text-[#74635c]">{metric.detail}</p>
              <div className="mt-4"><ChangeBadge value={metric.change} previousYear={previousData?.year} /></div>
            </div>
          </article>
        ))}
      </div>

      <article className="overflow-hidden rounded-2xl border border-[#ead8c7] bg-white soft-shadow">
        <div className="flex flex-col gap-4 border-b border-[#ead8c7] bg-[linear-gradient(120deg,#fff9f3_0%,#fff_54%,#fbe3e8_100%)] p-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a35166]">Pulso del negocio</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Ventas y ganancia por mes</h2>
            <p className="mt-1 text-sm text-[#74635c]">Selecciona cualquier mes para abrir su detalle operativo.</p>
          </div>
          <div className="flex flex-wrap gap-4 text-xs font-semibold text-[#74635c]">
            <span className="flex items-center gap-2"><i className="h-3 w-3 rounded-sm bg-[#c9657e]" /> Ventas</span>
            <span className="flex items-center gap-2"><i className="h-0.5 w-5 bg-[#3f7650]" /> Ganancia estimada</span>
          </div>
        </div>
        <div className="p-4 sm:p-5">
          {data.revenue > 0 ? <MonthlyPerformanceChart data={data} onSelectMonth={onSelectMonth} /> : (
            <div className="grid min-h-64 place-items-center rounded-xl border border-dashed border-[#d9c4b3] bg-[#fff9f3] p-8 text-center">
              <div><p className="font-semibold">Todavía no hay ventas en {data.year}</p><p className="mt-2 text-sm text-[#74635c]">Los meses aparecerán aquí cuando se registren pedidos activos.</p></div>
            </div>
          )}
        </div>
      </article>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <article className="rounded-2xl border border-[#ead8c7] bg-white p-5 soft-shadow">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a35166]">Trayectoria</p><h2 className="mt-2 text-xl font-semibold">Ventas acumuladas</h2></div>
            <p className="rounded-full bg-[#fff2e8] px-3 py-1 text-xs font-semibold text-[#8a5d3c]">Ene → Dic</p>
          </div>
          {data.revenue > 0 ? <CumulativeChart data={data} /> : <p className="mt-8 rounded-xl bg-[#fff9f3] p-5 text-sm text-[#74635c]">Sin acumulado para mostrar.</p>}
          <div className="mt-4 flex items-end justify-between border-t border-[#ead8c7] pt-4">
            <div><p className="text-xs text-[#74635c]">Acumulado real</p><p className="mt-1 text-lg font-semibold">{formatCurrency(data.revenue)}</p></div>
            <p className="max-w-44 text-right text-xs leading-5 text-[#8f7b73]">Sin metas inventadas: esta curva usa solamente pedidos registrados.</p>
          </div>
        </article>

        <article className="rounded-2xl border border-[#ead8c7] bg-[#3b2924] p-5 text-white soft-shadow">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ffd3bc]">Calidad del dato</p>
          <h2 className="mt-2 text-xl font-semibold">Cobertura de costos</h2>
          <div className="mt-6 grid place-items-center">
            <div className="grid h-40 w-40 place-items-center rounded-full p-3" style={{ background: `conic-gradient(#f4b6c4 ${data.costCoverage * 3.6}deg, rgba(255,255,255,.12) 0deg)` }}>
              <div className="grid h-full w-full place-items-center rounded-full bg-[#3b2924] text-center"><div><strong className="text-4xl">{data.costCoverage}%</strong><p className="mt-1 text-xs text-[#e8d9d1]">de unidades</p></div></div>
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-[#e8d9d1]">{data.unitsWithRegisteredCost} de {data.totalUnits} unidades vendidas tienen costo configurado.</p>
          {data.costCoverage < 100 && <Link href="/admin/costos" className="focus-ring mt-4 block rounded-xl bg-white px-4 py-3 text-center text-sm font-bold !text-[#3b2924] transition hover:bg-[#fff1e8]">Completar costos</Link>}
        </article>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-2xl border border-[#ead8c7] bg-white p-5 soft-shadow">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a35166]">Portafolio</p>
          <h2 className="mt-2 text-xl font-semibold">Productos que más facturan</h2>
          <div className="mt-5 grid gap-4">
            {topProducts.map((product, index) => (
              <div key={product.id}>
                <div className="flex items-end justify-between gap-3">
                  <div className="min-w-0"><p className="truncate text-sm font-semibold">{index + 1}. {product.name}</p><p className="mt-1 text-xs text-[#74635c]">{product.units} und. · {product.margin === null ? `Costos ${product.costCoverage}% cubiertos` : `${product.margin}% margen estimado`}</p></div>
                  <p className="text-sm font-bold">{formatCurrency(product.revenue)}</p>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#f1e4d8]"><div className="h-full rounded-full bg-[linear-gradient(90deg,#b4835d,#c9657e)]" style={{ width: `${(product.revenue / maxProductRevenue) * 100}%` }} /></div>
              </div>
            ))}
            {!topProducts.length && <p className="rounded-xl bg-[#fff9f3] p-5 text-sm text-[#74635c]">Aún no hay productos vendidos en este año.</p>}
          </div>
        </article>

        <article className="rounded-2xl border border-[#ead8c7] bg-white p-5 soft-shadow">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#3f7650]">Comunidad</p>
          <h2 className="mt-2 text-xl font-semibold">Clientes que más compran</h2>
          <p className="mt-1 text-sm text-[#74635c]">Top anual por valor comprado.</p>
          <div className="mt-5 grid gap-4">
            {topCustomers.map((customer, index) => (
              <div key={customer.id}>
                <div className="flex items-end justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${index === 0 ? "bg-[#3f7650] text-white" : "bg-[#e7f3e9] text-[#356844]"}`}>{index + 1}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{customer.name}</p>
                      <p className="mt-1 text-xs text-[#74635c]">{customer.orders} {customer.orders === 1 ? "pedido" : "pedidos"} · {formatCurrency(customer.averageTicket)} ticket promedio</p>
                    </div>
                  </div>
                  <p className="shrink-0 text-sm font-bold">{formatCurrency(customer.revenue)}</p>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e7efe8]"><div className="h-full rounded-full bg-[linear-gradient(90deg,#3f7650,#8fb79a)]" style={{ width: `${(customer.revenue / maxCustomerRevenue) * 100}%` }} /></div>
              </div>
            ))}
            {!topCustomers.length && <p className="rounded-xl bg-[#fff9f3] p-5 text-sm text-[#74635c]">Aún no hay clientes con compras activas en este año.</p>}
          </div>
        </article>
      </div>

      <article className="rounded-2xl border border-[#ead8c7] bg-white p-5 soft-shadow">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a35166]">Ritmo diario</p><h2 className="mt-2 text-xl font-semibold">Mapa anual de actividad</h2></div>
          <div className="flex items-center gap-2 text-[10px] text-[#74635c]"><span>Menos</span>{[0.12, 0.32, 0.55, 0.78, 1].map((opacity) => <i key={opacity} className="h-3 w-3 rounded-[3px]" style={{ backgroundColor: `rgba(201,101,126,${opacity})` }} />)}<span>Más</span></div>
        </div>
        <p className="mt-2 text-sm text-[#74635c]">Cada cuadro representa un día; la intensidad refleja sus ventas.</p>
        <ActivityHeatmap data={data} />
      </article>
    </div>
  );
}
