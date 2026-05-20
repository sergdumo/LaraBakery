<div style="background: linear-gradient(135deg, #031F16 0%, #050505 55%, #0B3D2E 100%); color: white; padding: 32px; border-radius: 14px; margin: 24px 0; box-shadow: 0 10px 30px rgba(0,0,0,0.28); border: 1px solid rgba(70, 255, 170, 0.18);">
  <h1 style="margin: 0; font-size: 34px; font-weight: 800; letter-spacing: -0.5px;">🌿 Lara Bakery — Documentación del Proyecto</h1>
  <p style="margin: 12px 0 0 0; font-size: 16px; opacity: 0.9; line-height: 1.5;">Documento maestro para entender qué es la plataforma, cómo está construida, qué está operativo, qué falta y dónde están los riesgos reales antes de seguir metiendo features.</p>
</div>

<span style="display: inline-block; background-color: #0B3D2E; color: white; padding: 5px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; margin: 0 5px 8px 0;">📌 PROYECTO</span> <span style="display: inline-block; background-color: #111827; color: white; padding: 5px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; margin: 0 5px 8px 0;">v1.0</span> <span style="display: inline-block; background-color: #14532D; color: white; padding: 5px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; margin: 0 5px 8px 0;">🗓️ 2026-05-19</span> <span style="display: inline-block; background-color: #1F2937; color: white; padding: 5px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; margin: 0 5px 8px 0;">🔒 Privado</span>

<div style="height: 4px; background: linear-gradient(90deg, #064E3B 0%, #22C55E 50%, #020617 100%); margin: 36px 0; border-radius: 999px;"></div>

## 1. 🎯 Propósito

**Objetivo principal:**
Centralizar el estado verificable de Lara Bakery para que cualquier cambio futuro parta de la raíz correcta, respete la arquitectura real y ataque primero estabilidad, seguridad y operación.

**Este documento sirve para:**

* Ubicar la raíz real del proyecto: `/Users/checho/Documents/DuriRepos/LaraBakery/Web`.
* Entender el flujo de cliente, admin, pedidos, pagos, productos y notificaciones.
* Dejar visibles los riesgos que no se deben maquillar como "pendientes menores".
* Evitar reprocesos por documentación dispersa o rutas históricas.

---

## 2. 🧭 Contexto

<div style="background-color: #ECFDF5; border-left: 5px solid #047857; padding: 16px 20px; margin: 16px 0; border-radius: 8px; color: #111827;">
  <strong style="color: #065F46; font-size: 16px;">Resumen ejecutivo</strong>
  <p style="margin: 8px 0 0 0; line-height: 1.55;">Lara Bakery es una plataforma web de pedidos construida con Next.js, Firebase Auth, Firestore, Firebase Hosting y Firebase Functions. El sitio está configurado como export estático, por lo que la lógica de datos crítica ocurre en cliente y en reglas/Functions de Firebase. Esa decisión simplifica Hosting, pero exige disciplina fuerte en reglas Firestore y validaciones backend.</p>
</div>

### Antecedentes

* La raíz operativa verificada es `Web/`, porque ahí existen `package.json`, `firebase.json`, `.firebaserc`, `next.config.ts`, `app/`, `lib/`, `functions/` y `documentacion/`.
* El sitio usa `output: "export"` y Firebase Hosting sirve el directorio `out`.
* El panel admin existe y cubre pedidos, pedidos manuales, productos, costos, reportes y dashboard.
* Las notificaciones por e-mail viven en Firebase Functions 2nd Gen mediante `notifyAdminOnNewOrder`.

### Alcance

| Incluye | No incluye |
|---|---|
| Arquitectura web, Firebase, rutas, flujos, riesgos y acciones pendientes | Valores secretos de `.env.local` o secretos de Functions |
| Estado funcional documentado desde archivos locales del repo | Confirmación externa de producción en navegador |
| Decisiones y riesgos inferidos de código/configuración existente | Métricas reales de ventas, tráfico o uso |

---

## 3. 🧩 Contenido principal

### 3.1 Resumen corto

Lara Bakery está montado como app Next.js 16 con App Router, React 19, TypeScript, Tailwind CSS 4, Firebase Auth, Firestore, Firebase Hosting y Functions. Clientes pueden navegar productos, autenticarse, crear pedidos y consultar historial. Admins pueden gestionar pedidos, crear pedidos manuales, editar productos, revisar costos y consultar reportes. El punto crítico no es "hacer más pantallas"; es cerrar validaciones backend, mantener reglas Firestore alineadas con la UI y eliminar drift entre `lib/data.ts`, Firestore y SEO estático.

