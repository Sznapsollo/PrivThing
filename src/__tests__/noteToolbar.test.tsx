import { render, screen, fireEvent } from '@testing-library/react';
import NoteToolbar from '../components/note/NoteToolbar';
import { createRef } from 'react';
import '../i18n';

const props = () => ({
    isActive: true,
    filePath: '/notes/a.md',
    canUpdateFile: true,
    canDelete: true,
    isDirty: false,
    isEncrypted: false,
    needSecret: false,
    noteLength: 10,
    saveHotKey: 'Ctrl + S',
    showFullScreen: false,
    wrapWords: false,
    canPreview: false,
    showPreview: false,
    updateFileButtonRef: createRef<HTMLButtonElement>(),
    saveToFileButtonRef: createRef<HTMLButtonElement>(),
    scrollTopButtonRef: createRef<HTMLDivElement>(),
    onSave: () => {},
    onDelete: () => {},
    onScrollTop: () => {},
    onChangeSecret: () => {},
    onShowFullScreen: () => {},
    onWrapToggle: () => {},
    onPreviewToggle: () => {},
    onSaveAs: () => {},
    onRollback: () => {}
});

describe('the note toolbar', () => {
    it('offers Preview only when the note can be previewed', () => {
        const { rerender } = render(<NoteToolbar {...props()} canPreview={false} />);
        expect(screen.queryByText('Preview .md')).toBeNull();

        rerender(<NoteToolbar {...props()} canPreview={true} />);
        expect(screen.queryByText('Preview .md')).not.toBeNull();
    });

    it('says Hide preview once the preview is open', () => {
        render(<NoteToolbar {...props()} canPreview={true} showPreview={true} />);
        expect(screen.queryByText('Hide preview .md')).not.toBeNull();
        expect(screen.queryByText('Preview .md')).toBeNull();
    });

    it('calls back when Preview is clicked', () => {
        let toggled = 0;
        render(<NoteToolbar {...props()} canPreview={true} onPreviewToggle={() => { toggled++ }} />);
        fireEvent.click(screen.getByText('Preview .md'));
        expect(toggled).toBe(1);
    });

    it('shows Save and Delete for a writable note, and Save is disabled until it is dirty', () => {
        render(<NoteToolbar {...props()} />);
        expect((screen.getByText('Save').closest('button') as HTMLButtonElement).disabled).toBe(true);
        expect(screen.queryByText('Delete')).not.toBeNull();
    });

    it('hides Delete when the backend cannot delete', () => {
        render(<NoteToolbar {...props()} canDelete={false} />);
        expect(screen.queryByText('Delete')).toBeNull();
    });
});

describe('preview and full screen together', () => {
    it('offers both Preview and Show full screen at the same time', () => {
        render(<NoteToolbar {...props()} canPreview={true} showFullScreen={false} />);
        expect(screen.queryByText('Preview .md')).not.toBeNull();
        expect(screen.queryByText('Show full screen')).not.toBeNull();
    });

    it('still offers Preview while in full screen', () => {
        render(<NoteToolbar {...props()} canPreview={true} showFullScreen={true} />);
        expect(screen.queryByText('Preview .md')).not.toBeNull();
        expect(screen.queryByText('Wrap rows')).not.toBeNull();
    });
});
