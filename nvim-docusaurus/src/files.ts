import fs from "node:fs";
import path from "node:path";

import type { ReferenceDir } from "./types.js";

/**
 * Directory names that never hold documentable configuration.
 *
 * `doc/` is Vim's generated help, `parser/` holds compiled tree-sitter objects,
 * and `domscheme-main` is a vendored terminal-palette drop that happens to sit
 * under `colors/`.
 */
const SKIP_DIRS = new Set([
  ".git",
  ".vscode",
  "doc",
  "domscheme-main",
  "node_modules",
  "parser",
]);

/**
 * Third-party Lua that ships with the configuration without being part of it.
 *
 * `dkjson.lua` is David Kolf's JSON module, which LDoc loads to write its
 * machine-readable output; `dump.lua` is one of those outputs. Documenting
 * either would describe the documentation toolchain as if it were editor
 * configuration, so both are described by hand in the Documentation section
 * instead.
 */
const SKIP_FILES = new Set(["dkjson.lua", "dump.lua"]);

/**
 * Where each top-level directory sits in the reference.
 *
 * The order is Neovim's own startup order rather than the alphabet: what
 * `init.lua` pulls in, then what the runtimepath sources after it.
 */
const DIR_POSITIONS: Record<string, number> = {
  lua: 10,
  plugin: 20,
  after: 30,
  ftdetect: 40,
  colors: 50,
  queries: 60,
};

/**
 * Every Lua file worth a page, sorted.
 *
 * The sort keeps the generated tree byte-identical between builds on machines
 * whose filesystems enumerate directories in different orders.
 */
export function findLuaFiles(root: string): string[] {
  const found: string[] = [];

  const walk = (dir: string): void => {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
      throw error;
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name) || entry.name.startsWith(".")) continue;
        walk(path.join(dir, entry.name));
        continue;
      }
      if (!entry.isFile()) continue;
      if (!entry.name.endsWith(".lua")) continue;
      if (SKIP_FILES.has(entry.name)) continue;
      found.push(path.join(dir, entry.name));
    }
  };

  walk(root);
  return found.sort();
}

/** `lua/config/options.lua` → `lua/config/options`, with POSIX separators. */
export function toDocPath(relativePath: string): string {
  return relativePath.replace(/\.lua$/, "").split(path.sep).join("/");
}

/**
 * The module name a file would be `require`d by, when it has no `@module`.
 *
 * Only files under `lua/` are on Lua's package path, so only those get a
 * dotted name; everything else is identified by its path instead.
 */
export function inferModuleName(relativePath: string): string {
  const posix = relativePath.split(path.sep).join("/");
  if (!posix.startsWith("lua/")) return posix;
  return posix
    .slice("lua/".length)
    .replace(/\.lua$/, "")
    .replace(/\/init$/, "")
    .replace(/\//g, ".");
}

/**
 * Every directory the pages live in, with the label and position its
 * `_category_.json` should carry.
 */
export function collectDirs(docPaths: string[]): ReferenceDir[] {
  const dirs = new Map<string, ReferenceDir>();

  for (const docPath of docPaths) {
    const segments = docPath.split("/");
    // The last segment is the page itself.
    for (let depth = 1; depth < segments.length; depth++) {
      const dirPath = segments.slice(0, depth).join("/");
      if (dirs.has(dirPath)) continue;
      dirs.set(dirPath, {
        dirPath,
        label: `${segments[depth - 1]}/`,
        position: depth === 1 ? (DIR_POSITIONS[segments[0]] ?? 90) : 10,
      });
    }
  }

  return [...dirs.values()].sort((a, b) => a.dirPath.localeCompare(b.dirPath));
}
