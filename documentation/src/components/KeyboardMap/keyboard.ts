/**
 * The keyboard layout, and the translation between Vim's key notation and a
 * position on it.
 *
 * Vim writes a chord as one string — `<C-S-CR>`, `<leader>`, `A`, `|` — and a
 * keyboard has a key plus a set of held modifiers. Everything here is about
 * getting from the first to the second, so a mapping can be shown on the key
 * you would actually press.
 */

export interface KeyDef {
  /** Stable id, also what `Chord.key` holds. */
  id: string;
  /** Legend with no modifier held. */
  label: string;
  /** Legend with Shift held, where it differs. */
  shifted?: string;
  /** Width in key units; 1 unit is one alphanumeric key. */
  width?: number;
  /** A modifier this key toggles, rather than a key a mapping can land on. */
  modifier?: ModifierName;
  /** Present on the keyboard, but nothing can be bound to it here. */
  inert?: boolean;
}

export type ModifierName = "ctrl" | "shift" | "alt" | "meta";

export interface Modifiers {
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
}

export const NO_MODIFIERS: Modifiers = {
  ctrl: false,
  shift: false,
  alt: false,
  meta: false,
};

// ── Layout ───────────────────────────────────────────────────────────────────

/** A 60% ANSI block: what a mapping can realistically assume is present. */
export const ROWS: KeyDef[][] = [
  [
    { id: "backquote", label: "`", shifted: "~" },
    { id: "1", label: "1", shifted: "!" },
    { id: "2", label: "2", shifted: "@" },
    { id: "3", label: "3", shifted: "#" },
    { id: "4", label: "4", shifted: "$" },
    { id: "5", label: "5", shifted: "%" },
    { id: "6", label: "6", shifted: "^" },
    { id: "7", label: "7", shifted: "&" },
    { id: "8", label: "8", shifted: "*" },
    { id: "9", label: "9", shifted: "(" },
    { id: "0", label: "0", shifted: ")" },
    { id: "minus", label: "-", shifted: "_" },
    { id: "equal", label: "=", shifted: "+" },
    { id: "backspace", label: "Bksp", width: 2 },
  ],
  [
    { id: "tab", label: "Tab", width: 1.5 },
    { id: "q", label: "q", shifted: "Q" },
    { id: "w", label: "w", shifted: "W" },
    { id: "e", label: "e", shifted: "E" },
    { id: "r", label: "r", shifted: "R" },
    { id: "t", label: "t", shifted: "T" },
    { id: "y", label: "y", shifted: "Y" },
    { id: "u", label: "u", shifted: "U" },
    { id: "i", label: "i", shifted: "I" },
    { id: "o", label: "o", shifted: "O" },
    { id: "p", label: "p", shifted: "P" },
    { id: "bracketleft", label: "[", shifted: "{" },
    { id: "bracketright", label: "]", shifted: "}" },
    { id: "backslash", label: "\\", shifted: "|", width: 1.5 },
  ],
  [
    { id: "capslock", label: "Caps", width: 1.75, inert: true },
    { id: "a", label: "a", shifted: "A" },
    { id: "s", label: "s", shifted: "S" },
    { id: "d", label: "d", shifted: "D" },
    { id: "f", label: "f", shifted: "F" },
    { id: "g", label: "g", shifted: "G" },
    { id: "h", label: "h", shifted: "H" },
    { id: "j", label: "j", shifted: "J" },
    { id: "k", label: "k", shifted: "K" },
    { id: "l", label: "l", shifted: "L" },
    { id: "semicolon", label: ";", shifted: ":" },
    { id: "apostrophe", label: "'", shifted: '"' },
    { id: "enter", label: "Enter", width: 2.25 },
  ],
  [
    { id: "shift-left", label: "Shift", width: 2.25, modifier: "shift" },
    { id: "z", label: "z", shifted: "Z" },
    { id: "x", label: "x", shifted: "X" },
    { id: "c", label: "c", shifted: "C" },
    { id: "v", label: "v", shifted: "V" },
    { id: "b", label: "b", shifted: "B" },
    { id: "n", label: "n", shifted: "N" },
    { id: "m", label: "m", shifted: "M" },
    { id: "comma", label: ",", shifted: "<" },
    { id: "period", label: ".", shifted: ">" },
    { id: "slash", label: "/", shifted: "?" },
    { id: "shift-right", label: "Shift", width: 2.75, modifier: "shift" },
  ],
  [
    { id: "ctrl-left", label: "Ctrl", width: 1.25, modifier: "ctrl" },
    { id: "meta-left", label: "Super", width: 1.25, modifier: "meta" },
    { id: "alt-left", label: "Alt", width: 1.25, modifier: "alt" },
    { id: "space", label: "Space  ·  <leader>", width: 6.25 },
    { id: "alt-right", label: "Alt", width: 1.25, modifier: "alt" },
    { id: "meta-right", label: "Super", width: 1.25, modifier: "meta" },
    { id: "menu", label: "Menu", width: 1.25, inert: true },
    { id: "ctrl-right", label: "Ctrl", width: 1.25, modifier: "ctrl" },
  ],
];

/** Escape and the arrow cluster, which sit outside the 60% block. */
export const CLUSTER: KeyDef[][] = [
  [{ id: "escape", label: "Esc", width: 1.5 }],
  [{ id: "up", label: "↑", width: 1.5 }],
  [
    { id: "left", label: "←" },
    { id: "down", label: "↓" },
    { id: "right", label: "→" },
  ],
];

/** Every key a mapping could be bound to, for the "how many are free" count. */
export const BINDABLE: KeyDef[] = [...ROWS, ...CLUSTER]
  .flat()
  .filter((key) => !key.modifier && !key.inert);

