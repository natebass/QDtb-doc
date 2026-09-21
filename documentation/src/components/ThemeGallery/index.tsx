import { useId, useState, type ReactNode } from "react";

import highlights from "@site/src/data/theme-highlights.json";
import styles from "./styles.module.css";

/**
 * Previews every colour scheme in `QDtb/colors`.
 *
 * The colours come from `src/data/theme-highlights.json`, which is dumped out
 * of a real Neovim by `scripts/dump-theme-highlights.lua`. They are not the hex
 * values written in the scheme files: `mini.hues` treats those as reference
 * colours and adjusts them, so reading the source would show something the
 * editor never renders.
 */

type Attrs = {
  fg?: string;
  bg?: string;
  bold?: boolean;
  italic?: boolean;
  reverse?: boolean;
  underline?: boolean;
};

type Scheme = Record<string, Attrs>;
type Background = "dark" | "light";

const data = highlights as Record<string, Record<Background, Scheme>>;

export interface ThemeMeta {
  /** File basename, and the key into the dumped data. */
  name: string;
  title: string;
  tagline: string;
  /** Shown as a chip: how the palette is built. */
  technique: string;
  /** Set when the scheme ignores `'background'` and only ships one variant. */
  darkOnly?: boolean;
  /** Set when `Normal` declares no background, i.e. the terminal shows through. */
  transparent?: boolean;
}

// ── Token model ──────────────────────────────────────────────────────────────

/**
 * The sample buffer, tokenised by hand.
 *
 * Hand-tokenising rather than regex-highlighting means each span maps to the
 * tree-sitter capture a real buffer would get, so the preview shows the groups
 * the scheme actually defines instead of an approximation of them.
 */
type Token = [text: string, group: string];

const SAMPLE: Token[][] = [
  [["--- Window title, from the active buffer.", "@comment"]],
  [
    ["local", "@keyword"],
    [" M ", "@variable"],
    ["=", "@punctuation.delimiter"],
    [" {}", "@punctuation.delimiter"],
  ],
  [],
  [
    ["function", "@keyword"],
    [" ", "@variable"],
    ["M.set_title", "@function"],
    ["(", "@punctuation.delimiter"],
    ["name", "@variable"],
    [")", "@punctuation.delimiter"],
  ],
  [
    ["  local", "@keyword"],
    [" project ", "@variable"],
    ["=", "@punctuation.delimiter"],
    [" vim.fn.", "@variable"],
    ["fnamemodify", "@function"],
    ["(", "@punctuation.delimiter"],
    ['"~"', "@string"],
    [", ", "@punctuation.delimiter"],
    ['":t"', "@string"],
    [")", "@punctuation.delimiter"],
  ],
  [
    ["  if", "@keyword"],
    [" name ", "@variable"],
    ["~=", "@punctuation.delimiter"],
    [" ", "@variable"],
    ['""', "@string"],
    [" then", "@keyword"],
  ],
  [
    ["    return", "@keyword.return"],
    [" name ", "@variable"],
    ["..", "@punctuation.delimiter"],
    [' " — " ', "@string"],
    ["..", "@punctuation.delimiter"],
    [" project", "@variable"],
  ],
  [["  end", "@keyword"]],
  [
    ["  return", "@keyword.return"],
    [" ", "@variable"],
    ["project", "@variable"],
  ],
  [["end", "@keyword"]],
  [],
  [
    ["M.timeout", "@field"],
    [" = ", "@punctuation.delimiter"],
    ["300", "@constant"],
  ],
  [
    ["return", "@keyword.return"],
    [" M", "@variable"],
  ],
];

/** Which line gets the `CursorLine` background, 0-based. */
const CURSOR_LINE = 6;
/** Which line gets a `Visual` selection, and over which characters. */
const VISUAL_LINE = 11;

// ── Lookup ───────────────────────────────────────────────────────────────────

/**
 * Resolve a group to the attributes the scheme gives it.
 *
 * Tree-sitter captures fall back to their legacy group and then to `Normal`,
 * which is how Neovim resolves them too: a scheme that defines only `Keyword`
 * still colours `@keyword`.
 */
const FALLBACKS: Record<string, string[]> = {
  "@comment": ["Comment"],
  "@keyword": ["Keyword", "Statement"],
  "@keyword.return": ["@keyword", "Keyword", "Statement"],
  "@function": ["Function", "Identifier"],
  "@string": ["String", "Constant"],
  "@variable": ["Identifier"],
  "@constant": ["Constant", "Number"],
  "@field": ["Identifier"],
  "@type": ["Type"],
  "@punctuation.delimiter": ["Special"],
};

function attrs(scheme: Scheme, group: string): Attrs {
  const chain = [group, ...(FALLBACKS[group] ?? [])];
  for (const candidate of chain) {
    const found = scheme[candidate];
    if (found && (found.fg || found.bg)) return found;
  }
  return {};
}

/** The scheme's editor background, with a stand-in for a transparent one. */
function surface(scheme: Scheme, background: Background): string {
  return scheme.Normal?.bg ?? (background === "dark" ? "#1c1c1c" : "#f4f4f4");
}

function tokenStyle(scheme: Scheme, group: string, fallbackFg: string) {
  const a = attrs(scheme, group);
  return {
    color: a.fg ?? fallbackFg,
    backgroundColor: a.bg,
    fontWeight: a.bold ? 700 : undefined,
    fontStyle: a.italic ? "italic" : undefined,
    textDecoration: a.underline ? "underline" : undefined,
  };
}

