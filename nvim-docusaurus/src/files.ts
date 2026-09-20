import { globSync } from "node:fs";
import path from "node:path";

export const PLUGINS_TO_CONSOLIDATE = [
  "code_style",
  "session_manager",
  "fold_this",
];

/**
 * The pages the core `config` group is split across, in sidebar order.
 *
 * Shared between the writer (which emits `docs/config/<page>.md`) and the
 * module index (which links to them). They drifted apart before: the index
 * linked to a single consolidated `/docs/config` page that is never written.
 */
export const CONFIG_PAGES = ["init", "options", "keymaps"] as const;

/** Directories that never contain documentable configuration. */
const SKIP_ENTRIES = new Set([
  "doc",
  "node_modules",
  ".git",
  "domscheme-main",
  // Vendored third-party Lua, not part of the configuration.
  "dkjson.lua",
  "dump.lua",
]);

/**
 * Absolute paths of every documentable Lua file under `dir`, sorted.
 *
 * Synchronous on purpose — see the note on `loadContent` in index.ts.
 *
 * Sorted so the generated module index is byte-identical between builds on
 * machines whose filesystems enumerate directories in different orders.
 */
export function findLuaFiles(dir: string): string[] {
  try {
    return globSync("**/*.lua", {
      cwd: dir,
      exclude: (name) => SKIP_ENTRIES.has(name),
    })
      .map((relativePath) => path.join(dir, relativePath))
      .sort();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export function categorizeFile(filePath: string, QDtbPath: string): string {
  const rel = path.relative(QDtbPath, filePath);
  if (rel === "init.lua") return "config";
  if (rel.startsWith("colors/") || rel.startsWith("colors\\")) return "colors";
  if (rel.startsWith("lua/config/") || rel.startsWith("lua\\config\\"))
    return "config";
  if (rel.startsWith("lua/plugins/") || rel.startsWith("lua\\plugins\\"))
    return "plugins";
  return "other";
}

export function getModuleName(filePath: string, QDtbPath: string): string {
  const rel = path.relative(QDtbPath, filePath);
  return rel
    .replace(/\.lua$/, "")
    .replace(/[\\/]/g, ".")
    .replace(/\.init$/, "");
}

export function getGroupInfo(filePath: string, QDtbPath: string) {
  const rel = path.relative(QDtbPath, filePath);
  const parts = rel.split(path.sep);
  const category = categorizeFile(filePath, QDtbPath);
  if ((category === "plugins" || category === "config") && parts.length >= 4) {
    return { category, group: parts[2] };
  }
  if (category === "config") {
    return { category, group: "index" };
  }
  return { category, group: path.basename(filePath, ".lua") };
}
