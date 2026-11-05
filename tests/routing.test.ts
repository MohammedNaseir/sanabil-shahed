import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatHash, parseHash, HOME_ROUTE, type Route } from '../src/utils/routing';

test('كل مسار صالح يتحول إلى hash ويعود كما هو', () => {
  const routes: Route[] = [
    HOME_ROUTE,
    { view: 'lab_selection', gate: null, lab: null },
    { view: 'atom_hub', gate: null, lab: null },
    { view: 'atom_gate', gate: 0, lab: null },
    { view: 'atom_gate', gate: 5, lab: null },
    { view: 'elements_hub', gate: null, lab: null },
    { view: 'element_lab', gate: null, lab: 'ca' },
    { view: 'element_lab', gate: null, lab: 'si' },
    { view: 'finale', gate: null, lab: null },
  ];
  for (const r of routes) {
    const { route, valid } = parseHash(formatHash(r));
    assert.equal(valid, true, formatHash(r));
    assert.deepEqual(route, r);
  }
  assert.equal(formatHash({ view: 'atom_gate', gate: 2, lab: null }), '#/atom/3', 'أرقام البوابات تبدأ من 1 في الرابط');
});

test('الروابط غير الصالحة تعود لمكان آمن', () => {
  assert.deepEqual(parseHash('#/atom/9'), { route: { view: 'atom_hub', gate: null, lab: null }, valid: false });
  assert.deepEqual(parseHash('#/atom/x'), { route: { view: 'atom_hub', gate: null, lab: null }, valid: false });
  assert.deepEqual(parseHash('#/elements/fe'), { route: { view: 'elements_hub', gate: null, lab: null }, valid: false });
  assert.deepEqual(parseHash('#/silicon/falcon'), { route: HOME_ROUTE, valid: false }, 'روابط النسخة القديمة تعود للبداية');
  assert.equal(parseHash('#/atom/1/extra').valid, false);
  assert.equal(parseHash('').route.view, 'reception');
  assert.equal(parseHash('#/elements/').route.view, 'elements_hub');
});
