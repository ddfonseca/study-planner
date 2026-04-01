import {
  ViewPlugin,
  Decoration,
  WidgetType,
  type DecorationSet,
  type EditorView,
  type ViewUpdate,
} from "@codemirror/view";
import type { Range } from "@codemirror/state";

// Matches [ ] or [x]/[X] at the start of a line, optionally preceded by - or *
const taskPattern = /^(\s*(?:[-*]\s+)?)\[([ xX])\]/;

// Matches the completion timestamp appended at end of line: ✓ MM/DD/YYYY at HH:MM
const timestampPattern = / ✓ \d{2}\/\d{2}\/\d{4} at \d{2}:\d{2}$/;

function formatTimestamp(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return ` ✓ ${mm}/${dd}/${yyyy} at ${hh}:${min}`;
}

class CheckboxWidget extends WidgetType {
  constructor(
    private checked: boolean,
    private pos: number,
    private bracketLen: number,
  ) {
    super();
  }

  eq(other: CheckboxWidget) {
    return this.checked === other.checked && this.pos === other.pos;
  }

  toDOM(view: EditorView) {
    const runToggle = () => {
      const line = view.state.doc.lineAt(this.pos);
      const changes: { from: number; to: number; insert: string }[] = [];

      if (this.checked) {
        // Unchecking: [x] → [ ] and remove timestamp
        changes.push({ from: this.pos, to: this.pos + this.bracketLen, insert: "[ ]" });
        const tsMatch = timestampPattern.exec(line.text);
        if (tsMatch) {
          const tsStart = line.from + tsMatch.index;
          changes.push({ from: tsStart, to: line.to, insert: "" });
        }
      } else {
        // Checking: [ ] → [x] and append timestamp
        changes.push({ from: this.pos, to: this.pos + this.bracketLen, insert: "[x]" });
        changes.push({ from: line.to, to: line.to, insert: formatTimestamp() });
      }

      view.dispatch({ changes });
    };

    if (this.checked) {
      // Checked: show ✅ [x] (emoji + [x]), clickable to uncheck
      const span = document.createElement("span");
      span.className = "cm-task-checked";
      span.setAttribute("aria-label", "Uncheck task");
      span.textContent = "✅ [x] ";
      span.addEventListener("mousedown", (e) => {
        e.preventDefault();
        runToggle();
      });
      return span;
    }

    // Unchecked: show checkbox for [ ]
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = false;
    input.className = "cm-task-checkbox";
    input.setAttribute("aria-label", "Check task");
    input.addEventListener("mousedown", (e) => {
      e.preventDefault();
      runToggle();
    });
    return input;
  }

  ignoreEvent() {
    return false;
  }
}

function buildDecorations(view: EditorView): DecorationSet {
  const decorations: Range<Decoration>[] = [];
  const doc = view.state.doc;

  for (const { from, to } of view.visibleRanges) {
    const startLine = doc.lineAt(from).number;
    const endLine = doc.lineAt(to).number;

    for (let i = startLine; i <= endLine; i++) {
      const line = doc.line(i);
      const match = taskPattern.exec(line.text);
      if (!match) continue;

      const prefixLen = match[1].length;
      const bracketStart = line.from + prefixLen;
      const bracketEnd = bracketStart + 3; // [x] or [ ]
      const checked = match[2] !== " ";

      const widget = new CheckboxWidget(checked, bracketStart, 3);
      decorations.push(
        Decoration.replace({
          widget,
        }).range(bracketStart, bracketEnd),
      );
    }
  }

  // Line decorations must come before replace decorations at the same pos,
  // so sort by position, then line decos (no to) before replace decos
  decorations.sort((a, b) => a.from - b.from);

  return Decoration.set(decorations, true);
}

export const taskCheckboxes = ViewPlugin.fromClass(
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
  },
);
