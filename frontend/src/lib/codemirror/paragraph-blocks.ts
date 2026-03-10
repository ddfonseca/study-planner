import {
  ViewPlugin,
  Decoration,
  type DecorationSet,
  type EditorView,
  type ViewUpdate,
} from '@codemirror/view';
import type { Range } from '@codemirror/state';

const titleDeco = Decoration.line({ class: 'cm-paragraph-title' });
const bodyDeco = Decoration.line({ class: 'cm-paragraph-body' });

function isBlankLine(view: EditorView, lineNumber: number): boolean {
  const line = view.state.doc.line(lineNumber);
  return line.text.trim().length === 0;
}

function buildDecorations(view: EditorView): DecorationSet {
  const doc = view.state.doc;
  if (doc.lines === 1 && doc.line(1).text.trim().length === 0) {
    return Decoration.set([]);
  }

  const decorations: Range<Decoration>[] = [];

  for (const { from, to } of view.visibleRanges) {
    const startLine = doc.lineAt(from).number;
    const endLine = doc.lineAt(to).number;

    // Determine if the first visible line starts a new paragraph
    // by checking if the previous line is blank or it's the first line
    let isNewParagraph =
      startLine === 1 || isBlankLine(view, startLine - 1);

    for (let i = startLine; i <= endLine; i++) {
      const line = doc.line(i);
      const blank = line.text.trim().length === 0;

      if (blank) {
        isNewParagraph = true;
        continue;
      }

      if (isNewParagraph) {
        decorations.push(titleDeco.range(line.from));
        isNewParagraph = false;
      } else {
        decorations.push(bodyDeco.range(line.from));
      }
    }
  }

  return Decoration.set(decorations);
}

export const paragraphBlocks = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = buildDecorations(update.view);
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);
