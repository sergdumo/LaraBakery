# Bitácora de desarrollo

---

## 2026-05-12 — Sesión 4: notificaciones, pedidos y dashboard operativo

### Completado en esta sesión

**Notificaciones por e-mail**
- Firebase Function productiva `notifyAdminOnNewOrder` para pedidos nuevos.
- Secrets requeridos: `GMAIL_USER` y `GMAIL_PASS`.
- Envío de correo a admins con ID de pedido, cliente, WhatsApp, e-mail, productos, fecha, entrega y total.
- Control de duplicados en `notification_logs/order-{orderId}-admin-email`.
- Estados de log: `sending`, `sent`, `failed`.
- Runtime Functions ajustado a Node 22.

**Creación de pedidos**
- `createOrder()` ahora guarda documento padre e items en una sola escritura batch.
- `firestore.rules` usa `getAfter()` para permitir que cliente cree items dentro del mismo batch.
- El formulario bloquea doble submit con un candado inmediato para evitar pedidos duplicados por doble click.
- Texto del botón cambia a "Registrando..." mientras Firestore guarda.

**Anticipación mínima**
- Regla pública actualizada de 24h a 48h.
- Actualizados cálculo de `minDate`, formulario de pedido, header, footer, home, catálogo, página de pedido y documentación.

**Admin /pedidos**
- Lista ordenada por pedidos más nuevos (`created_at desc`) por defecto.
- Nuevo filtro por estado de pago.
- Orden opcional por entrega próxima o entrega lejana.
- Soporte de parámetros `?estado=...` y `?pago=...` para llegar desde el dashboard con filtros aplicados.

**Dashboard admin**
- Distribución de estados y pagos convertida en control interactivo.
- Al seleccionar un estado o pago, se muestra listado de clientes/pedidos dentro de ese segmento.
- Cada pedido del segmento enlaza al detalle.
- Botón "Ver filtro" abre `/admin/pedidos` con el filtro equivalente.

---

## 2026-05-09 — Sesión 3: edición de pedidos y operación manual

### Completado en esta sesión

**Dashboard admin**
- `/admin` ahora carga pedidos y costos desde Firestore.
- Agrega selector de mes/año con timezone Colombia.
- Muestra ventas del mes, ganancia estimada, ticket promedio, pedidos activos/entregados, cobros, costos y cobertura de costos.
- Incluye gráfica SVG de ventas diarias, distribución por estado/pago, productos más pedidos, productos por ingresos y últimos pedidos con enlace al detalle.

**SEO técnico y local**
- Se agregó `lib/seo.ts` para centralizar URL base, imagen OG y helper de metadata.
- Home, catálogo, pedido y productos tienen metadata específica con canonicals, OpenGraph y Twitter cards.
- `/productos/[id]` usa `generateMetadata()` desde `lib/data.ts`.
- Se agregaron JSON-LD de `Bakery` en home y `Product` en detalle de producto.
- Se agregó `app/sitemap.ts` y `app/robots.ts` compatibles con `output: "export"`.
- Se añadieron señales locales naturales para Medellín, Envigado, Sabaneta, Laureles y El Poblado.

**Variantes de producto**
- `Product` ahora soporta `variants` con `id`, `name` y `price`.
- Torta de zanahoria y Red velvet tienen tamaños con precios propios.
- El formulario de pedido permite escoger variante y guarda nombre/precio histórico del item.

**Pedidos manuales**
- `/admin/pedidos` incluye formulario "Nuevo pedido manual".
- El admin puede crear pedidos recibidos por WhatsApp u otros canales.
- Se guardan `source: "manual"` y `created_by` en Firestore.

**Edición y eliminación de pedidos**
- Clientes pueden editar datos básicos, cantidades y notas de pedidos propios en estado `pendiente`.
- Clientes pueden eliminar pedidos propios mientras estén `pendiente`.
- Admin puede editar datos del cliente, entrega, items, cantidades, precios y notas desde `/admin/pedidos/[id]`.
- Admin puede eliminar pedidos desde la lista o desde el detalle.

**Firestore y store**
- `firebase-store.ts` agrega `createManualOrder`, `updateOrderDetails` y `deleteOrder`.
- `firestore.rules` permite al dueño actualizar/eliminar solo pedidos propios en estado `pendiente`.
- Las reglas permiten al admin crear pedidos manuales y administrar pedidos/items.

**Functions**
- Se agregó scaffold de Firebase Functions con TypeScript, Genkit y dependencias.
- Aún no hay triggers ni endpoints productivos activos.

## 2026-05-08 — Sesión 2: MVP completo

### Completado en esta sesión

**Hero mobile**
- Eliminado `min-h-[calc(100vh-105px)]` que obligaba el hero a ocupar toda la pantalla.
- Imagen del hero oculta en mobile (`hidden md:block`); en desktop se mantiene a la derecha.
- Título reducido a `text-3xl` en mobile, botones en fila horizontal, badges en `flex-wrap`.