### 3.2 Stack verificado

| Capa | Valor | Fuente / Nota |
|---|---|---|
| Framework | Next.js `16.2.6` | `package.json` |
| UI | React `19.2.0` + React DOM `19.2.0` | `package.json` |
| Lenguaje | TypeScript `^5.9.3` | `package.json` |
| Estilos | Tailwind CSS `^4.1.17` | `package.json`, `postcss.config.mjs` |
| Datos cliente | Firebase SDK `^12.13.0` | `package.json`, `lib/firebase.ts`, `lib/firebase-store.ts` |
| Hosting | Firebase Hosting con `public: "out"` | `firebase.json` |
| Render | Export estático `output: "export"` | `next.config.ts` |
| Imágenes Next | `images.unoptimized: true` | `next.config.ts` |
| Functions | Firebase Functions 2nd Gen | `functions/src/index.ts`, `firebase.json` |

### 3.3 Estructura operativa

| Ruta / archivo | Rol |
|---|---|
| `app/` | Rutas Next.js: home, productos, pedido, login, mis pedidos y admin |
| `components/` | UI compartida: header, footer, navegación mobile, guard admin, tarjetas y pills |
| `lib/data.ts` | Tipos, productos fallback, helpers de moneda/status y datos de muestra |
| `lib/firebase-store.ts` | Capa central de operaciones Firestore |
| `lib/firebase.ts` | Inicialización Firebase cliente |
| `lib/seo.ts` | Helpers de metadata, canonicals y datos SEO |
| `functions/src/index.ts` | Trigger `notifyAdminOnNewOrder` para correos de pedidos |
| `firestore.rules` | Reglas de acceso a usuarios, productos, pedidos, costos y contadores |
| `firebase.json` | Hosting, Firestore, Functions y predeploy |
| `documentacion/` | Documentación viva del proyecto |

### 3.4 Rutas principales

| Área | Rutas | Evidencia |
|---|---|---|
| Pública | `/`, `/productos`, `/productos/[id]`, `/login` | `app/page.tsx`, `app/productos/*`, `app/login/page.tsx` |
| Cliente | `/pedido`, `/mis-pedidos` | `app/pedido/*`, `app/mis-pedidos/page.tsx` |
| Admin | `/admin`, `/admin/pedidos`, `/admin/pedidos/[id]`, `/admin/productos`, `/admin/costos`, `/admin/reportes` | `app/admin/*` |
| SEO técnico | `/robots.txt`, `/sitemap.xml` | `app/robots.ts`, `app/sitemap.ts` |

### 3.5 Flujo de pedido

1. Cliente navega productos en `/productos`.
2. Selecciona producto o variante y va a `/pedido`.
3. Completa datos, fecha, entrega, notas e items.
4. Se autentica con Google si no tiene sesión.
5. `createOrder()` genera ID `LB-YYMMDD-NN` con contador diario en `counters/orders`.
6. Se guarda el pedido padre y sus items en Firestore con `writeBatch`.
7. La confirmación muestra datos de pago Nequi y acción de WhatsApp.
8. `notifyAdminOnNewOrder` envía correo a admins y registra idempotencia en `notification_logs`.
9. Admin gestiona estado, pago, detalle, notas internas o eliminación desde `/admin`.

### 3.6 Firestore y seguridad

| Colección | Uso | Regla relevante |
|---|---|---|
| `users/{uid}` | Perfil, rol y datos de usuario | Owner lee/actualiza su perfil; admin puede leer/gestionar |
| `products/{productId}` | Catálogo editable por admin | Lectura pública; escritura solo admin |
| `orders/{orderId}` | Pedido padre | Cliente crea/lee propios; admin gestiona; cliente puede editar/eliminar propio si está `pendiente` |
| `orders/{orderId}/items/{itemId}` | Items del pedido | Lectura owner/admin; escritura alineada con pedido pendiente o admin |
| `counters/orders` | Secuencia diaria de pedidos | Cliente autenticado puede escribir estructura limitada; admin también |
| `product_costs/{productId}` | Costos para margen | Solo admin |
| `business_costs/{costId}` | Costos de negocio | Solo admin |

