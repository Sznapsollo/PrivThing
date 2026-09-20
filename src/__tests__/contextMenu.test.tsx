import { render, screen, fireEvent } from '@testing-library/react';
import GenericContextMenuComp from '../components/GenericContextMenuComp';

const menuActions = [
    { action: 'copy', title: 'Copy line' },
    { action: 'hide', title: 'Hide' },
    { action: 'delete', title: 'Delete line' }
];

const renderMenu = (onAction = (_: any) => {}) =>
    render(<GenericContextMenuComp x={10} y={10} menuActions={menuActions} contextMenuAction={onAction} />);

describe('the context menu, from the keyboard', () => {
    it('is announced as a menu with menu items', () => {
        renderMenu();
        expect(screen.getByRole('menu')).not.toBeNull();
        expect(screen.getAllByRole('menuitem')).toHaveLength(3);
    });

    it('focuses the first item so the keyboard can take over', () => {
        renderMenu();
        expect(document.activeElement?.textContent).toBe('Copy line');
    });

    it('moves down and up with the arrow keys, wrapping round', () => {
        renderMenu();
        const menu = screen.getByRole('menu');

        fireEvent.keyDown(menu, { key: 'ArrowDown' });
        expect(document.activeElement?.textContent).toBe('Hide');

        fireEvent.keyDown(menu, { key: 'ArrowDown' });
        fireEvent.keyDown(menu, { key: 'ArrowDown' });
        expect(document.activeElement?.textContent).toBe('Copy line');

        fireEvent.keyDown(menu, { key: 'ArrowUp' });
        expect(document.activeElement?.textContent).toBe('Delete line');
    });

    it('jumps to the first and last item with Home and End', () => {
        renderMenu();
        const menu = screen.getByRole('menu');

        fireEvent.keyDown(menu, { key: 'End' });
        expect(document.activeElement?.textContent).toBe('Delete line');

        fireEvent.keyDown(menu, { key: 'Home' });
        expect(document.activeElement?.textContent).toBe('Copy line');
    });

    it('runs the focused item on Enter and on Space', () => {
        const actions: string[] = [];
        renderMenu((menuAction) => actions.push(menuAction.action));

        fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowDown' });
        fireEvent.keyDown(screen.getAllByRole('menuitem')[1], { key: 'Enter' });
        fireEvent.keyDown(screen.getAllByRole('menuitem')[1], { key: ' ' });

        expect(actions).toEqual(['hide', 'hide']);
    });

    it('closes on Escape', () => {
        const actions: string[] = [];
        renderMenu((menuAction) => actions.push(menuAction.action));

        fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
        expect(actions).toEqual(['close']);
    });
});
