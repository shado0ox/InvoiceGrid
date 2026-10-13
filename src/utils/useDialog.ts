import { useEffect, useRef } from 'react';
export function useDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!open || !ref.current) return;
    const previous = document.activeElement as HTMLElement | null;
    const element = ref.current;
    const focusables = () => [...element.querySelectorAll<HTMLElement>('button, input, select, textarea, a[href], iframe, [tabindex="0"]')].filter(item => !item.hasAttribute('disabled') && item.getClientRects().length > 0);
    focusables()[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); close.current(); }
      if (event.key !== 'Tab') return;
      const items = focusables();
      const first = items[0], last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    element.addEventListener('keydown', onKey);
    return () => { element.removeEventListener('keydown', onKey); previous?.focus(); };
  }, [open]);
  return ref;
}