**Admin /pedidos/[id]**
- Reescrito de cero. Antes usaba datos estáticos de `lib/data.ts` y fallaba con pedidos reales.
- Ahora es un client component que carga el pedido por ID desde Firestore (`getOrderById`).
- Muestra productos, cliente, estado/pago editable y notas internas editables.
- Separado en dos archivos para cumplir el requisito de `generateStaticParams` del export estático: `page.tsx` (servidor) + `admin-order-detail.tsx` (cliente).

**Admin /productos — CRUD**
- Toggle disponible/activar con un clic.
- Edición inline: clic en "Editar" expande campos (nombre, precio, descripción, presentación, imagen, horas prep, disponible, destacado). Se guarda con "Guardar".
- Formulario "Nuevo producto" expansible en la parte superior.
- Seed button eliminado del UI de producción.

**Admin /pedidos — búsqueda y filtro**
- Input de búsqueda client-side por ID, nombre del cliente o teléfono.
- Dropdown de filtro por estado de pedido.
- Cada pedido tiene link "Ver detalle" al `/admin/pedidos/[id]`.

**Admin layout**
- `AdminGuard` ahora envuelve el sidebar completo, no solo el contenido. El menú no se muestra antes de validar el rol.
- Navegación mobile: tabs horizontales con scroll (antes era sidebar vertical que se apilaba feo).
- Link activo resaltado en rosado.

**/mis-pedidos**
- Reemplazado texto plano `Estado: {order.status}` por `StatusPill` con color.
- Muestra tanto estado del pedido como estado del pago.

**Formulario de pedido**
- Campo fecha con `min` dinámico = 48h en timezone Colombia. Bloquea seleccionar fechas sin anticipación de 48h.
- Texto de ayuda "Mínimo 48 h de anticipación" bajo el input.

**Footer**
- Nuevo componente `SiteFooter` con WhatsApp y copyright.
- `pb-20 md:pb-0` para no quedar tapado por el bottom nav en mobile.

**StatusPill**
- Colores automáticos por valor: no hay que pasar `tone` manualmente.
- Mapa: confirmado/pagado/entregado → verde · en_preparacion/parcial → rosa · pendiente/cancelado → arena.

**formatStatus()**
- Helper en `lib/data.ts` que convierte valores raw a etiquetas legibles.
- `en_preparacion` → "En preparación", `listo_para_entrega` → "Listo p/entrega", etc.
- Usado en todos los selects del admin y en los StatusPills de /mis-pedidos.

**Tildes**
- Corregidos acentos en toda la UI: ocasión, pequeñas, mínimo, también, presentación, etc.

**firebase-store.ts — nuevas funciones**
- `getOrderById(id)` — lee un pedido por ID para el detalle admin.
- `updateProduct(id, fields)` — actualiza campos de un producto.
- `createProduct(product)` — crea producto nuevo.
- `updateOrderInternalNotes(orderId, notes)` — guarda notas internas.

**Deploy**
- Build y deploy exitoso en https://larabakery.web.app · 166 archivos.

---

## 2026-05-08 — Sesión 1: Mobile-first y operación real

### Completado en esta sesión

**Navegación mobile**
- `BottomNav`: bottom nav fijo con tabs (Inicio, Productos, Pedir, Mis pedidos, Admin). Se oculta en `/pedido`.
- `LayoutPadding`: padding inferior en todas las páginas excepto `/pedido`.
- Header simplificado en mobile: solo logo y login/logout.

**WhatsApp**
- Botón flotante ahora visible en mobile.
- Posición adaptada: `bottom-24` en `/pedido` (sobre barra de confirmación) · `bottom-20` en el resto.
- URL configurable con `NEXT_PUBLIC_WHATSAPP_URL`.

**Datos de pago reales**
- Nequi: 301 248 1041 a nombre de Lara Bakery.
- QR placeholder SVG mientras Lara provee el QR real.
- Variables de entorno: `NEXT_PUBLIC_PAYMENT_NEQUI`, `NEXT_PUBLIC_PAYMENT_NAME`.

**WhatsApp mensaje prellenado**
- Formato: pedido, cliente, total y saludo. Antes era un texto genérico sin nombre.

**ID de pedido**
- Formato `LB-YYMMDD-NN` (ej: `LB-260508-01`).
- Contador diario con transacción Firestore en `counters/orders`. Atómico y sin colisiones.

**Header**
- Muestra el primer nombre del usuario cuando está logueado.

**Admin /costos**
- Conectado a Firestore. Antes mostraba datos inventados de `lib/data.ts`.
- Inputs editables por producto. Botón "Guardar" por producto con feedback "✓ Guardado".

**Admin /reportes**
- Conectado a Firestore. Antes mostraba números falsos.
- Ventas del mes, totales, cobros confirmados/pendientes, top 5 productos.

**Formulario de pedido**
- Botones +/− para cantidad en lugar de input numérico.
- Barra sticky en mobile con total y botón de confirmar/login.

---

## 2026-05-08 — Base inicial

- Creado el directorio `documentacion/` con estructura de 5 archivos.
- Documentado el estado inicial del MVP.
- Firebase Auth con Google operativo.
- Firestore conectado para usuarios, productos, pedidos y items.
- Panel admin con guard, listado de pedidos y cambio de estado.
- Export estático configurado para Firebase Hosting.
- Reglas Firestore iniciales desplegadas.
