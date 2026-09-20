import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Form } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { AppState } from '../context/Context';
import { MAIN_ACTIONS } from '../context/Reducers';
import { Item } from '../model';
import { quickOpenMatches } from '../utils/quickOpen';

interface Props {
    onClose: () => void
}

const QuickOpenComp = ({ onClose }: Props) => {

    const { t } = useTranslation();
    const { mainState: { items }, mainDispatch } = AppState();

    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const matches = useMemo(() => quickOpenMatches(items, query), [items, query]);

    useEffect(() => {
        setSelected(0);
    }, [query]);

    useEffect(() => {
        const focusHandle = setTimeout(() => inputRef.current?.focus(), 50);
        return () => clearTimeout(focusHandle)
    }, []);

    const openItem = (item: Item, inNewSpace: boolean) => {
        const payLoadItem: Item = {
            name: item.name,
            folder: item.folder,
            path: item.path,
            size: item.size,
            fetchData: item.folder === 'localStorage' ? false : true,
            rawNote: undefined
        };
        mainDispatch({
            type: MAIN_ACTIONS.SET_EDITED_ITEM_CANDIDATE,
            payload: {
                item: payLoadItem,
                tab: { ...payLoadItem, isNew: true },
                action: inNewSpace ? 'NEW_NOTE_SPACE' : undefined
            }
        });
        onClose();
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelected((current) => Math.min(current + 1, matches.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelected((current) => Math.max(current - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (matches[selected]) {
                openItem(matches[selected], e.shiftKey);
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
        }
    };

    return (
        <Modal show={true} onHide={onClose} centered className='quickOpen' aria-labelledby="quick-open-title">
            <Modal.Body>
                <Form.Control
                    ref={inputRef}
                    type="text"
                    className='form-control-lg'
                    placeholder={t("quickOpenPlaceholder")}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={onKeyDown}
                />
                <div className='quickOpenResults'>
                    {
                        matches.map((item, index) => (
                            <div
                                key={item.path}
                                className={'quickOpenItem' + (index === selected ? ' quickOpenItemSelected' : '')}
                                onMouseEnter={() => setSelected(index)}
                                onClick={(e) => openItem(item, e.shiftKey)}
                            >
                                <span className='quickOpenName'>{item.name}</span>
                                <span className='quickOpenFolder'>{item.folder === 'localStorage' ? t("localStorage") : item.folder}</span>
                            </div>
                        ))
                    }
                    {
                        !matches.length &&
                        <div className='quickOpenEmpty'>{t("quickOpenNothingFound")}</div>
                    }
                </div>
                <div className='quickOpenHint'>{t("quickOpenHint")}</div>
            </Modal.Body>
        </Modal>
    )
}

export default QuickOpenComp;
