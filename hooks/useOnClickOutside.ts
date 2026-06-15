import { useEffect, RefObject } from 'react';

type AnyEvent = MouseEvent | TouchEvent;

export function useOnClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T> | RefObject<T>[],
  handler: (event: AnyEvent) => void,
): void {
  useEffect(() => {
    const listener = (event: AnyEvent) => {
      const refs = Array.isArray(ref) ? ref : [ref];

      // Do nothing if clicking any of the ref's elements or descendent elements
      const isInside = refs.some(
        (r) => r.current && r.current.contains(event.target as Node)
      );

      if (isInside) {
        return;
      }

      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}
