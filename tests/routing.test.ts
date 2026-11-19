import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatHash, parseHash, HOME_ROUTE, type Route } from '../src/utils/routing';

test('كل مسار صالح يتحول إلى hash ويعود كما هو', () => {
  const routes: Route[] = [
    HOME_ROUTE,
    { view: 'lab_selection', gate: null, lab: null },
    { view: 'questions', gate: null, lab: null },
    { view: 'review', gate: null, lab: null },
    { view: 'atom_hub', gate: null, lab: null },
    { view: 'atom_gate', gate: 0, lab: null },
    { view: 'atom_gate', gate: 5, lab: null },
    { view: 'elements_hub', gate: null, lab: null },
    { view: 'element_lab', gate: null, lab: 'ca' },
    { view: 'element_lab', gate: null, lab: 'si' },
    { view: 'finale', gate: null, lab: null },
    { view: 'mass', gate: null, lab: null, stage: 'intro' },
    { view: 'mass', gate: null, lab: null, stage: 'hub' },
    { view: 'mass', gate: null, lab: null, stage: 'stadium' },
    { view: 'mass', gate: null, lab: null, stage: 'finale' },
    { view: 'ratio', gate: null, lab: null, rstage: 'welcome' },
    { view: 'ratio', gate: null, lab: null, rstage: 'map' },
    { view: 'ratio', gate: null, lab: null, rstage: 'match' },
  ];
  for (const r of routes) {
    const { route, valid } = parseHash(formatHash(r));
    assert.equal(valid, true, formatHash(r));
    assert.deepEqual(route, r);
  }
  assert.equal(formatHash({ view: 'atom_gate', gate: 2, lab: null }), '#/atom/3', 'أرقام البوابات تبدأ من 1 في الرابط');
  assert.equal(formatHash({ view: 'review', gate: null, lab: null }), '#/review');
  assert.equal(formatHash({ view: 'questions', gate: null, lab: null }), '#/questions');
  assert.equal(formatHash({ view: 'mass', gate: null, lab: null, stage: 'intro' }), '#/mass');
  assert.equal(formatHash({ view: 'mass', gate: null, lab: null, stage: 'falcon' }), '#/mass/falcon');
});

test('الروابط غير الصالحة تعود لمكان آمن', () => {
  assert.deepEqual(parseHash('#/atom/9'), { route: { view: 'atom_hub', gate: null, lab: null }, valid: false });
  assert.deepEqual(parseHash('#/atom/x'), { route: { view: 'atom_hub', gate: null, lab: null }, valid: false });
  assert.deepEqual(parseHash('#/elements/fe'), { route: { view: 'elements_hub', gate: null, lab: null }, valid: false });
  assert.deepEqual(parseHash('#/silicon/falcon'), { route: HOME_ROUTE, valid: false }, 'روابط النسخة القديمة تعود للبداية');
  assert.deepEqual(parseHash('#/mass/nope'), { route: { view: 'mass', gate: null, lab: null, stage: 'intro' }, valid: false });
  assert.equal(parseHash('#/mass/hub/extra').valid, false);
  assert.deepEqual(parseHash('#/ratio/zzz'), { route: { view: 'ratio', gate: null, lab: null, rstage: 'welcome' }, valid: false });
  assert.equal(formatHash({ view: 'ratio', gate: null, lab: null, rstage: 'vault' }), '#/ratio/vault');
  assert.equal(parseHash('#/atom/1/extra').valid, false);
  assert.equal(parseHash('').route.view, 'reception');
  assert.equal(parseHash('#/elements/').route.view, 'elements_hub');
});
