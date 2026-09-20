import { useMemo } from 'react';
import { renderMarkdown } from '../../utils/markdown';

interface Props {
    note: string
}

const MarkdownPreview = ({ note }: Props) => {

    const html = useMemo(() => renderMarkdown(note), [note]);

    return (
        <div className='markdownPreview' dangerouslySetInnerHTML={{ __html: html }} />
    )
}

export default MarkdownPreview;
