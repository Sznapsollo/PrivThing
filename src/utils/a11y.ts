import { KeyboardEvent } from 'react';

export function keyActivate<T = Element>(handler: (e: KeyboardEvent<T>) => void) {
    return (e: KeyboardEvent<T>) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault();
            handler(e);
        }
    }
}

export const clickableProps = { role: 'button', tabIndex: 0 };
