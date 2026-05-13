# Documentación Lara Bakery

Esta carpeta acompaña el desarrollo del sitio web de Lara Bakery. La idea es mantener aquí una bitácora viva: qué existe, cómo está construido, qué falta y qué decisiones se han tomado.

---

## Documentos

| Archivo | Contenido |
|---|---|
| [estado-mvp.md](./estado-mvp.md) | Qué está funcionando, qué falta y riesgos actuales |
| [arquitectura.md](./arquitectura.md) | Stack, rutas, componentes, Firestore y decisiones técnicas |
| [backlog.md](./backlog.md) | Pendientes priorizados y registro de lo completado |
| [bitacora.md](./bitacora.md) | Registro cronológico de avances y decisiones por sesión |

Para el quickstart de desarrollo (setup local, variables, deploy) ver el [`README.md`](../README.md) en la raíz del proyecto.

---

## Estado actual rápido

El sitio está **operativo en producción** en https://larabakery.web.app.

- Clientes pueden navegar el catálogo, hacer pedidos y ver su historial.
- Clientes pueden editar/eliminar pedidos propios mientras sigan pendientes.
- Lara gestiona pedidos, pedidos manuales, productos, costos, reportes y dashboard interactivo desde el panel admin.
- Todo conectado a Firebase (Auth + Firestore + Functions). UI 100% optimizada para mobile.
- Hay notificaciones automáticas por e-mail cuando entra un pedido.

Lo que falta para considerarlo "terminado": QR Nequi real, detalle de producto desde Firestore, validaciones backend productivas y limpieza de archivos duplicados/sobrantes.

---

## Regla de mantenimiento

Cada cambio relevante debe actualizar al menos uno de estos documentos:

- Nuevas páginas, componentes, colecciones o reglas → `arquitectura.md`
- Funcionalidad terminada o descartada → `estado-mvp.md` y `backlog.md`
- Decisiones importantes o sesiones de trabajo → `bitacora.md`
