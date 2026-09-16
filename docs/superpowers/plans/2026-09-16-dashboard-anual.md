# Dashboard Anual Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar al dashboard administrativo una vista anual util, atractiva y navegable sin cambiar produccion.

**Architecture:** Extraer los calculos anuales a funciones puras, probarlos con `node:test` y renderizar la experiencia en un componente aislado. La pagina administrativa seguira siendo responsable de cargar pedidos y costos desde Firestore y de alternar entre la vista mensual existente y la nueva vista anual.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, SVG nativo, Node test runner.

## Global Constraints

- No agregar dependencias de graficos.
- Usar `requestedDeliveryDate` para atribuir pedidos a periodos.
- Excluir pedidos cancelados de indicadores financieros.
- Etiquetar la ganancia como estimada y mostrar cobertura de costos.
- No desplegar a Firebase Hosting sin autorizacion explicita.

---

### Task 1: Motor de analitica anual

**Files:**
- Create: `lib/dashboard-analytics.ts`
- Create: `tests/dashboard-analytics.test.mjs`

**Interfaces:**
- Consumes: `Order[]`, `ProductCostEntry[]`, `year: number`.
- Produces: `buildAnnualDashboard(orders, costs, year): AnnualDashboardData`.

- [ ] **Step 1: Escribir pruebas fallidas**

Cubrir doce meses, exclusion de cancelados, costo por producto base antes de `:`, acumulado, cobertura de costos, ranking y mapa diario.

- [ ] **Step 2: Confirmar el fallo correcto**

Run: `node --test tests/dashboard-analytics.test.mjs`
Expected: FAIL porque `lib/dashboard-analytics.ts` no existe.

- [ ] **Step 3: Implementar el calculo minimo**

Definir tipos `AnnualMonthSummary`, `AnnualProductSummary`, `AnnualActivityDay` y `AnnualDashboardData`; recorrer una sola vez los pedidos activos del ano y construir los agregados.

- [ ] **Step 4: Confirmar pruebas verdes**

Run: `node --test tests/dashboard-analytics.test.mjs`
Expected: PASS sin warnings.

### Task 2: Vista anual

**Files:**
- Create: `components/annual-dashboard.tsx`
- Modify: `app/admin/page.tsx`

**Interfaces:**
- Consumes: `AnnualDashboardData`, `year`, `hasPreviousYear`, `onSelectMonth(month)`.
- Produces: tarjetas KPI, grafico mensual combinado, acumulado, ranking y mapa de actividad.

- [ ] **Step 1: Agregar una prueba estructural fallida**

Comprobar que la pagina contiene el selector `Mes | Ano`, que el componente anual tiene botones por mes y que no existe una meta codificada.

- [ ] **Step 2: Confirmar el fallo correcto**

Run: `node --test tests/annual-dashboard-structure.test.mjs`
Expected: FAIL porque el componente y el selector aun no existen.

- [ ] **Step 3: Crear el componente anual**

Construir SVG responsivos con `viewBox`, etiquetas visibles, botones de mes y estados vacios. Usar la paleta cocoa, rose, caramel, mint y cream del proyecto.

- [ ] **Step 4: Integrar el selector**

Agregar estado `periodMode`, ocultar el selector de mes en modo anual y cambiar a modo mensual cuando el usuario seleccione una barra.

- [ ] **Step 5: Confirmar pruebas verdes**

Run: `node --test tests/annual-dashboard-structure.test.mjs`
Expected: PASS.

### Task 3: Consolidacion y verificacion

**Files:**
- Modify: `app/admin/reportes/page.tsx`
- Modify: `documentacion/estado-mvp.md`

**Interfaces:**
- Consumes: ruta `/admin` con modo anual.
- Produces: Reportes sin duplicar cifras basicas y documentacion actualizada.

- [ ] **Step 1: Sustituir la pagina duplicada**

Hacer que Reportes explique que los analisis mensual y anual viven en el dashboard y ofrezca acceso directo, evitando dos implementaciones divergentes.

- [ ] **Step 2: Actualizar documentacion**

Registrar selector Mes/Ano, graficos anuales y reglas de calculo.

- [ ] **Step 3: Ejecutar validacion completa**

Run: `node --test tests/*.test.mjs && npm run lint && npm run build`
Expected: todos los tests pasan, lint termina sin errores y Next.js exporta el sitio.

- [ ] **Step 4: Revisar visualmente**

Abrir `/admin` localmente, validar 390 px y escritorio, comprobar estados vacios, interaccion por mes y ausencia de overflow.

### Task 4: Top de clientes por valor comprado

**Files:**
- Modify: `lib/dashboard-analytics.ts`
- Modify: `components/annual-dashboard.tsx`
- Modify: `tests/dashboard-analytics.test.mjs`
- Modify: `tests/annual-dashboard-structure.test.mjs`

**Interfaces:**
- Consumes: `customerName` de cada pedido activo del ano.
- Produces: `AnnualCustomerSummary[]` ordenado por `revenue` descendente dentro de `AnnualDashboardData.customers`.

- [ ] **Step 1: Escribir pruebas fallidas de identidad y ranking**

Probar que `Maria Gomez`, `MARÍA GÓMEZ` y espacios repetidos se consolidan; que cancelados y nombres vacios se excluyen; y que el resultado incluye ventas, pedidos y ticket promedio.

- [ ] **Step 2: Confirmar el fallo correcto**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/dashboard-analytics.test.mjs`
Expected: FAIL porque `AnnualDashboardData` aun no produce `customers`.

- [ ] **Step 3: Implementar agregacion por nombre normalizado**

Agregar `AnnualCustomerSummary`, normalizar con Unicode NFD, quitar diacriticos y signos, acumular solo pedidos no cancelados y ordenar por facturacion.

- [ ] **Step 4: Integrar la tarjeta visual**

Mostrar hasta cinco clientes junto al ranking de productos, con nombre, facturacion, numero de pedidos y ticket promedio, sin datos de contacto.

- [ ] **Step 5: Validar y revisar visualmente**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/*.test.mjs && npm run lint && npm run build`
Expected: todas las pruebas pasan, lint termina sin errores y el export estatico se genera correctamente.

## Self-review

- El plan cubre todos los requisitos de la especificacion.
- No hay metas, datos ni comparaciones inventadas.
- Los tipos producidos por analitica coinciden con los consumidos por la vista.
- El alcance queda limitado al dashboard y a eliminar la duplicacion de Reportes.
