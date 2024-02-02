import {createTheme} from 'thememirror';
import {tags as t} from '@lezer/highlight';

// from https://thememirror.net/create

const createCustomTheme = (customThemeColors) => {
	return createTheme({
		variant: customThemeColors.variant,
		settings: {
			background: customThemeColors.background,
			foreground: customThemeColors.foreground,
			caret: customThemeColors.caret,
			selectionBackground: customThemeColors.selection,
			lineHighlight: customThemeColors.lineHighlight,
			gutterBackground: customThemeColors.gutterBackground,
			gutterForeground: customThemeColors.gutterForeground
		},
		styles: [
			{
				tag: t.comment,
				color: customThemeColors.comment,
			},
			{
				tag: t.variableName,
				color: customThemeColors.variableName,
			},
			{
				tag: [t.string, t.special(t.brace)],
				color: customThemeColors.brace,
			},
			{
				tag: t.number,
				color: customThemeColors.numberType,
			},
			{
				tag: t.bool,
				color: customThemeColors.boolType,
			},
			{
				tag: t.null,
				color: customThemeColors.nullType,
			},
			{
				tag: t.keyword,
				color: customThemeColors.keyWordType,
			},
			{
				tag: t.operator,
				color: customThemeColors.operatorType,
			},
			{
				tag: t.className,
				color: customThemeColors.classNameType,
			},
			{
				tag: t.definition(t.typeName),
				color: customThemeColors.typeName,
			},
			{
				tag: t.typeName,
				color: customThemeColors.typeName2,
			},
			{
				tag: t.angleBracket,
				color: customThemeColors.angleBracket,
			},
			{
				tag: t.tagName,
				color: customThemeColors.tagName,
			},
			{
				tag: t.attributeName,
				color: customThemeColors.attributeName,
			},
		],
	});
}


export {createCustomTheme};