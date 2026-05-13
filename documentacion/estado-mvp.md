# Estado del MVP

Fecha de corte: 2026-05-12

---

## Resumen

El sitio está operativo y conectado a Firebase. Clientes pueden navegar el catálogo, hacer pedidos, pagar por Nequi y revisar su historial. Lara gestiona pedidos, productos, costos y reportes desde el panel admin. Toda la UI está optimizada para mobile.

---

## Implementado y funcional

### Sitio público
- Home con hero compacto para mobile, categorías, productos destacados y trust items.
- Catálogo público con productos desde Firestore (fallback a `lib/data.ts` si está vacío).
- Detalle de producto con descripción, ingredientes y acceso directo al pedido.
- Footer con WhatsApp y copyright.
- Navegación mobile con bottom nav (Inicio, Productos, Pedir, Mis pedidos, Admin).
- Header sticky con logo, nav desktop, nombre del usuario logueado y login/logout.
- Botón flotante de WhatsApp en todas las páginas (posición adaptada según contexto).

### Flujo de pedido
- Formulario con selección de producto, cantidad (+/−), observaciones por ítem, fecha, método de entrega y notas generales.
- Soporte de variantes/tamaños por producto, con precio propio por variante.
- Validación de fecha mínima: bloquea fechas anteriores a 48h (timezone Colombia).
- Bloqueo inmediato de doble submit mientras se registra el pedido para evitar pedidos duplicados por doble click.
- Barra sticky en mobile con total y botón de confirmar.
- Creación real de pedido en Firestore con ID secuencial formato `LB-YYMMDD-NN`.
- Pantalla de confirmación con número de pedido, datos Nequi (número + QR placeholder) y botón para enviar comprobante por WhatsApp con mensaje prellenado.
- Notificación automática por e-mail a los admins cuando se crea un pedido.

### Autenticación
- Login con Google vía Firebase Auth.
- Creación/actualización de perfil en Firestore al hacer login.
- Roles: `customer` (por defecto) y `admin` (por email autorizado o campo en Firestore).
- Nombre del usuario visible en el header una vez logueado.

### Panel admin
- Guard real: sidebar y contenido del admin solo visibles al validar rol.
- Navegación admin mobile: tabs horizontales con scroll; vertical en desktop.
- Link al admin visible en header y bottom nav cuando el usuario es admin.

- **Dashboard** (`/admin`): resumen por mes/año con ventas, ganancia estimada, ticket promedio, pedidos activos/entregados, cobros, costos, cobertura de costos, gráfica de ventas diarias, distribución interactiva por estado/pago, listado de pedidos del segmento seleccionado, productos más pedidos, productos por ingresos y últimos pedidos.
- **Pedidos** (`/admin/pedidos`): lista desde Firestore ordenada por pedidos más nuevos, búsqueda por ID/nombre/teléfono, filtro por estado, filtro por pago, orden por creación o entrega, cambio de estado y pago inline, link a detalle.
- **Pedidos manuales** (`/admin/pedidos?nuevo=1`): el admin puede crear pedidos recibidos por fuera del sitio, con productos, variantes, entrega, estado, pago y notas internas.
- **Detalle de pedido** (`/admin/pedidos/[id]`): carga desde Firestore, productos, cliente, edición de datos/items, cambio de estado/pago, notas internas editables y eliminación.
- **Productos** (`/admin/productos`): lista desde Firestore, toggle disponible/activar, edición inline (nombre, precio, descripción, presentación, imagen, horas prep, destacado), formulario para crear producto nuevo.
- **Costos** (`/admin/costos`): costos por producto en Firestore (ingredientes, empaque, mano de obra, otros), cálculo de margen con color (verde ≥50%, ámbar 30–49%, rojo <30%).
- **Reportes** (`/admin/reportes`): ventas del mes, ventas totales, pedidos por estado, top 5 productos más pedidos — todos desde Firestore.

### Historial del cliente
- `/mis-pedidos`: pedidos del usuario autenticado con estado y pago en StatusPill con color.
- Los clientes pueden editar datos básicos, cantidades y notas de pedidos en estado `pendiente`.
- Los clientes pueden eliminar pedidos en estado `pendiente`.

### Infraestructura
- Reglas Firestore sólidas: lectura pública de productos, pedidos solo del dueño o admin, costos solo admin.
- Export estático con `output: "export"` compatible con Firebase Hosting.
- Variables de entorno para WhatsApp, Nequi y credenciales Firebase.
- Firebase Functions 2nd Gen activa para notificaciones por e-mail al crear pedidos.
- Secretos productivos esperados: `GMAIL_USER` y `GMAIL_PASS`.
- Registro de envíos en `notification_logs` para evitar correos duplicados y diagnosticar fallos SMTP.
- SEO técnico inicial: metadata por páginas públicas, metadata por producto, canonicals, OpenGraph, Twitter cards, JSON-LD de negocio local/producto, `sitemap.xml` y `robots.txt`.

---

## Pendiente / mejoras futuras

| Ítem | Contexto |
|---|---|
| QR Nequi real | Reemplazar `/public/images/nequi-qr.svg` con el QR real de Lara |
| `/productos/[id]` desde Firestore | Hoy usa datos de `lib/data.ts`; funciona pero no refleja ediciones del admin |
| SEO de productos Firestore | Las páginas SEO se generan desde `lib/data.ts`; productos creados solo en Firestore no aparecen en sitemap ni metadata hasta incorporarlos al build |
| Validación 48h en el servidor | Hoy es solo client-side en el input `min`; podría bypassearse |
| Gestión de roles desde UI | Hoy se agrega admin editando código; no hay UI para eso |
| Filtros en catálogo de productos | Por categoría o búsqueda |
| Índices Firestore en producción | Si el volumen de pedidos crece, pueden necesitarse índices compuestos |
| Instagram | Ya está incluido en footer; mantener actualizado si cambia el handle |
| Validaciones backend reales | Ya existe Function de notificación; todavía falta mover validaciones críticas del cliente a backend |

---

## Riesgos residuales

- Si se cambian los emails admin en `firebase-store.ts`, debe actualizarse también `firestore.rules` (son dos listas paralelas).
- `/admin/pedidos/[id]` usa `generateStaticParams` con `placeholder` para satisfacer el build estático. La navegación real ocurre siempre desde la lista de pedidos (client-side routing), por lo que esto no afecta la operación.
- Las reglas permiten que un cliente edite/elimine pedidos propios mientras sigan en `pendiente`; cualquier cambio de reglas debe mantenerse alineado con `/mis-pedidos`.
