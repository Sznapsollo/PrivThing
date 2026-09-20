import { RefObject, useEffect, useRef } from 'react';

const events = ['mousedown', 'touchstart'];

export function useClickAway(ref: RefObject<HTMLElement>, onClickAway: (event: Event) => void) {
    const handlerRef = useRef(onClickAway);
    handlerRef.current = onClickAway;

    useEffect(() => {
        const handler = (event: Event) => {
            const element = ref.current;
            if (element && event.target instanceof Node && !element.contains(event.target)) {
                handlerRef.current(event);
            }
        };
        events.forEach((eventName) => document.addEventListener(eventName, handler));
        return () => events.forEach((eventName) => document.removeEventListener(eventName, handler))
    }, [ref]);
}
