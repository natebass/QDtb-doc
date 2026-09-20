import type { LoadContext, Plugin } from "@docusaurus/types";
import fs from "node:fs";
import path from "node:path";
import { styleText } from "node:util";

import type { LuaModule, PluginOptions, GroupMap } from "./types.js";
import {
  extractModuleInfo,
  extractFunctions,
  extractVariables,
  extractColors,
} from "./parsers.js";
import {
  CONFIG_PAGES,
  PLUGINS_TO_CONSOLIDATE,
  findLuaFiles,
  getGroupInfo,
  getModuleName,
} from "./files.js";
import {
  generateModuleMarkdown,
  generateInitConfigMarkdown,
  generateOptionsConfigMarkdown,
  generateKeymapsConfigMarkdown,
  generateCategoryIndexMarkdown,
  generateConsolidatedModuleMarkdown,
  generateColorSchemeMarkdown,
  generateIndexMarkdown,
} from "./markdown.js";
import { generateSidebar } from "./sidebar.js";
import type { ColorScheme } from "./types.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Colourise for a terminal, plain for a log file.
 *
 * `styleText` drops the escape codes by itself when the stream is not a TTY,
 * so CI logs stay readable without a `process.env.CI` check of our own.
 */
function paint(
  format: Parameters<typeof styleText>[0],
  text: string,
): string {
  return styleText(format, text, { stream: process.stdout });
}

/**
 * Check whether a doc file is manually managed (not auto-generated).
 * A file is manual if it exists and does NOT contain `generated: true`
 * in its YAML frontmatter.
 */