**Verdad incómoda:** la app todavía depende bastante de validaciones cliente y reglas Firestore. Eso puede ser suficiente para MVP, pero no es una arquitectura robusta para reglas de negocio sensibles como fechas mínimas, totales, precios y edición de pedidos.

### 3.7 Configuración local

```bash
npm install
npm run dev
npm run build
npm run lint
firebase deploy --only hosting
```

Variables públicas esperadas, sin valores secretos:

| Variable | Uso |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase cliente |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Proyecto Firebase |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Storage |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | App Firebase |
| `NEXT_PUBLIC_WHATSAPP_URL` | Contacto WhatsApp |
| `NEXT_PUBLIC_PAYMENT_NEQUI` | Número Nequi mostrado al cliente |
| `NEXT_PUBLIC_PAYMENT_NAME` | Nombre de pago mostrado al cliente |

Secretos de Functions:

| Secreto | Uso |
|---|---|
| `GMAIL_USER` | Cuenta remitente SMTP/Gmail |
| `GMAIL_PASS` | Contraseña de aplicación o credencial SMTP |

### 3.8 Deploy

| Acción | Comando | Fuente |
|---|---|---|
| Build local | `npm run build` | `package.json` |
| Deploy Hosting | `firebase deploy --only hosting` | `firebase.json`, `README.md` |
| Deploy Functions | `firebase deploy --only functions` | `README.md`, `firebase.json` |
| Set secrets | `firebase functions:secrets:set GMAIL_USER` y `firebase functions:secrets:set GMAIL_PASS` | `README.md`, `functions/src/index.ts` |

`firebase.json` ejecuta `npm run build` antes del deploy de Hosting y publica `out`.

---

## 4. ✅ Decisiones tomadas

| Fecha | Decisión | Motivo | Impacto | Estado |
|---|---|---|---|---|
| 2026-05-08 | Usar Firebase Auth + Firestore + Hosting | Permite MVP rápido con autenticación, datos y hosting gestionado | Alto | Activa |
| 2026-05-08 | Export estático con `output: "export"` | Compatibilidad directa con Firebase Hosting | Alto | Activa |
| 2026-05-08 | Centralizar operaciones Firestore en `lib/firebase-store.ts` | Evita lógica de datos dispersa | Medio | Activa |
| 2026-05-09 | Manejar tortas con variantes en un solo producto | Evita repetir tarjetas por tamaño | Medio | Activa |
| 2026-05-09 | Permitir pedidos manuales desde admin | Captura pedidos recibidos por canales externos | Alto | Activa |
| 2026-05-12 | Crear Function de notificación por e-mail | Avisar a admins cuando entra un pedido | Alto | Activa |
| 2026-05-12 | Subir anticipación mínima a 48h | Dar más margen operativo a producción | Medio | Activa |

<div style="background-color: #F0FDF4; border-left: 5px solid #16A34A; padding: 16px 20px; margin: 16px 0; border-radius: 8px; color: #111827;">
  <strong style="color: #166534; font-size: 16px;">Regla brutal</strong>
  <p style="margin: 8px 0 0 0; line-height: 1.55;">Seguir agregando UI sin mover validaciones críticas a backend aumenta fragilidad operativa. El siguiente salto serio no es visual: es cerrar superficie de abuso y drift de datos.</p>
</div>

---

## 5. ⚠️ Riesgos, dudas y bloqueos

| Tipo | Descripción | Severidad | Acción requerida |
|---|---|---|---|
| Riesgo | Totales, precios y fecha mínima dependen de lógica cliente en partes críticas del flujo | Alta | Validar en backend/Function antes de aceptar o modificar pedidos |
| Riesgo | Admins están definidos en código y reglas; dos fuentes pueden desincronizarse | Alta | Centralizar roles o crear flujo admin con control explícito |
| Riesgo | SEO/productos estáticos pueden no reflejar productos creados solo en Firestore | Media | Definir fuente canónica: `lib/data.ts`, sync prebuild, SSR/ISR o Cloud Function |
| Riesgo | Archivos duplicados/sobrantes con sufijo ` 2` aparecen en `.next`, `out` y reglas duplicadas | Media | Limpiar artefactos generados y confirmar qué duplicados afectan Git/deploy |
| Riesgo | `orders/{orderId}/items` permite escritura de cliente sobre items si pedido propio sigue pendiente | Media | Revisar reglas contra cambios de precio/item no autorizados |
| Duda | No puedo confirmar desde archivos si el deploy actual de producción corresponde al último build local | Media | Ejecutar build/deploy o inspección de hosting cuando se quiera confirmar producción |
| Duda | No puedo confirmar métricas reales de ventas, pedidos o uso | Baja | Revisar Firestore/export de datos si se necesitan números reales |

