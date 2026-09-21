import type { LuaFunction, LuaModule, ReferenceDir } from "./types.js";

/**
 * Rendering. One Lua file becomes one page, and the header comment is what
 * that page leads with.
 */

// ── Escaping ─────────────────────────────────────────────────────────────────

/**
 * Make comment text safe to drop into Markdown.
 *
 * Generated pages are written as `.md`, which the site parses as CommonMark
 * (`markdown.format: "detect"`), so braces need no special handling — but angle
 * brackets do. Neovim comments are full of them (`<C-s>`, `<leader>`,
 * `fun(): boolean`), and CommonMark reads those as raw HTML tags and drops
 * them from the output.
 */
function escapeText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** As `escapeText`, plus the pipe that would end a table cell early. */
function escapeCell(text: string): string {
  return escapeText(text).replace(/\|/g, "\\|");
}

/** A code span whose contents cannot break out of it. */
function code(text: string): string {
  // A backtick inside the span needs a longer fence around it.
  const longest = [...text.matchAll(/`+/g)].reduce(
    (max, match) => Math.max(max, match[0].length),
    0,
  );
  const fence = "`".repeat(longest + 1);
  const padding = text.startsWith("`") || text.endsWith("`") ? " " : "";
  return `${fence}${padding}${text}${padding}${fence}`;
}

/**
 * The URL Docusaurus will serve a generated page at.
 *
 * Docusaurus applies a category-index convention: a doc named `index`, or named
 * after the folder that contains it, *is* that folder's page. So
 * `reference/lua/plugins/fold_this/fold_this.md` is served at
 * `/docs/reference/lua/plugins/fold_this`, and linking to the path the file
 * name suggests gives a 404 the build rightly refuses to ship.
 */
export function docsUrl(referenceDir: string, docPath: string): string {
  const segments = docPath.split("/");
  const last = segments.at(-1);
  const parent = segments.at(-2);
  if (last === "index" || (parent !== undefined && last === parent)) {
    segments.pop();
  }
  return `/docs/${[referenceDir, ...segments].join("/")}`;
}

/**
 * Quote a value for a YAML frontmatter field.
 *
 * Summaries come from Lua comments and may contain quotes, colons or
 * backslashes, any of which break the frontmatter parser if interpolated raw.
 * JSON string syntax is a valid subset of YAML's double-quoted style.
 */
function yamlString(value: string): string {
  return JSON.stringify(value ?? "");
}

// ── Module page ──────────────────────────────────────────────────────────────

/**
 * Whether a function is worth a section.
 *
 * Everything a module exports is, because that is its API. A local helper only
 * earns one when its author wrote something about it; the rest are
 * implementation detail that the source itself shows better than a table can.
 */
function isDocumented(fn: LuaFunction): boolean {
  return !fn.isLocal || fn.summary.length > 0;
}

export function renderModulePage(
  mod: LuaModule,
  sourceBaseUrl: string,
): string {
  const lines: string[] = [];
  const sourceUrl = `${sourceBaseUrl}/${mod.relativePath.split("\\").join("/")}`;
  const functions = mod.functions.filter(isDocumented);

  const description = mod.summary || `${mod.relativePath} reference`;

  lines.push("---");
  lines.push(`title: ${yamlString(mod.moduleName)}`);
  lines.push(`description: ${yamlString(description)}`);
  lines.push(`sidebar_label: ${yamlString(mod.name)}`);
  if (mod.name === "init") lines.push("sidebar_position: 1");
  lines.push("generated: true");
  lines.push("---");
  lines.push("");

  lines.push(`# ${escapeText(mod.moduleName)}`);
  lines.push("");

  if (mod.summary) {
    lines.push(`> ${escapeText(mod.summary)}`);
    lines.push("");
  }

  if (!mod.documented) {
    lines.push(":::note[No header comment]");
    lines.push("");
    lines.push(
      `${code(mod.relativePath)} does not open with a \`---\` documentation block, so ` +
        "there is nothing in the file that says what it is for. Everything below is " +
        "read off the code itself.",
    );
    lines.push("");
    lines.push(":::");
    lines.push("");
  }

  if (mod.description) {
    lines.push(escapeText(mod.description));
    lines.push("");
  }

  lines.push("## At a glance");
  lines.push("");
  lines.push("| | |");
  lines.push("|---|---|");
  if (mod.hasModuleTag) {
    lines.push(`| Module | ${code(mod.moduleName)} |`);
  } else {
    lines.push(`| Module | ${code(mod.moduleName)} (inferred from the path) |`);
  }
  lines.push(`| File | [${code(mod.relativePath)}](${sourceUrl}) |`);
  lines.push(`| Lines | ${mod.lineCount} |`);
  lines.push(
    `| Documented functions | ${functions.length === 0 ? "none" : functions.length} |`,
  );
  lines.push("");

  if (functions.length > 0) {
    lines.push("## Functions");
    lines.push("");
    for (const fn of functions) {
      lines.push(...renderFunction(fn, sourceUrl));
    }
  }

  lines.push("## Source");
  lines.push("");
  lines.push(`[View ${code(mod.relativePath)} on GitHub](${sourceUrl})`);
  lines.push("");

  return lines.join("\n");
}

function renderFunction(fn: LuaFunction, sourceUrl: string): string[] {
  const lines: string[] = [];

  lines.push(`### ${code(`${fn.name}(${fn.signature})`)}`);
  lines.push("");

  if (fn.isLocal) {
    lines.push("*Local to the module.*");
    lines.push("");
  }

  if (fn.summary) {
    lines.push(escapeText(fn.summary));
    lines.push("");
  }

  if (fn.description) {
    lines.push(escapeText(fn.description));
    lines.push("");
  }

  if (fn.params.length > 0) {
    lines.push("| Parameter | Type | Description |");
    lines.push("|---|---|---|");
    for (const param of fn.params) {
      lines.push(
        `| ${code(param.name)} | ${param.type ? code(param.type) : "—"} | ${escapeCell(param.description) || "—"} |`,
      );
    }
    lines.push("");
  }

  if (fn.returns.length > 0) {
    lines.push("**Returns**");
    lines.push("");
    for (const returned of fn.returns) {
      const name = returned.name ? ` ${code(returned.name)}` : "";
      const description = returned.description
        ? ` — ${escapeText(returned.description)}`
        : "";
      lines.push(`- ${returned.type ? code(returned.type) : "value"}${name}${description}`);
    }
    lines.push("");
  }

  lines.push(`[Line ${fn.line}](${sourceUrl}#L${fn.line})`);
  lines.push("");

  return lines;
}

// ── Category metadata ────────────────────────────────────────────────────────

export function renderCategory(dir: ReferenceDir): string {
  return `${JSON.stringify(
    {
      label: dir.label,
      position: dir.position,
      collapsed: true,
      link: null,
    },
    null,
    2,
  )}\n`;
}

// ── Reference index ──────────────────────────────────────────────────────────

/**
 * The reference's front page: what is in the configuration, and which parts of
 * it still have nothing written about them.
 */
export function renderIndexPage(
  modules: LuaModule[],
  referenceDir: string,
): string {
  const lines: string[] = [];
  const documented = modules.filter((mod) => mod.documented).length;

  lines.push("---");
  lines.push('title: "Lua Reference"');
  lines.push(
    'description: "Every Lua file in the configuration, described by its own header comment"',
  );
  lines.push('sidebar_label: "Overview"');
  lines.push("sidebar_position: 0");
  lines.push("generated: true");
  lines.push("---");
  lines.push("");
  lines.push("# Lua Reference");
  lines.push("");
  lines.push(
    "One page per Lua file, generated from the source on every build. Each page leads " +
      "with the file's header comment, because that is the part that says why the file " +
      "exists; exported functions and their parameters follow underneath.",
  );
  lines.push("");
  lines.push(
    `Of the ${modules.length} files in the configuration, ${documented} open with a ` +
      "`---` documentation block. The rest still get a page — see " +
      "[Undocumented files](#undocumented-files) for what is missing.",
  );
  lines.push("");

  const byTopLevel = new Map<string, LuaModule[]>();
  for (const mod of modules) {
    const top = mod.docPath.includes("/")
      ? mod.docPath.slice(0, mod.docPath.indexOf("/"))
      : ".";
    if (!byTopLevel.has(top)) byTopLevel.set(top, []);
    byTopLevel.get(top)!.push(mod);
  }

  for (const [top, group] of [...byTopLevel.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    lines.push(`## ${top === "." ? "Entry point" : code(`${top}/`)}`);
    lines.push("");
    lines.push("| File | Summary |");
    lines.push("|---|---|");
    for (const mod of group) {
      lines.push(
        `| [${code(mod.relativePath)}](${docsUrl(referenceDir, mod.docPath)}) | ` +
          `${escapeCell(mod.summary) || "—"} |`,
      );
    }
    lines.push("");
  }

  const undocumented = modules.filter((mod) => !mod.documented);
  lines.push("## Undocumented files");
  lines.push("");
  if (undocumented.length === 0) {
    lines.push("Every file opens with a `---` header comment.");
    lines.push("");
  } else {
    lines.push(
      "These files have no `---` header, so nothing in the source says what they are " +
        "for. They are listed here rather than hidden, because the list is the to-do.",
    );
    lines.push("");
    for (const mod of undocumented) {
      lines.push(
        `- [${code(mod.relativePath)}](${docsUrl(referenceDir, mod.docPath)})`,
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}