// ── Pieces ───────────────────────────────────────────────────────────────────

function Buffer({
  scheme,
  background,
}: {
  scheme: Scheme;
  background: Background;
}) {
  const bg = surface(scheme, background);
  const fg = scheme.Normal?.fg ?? (background === "dark" ? "#e0e0e0" : "#202020");
  const cursorLine = scheme.CursorLine?.bg;
  const visual = scheme.Visual?.bg;
  const lineNr = scheme.LineNr?.fg ?? fg;
  const cursorLineNr = scheme.CursorLineNr?.fg ?? lineNr;
  const status = scheme.StatusLine ?? {};

  return (
    <div className={styles.buffer} style={{ background: bg, color: fg }}>
      <pre className={styles.code}>
        <code>
          {SAMPLE.map((tokens, index) => {
            const onCursor = index === CURSOR_LINE;
            const selected = index === VISUAL_LINE;
            return (
              <span
                key={index}
                className={styles.line}
                style={{
                  background: onCursor ? cursorLine : undefined,
                }}
              >
                <span
                  className={styles.gutter}
                  style={{ color: onCursor ? cursorLineNr : lineNr }}
                >
                  {index + 1}
                </span>
                <span
                  style={{
                    background: selected ? visual : undefined,
                    color: selected ? scheme.Visual?.fg : undefined,
                  }}
                >
                  {tokens.length === 0
                    ? " "
                    : tokens.map(([text, group], slot) => (
                        <span key={slot} style={tokenStyle(scheme, group, fg)}>
                          {text}
                        </span>
                      ))}
                </span>
              </span>
            );
          })}
        </code>
      </pre>
      <div
        className={styles.status}
        style={{
          background: status.bg ?? bg,
          color: status.fg ?? fg,
          fontWeight: status.bold ? 700 : undefined,
        }}
      >
        <span>NORMAL</span>
        <span>window_title.lua</span>
        <span>7:11</span>
      </div>
    </div>
  );
}

/** The groups worth showing as swatches, in the order they read best. */
const SWATCHES: [group: string, label: string][] = [
  ["Normal", "bg"],
  ["@keyword", "keyword"],
  ["@function", "function"],
  ["@string", "string"],
  ["@constant", "number"],
  ["@comment", "comment"],
  ["DiagnosticError", "error"],
  ["DiagnosticWarn", "warn"],
  ["DiagnosticInfo", "info"],
  ["DiffAdd", "add"],
  ["DiffChange", "change"],
  ["DiffDelete", "delete"],
];

function Swatches({
  scheme,
  background,
}: {
  scheme: Scheme;
  background: Background;
}) {
  return (
    <ul className={styles.swatches}>
      {SWATCHES.map(([group, label]) => {
        const a = attrs(scheme, group);
        const colour =
          group === "Normal" ? surface(scheme, background) : (a.bg ?? a.fg);
        if (!colour) return null;
        return (
          <li key={group} className={styles.swatch}>
            <span
              className={styles.chip}
              style={{ background: colour }}
              aria-hidden="true"
            />
            <span className={styles.swatchLabel}>{label}</span>
            <code className={styles.swatchHex}>{colour}</code>
          </li>
        );
      })}
    </ul>
  );
}

function ThemeCard({
  meta,
  background,
}: {
  meta: ThemeMeta;
  background: Background;
}) {
  const scheme = data[meta.name]?.[meta.darkOnly ? "dark" : background];
  if (!scheme) return null;

  return (
    <article className={styles.card} id={meta.name}>
      <header className={styles.cardHeader}>
        <div>
          <h3 className={styles.cardTitle}>{meta.title}</h3>
          <p className={styles.cardTagline}>{meta.tagline}</p>
        </div>
        <div className={styles.chips}>
          <span className={styles.badge}>{meta.technique}</span>
          {meta.darkOnly && <span className={styles.badgeMuted}>dark only</span>}
          {meta.transparent && (
            <span className={styles.badgeMuted}>transparent bg</span>
          )}
        </div>
      </header>
      <Buffer
        scheme={scheme}
        background={meta.darkOnly ? "dark" : background}
      />
      <Swatches
        scheme={scheme}
        background={meta.darkOnly ? "dark" : background}
      />
      <footer className={styles.cardFooter}>
        <code>:colorscheme {meta.name}</code>
        <a
          href={`https://github.com/natebass/QDtb/blob/master/colors/${meta.name}.lua`}
        >
          colors/{meta.name}.lua
        </a>
      </footer>
    </article>
  );
}

// ── Gallery ──────────────────────────────────────────────────────────────────

export default function ThemeGallery({
  themes,
  children,
}: {
  themes: ThemeMeta[];
  children?: ReactNode;
}) {
  const [background, setBackground] = useState<Background>("dark");
  const groupId = useId();

  return (
    <section className={styles.gallery}>
      <div className={styles.toolbar} role="group" aria-labelledby={groupId}>
        <span id={groupId} className={styles.toolbarLabel}>
          <code>&apos;background&apos;</code>
        </span>
        {(["dark", "light"] as const).map((value) => (
          <button
            key={value}
            type="button"
            className={styles.toggle}
            aria-pressed={background === value}
            onClick={() => setBackground(value)}
          >
            {value}
          </button>
        ))}
      </div>
      {children}
      <div className={styles.grid}>
        {themes.map((meta) => (
          <ThemeCard key={meta.name} meta={meta} background={background} />
        ))}
      </div>
    </section>
  );
}
