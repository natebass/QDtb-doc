import fs from "fs";
import path from "path";

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

export function findLuaFiles(dir: string, basePath: string = ""): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        ["doc", "node_modules", ".git", "domscheme-main"].includes(entry.name)
      )
        continue;
      files.push(
        ...findLuaFiles(
          fullPath,
          basePath ? `${basePath}/${entry.name}` : entry.name,
        ),
      );
    } else if (
      entry.name.endsWith(".lua") &&
      entry.name !== "dkjson.lua" &&
      entry.name !== "dump.lua"
    ) {
      files.push(fullPath);
    }
  }
  return files;
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