---

## 6. 🛠️ Acciones pendientes

* [ ] P0 — Mover validaciones críticas de pedido a backend: fecha mínima, precios, totales, método de entrega e items permitidos.
* [ ] P0 — Revisar y endurecer reglas Firestore para edición de items por cliente en pedidos pendientes.
* [ ] P1 — Centralizar gestión de admins para evitar doble mantenimiento entre `firebase-store.ts` y `firestore.rules`.
* [ ] P1 — Resolver fuente canónica de productos para detalle, sitemap y metadata.
* [ ] P1 — Reemplazar QR/imagen de pago por recurso final confirmado.
* [ ] P2 — Limpiar artefactos duplicados/sobrantes con sufijo ` 2` y revisar si alguno está versionado.
* [ ] P2 — Agregar historial de cambios por pedido: quién cambió estado, pago, items o notas y cuándo.

### Priorización

| Prioridad | Acción | Criterio |
|---|---|---|
| P0 | Validaciones backend y reglas Firestore | Si falla, un usuario técnico puede alterar condiciones operativas |
| P1 | Fuente canónica de productos/SEO y roles admin | Reduce drift y riesgo de operación manual |
| P2 | Limpieza y mejoras de trazabilidad | Mejora mantenimiento, no bloquea operación diaria |

---

## 7. 📚 Referencias

| Recurso | Tipo | Comentario |
|---|---|---|
| `README.md` | Documento raíz | Setup, deploy, rutas, colecciones y flujo general |
| `documentacion/estado-mvp.md` | Documento vivo | Estado funcional y pendientes existentes |
| `documentacion/arquitectura.md` | Documento vivo | Arquitectura, rutas y Firestore |
| `documentacion/backlog.md` | Documento vivo | Pendientes priorizados y completados |
| `documentacion/bitacora.md` | Documento vivo | Historial cronológico de sesiones |
| `package.json` | Configuración | Versiones, scripts y dependencias |
| `next.config.ts` | Configuración | Export estático e imágenes sin optimización |
| `firebase.json` | Configuración | Hosting, Functions, Firestore y predeploy |
| `firestore.rules` | Seguridad | Reglas de acceso Firestore |
| `lib/firebase-store.ts` | Código | Operaciones de datos y roles admin |
| `functions/src/index.ts` | Código | Notificaciones por e-mail e idempotencia |

---

## 8. 🕰️ Bitácora

| Fecha | Cambio / Evento | Observación |
|---|---|---|
| 2026-05-08 | Creación base de documentación | Documentos iniciales en `documentacion/` |
| 2026-05-09 | Documentación de admin, SEO, variantes y pedidos manuales | Quedó registrado en backlog y bitácora |
| 2026-05-12 | Documentación de notificaciones, 48h y dashboard interactivo | Quedó registrado en estado/backlog/bitácora |
| 2026-05-19 | Creación de documento maestro con skill de documentación | Este archivo consolida estado, riesgos y acciones |

---

## 9. 🧪 Checklist de calidad

* [x] El propósito está claro.
* [x] Hay contexto suficiente para entenderlo en el futuro.
* [x] Las decisiones tienen motivo.
* [x] Las acciones tienen siguiente paso concreto.
* [x] No hay información sensible innecesaria.
* [x] Los archivos de referencia importantes están incluidos.
* [x] El documento se puede entender sin explicación verbal.
* [x] Los hechos están ligados a fuentes locales verificables.

---

<details>
<summary>🧬 Historial de versiones</summary>

| Fecha | Versión | Autor | Cambios |
|---|---|---|---|
| 2026-05-19 | 1.0 | Codex | Documento maestro inicial usando el skill de documentación |

</details>

---

<div style="text-align: center; padding: 22px; background: linear-gradient(135deg, #020617 0%, #052E1F 100%); color: white; border-radius: 14px; margin: 34px 0; border: 1px solid rgba(34,197,94,0.25);">
  <p style="margin: 0; font-weight: 700;">🌿 Documentación personal · Checho</p>
  <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.8;">Última actualización: 2026-05-19 · Mantener simple, claro y accionable</p>
</div>
