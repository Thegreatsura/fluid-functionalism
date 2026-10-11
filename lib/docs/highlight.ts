import { createHighlighter, type Highlighter } from "shiki/bundle/web";

let highlighter: Highlighter | null = null;
let loading: Promise<Highlighter> | null = null;

async function getHighlighter(): Promise<Highlighter> {
  if (highlighter) return highlighter;
  if (!loading) {
    loading = createHighlighter({
      themes: ["github-dark", "github-light"],
      langs: ["tsx"],
    }).then((h) => {
      highlighter = h;
      return h;
    });
  }
  return loading;
}

export async function highlight(code: string): Promise<string> {
  const h = await getHighlighter();
  return h.codeToHtml(code.trim(), {
    lang: "tsx",
    themes: { dark: "github-dark", light: "github-light" },
    defaultColor: false,
  });
}

/** A ```diff block, highlighted as TSX: each line keeps its syntax colors and
 *  gets `diff add` / `diff remove` from its `+` / `-` marker, which the page
 *  turns into a tinted line with the marker in a gutter. */
export async function highlightDiff(diff: string): Promise<string> {
  const h = await getHighlighter();
  const lines = diff.replace(/\n+$/, "").split("\n");
  const marks = lines.map((line) => (line.startsWith("+") ? "add" : line.startsWith("-") ? "remove" : null));
  const code = lines.map((line) => (/^[+\- ]/.test(line) ? line.slice(1) : line)).join("\n");
  return h.codeToHtml(code, {
    lang: "tsx",
    themes: { dark: "github-dark", light: "github-light" },
    defaultColor: false,
    transformers: [
      {
        line(node, line) {
          const mark = marks[line - 1];
          if (mark) this.addClassToHast(node, ["diff", mark]);
        },
      },
    ],
  });
}
