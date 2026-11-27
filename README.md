# @rve/tiptap

Shared TipTap document reader for admin-web and public-web. The read path turns TipTap JSON into static HTML. It does not create an editor.

The composing schema stays in this package for admin-web. Import it from `@rve/tiptap/editor`. `@tiptap/*` packages are dependencies of admin-web at `^3.35.0`, so the editor and the schema use one copy.

## Consumers

admin-web and public-web install this package from GitHub:

```json
"@rve/tiptap": "github:review-everything/rve-tiptap#develop"
```

`dist` is not in git. Installing the package runs `prepare`, which compiles `src` to `dist`.

Each app's lockfile pins that commit. After a new commit lands on `develop`, run `npm update @rve/tiptap` in each app to fetch it and build again.

## Develop

In this folder:

```bash
npm install
npm run build
```

`npm install` also runs `prepare`. Run `npm run build` again after changing source.

## Read

```ts
import { mountReadOnlyContent, readContent } from '@rve/tiptap';
import '@rve/tiptap/styles/content.css';
```

- `readContent` parses a JSON string and returns a document, or `null` when the value is not a TipTap doc.
- `mountReadOnlyContent` writes static HTML into an element and adds the class `rve-content`. Call `destroy()` when the view goes away.
- Links render only for `http` and `https` URLs, and open in a new tab.

The prose styles apply to `.rve-content`.

## Edit

admin-web imports the editor from the subpath:

```ts
import { Editor, contentExtensions } from '@rve/tiptap/editor';
```

`contentExtensions()` is the composing schema. It includes the placeholder "Nhập nội dung". List indent stops at 3 levels. Tab and Shift-Tab change the indent while editing.

Font family and font size are optional `textStyle` marks. `contentFonts` and `contentFontSizes`, exported from `@rve/tiptap/editor`, are the only values the read path writes. Unmarked text uses Roboto at 16px from `content.css`.

## Not implemented

`src/extensions/review-box.ts` is reserved for a custom review box node. It is not registered.
