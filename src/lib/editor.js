// Minimal CodeMirror 6 editor, themed to Covely's calm palette via CSS vars so
// it follows the dawn/day/dusk/night phases automatically. No line numbers,
// gutters, or toolbars — it stays a quiet writing surface for fleeting ideas.

import { EditorView, keymap, placeholder, drawSelection } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { syntaxHighlighting, HighlightStyle } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

// Markdown token styling — colors reference the phase-driven CSS variables.
const mdHighlight = HighlightStyle.define([
  { tag: t.heading, color: "var(--fg)", fontWeight: "500" },
  { tag: t.strong, fontWeight: "600" },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.link, color: "var(--accent)" },
  { tag: t.url, color: "var(--muted)" },
  { tag: t.monospace, color: "var(--accent)", fontFamily: MONO },
  { tag: t.quote, color: "var(--muted)", fontStyle: "italic" },
  { tag: [t.list, t.meta, t.processingInstruction], color: "var(--muted)" },
  { tag: t.strikethrough, textDecoration: "line-through" },
]);

const calmTheme = EditorView.theme(
  {
    "&": { color: "var(--fg)", backgroundColor: "transparent", fontSize: "15px" },
    "&.cm-focused": { outline: "none" },
    ".cm-content": {
      fontFamily: "inherit",
      lineHeight: "1.7",
      padding: "18px 22px",
      minHeight: "120px",
      caretColor: "var(--accent)",
    },
    ".cm-scroller": { fontFamily: "inherit", overflow: "auto", maxHeight: "360px" },
    ".cm-line": { padding: "0" },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--accent)" },
    ".cm-placeholder": { color: "var(--muted)" },
    "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
      { backgroundColor: "color-mix(in srgb, var(--accent) 22%, transparent)" },
    ".cm-activeLine": { backgroundColor: "transparent" },
  },
  { dark: false },
);

/**
 * @param {{ parent: HTMLElement, doc?: string, placeholder?: string,
 *           ariaLabel?: string, onChange?: (value: string) => void }} opts
 * @returns {EditorView}
 */
export function createEditor(opts) {
  const state = EditorState.create({
    doc: opts.doc ?? "",
    extensions: [
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
      markdown(),
      syntaxHighlighting(mdHighlight),
      EditorView.lineWrapping,
      drawSelection(),
      placeholder(opts.placeholder ?? ""),
      calmTheme,
      EditorView.contentAttributes.of({ "aria-label": opts.ariaLabel ?? "" }),
      EditorView.updateListener.of((u) => {
        if (u.docChanged) opts.onChange?.(u.state.doc.toString());
      }),
    ],
  });
  return new EditorView({ state, parent: opts.parent });
}
