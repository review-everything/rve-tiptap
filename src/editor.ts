import '@tiptap/extension-list';
import '@tiptap/extension-placeholder';
import '@tiptap/extension-text-align';
import '@tiptap/extension-text-style';
import '@tiptap/starter-kit';

export { Editor } from '@tiptap/core';
export { contentExtensions } from './extensions/index.js';
export { contentFontFamily, contentFontSize, contentFontSizes, contentFonts } from './fonts.js';
