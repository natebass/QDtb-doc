import type { LuaFunction, LuaParam, LuaReturn } from "./types.js";

/**
 * Lua comment parsing.
 *
 * Two things are extracted, and the first matters much more than the second:
 *
 * 1. The **header block** — the comment that opens a file. It is the one place
 *    that says what a file is for, so the reference is built around it.
 * 2. **Function documentation**, for the handful of modules that expose an API.
 *
 * Neither is done with a Lua parser. The configuration is a set of small files
 * written in a consistent style, and a parser would buy precision this does not
 * need at the cost of a dependency and a build step. What it does need is to
 * fail *quietly*: an undocumented file must still produce a page, and a comment
 * shape nobody anticipated must not take the build down with it.
 */

// ── Shared helpers ───────────────────────────────────────────────────────────

/** A line that is only rules, arrows or box drawing, carrying no prose. */
const DECORATION = /^[\s\-=~_*#↓↑─━│┌┐└┘├┤┬┴┼<>|.·•]+$/u;

/** Vim fold markers, which are editor furniture rather than documentation. */
const FOLD_MARKER = /\{\{\{\d*\s*$|\}\}\}\s*$/;

/** Strip the surrounding quotes LuaCATS uses in `@module "name"`. */
function unquote(text: string): string {
  return text.replace(/^["'](.*)["']$/, "$1");
}

/**
 * Remove a comment line's leading dashes.
 *
 * Returns `null` for anything that is not a comment, so callers can use it as
 * the test for "is this still part of the block?".
 */
function commentBody(line: string): string | null {
  const match = line.match(/^\s*--+(.*)$/);
  if (match === null) return null;
  return match[1].replace(/^\s?/, "").trimEnd();
}

/** True for a line that carries prose rather than decoration or a fold marker. */
function isProse(text: string): boolean {
  if (text.length === 0) return false;
  if (DECORATION.test(text)) return false;
  if (FOLD_MARKER.test(text) && text.replace(FOLD_MARKER, "").trim() === "")
    return false;
  return true;
}

/**
 * Split a `@param`/`@return` body into its type and the description after it.
 *
 * The type is normally one token, but a function type is not: `fun(bufnr:
 * integer): boolean` contains both spaces and a colon, and taking the first
 * token would leave `integer): boolean` in the description. So a `fun(` type is
 * read by balancing its parentheses and then taking an optional `: ReturnType`.
 */
export function splitType(rest: string): { type: string; remainder: string } {
  const text = rest.trim();
  if (text.length === 0) return { type: "", remainder: "" };

  if (text.startsWith("fun(")) {
    let depth = 0;
    let index = 0;
    for (; index < text.length; index++) {
      if (text[index] === "(") depth++;
      else if (text[index] === ")") {
        depth--;
        if (depth === 0) {
          index++;
          break;
        }
      }
    }
    // An unbalanced `fun(` means the annotation is malformed; treating the
    // whole thing as the type is more useful than throwing the build away.
    const returnType = text.slice(index).match(/^\s*:\s*\S+/);
    if (returnType !== null) index += returnType[0].length;
    return {
      type: text.slice(0, index).trim(),
      remainder: text.slice(index).trim(),
    };
  }

  const match = text.match(/^(\S+)\s*([\s\S]*)$/);
  if (match === null) return { type: text, remainder: "" };
  return { type: match[1], remainder: match[2].trim() };
}

// ── Header block ─────────────────────────────────────────────────────────────

export interface LuaHeader {
  moduleName: string;
  hasModuleTag: boolean;
  summary: string;
  description: string;
  /** True when the block was written as `---`, i.e. meant as documentation. */
  documented: boolean;
}

/**
 * Read the comment block a file opens with.
 *
 * `---` lines are preferred, because that is what marks a comment as
 * documentation rather than a note to self. When a file has none — several of
 * the colour schemes and every `after/ftplugin` override — the plain `--` lines
 * at the top are used instead and the result is flagged as undocumented, so the
 * index can show which files still need a header.
 */
export function parseHeader(source: string): LuaHeader {
  const lines = source.split("\n");
  const block: { text: string; doc: boolean }[] = [];

  for (const line of lines) {
    if (line.trim() === "") {
      // A blank line separates paragraphs inside the block, but only once the
      // block has started; leading blank lines are simply skipped.
      if (block.length > 0) block.push({ text: "", doc: false });
      continue;
    }
    const body = commentBody(line);
    if (body === null) break;
    block.push({ text: body, doc: /^\s*---/.test(line) });
  }

  const hasDocLines = block.some((entry) => entry.doc);
  // A file that documents itself gets read on its own terms: the `--` notes
  // interleaved with a `---` block are working notes, not the description.
  const relevant = hasDocLines
    ? block.filter((entry) => entry.doc || entry.text === "")
    : block;

  let moduleName = "";
  let hasModuleTag = false;
  const prose: string[] = [];

  for (const entry of relevant) {
    const moduleTag = entry.text.match(/^@module\s+(.+)$/);
    if (moduleTag !== null) {
      moduleName = unquote(moduleTag[1].trim());
      hasModuleTag = true;
      continue;
    }
    // Any other annotation belongs to the tooling, not to the prose.
    if (entry.text.startsWith("@")) continue;
    if (entry.text === "") {
      if (prose.length > 0 && prose.at(-1) !== "") prose.push("");
      continue;
    }
    if (!isProse(entry.text)) continue;
    prose.push(entry.text.replace(FOLD_MARKER, "").trimEnd());
  }

  while (prose.length > 0 && prose.at(-1) === "") prose.pop();

  const { summary, description } = splitSummary(prose);
  return {
    moduleName,
    hasModuleTag,
    summary,
    description,
    documented: hasDocLines,
  };
}

/**
 * Split collected prose into a one-line summary and the rest.
 *
 * Both shapes in this configuration are handled: a summary alone on the first
 * line, and a summary that shares its line with the start of the description
 * ("Editor Options. Configures Neovim UI, ...").
 */
function splitSummary(prose: string[]): {
  summary: string;
  description: string;
} {
  if (prose.length === 0) return { summary: "", description: "" };

  const first = prose[0];
  const rest = prose.slice(1);
  // Only split on a sentence end that is followed by more text on the same
  // line; `Autosave Configuration.` alone is the whole summary.
  const sentence = first.match(/^(.+?[.!?])\s+(\S.*)$/);
  if (sentence !== null) {
    return {
      summary: sentence[1],
      description: paragraphs([sentence[2], ...rest]),
    };
  }
  return { summary: first, description: paragraphs(rest) };
}

/**
 * Join lines into Markdown paragraphs.
 *
 * Consecutive lines are one paragraph: Lua comments wrap at the source's line
 * width, and reflowing them is what makes the rendered page read as prose
 * rather than as a column of fragments.
 */
function paragraphs(lines: string[]): string {
  const out: string[] = [];
  let current: string[] = [];
  for (const line of lines) {
    if (line.trim() === "") {
      if (current.length > 0) out.push(current.join(" "));
      current = [];
      continue;
    }
    current.push(line.trim());
  }
  if (current.length > 0) out.push(current.join(" "));
  return out.join("\n\n");
}

// ── Functions ────────────────────────────────────────────────────────────────

/**
 * Every function declaration, with whatever comment block precedes it.
 *
 * Both `function M.x()` and `M.x = function()` are recognised, because this
 * configuration uses each in different files.
 */
export function parseFunctions(source: string): LuaFunction[] {
  const lines = source.split("\n");
  const functions: LuaFunction[] = [];

  for (let i = 0; i < lines.length; i++) {
    const declaration = matchDeclaration(lines[i]);
    if (declaration === null) continue;

    const doc = parseFunctionDoc(lines, i);
    functions.push({
      name: doc.name || declaration.name,
      signature: declaration.signature,
      isLocal: declaration.isLocal,
      summary: doc.summary,
      description: doc.description,
      params: doc.params,
      returns: doc.returns,
      line: i + 1,
    });
  }

  return functions;
}

interface Declaration {
  name: string;
  signature: string;
  isLocal: boolean;
}

function matchDeclaration(line: string): Declaration | null {
  const statement = line.match(
    /^\s*(local\s+)?function\s+([\w.:]+)\s*\(([^)]*)\)/,
  );
  if (statement !== null) {
    return {
      name: statement[2],
      signature: statement[3].trim(),
      isLocal: statement[1] !== undefined,
    };
  }

  // `M.format = function()` is a module function. `callback = function(args)`
  // is a field of a table being passed to someone else's setup call, and there
  // are dozens of those in this configuration — autocmd callbacks, mini.nvim
  // options, picker mappings. Requiring either a qualified name or an explicit
  // `local` is what tells the two apart without parsing the enclosing table.
  const assignment = line.match(
    /^\s*(local\s+)?([\w.]+)\s*=\s*function\s*\(([^)]*)\)/,
  );
  if (
    assignment !== null &&
    (assignment[1] !== undefined || assignment[2].includes("."))
  ) {
    return {
      name: assignment[2],
      signature: assignment[3].trim(),
      isLocal: assignment[1] !== undefined,
    };
  }

  return null;
}

interface FunctionDoc {
  name: string;
  summary: string;
  description: string;
  params: LuaParam[];
  returns: LuaReturn[];
}

/** Read the contiguous comment block that ends on the line before `index`. */
function parseFunctionDoc(lines: string[], index: number): FunctionDoc {
  let start = index;
  while (start > 0 && commentBody(lines[start - 1]) !== null) start--;

  const params: LuaParam[] = [];
  const returns: LuaReturn[] = [];
  const prose: string[] = [];
  let name = "";

  for (let i = start; i < index; i++) {
    const body = commentBody(lines[i]);
    if (body === null) continue;

    const param = body.match(/^@param\s+(\S+)\s*([\s\S]*)$/);
    if (param !== null) {
      const { type, remainder } = splitType(param[2]);
      params.push({
        name: param[1].replace(/\?$/, ""),
        type: param[1].endsWith("?") && type ? `${type}?` : type,
        description: remainder,
      });
      continue;
    }

    const returned = body.match(/^@return\s+([\s\S]*)$/);
    if (returned !== null) {
      const { type, remainder } = splitType(returned[1]);
      const named = remainder.match(/^([a-z_][\w]*)\s+(\S[\s\S]*)$/);
      returns.push({
        type,
        name: named !== null ? named[1] : "",
        description: named !== null ? named[2] : remainder,
      });
      continue;
    }

    // LDoc's explicit `@function name`, which wins over the parsed declaration.
    const explicit = body.match(/^@function\s+(\S+)$/);
    if (explicit !== null) {
      name = explicit[1];
      continue;
    }

    if (body.startsWith("@")) continue;
    if (body === "") {
      if (prose.length > 0 && prose.at(-1) !== "") prose.push("");
      continue;
    }
    if (!isProse(body)) continue;
    prose.push(body.replace(FOLD_MARKER, "").trimEnd());
  }

  while (prose.length > 0 && prose.at(-1) === "") prose.pop();
  const { summary, description } = splitSummary(prose);
  return { name, summary, description, params, returns };
}
