---
name: rve-tiptap
description: Change the @rve/tiptap library. Static HTML renderer for TipTap JSON, editor schema for admin-web, packed by prepare and installed from GitHub. Use when editing rve-tiptap, readContent, mountReadOnlyContent, contentExtensions, or when the user mentions dist, develop, or npm update @rve/tiptap.
---

# rve-tiptap

Read `.cursor/rules/rve-tiptap.mdc` before editing.

## Where code goes

- `src/renderer/`: parse JSON and build DOM. Do not import `@tiptap/*`.
- `src/index.ts`: export only the read functions.
- `src/editor.ts`: export `Editor` and `contentExtensions`. Side-effect import the extensions so admin-web sees the editor commands.
- `src/extensions/`: composing schema. Lists stop at 3 levels.
- `src/styles/content.css`: styles for `.rve-content` and for the composing form's `.ProseMirror`.

## When adding a node or mark

Add it to the editor schema and the renderer together. For an unknown node, drop the tag and keep the text inside. Do not assemble HTML from the article text.

## Shipping to both apps

Do not commit `dist`. Push source to `develop`.

Each app's lockfile pins that commit. After a new commit lands on `develop`, run `npm update @rve/tiptap` in each app to fetch it and build again.

admin-web keeps its own `@tiptap/*` dependencies. public-web installs only `@rve/tiptap`.
