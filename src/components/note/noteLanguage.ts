import { LanguageDescription, LanguageSupport, StreamLanguage } from '@codemirror/language';

const streamLanguage = (load: () => Promise<StreamLanguage<unknown>>) =>
    async () => new LanguageSupport(await load());

export const noteLanguages: LanguageDescription[] = [
    LanguageDescription.of({
        name: 'JavaScript',
        extensions: ['js', 'jsx', 'mjs', 'cjs', 'ts', 'tsx', 'txt', 'prvthng', 'log'],
        load: () => import('@codemirror/lang-javascript').then((m) => m.javascript({ jsx: true }))
    }),
    LanguageDescription.of({
        name: 'JSON',
        extensions: ['json'],
        load: () => import('@codemirror/lang-json').then((m) => m.json())
    }),
    LanguageDescription.of({
        name: 'Markdown',
        extensions: ['md', 'markdown'],
        load: () => import('@codemirror/lang-markdown').then((m) => m.markdown())
    }),
    LanguageDescription.of({
        name: 'SQL',
        extensions: ['sql'],
        load: () => import('@codemirror/lang-sql').then((m) => m.sql())
    }),
    LanguageDescription.of({
        name: 'YAML',
        extensions: ['yaml', 'yml'],
        load: () => import('@codemirror/lang-yaml').then((m) => m.yaml())
    }),
    LanguageDescription.of({
        name: 'XML',
        extensions: ['xml', 'svg', 'xsl'],
        load: () => import('@codemirror/lang-xml').then((m) => m.xml())
    }),
    LanguageDescription.of({
        name: 'HTML',
        extensions: ['html', 'htm'],
        load: () => import('@codemirror/lang-html').then((m) => m.html())
    }),
    LanguageDescription.of({
        name: 'CSS',
        extensions: ['css'],
        load: () => import('@codemirror/lang-css').then((m) => m.css())
    }),
    LanguageDescription.of({
        name: 'Python',
        extensions: ['py'],
        load: () => import('@codemirror/lang-python').then((m) => m.python())
    }),
    LanguageDescription.of({
        name: 'Shell',
        extensions: ['sh', 'bash', 'zsh'],
        load: streamLanguage(() => import('@codemirror/legacy-modes/mode/shell').then((m) => StreamLanguage.define(m.shell)))
    }),
    LanguageDescription.of({
        name: 'Groovy',
        extensions: ['groovy', 'gradle'],
        load: streamLanguage(() => import('@codemirror/legacy-modes/mode/groovy').then((m) => StreamLanguage.define(m.groovy)))
    }),
    LanguageDescription.of({
        name: 'Properties',
        extensions: ['properties', 'ini', 'conf', 'env'],
        load: streamLanguage(() => import('@codemirror/legacy-modes/mode/properties').then((m) => StreamLanguage.define(m.properties)))
    })
];

const DEFAULT_LANGUAGE = 'JavaScript';

export function describeNoteLanguage(fileName?: string): LanguageDescription | null {
    const matched = fileName ? LanguageDescription.matchFilename(noteLanguages, fileName.toLowerCase()) : null;
    if (matched) {
        return matched
    }

    return noteLanguages.find((language) => language.name === DEFAULT_LANGUAGE) || null
}

export async function loadNoteLanguage(fileName?: string): Promise<LanguageSupport | null> {
    const description = describeNoteLanguage(fileName);
    if (!description) {
        return null
    }

    try {
        return await description.load()
    } catch (e) {
        console.warn('Could not load highlighting for ' + fileName, e);
        return null
    }
}
