/**
 * التنقّل عبر عنوان الصفحة (hash) حتى يعمل زر الرجوع في المتصفح والجوال،
 * ويمكن مشاركة رابط مباشر لمحطة معيّنة، ويستعيد التحديث الشاشة نفسها.
 *
 * الصيغ:
 *   #/                 شاشة الاستقبال
 *   #/labs             اختيار المختبر
 *   #/silicon          مختبر السيليكون
 *   #/silicon/<game>   لعبة سيليكون
 *   #/atomic           مختبر الذرة
 *   #/atomic/<dest>    وجهة في مختبر الذرة
 *   #/gateway          بوابة المختبرين
 */
import { SILICON_GAME_IDS } from '../data/atomicTasks';

export const ATOMIC_DESTINATIONS = ['timeline', 'infer', 'explain', 'error_detective', 'whatif', 'final_challenge'] as const;
export type AtomicDestination = typeof ATOMIC_DESTINATIONS[number];

export type ViewName = 'reception' | 'lab_selection' | 'silicon_hub' | 'silicon_game' | 'atomic_hub' | 'destination' | 'gateway';

export interface Route {
  view: ViewName;
  station: string | null;
  destination: AtomicDestination | null;
}

export const HOME_ROUTE: Route = { view: 'reception', station: null, destination: null };

export function parseHash(hash: string): { route: Route; valid: boolean } {
  const clean = hash.replace(/^#\/?/, '').replace(/\/+$/, '');
  const [first = '', second, ...rest] = clean.split('/').map(p => decodeURIComponent(p));
  const r = (view: ViewName, station: string | null = null, destination: AtomicDestination | null = null) =>
    ({ route: { view, station, destination }, valid: rest.length === 0 });

  switch (first) {
    case '':
      return r('reception');
    case 'labs':
      return second ? { route: HOME_ROUTE, valid: false } : r('lab_selection');
    case 'gateway':
      return second ? { route: HOME_ROUTE, valid: false } : r('gateway');
    case 'silicon':
      if (!second) return r('silicon_hub');
      if ((SILICON_GAME_IDS as readonly string[]).includes(second)) return r('silicon_game', second);
      return { route: { view: 'silicon_hub', station: null, destination: null }, valid: false };
    case 'atomic':
      if (!second) return r('atomic_hub');
      if ((ATOMIC_DESTINATIONS as readonly string[]).includes(second)) return r('destination', null, second as AtomicDestination);
      return { route: { view: 'atomic_hub', station: null, destination: null }, valid: false };
    default:
      return { route: HOME_ROUTE, valid: false };
  }
}

export function formatHash(route: Route): string {
  switch (route.view) {
    case 'reception': return '#/';
    case 'lab_selection': return '#/labs';
    case 'gateway': return '#/gateway';
    case 'silicon_hub': return '#/silicon';
    case 'silicon_game': return route.station ? `#/silicon/${route.station}` : '#/silicon';
    case 'atomic_hub': return '#/atomic';
    case 'destination': return route.destination ? `#/atomic/${route.destination}` : '#/atomic';
  }
}

export function sameRoute(a: Route, b: Route) {
  return a.view === b.view && a.station === b.station && a.destination === b.destination;
}
