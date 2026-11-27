import { Editor, Extension, type Extensions } from '@tiptap/core';
import { BulletList, OrderedList } from '@tiptap/extension-list';
import { Placeholder } from '@tiptap/extension-placeholder';
import { TextAlign } from '@tiptap/extension-text-align';
import { FontFamily, FontSize, TextStyle } from '@tiptap/extension-text-style';
import { StarterKit } from '@tiptap/starter-kit';

const MAX_LIST_LEVEL = 3;

export function contentExtensions(): Extensions {
  return [
    StarterKit.configure({
      heading: { levels: [2, 3] },
      bulletList: false,
      orderedList: false,
      dropcursor: { color: 'var(--ink)', width: 1 },
      link: {
        openOnClick: false,
        autolink: false,
        linkOnPaste: false,
        enableClickSelection: true,
        defaultProtocol: 'https',
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      },
    }),
    TextStyle,
    FontFamily,
    FontSize,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    IndentedBulletList,
    IndentedOrderedList,
    ListTab,
    Placeholder.configure({
      placeholder: ({ editor }) => (editor.isEmpty ? 'Nhập nội dung' : ''),
      showOnlyCurrent: false,
    }),
  ];
}

const IndentedBulletList = BulletList.extend({
  addAttributes() {
    return {
      ...(this.parent?.() ?? {}),
      ...listIndentAttribute(),
    };
  },
});

const IndentedOrderedList = OrderedList.extend({
  addAttributes() {
    return {
      ...(this.parent?.() ?? {}),
      ...listIndentAttribute(),
    };
  },
});

const ListTab = Extension.create({
  name: 'listTab',
  priority: 1000,
  addKeyboardShortcuts() {
    return {
      Tab: () => indentList(this.editor, 1),
      'Shift-Tab': () => indentList(this.editor, -1),
    };
  },
});

function listIndentAttribute() {
  return {
    indent: {
      default: 0,
      parseHTML: (element: HTMLElement) => {
        const rem = Number.parseFloat(element.style.marginLeft);
        if (!Number.isFinite(rem) || rem <= 0) {
          return 0;
        }
        return Math.min(MAX_LIST_LEVEL - 1, Math.round(rem / 1.5));
      },
      renderHTML: (attributes: { indent?: number }) => {
        const indent = Math.min(MAX_LIST_LEVEL - 1, Number(attributes.indent ?? 0));
        if (!indent) {
          return {};
        }
        return { style: `margin-left: ${indent * 1.5}rem` };
      },
    },
  };
}

function listLevel(editor: Editor): number {
  const { $from } = editor.state.selection;
  let level = 0;
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    const node = $from.node(depth);
    if (node.type.name === 'bulletList' || node.type.name === 'orderedList') {
      level += 1 + Number(node.attrs['indent'] ?? 0);
    }
  }
  return level;
}

function indentList(editor: Editor, delta: number): boolean {
  if (!editor.isEditable || !editor.isActive('listItem')) {
    return false;
  }
  if (delta > 0 && listLevel(editor) >= MAX_LIST_LEVEL) {
    return true;
  }
  if (delta > 0 && editor.commands.sinkListItem('listItem')) {
    return true;
  }
  if (delta < 0 && editor.commands.liftListItem('listItem')) {
    return true;
  }
  const { $from } = editor.state.selection;
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    const node = $from.node(depth);
    if (node.type.name !== 'bulletList' && node.type.name !== 'orderedList') {
      continue;
    }
    const current = Number(node.attrs['indent'] ?? 0);
    const next = delta > 0 ? current + 1 : Math.max(0, current - 1);
    if (next === current) {
      return true;
    }
    const position = $from.before(depth);
    return editor.commands.command(({ tr }) => {
      tr.setNodeMarkup(position, undefined, { ...node.attrs, indent: next });
      return true;
    });
  }
  return true;
}
