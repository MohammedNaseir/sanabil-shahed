import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatHash, parseHash, HOME_ROUTE, type Route } from '../src/utils/routing';

test('كل مسار صالح يتحول إلى hash ويعود كما هو', () => {
  const routes: Route[] = [
    HOME_ROUTE,
    { view: 'lab_selection', station: null, destination: null },
    { view: 'silicon_hub', station: null, destination: null },
    { view: 'silicon_game', station: 'falcon', destination: null },
    { view: 'silicon_game', station: 'rescue', destination: null },
    { view: 'atomic_hub', station: null, destination: null },
    { view: 'destination', station: null, destination: 'error_detective' },
    { view: 'gateway', station: null, destination: null },
  ];
  for (const r of routes) {
    const { route, valid } = parseHash(formatHash(r));
    assert.equal(valid, true, formatHash(r));
    assert.deepEqual(route, r);
  }
});

test('الروابط غير الصالحة تعود لمكان آمن', () => {
  assert.deepEqual(parseHash('#/silicon/hack'), { route: { view: 'silicon_hub', station: null, destination: null }, valid: false });
  assert.deepEqual(parseHash('#/atomic/nowhere'), { route: { view: 'atomic_hub', station: null, destination: null }, valid: false });
  assert.deepEqual(parseHash('#/what'), { route: HOME_ROUTE, valid: false });
  assert.equal(parseHash('#/silicon/falcon/extra').valid, false);
  assert.equal(parseHash('').route.view, 'reception');
  assert.equal(parseHash('#/silicon/').route.view, 'silicon_hub');
});
