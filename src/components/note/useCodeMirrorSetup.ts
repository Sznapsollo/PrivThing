import { useEffect, useMemo, useRef, useState, MutableRefObject } from 'react';
import { BlockInfo, lineNumbers, Extension, EditorSelection, Prec } from '@uiw/react-codemirror';
import {
    Decoration,
    DecorationSet,
    EditorView,
    MatchDecorator,
    WidgetType,
    ViewPlugin,
    ViewUpdate,
    keymap
} from '@codemirror/view';
import {
    amy,
    ayuLight,
    barf,
    bespin,
    birdsOfParadise,
    boysAndGirls,
    clouds,
    cobalt,
    coolGlow,
    dracula,
    espresso,
    noctisLilac,
    rosePineDawn,
    smoothy,
    solarizedLight,
    tomorrow
} from 'thememirror';
import { LanguageSupport } from '@codemirror/language';
import { createCustomTheme } from '../../utils/customTheme';
import { loadNoteLanguage } from './noteLanguage';
import { hideRegex } from './hideRegex';

type CopyClickedValue = (copiedText: string, copyMessage?: string) => void;
type BuildContextMenu = (e: any, options?: { type: string; selectionStart?: number; selectionEnd?: number }) => void;

interface Options {
    fileName?: string;
    themeName?: string;
    customThemeColors?: any;
    wrapWords: boolean;
    copyClickedValue: CopyClickedValue;
    buildContextMenu: BuildContextMenu;
}

