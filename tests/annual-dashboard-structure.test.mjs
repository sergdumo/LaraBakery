import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("el dashboard permite alternar entre mes y año", () => {
  const page = source("app/admin/page.tsx");

  assert.match(page, /periodMode/);
  assert.match(page, />Mes</);
  assert.match(page, />Año</);
  assert.match(page, /<AnnualDashboard/);
});

test("la vista anual expone los meses como controles navegables", () => {
  const component = source("components/annual-dashboard.tsx");

  assert.match(component, /onSelectMonth/);
  assert.match(component, /Ver detalle de/);
  assert.match(component, /Ventas y ganancia por mes/);
});

test("la vista anual comunica estimación y cobertura de costos", () => {
  const component = source("components/annual-dashboard.tsx");

  assert.match(component, /Ganancia estimada/);
  assert.match(component, /Cobertura de costos/);
  assert.doesNotMatch(component, /meta anual/i);
});

test("el contenido administrativo permite que los gráficos reduzcan su ancho en móvil", () => {
  const layout = source("app/admin/layout.tsx");

  assert.match(layout, /<aside className="min-w-0/);
  assert.match(layout, /<div className="min-w-0">\{children\}<\/div>/);
});

test("no muestra métricas vacías mientras Firestore sigue cargando", () => {
  const page = source("app/admin/page.tsx");

  assert.match(page, /\{!loading && \(\s*periodMode === "year"/);
});
