/**
 * سلوك النوافذ المنبثقة لسهولة الوصول:
 * - role="dialog" و aria-modal وعنوان مرتبط
 * - نقل التركيز إلى النافذة وحبسه داخلها بزر Tab
 * - الإغلاق بزر Escape (للنافذة العليا فقط عند تداخل النوافذ)
 * - إرجاع التركيز إلى العنصر الذي فتح النافذة بعد إغلاقها
 */
import { useEffect, useId, useRef } from 'react';

const dialogStack: symbol[] = [];

const FOCUSABLE = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])',
].join(',');

function focusables(node: HTMLElement): HTMLElement[] {
  return Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE))
    .filter(el => !el.hasAttribute('inert') && el.getClientRects().length > 0);
}

export function useDialog(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const id = Symbol('dialog');
    dialogStack.push(id);
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const isTop = () => dialogStack[dialogStack.length - 1] === id;

    const raf = requestAnimationFrame(() => {
      const node = ref.current;
      if (!node || node.contains(document.activeElement)) return;
      const auto = node.querySelector<HTMLElement>('[autofocus]');
      (auto || node).focus({ preventScroll: true });
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (!isTop()) return;
      const node = ref.current;
      if (!node) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key === 'Tab') {
        const list = focusables(node);
        if (list.length === 0) {
          e.preventDefault();
          node.focus();
          return;
        }
        const first = list[0];
        const last = list[list.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || active === node || !node.contains(active))) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (active === last || !node.contains(active))) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKeyDown);
      const idx = dialogStack.indexOf(id);
      if (idx >= 0) dialogStack.splice(idx, 1);
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, []);

  return {
    titleId,
    dialogProps: {
      ref,
      role: 'dialog' as const,
      'aria-modal': true as const,
      'aria-labelledby': titleId,
      tabIndex: -1,
    },
  };
}
