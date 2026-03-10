import {
  ViewPlugin,
  Decoration,
  type DecorationSet,
  type EditorView,
  type ViewUpdate,
} from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';

const decorationClasses: Record<string, string> = {
  'ATXHeading1': 'cm-h1',
  'ATXHeading2': 'cm-h2',
  'ATXHeading3': 'cm-h3',
  'HeaderMark': 'cm-header-mark',
  'StrongEmphasis': 'cm-bold',
  'Emphasis': 'cm-italic',
  'EmphasisMark': 'cm-emphasis-mark',
  'Blockquote': 'cm-blockquote',
  'QuoteMark': 'cm-quote-mark',
  'InlineCode': 'cm-inline-code',
  'CodeMark': 'cm-code-mark',
  'ListMark': 'cm-list-mark',
};

// Heading nodes that need their content (not the mark) decorated
const headingNodes = new Set(['ATXHeading1', 'ATXHeading2', 'ATXHeading3']);

function buildDecorations(view: EditorView): DecorationSet {
  const decorations: { from: number; to: number; decoration: Decoration }[] = [];

  for (const { from, to } of view.visibleRanges) {
    syntaxTree(view.state).iterate({
      from,
      to,
      enter(node) {
        const cls = decorationClasses[node.name];
        if (!cls) return;

        if (headingNodes.has(node.name)) {
          // For headings, decorate the full line range
          decorations.push({
            from: node.from,
            to: node.to,
            decoration: Decoration.mark({ class: cls }),
          });
        } else {
          decorations.push({
            from: node.from,
            to: node.to,
            decoration: Decoration.mark({ class: cls }),
          });
        }
      },
    });
  }

  // Sort by from position (required by RangeSet)
  decorations.sort((a, b) => a.from - b.from || a.to - b.to);

  return Decoration.set(
    decorations.map((d) => d.decoration.range(d.from, d.to))
  );
}

export const markdownDecorations = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged || update.selectionSet) {
        this.decorations = buildDecorations(update.view);
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);
