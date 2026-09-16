import { test } from "node:test";
import assert from "node:assert/strict";
import { buildAnnualDashboard } from "../lib/dashboard-analytics.ts";

function order(overrides = {}) {
  return {
    id: "LB-260101-01",
    customerName: "Cliente",
    customerEmail: "cliente@example.com",
    customerPhone: "3000000000",
    createdAt: "2026-01-01T12:00:00.000Z",
    requestedDeliveryDate: "2026-01-15",
    deliveryMethod: "recoger",
    status: "entregado",
    paymentStatus: "pagado",
    customerNotes: "",
    internalNotes: "",
    items: [
      { productId: "alfajor", productName: "Alfajor", quantity: 2, unitPrice: 10_000 }
    ],
    ...overrides
  };
}

const costs = [
  { productId: "alfajor", ingredients: 2_000, packaging: 500, labor: 1_000, other: 500 },
  { productId: "torta", ingredients: 10_000, packaging: 2_000, labor: 5_000, other: 1_000 }
];

test("agrupa ventas, costos y pedidos en los doce meses del año", () => {
  const result = buildAnnualDashboard(
    [
      order(),
      order({
        id: "LB-260201-01",
        requestedDeliveryDate: "2026-02-20",
        paymentStatus: "pendiente",
        items: [{ productId: "torta:grande", productName: "Torta grande", quantity: 1, unitPrice: 50_000 }]
      }),
      order({ id: "LB-250101-01", requestedDeliveryDate: "2025-01-10" })
    ],
    costs,
    2026
  );

  assert.equal(result.months.length, 12);
  assert.deepEqual(
    result.months.slice(0, 3).map(({ month, revenue, estimatedCost, estimatedProfit, orders }) => ({ month, revenue, estimatedCost, estimatedProfit, orders })),
    [
      { month: 1, revenue: 20_000, estimatedCost: 8_000, estimatedProfit: 12_000, orders: 1 },
      { month: 2, revenue: 50_000, estimatedCost: 18_000, estimatedProfit: 32_000, orders: 1 },
      { month: 3, revenue: 0, estimatedCost: 0, estimatedProfit: 0, orders: 0 }
    ]
  );
  assert.equal(result.revenue, 70_000);
  assert.equal(result.estimatedProfit, 44_000);
  assert.equal(result.paidRevenue, 20_000);
  assert.equal(result.orders, 2);
  assert.equal(result.averageTicket, 35_000);
});

test("excluye cancelados y conserva en cero los meses sin actividad", () => {
  const result = buildAnnualDashboard(
    [
      order({ status: "cancelado", items: [{ productId: "torta", productName: "Torta", quantity: 1, unitPrice: 80_000 }] }),
      order({ requestedDeliveryDate: "fecha-invalida" })
    ],
    costs,
    2026
  );

  assert.equal(result.revenue, 0);
  assert.equal(result.orders, 0);
  assert.ok(result.months.every((month) => month.revenue === 0));
  assert.deepEqual(result.products, []);
  assert.deepEqual(result.activity, []);
});

test("mide cobertura de costos por unidades sin ocultar costos faltantes", () => {
  const result = buildAnnualDashboard(
    [
      order({
        items: [
          { productId: "alfajor", productName: "Alfajor", quantity: 2, unitPrice: 10_000 },
          { productId: "galleta", productName: "Galleta", quantity: 2, unitPrice: 5_000 }
        ]
      })
    ],
    costs,
    2026
  );

  assert.equal(result.totalUnits, 4);
  assert.equal(result.unitsWithRegisteredCost, 2);
  assert.equal(result.costCoverage, 50);
  assert.equal(result.estimatedCost, 8_000);
  assert.equal(result.estimatedProfit, 22_000);
  assert.deepEqual(result.products.map(({ name, costCoverage, margin }) => ({ name, costCoverage, margin })), [
    { name: "Alfajor", costCoverage: 100, margin: 60 },
    { name: "Galleta", costCoverage: 0, margin: null }
  ]);
});

test("calcula acumulados y ordena productos por facturación", () => {
  const result = buildAnnualDashboard(
    [
      order(),
      order({
        requestedDeliveryDate: "2026-03-02",
        items: [{ productId: "torta", productName: "Torta", quantity: 1, unitPrice: 50_000 }]
      })
    ],
    costs,
    2026
  );

  assert.deepEqual(result.months.slice(0, 4).map((month) => month.cumulativeRevenue), [20_000, 20_000, 70_000, 70_000]);
  assert.deepEqual(result.products.map(({ name, revenue }) => ({ name, revenue })), [
    { name: "Torta", revenue: 50_000 },
    { name: "Alfajor", revenue: 20_000 }
  ]);
});

test("agrupa la actividad por fecha de entrega", () => {
  const result = buildAnnualDashboard(
    [
      order(),
      order({ id: "LB-260115-02", paymentStatus: "pendiente" }),
      order({ id: "LB-260116-01", requestedDeliveryDate: "2026-01-16" })
    ],
    costs,
    2026
  );

  assert.deepEqual(result.activity, [
    { date: "2026-01-15", month: 1, day: 15, orders: 2, revenue: 40_000 },
    { date: "2026-01-16", month: 1, day: 16, orders: 1, revenue: 20_000 }
  ]);
});

test("mantiene variantes separadas y usa el costo del producto base", () => {
  const result = buildAnnualDashboard(
    [
      order({
        items: [
          { productId: "torta:pequena", productName: "Torta - Pequeña", quantity: 1, unitPrice: 35_000 },
          { productId: "torta:grande", productName: "Torta - Grande", quantity: 1, unitPrice: 60_000 }
        ]
      })
    ],
    costs,
    2026
  );

  assert.deepEqual(result.products.map(({ id, name, estimatedCost }) => ({ id, name, estimatedCost })), [
    { id: "torta:grande", name: "Torta - Grande", estimatedCost: 18_000 },
    { id: "torta:pequena", name: "Torta - Pequeña", estimatedCost: 18_000 }
  ]);
});