function isManualDoc(filePath: string): boolean {
  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch (error) {
    // Nothing there to protect, so it is ours to write.
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
  const fmMatch = content.match(/^---([\s\S]*?)---/);
  if (!fmMatch) return true; // No frontmatter at all → treat as manual
  return !fmMatch[1].includes("generated: true");
}

/**
 * Write a generated doc file, but only if the path isn't occupied by a
 * manually-managed document.
 */
function writeGeneratedFile(filePath: string, content: string): boolean {
  if (isManualDoc(filePath)) {
    console.log(
      `   ${paint("yellow", "⏭️  Skipped (manual)")}: ${path.basename(filePath)}`,
    );
    return false;
  }
  fs.writeFileSync(filePath, content);
  return true;
}

// ── Plugin ───────────────────────────────────────────────────────────────────

export default function nvimDocusaurusPlugin(
  context: LoadContext,
  options: PluginOptions,
): Plugin<void> {
  const QDtbPath = options.QDtbPath ?? path.resolve(context.siteDir, "../QDtb");
  const outputBase = path.resolve(context.siteDir, "docs");

  return {
    name: "nvim-docusaurus",

    /**
     * Regenerate `documentation/docs/**` from the Lua sources.
     *
     * Every file operation here is deliberately synchronous. Docusaurus runs
     * all plugins' `loadContent` concurrently (`Promise.all` in
     * core/lib/server/plugins/plugins.js), and the docs content plugin reads
     * the very directories this method deletes and rewrites. Blocking the
     * event loop is what keeps that regeneration atomic from its point of
     * view; awaiting anything in here lets it observe a half-written docs tree
     * and fail with "No docs found in ...".
     */
    async loadContent() {
      console.log(
        `\n🔌 ${paint("bold", "nvim-docusaurus")}: Scanning ${QDtbPath}...`,
      );

      // Clean previous generated docs. `force` already swallows ENOENT, so
      // there is no need to stat each path first.
      for (const dir of ["colors", "config", "plugins", "other"]) {
        fs.rmSync(path.join(outputBase, dir), { recursive: true, force: true });
      }
      fs.rmSync(path.join(outputBase, "_sidebar.json"), { force: true });

      // Ensure output directory exists
      fs.mkdirSync(outputBase, { recursive: true });

      // Find all Lua files
      const luaFiles = findLuaFiles(QDtbPath);
      console.log(`   Found ${luaFiles.length} Lua files`);

      const modules: LuaModule[] = [];
      const colorSchemes: ColorScheme[] = [];
      const groups: GroupMap = new Map();

      for (const filePath of luaFiles) {
        const source = fs.readFileSync(filePath, "utf-8");
        const { category, group: groupName } = getGroupInfo(filePath, QDtbPath);
        const fileName = path.basename(filePath);
        const name = path.basename(filePath, ".lua");
        const relativePath = path.relative(QDtbPath, filePath);

        const moduleInfo = extractModuleInfo(source);
        const functions = extractFunctions(source);
        const variables = extractVariables(source);

        const mod: LuaModule = {
          name,
          moduleName:
            moduleInfo.moduleName || getModuleName(filePath, QDtbPath),
          summary: moduleInfo.summary || `${name} module`,
          description: moduleInfo.description,
          filePath,
          relativePath,
          functions,
          variables,
          sourceCode: source,
          category,
        };

        modules.push(mod);

        // Handle grouping with a composite key to avoid collisions between categories
        const groupKey = `${category}/${groupName}`;
        if (!groups.has(groupKey)) {
          groups.set(groupKey, { category, groupName, modules: [] });
        }
        groups.get(groupKey)!.modules.push(mod);

        // For color files, also extract color data
        if (category === "colors") {
          const scheme = extractColors(source, fileName);
          colorSchemes.push(scheme);
        }
      }

      // Generate markdown files for groups
      for (const [groupKey, info] of groups) {
        if (info.category === "colors") {
          // Color schemes get special treatment (still 1-to-1)
          for (const mod of info.modules) {
            const scheme = colorSchemes.find((s) => s.name === mod.name);
            if (scheme) {
              const outDir = path.join(outputBase, "colors");
              fs.mkdirSync(outDir, { recursive: true });
              const outFile = path.join(outDir, `${mod.name}.mdx`);
              if (
                writeGeneratedFile(
                  outFile,
                  generateColorSchemeMarkdown(scheme),
                )
              ) {
                console.log(`   📝 Generated: colors/${mod.name}.mdx`);
              }
            }
          }
        } else if (info.category === "config" && info.groupName === "index") {
          // Break down core configuration
          const outDir = path.join(outputBase, "config");
          fs.mkdirSync(outDir, { recursive: true });

          const configGenerators = {
            init: generateInitConfigMarkdown,
            options: generateOptionsConfigMarkdown,
            keymaps: generateKeymapsConfigMarkdown,
          } as const;
          const written: string[] = [];
          for (const page of CONFIG_PAGES) {
            const name = `${page}.md`;
            const gen = configGenerators[page];
            if (
              writeGeneratedFile(
                path.join(outDir, name),
                gen(info.modules),
              )
            ) {
              written.push(name);
            }
          }
          if (written.length > 0) {
            console.log(`   📝 Generated: config/{${written.join(",")}}`);
          }
        } else {
          const outDir = path.join(outputBase, info.category);
          fs.mkdirSync(outDir, { recursive: true });

          const isFolder =
            (info.modules.length > 1 ||
              info.modules[0].name !== info.groupName) &&
            !(
              info.category === "plugins" &&
              PLUGINS_TO_CONSOLIDATE.includes(info.groupName)
            );

          if (
            info.category === "plugins" &&
            PLUGINS_TO_CONSOLIDATE.includes(info.groupName)
          ) {
            const outFile = path.join(outDir, `${info.groupName}.md`);
            if (
              writeGeneratedFile(
                outFile,
                generateConsolidatedModuleMarkdown(
                  info.groupName,
                  info.modules,
                ),
              )
            ) {
              console.log(
                `   📝 Generated: ${info.category}/${info.groupName}.md (consolidated)`,
              );
            }
          } else if (!isFolder) {
            const mod = info.modules[0];
            const outFile = path.join(outDir, `${mod.name}.md`);
            if (writeGeneratedFile(outFile, generateModuleMarkdown(mod))) {
              console.log(`   📝 Generated: ${info.category}/${mod.name}.md`);
            }
          } else {
            const groupDir = path.join(outDir, info.groupName);
            fs.mkdirSync(groupDir, { recursive: true });

            // Generate individual pages
            for (const mod of info.modules) {
              const outFile = path.join(groupDir, `${mod.name}.md`);
              if (writeGeneratedFile(outFile, generateModuleMarkdown(mod))) {
                console.log(
                  `   📝 Generated: ${info.category}/${info.groupName}/${mod.name}.md`,
                );
              }
            }

            // Generate index.md for the group
            const indexFile = path.join(groupDir, "index.md");
            if (
              writeGeneratedFile(
                indexFile,
                generateCategoryIndexMarkdown(
                  info.groupName,
                  info.modules,
                  info.category,
                ),
              )
            ) {
              console.log(
                `   📝 Generated: ${info.category}/${info.groupName}/index.md`,
              );
            }
          }
        }
      }

      // Generate module index
      const modulesIndexFile = path.join(outputBase, "modules.md");
      if (
        writeGeneratedFile(
          modulesIndexFile,
          generateIndexMarkdown(groups, colorSchemes),
        )
      ) {
        console.log(`   📝 Generated: modules.md`);
      }

      // Generate sidebar data for the plugin
      const sidebarItems = generateSidebar(groups, colorSchemes);
      const sidebarFile = path.join(outputBase, "_sidebar.json");
      fs.writeFileSync(sidebarFile, JSON.stringify(sidebarItems, null, 2));
      console.log(`   📝 Generated: _sidebar.json`);

      console.log(
        paint(
          "green",
          `\n✅ nvim-docusaurus: Generated docs for ${modules.length} modules (${groups.size} groups) and ${colorSchemes.length} color schemes\n`,
        ),
      );
    },

    async contentLoaded({ actions }) {
      const sidebarPath = path.join(outputBase, "_sidebar.json");
      try {
        const sidebarData = JSON.parse(fs.readFileSync(sidebarPath, "utf-8"));
        actions.setGlobalData({
          apiSidebar: sidebarData,
        });
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
    },

    getPathsToWatch() {
      return [path.join(QDtbPath, "**/*.lua")];
    },
  };
}