export function useCodeMirrorSetup({
    fileName,
    themeName,
    customThemeColors,
    wrapWords,
    copyClickedValue,
    buildContextMenu
}: Options) {
    const copyClickedValueRef: MutableRefObject<CopyClickedValue> = useRef(copyClickedValue);
    copyClickedValueRef.current = copyClickedValue;

    const buildContextMenuRef: MutableRefObject<BuildContextMenu> = useRef(buildContextMenu);
    buildContextMenuRef.current = buildContextMenu;

    const [noteLanguage, setNoteLanguage] = useState<LanguageSupport | null>(null);

    useEffect(() => {
        let stillWanted = true;
        loadNoteLanguage(fileName).then((support) => {
            if (stillWanted) {
                setNoteLanguage(support);
            }
        });
        return () => { stillWanted = false }
    }, [fileName]);

    const codeMirrorTheme: 'none' | Extension = useMemo(() => {
        const themes: Record<string, Extension> = {
            amy: amy,
            ayuLight: ayuLight,
            barf: barf,
            bespin: bespin,
            birdsOfParadise: birdsOfParadise,
            boysAndGirls: boysAndGirls,
            clouds: clouds,
            cobalt: cobalt,
            coolGlow: coolGlow,
            dracula: dracula,
            espresso: espresso,
            noctisLilac: noctisLilac,
            rosePineDawn: rosePineDawn,
            smoothy: smoothy,
            solarizedLight: solarizedLight,
            tomorrow: tomorrow
        };
        if (themeName === 'customTheme') {
            return createCustomTheme(customThemeColors);
        }
        return (themeName && themes[themeName]) || 'none';
    }, [themeName, customThemeColors]);

    const codeMirrorExtensions = useMemo(() => {
        class PassHiderWidget extends WidgetType {
            constructor(
                readonly element: string,
                readonly view: EditorView,
                readonly position: number
            ) {
                super();
            }

            toDOM() {
                const spanID = `${this.position}_${this.position + this.element.length + 'hide[[]]'.length}`;
                let wrap = document.createElement('span');
                wrap.setAttribute('role', 'button');
                wrap.setAttribute('tabindex', '0');
                wrap.setAttribute('aria-label', 'hidden value, activate to copy it');
                wrap.onkeydown = (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        copyClickedValueRef.current((this.element || '').replaceAll('hide[[', '').replaceAll(']]', ''), 'copied');
                    }
                };
                wrap.setAttribute('id', spanID);
                wrap.onclick = (e) => {
                    copyClickedValueRef.current(
                        (this.element || '').replaceAll('hide[[', '').replaceAll(']]', ''),
                        'copied'
                    );
                    e.preventDefault();
                };
                wrap.oncontextmenu = (e) => {
                    if (e && e.target) {
                        // const {pageX, pageY} = e;
                        buildContextMenuRef.current(e, {
                            type: 'fromMarked',
                            selectionStart: this.position,
                            selectionEnd: this.position + this.element.length + 'hide[[]]'.length
                        });
                    }
                    e.preventDefault();
                };
                wrap.className = 'cm-pass-hider';
                wrap.innerHTML = this.element.replace(/./g, '*');

                return wrap;
            }

            ignoreEvent() {
                return false;
            }
        }
        const placeholderMatcher = new MatchDecorator({
            // regexp: /pass\[\[(\w+)\]\]/g,
            regexp: hideRegex,
            decoration: (match, view, position) =>
                Decoration.replace({
                    widget: new PassHiderWidget(match[1], view, position)
                })
        });

        const placeholders = ViewPlugin.fromClass(
            class {
                placeholders: DecorationSet;
                constructor(view: EditorView) {
                    this.placeholders = placeholderMatcher.createDeco(view);
                }
                update(update: ViewUpdate) {
                    this.placeholders = placeholderMatcher.updateDeco(update, this.placeholders);
                }
            },
            {
                decorations: (instance) => instance.placeholders,
                provide: (plugin) =>
                    EditorView.atomicRanges.of((view) => {
                        return view.plugin(plugin)?.placeholders || Decoration.none;
                    })
            }
        );
        const extensions = [
            lineNumbers({
                domEventHandlers: {
                    click(view: EditorView, line: BlockInfo, event: any) {
                        let clickedNumber = event?.srcElement?.innerText;
                        if (clickedNumber) {
                            let rowNumber = parseInt(clickedNumber);
                            if (!isNaN(rowNumber)) {
                                copyClickedValueRef.current(
                                    (view.state.doc.line(rowNumber).text || '')
                                        .replaceAll('hide[[', '')
                                        .replaceAll(']]', '')
                                );

                                view.dispatch({
                                    // Set selection to that entire line.
                                    // selection: { head: line.from, anchor: line.to },
                                    selection: { head: line.from, anchor: line.from },
                                    // Ensure the selection is shown in viewport
                                    scrollIntoView: true
                                });
                            }
                        }
                        return true;
                    }
                }
            }),
            placeholders,
            EditorView.theme({
                '.cm-gutter,.cm-content': { borderBottom: 'nonde', minHeight: '1000px' },
                '.cm-scroller': { overflow: 'auto' }
            }),
            // Prec.high(
            //     EditorView.domEventHandlers({
            //         keydown: (event, view) => {
            //             console.log(`Key pressed: ${event.key}`);
            //           // Return false to let CodeMirror handle the event as well
            //           return false;
            //         },
            //     }),
            // ),
            // without Prec.high Enter and Backspace will not execute
            Prec.high(
                keymap.of([
                    {
                        key: 'Enter',
                        run: (view) => {
                            const { state, dispatch } = view;
                            const changes = state.changeByRange((range) => ({
                                changes: { from: range.from, insert: '\n' },
                                range: EditorSelection.range(range.to + 1, range.to + 1)
                                // range: EditorView.range(range.from + 1),
                            }));
                            dispatch(state.update(changes, { scrollIntoView: true, userEvent: 'input' }));
                            return true;
                        }
                    }
                ])
            ),
            EditorView.theme(
                {
                    // '&.cm-focused .cm-selectionLayer .cm-selectionBackground': {
                    '.cm-scroller .cm-selectionBackground': {
                        backgroundColor: '#99999940 !important' // Change the selection background color here
                    }
                },
                { dark: true }
            )
            // EditorView.theme({
            //     '.cm-cursor': {
            //       borderLeftColor: 'red', // Change the cursor color here
            //     },
            // }, { dark: true })
        ];

        if (noteLanguage) {
            extensions.unshift(noteLanguage);
        }

        if (wrapWords) {
            extensions.push(EditorView.lineWrapping);
        }

        return extensions;
    }, [wrapWords, noteLanguage]);

    return { codeMirrorTheme, codeMirrorExtensions };
}