// ── Vim notation ─────────────────────────────────────────────────────────────

/** Characters that are a key plus Shift on a US layout. */
const SHIFTED: Record<string, string> = {
  "~": "backquote",
  "!": "1",
  "@": "2",
  "#": "3",
  $: "4",
  "%": "5",
  "^": "6",
  "&": "7",
  "*": "8",
  "(": "9",
  ")": "0",
  _: "minus",
  "+": "equal",
  "{": "bracketleft",
  "}": "bracketright",
  "|": "backslash",
  ":": "semicolon",
  '"': "apostrophe",
  "<": "comma",
  ">": "period",
  "?": "slash",
};

/** Characters that are a key with nothing held. */
const UNSHIFTED: Record<string, string> = {
  "`": "backquote",
  "-": "minus",
  "=": "equal",
  "[": "bracketleft",
  "]": "bracketright",
  "\\": "backslash",
  ";": "semicolon",
  "'": "apostrophe",
  ",": "comma",
  ".": "period",
  "/": "slash",
  " ": "space",
};

/** `<name>` forms that are not a single character. */
const NAMED: Record<string, string> = {
  leader: "space",
  localleader: "backslash",
  space: "space",
  cr: "enter",
  enter: "enter",
  return: "enter",
  bs: "backspace",
  backspace: "backspace",
  tab: "tab",
  esc: "escape",
  escape: "escape",
  up: "up",
  down: "down",
  left: "left",
  right: "right",
  del: "backspace",
};

export interface Chord extends Modifiers {
  /** Layout key id, or null when the token is not on this keyboard. */
  key: string | null;
}

/** Split a left-hand side into the keys you press one after another. */
export function tokenize(lhs: string): string[] {
  const tokens: string[] = [];
  let index = 0;
  while (index < lhs.length) {
    if (lhs[index] === "<") {
      const end = lhs.indexOf(">", index);
      if (end !== -1) {
        tokens.push(lhs.slice(index, end + 1));
        index = end + 1;
        continue;
      }
    }
    tokens.push(lhs[index]);
    index += 1;
  }
  return tokens;
}

/** Compare two tokens the way Vim does: `<CR>` is `<cr>`, but `A` is not `a`. */
export function sameToken(a: string, b: string): boolean {
  if (a.startsWith("<") && b.startsWith("<")) {
    return a.toLowerCase() === b.toLowerCase();
  }
  return a === b;
}

/** One character to a key plus whether Shift is part of it. */
function fromChar(char: string): Chord | null {
  if (/^[a-z]$/.test(char)) return { ...NO_MODIFIERS, key: char };
  if (/^[A-Z]$/.test(char))
    return { ...NO_MODIFIERS, shift: true, key: char.toLowerCase() };
  if (/^[0-9]$/.test(char)) return { ...NO_MODIFIERS, key: char };
  if (char in SHIFTED)
    return { ...NO_MODIFIERS, shift: true, key: SHIFTED[char] };
  if (char in UNSHIFTED) return { ...NO_MODIFIERS, key: UNSHIFTED[char] };
  return null;
}

/**
 * One token to a key and the modifiers held with it.
 *
 * Modifier prefixes are read off the front while they are a single letter
 * followed by a dash and there is still something after them, which is what
 * keeps `<C-S-CR>` from losing its `CR` and stops a bare `<Left>` being read
 * as a modifier.
 */
export function parseToken(token: string): Chord | null {
  if (!token.startsWith("<") || !token.endsWith(">")) {
    return fromChar(token);
  }

  const inner = token.slice(1, -1);
  const parts = inner.split("-");
  const mods: Modifiers = { ...NO_MODIFIERS };
  let index = 0;
  while (index < parts.length - 1 && parts[index].length === 1) {
    const flag = parts[index].toLowerCase();
    if (flag === "c") mods.ctrl = true;
    else if (flag === "s") mods.shift = true;
    else if (flag === "a" || flag === "m") mods.alt = true;
    else if (flag === "d") mods.meta = true;
    else break;
    index += 1;
  }

  const base = parts.slice(index).join("-");
  if (base.length === 1) {
    const chord = fromChar(base);
    if (chord === null) return null;
    return {
      key: chord.key,
      ctrl: mods.ctrl,
      // A shifted character carries Shift whether or not `<S-` was written.
      shift: mods.shift || chord.shift,
      alt: mods.alt,
      meta: mods.meta,
    };
  }

  const named = NAMED[base.toLowerCase()];
  if (named === undefined) return null;
  return { ...mods, key: named };
}

/** Render a key plus the held modifiers back into Vim notation. */
export function toNotation(key: KeyDef, mods: Modifiers): string {
  const base =
    key.id === "space"
      ? "<leader>"
      : (NOTATION[key.id] ?? (mods.shift ? (key.shifted ?? key.label) : key.label));

  const prefixes = [
    mods.ctrl ? "C" : "",
    mods.alt ? "A" : "",
    mods.meta ? "D" : "",
  ].filter(Boolean);

  // A shifted character already says Shift in its own legend.
  const needsShiftFlag = mods.shift && base.startsWith("<");
  if (needsShiftFlag) prefixes.push("S");

  if (prefixes.length === 0) return base;
  const inner = base.startsWith("<") ? base.slice(1, -1) : base;
  return `<${prefixes.join("-")}-${inner}>`;
}

/** Key ids whose Vim notation is a `<name>` rather than the character itself. */
const NOTATION: Record<string, string> = {
  enter: "<CR>",
  backspace: "<BS>",
  tab: "<Tab>",
  escape: "<Esc>",
  up: "<Up>",
  down: "<Down>",
  left: "<Left>",
  right: "<Right>",
  space: "<leader>",
};
