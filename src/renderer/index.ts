import { contentFontFamily, contentFontSize } from '../fonts.js';

const contentClass = 'rve-content';
const maxListIndent = 2;

export type ContentMark = {
  type: string;
  attrs?: Record<string, unknown>;
};

export type ContentNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: ContentNode[];
  marks?: ContentMark[];
  text?: string;
};

export function readContent(value: string): ContentNode | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (isContentNode(parsed) && parsed.type === 'doc') {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

export function mountReadOnlyContent(element: HTMLElement, content: ContentNode): { destroy: () => void } {
  const nodes = content.type === 'doc' ? content.content : [content];
  element.classList.add(contentClass);
  element.replaceChildren(renderFragment(element.ownerDocument, nodes));
  return {
    destroy(): void {
      element.replaceChildren();
      element.classList.remove(contentClass);
    },
  };
}

function renderFragment(document: Document, nodes: ContentNode[] | undefined): DocumentFragment {
  const fragment = document.createDocumentFragment();
  appendChildren(fragment, document, nodes);
  return fragment;
}

function appendChildren(parent: ParentNode, document: Document, nodes: ContentNode[] | undefined): void {
  if (!Array.isArray(nodes)) {
    return;
  }
  for (const node of nodes) {
    if (!isContentNode(node)) {
      continue;
    }
    const rendered = renderNode(document, node);
    if (rendered) {
      parent.append(rendered);
    }
  }
}

function renderNode(document: Document, node: ContentNode): Node | null {
  switch (node.type) {
    case 'text':
      return renderText(document, node);
    case 'hardBreak':
      return document.createElement('br');
    case 'horizontalRule':
      return document.createElement('hr');
    case 'paragraph':
      return renderElement(document, 'p', node, textAlignStyle(node.attrs));
    case 'heading': {
      const tag = headingTag(node.attrs);
      if (!tag) {
        return renderFragment(document, node.content);
      }
      return renderElement(document, tag, node, textAlignStyle(node.attrs));
    }
    case 'bulletList':
      return renderElement(document, 'ul', node, listIndentStyle(node.attrs));
    case 'orderedList':
      return renderOrderedList(document, node);
    case 'listItem':
      return renderElement(document, 'li', node, null);
    case 'blockquote':
      return renderElement(document, 'blockquote', node, null);
    case 'codeBlock':
      return renderCodeBlock(document, node);
    case 'doc':
      return renderFragment(document, node.content);
    default:
      return renderFragment(document, node.content);
  }
}

function renderElement(document: Document, tag: string, node: ContentNode, style: string | null): HTMLElement {
  const element = document.createElement(tag);
  if (style) {
    element.setAttribute('style', style);
  }
  appendChildren(element, document, node.content);
  return element;
}

function renderOrderedList(document: Document, node: ContentNode): HTMLElement {
  const element = renderElement(document, 'ol', node, listIndentStyle(node.attrs));
  const start = listStart(node.attrs);
  if (start) {
    element.setAttribute('start', start);
  }
  return element;
}

function renderCodeBlock(document: Document, node: ContentNode): HTMLElement {
  const pre = document.createElement('pre');
  const code = document.createElement('code');
  const language = languageClass(node.attrs);
  if (language) {
    code.className = language;
  }
  appendChildren(code, document, node.content);
  pre.append(code);
  return pre;
}

function renderText(document: Document, node: ContentNode): Node | null {
  if (typeof node.text !== 'string' || node.text.length === 0) {
    return null;
  }
  let current: Node = document.createTextNode(node.text);
  const marks = Array.isArray(node.marks) ? node.marks : [];
  for (let index = marks.length - 1; index >= 0; index -= 1) {
    const mark = marks[index];
    if (!isMark(mark)) {
      continue;
    }
    const wrapped = renderMark(document, mark, current);
    if (wrapped) {
      current = wrapped;
    }
  }
  return current;
}

function renderMark(document: Document, mark: ContentMark, inner: Node): HTMLElement | null {
  switch (mark.type) {
    case 'bold':
      return wrap(document, 'strong', inner);
    case 'italic':
      return wrap(document, 'em', inner);
    case 'strike':
      return wrap(document, 's', inner);
    case 'underline':
      return wrap(document, 'u', inner);
    case 'code':
      return wrap(document, 'code', inner);
    case 'link':
      return renderLink(document, mark, inner);
    case 'textStyle':
      return renderTextStyle(document, mark, inner);
    default:
      return null;
  }
}

function renderTextStyle(document: Document, mark: ContentMark, inner: Node): HTMLElement | null {
  const family = contentFontFamily(mark.attrs?.['fontFamily']);
  const size = contentFontSize(mark.attrs?.['fontSize']);
  const declarations: string[] = [];
  if (family) {
    declarations.push(`font-family: ${family}`);
  }
  if (size) {
    declarations.push(`font-size: ${size}`);
  }
  if (declarations.length === 0) {
    return null;
  }
  const span = document.createElement('span');
  span.setAttribute('style', declarations.join('; '));
  span.append(inner);
  return span;
}

function renderLink(document: Document, mark: ContentMark, inner: Node): HTMLAnchorElement | null {
  const href = linkHref(mark.attrs?.['href']);
  if (!href) {
    return null;
  }
  const anchor = document.createElement('a');
  anchor.setAttribute('href', href);
  anchor.setAttribute('target', '_blank');
  anchor.setAttribute('rel', 'noopener noreferrer');
  anchor.append(inner);
  return anchor;
}

function wrap(document: Document, tag: string, inner: Node): HTMLElement {
  const element = document.createElement(tag);
  element.append(inner);
  return element;
}

function textAlignStyle(attrs: Record<string, unknown> | undefined): string | null {
  const value = attrs?.['textAlign'];
  if (value === 'left' || value === 'center' || value === 'right' || value === 'justify') {
    return `text-align: ${value}`;
  }
  return null;
}

function listIndentStyle(attrs: Record<string, unknown> | undefined): string | null {
  const indent = Number(attrs?.['indent'] ?? 0);
  if (!Number.isFinite(indent) || indent <= 0) {
    return null;
  }
  return `margin-left: ${Math.min(maxListIndent, indent) * 1.5}rem`;
}

function listStart(attrs: Record<string, unknown> | undefined): string | null {
  const start = attrs?.['start'];
  if (typeof start !== 'number' || !Number.isInteger(start) || start === 1) {
    return null;
  }
  return String(start);
}

function languageClass(attrs: Record<string, unknown> | undefined): string | null {
  const language = attrs?.['language'];
  if (typeof language !== 'string' || !/^[A-Za-z0-9_-]+$/.test(language)) {
    return null;
  }
  return `language-${language}`;
}

function headingTag(attrs: Record<string, unknown> | undefined): 'h2' | 'h3' | null {
  const level = attrs?.['level'];
  if (level === 2) {
    return 'h2';
  }
  if (level === 3) {
    return 'h3';
  }
  return null;
}

function linkHref(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }
    return url.href;
  } catch {
    return null;
  }
}

function isContentNode(value: unknown): value is ContentNode {
  return typeof value === 'object' && value !== null && typeof (value as ContentNode).type === 'string';
}

function isMark(value: unknown): value is ContentMark {
  return typeof value === 'object' && value !== null && typeof (value as ContentMark).type === 'string';
}
