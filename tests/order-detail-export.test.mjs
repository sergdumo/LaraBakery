import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

test('el detalle de cualquier pedido dispone de una página exportada', () => {
  const url = new URL('/admin/pedidos/detalle?id=LB-260916-01', 'https://larabakery.web.app');
  assert.ok(existsSync(`out${url.pathname}.html`), 'Falta la página estática: abrir o recargar el enlace devolvería 404');
});
