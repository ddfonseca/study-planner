import { useRef, useEffect } from "react";
import { EditorState, Compartment, type Extension } from "@codemirror/state";
import { EditorView, keymap, placeholder as cmPlaceholder } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { markdownDecorations } from "@/lib/codemirror/markdown-decorations";
import { paragraphBlocks } from "@/lib/codemirror/paragraph-blocks";
import { taskCheckboxes } from "@/lib/codemirror/task-checkboxes";
import { cn } from "@/lib/utils";

interface CodeMirrorEditorProps {
  docId: string;
  initialDoc: string;
  onChange: (content: string) => void;
  vimMode?: boolean;
  placeholder?: string;
  className?: string;
}

const vimCompartment = new Compartment();

// Serif stack for scratchpad editor only (rest of UI keeps Manrope)
const scratchpadFont = 'Lora, ui-serif, Georgia, Cambria, "Times New Roman", serif';

const editorTheme = EditorView.theme({
  "&": {
    backgroundColor: "transparent",
    color: "var(--foreground)",
    fontFamily: scratchpadFont,
    height: "100%",
  },
  "&.cm-focused": {
    outline: "none",
  },
  ".cm-scroller": {
    overflow: "auto",
    fontFamily: scratchpadFont,
    fontSize: "15px",
    lineHeight: "1.5",
  },
  ".cm-content": {
    caretColor: "var(--accent)",
    padding: "8px 12px",
  },
  ".cm-cursor, .cm-dropCursor": {
    borderLeftColor: "var(--accent)",
    borderLeftWidth: "2px",
  },
  ".cm-gutters": {
    display: "none",
  },
  ".cm-activeLine": {
    backgroundColor: "color-mix(in srgb, var(--muted) 40%, transparent)",
  },
  ".cm-selectionBackground, ::selection": {
    backgroundColor: "color-mix(in srgb, var(--accent) 20%, transparent) !important",
  },
  ".cm-placeholder": {
    color: "var(--muted-foreground)",
    fontStyle: "italic",
  },

  // Markdown decoration styles
  ".cm-h1": {
    fontSize: "1.75em",
    fontWeight: "700",
    lineHeight: "1.3",
  },
  ".cm-h2": {
    fontSize: "1.5em",
    fontWeight: "700",
    lineHeight: "1.3",
  },
  ".cm-h3": {
    fontSize: "1.25em",
    fontWeight: "600",
    lineHeight: "1.3",
  },
  ".cm-header-mark": {
    opacity: "0.4",
    color: "var(--muted-foreground)",
  },
  ".cm-bold": {
    fontWeight: "700",
  },
  ".cm-italic": {
    fontStyle: "italic",
  },
  ".cm-emphasis-mark": {
    opacity: "0.4",
  },
  ".cm-blockquote": {
    borderLeft: "3px solid var(--accent)",
    paddingLeft: "12px",
  },
  ".cm-quote-mark": {
    opacity: "0.4",
  },
  ".cm-inline-code": {
    backgroundColor: "var(--muted)",
    padding: "1px 4px",
    borderRadius: "3px",
    fontSize: "0.9em",
  },
  ".cm-code-mark": {
    opacity: "0.4",
  },
  ".cm-list-mark": {
    color: "var(--accent)",
    fontWeight: "700",
  },

  // Task checkbox styles
  ".cm-task-checkbox": {
    appearance: "none",
    width: "14px",
    height: "14px",
    border: "2px solid var(--muted-foreground)",
    borderRadius: "3px",
    verticalAlign: "middle",
    marginRight: "6px",
    cursor: "pointer",
    position: "relative",
    top: "-1px",
    transition: "all 0.15s ease",
  },
  ".cm-task-checkbox:checked": {
    backgroundColor: "var(--accent)",
    borderColor: "var(--accent)",
  },
  ".cm-task-checkbox:hover": {
    borderColor: "var(--accent)",
  },
  ".cm-task-checked": {
    cursor: "pointer",
    userSelect: "none",
  },

  // Paragraph block styles (TaskTXT)
  ".cm-paragraph-title": {
    color: "var(--foreground)",
  },
  ".cm-paragraph-body": {
    paddingLeft: "16px",
    color: "color-mix(in srgb, var(--foreground) 75%, transparent)",
  },

  // Vim panel styling
  ".cm-vim-panel": {
    backgroundColor: "var(--muted)",
    color: "var(--foreground)",
    padding: "2px 8px",
    fontFamily: '"Fira Code", monospace',
    fontSize: "12px",
    borderTop: "1px solid var(--border)",
  },
  ".cm-vim-panel input": {
    backgroundColor: "transparent",
    color: "var(--foreground)",
    outline: "none",
    fontFamily: '"Fira Code", monospace',
    fontSize: "12px",
  },
});

export function CodeMirrorEditor({
  docId,
  initialDoc,
  onChange,
  vimMode = false,
  placeholder = "",
  className,
}: CodeMirrorEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);

  // Keep onChange ref current without recreating editor
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Create/recreate editor when docId changes
  useEffect(() => {
    if (!containerRef.current) return;

    // Destroy previous instance
    viewRef.current?.destroy();

    // Dynamically import vim to avoid SSR issues
    const loadExtensions = async () => {
      const extensions = [
        editorTheme,
        markdown({ codeLanguages: languages }),
        markdownDecorations,
        paragraphBlocks,
        taskCheckboxes,
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
      ];

      if (placeholder) {
        extensions.push(cmPlaceholder(placeholder));
      }

      // Load vim if needed
      let vimExt: Extension[] = [];
      let VimApi: Awaited<ReturnType<typeof import("@replit/codemirror-vim")>>["Vim"] | null = null;
      if (vimMode) {
        try {
          const { vim, Vim } = await import("@replit/codemirror-vim");
          vimExt = [vim()];
          VimApi = Vim;
        } catch {
          // vim extension failed to load, continue without it
        }
      }

      extensions.push(vimCompartment.of(vimExt));

      const state = EditorState.create({
        doc: initialDoc,
        extensions,
      });

      const view = new EditorView({
        state,
        parent: containerRef.current!,
      });

      // Configure vim mappings after editor is created
      if (VimApi) {
        VimApi.map("jk", "<Esc>", "insert");
      }

      viewRef.current = view;
    };

    loadExtensions();

    return () => {
      viewRef.current?.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId]);

  // Toggle vim mode without recreating editor
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const reconfigure = async () => {
      let vimExt: Extension[] = [];
      if (vimMode) {
        try {
          const { vim, Vim } = await import("@replit/codemirror-vim");
          vimExt = [vim()];
          Vim.map("jk", "<Esc>", "insert");
        } catch {
          // vim extension failed to load
        }
      }
      // Check view is still alive
      if (viewRef.current === view) {
        view.dispatch({
          effects: vimCompartment.reconfigure(vimExt),
        });
      }
    };

    reconfigure();
  }, [vimMode]);

  return (
    <div
      ref={containerRef}
      className={cn("rounded-[var(--radius)] border border-input bg-transparent overflow-hidden", className)}
    />
  );
}
