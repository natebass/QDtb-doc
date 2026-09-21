import type { LoadContext, Plugin } from "@docusaurus/types";
import fs from "node:fs";
import path from "node:path";
import { styleText } from "node:util";

import type { LuaModule, PluginOptions } from "./types.js";
import { parseHeader, parseFunctions } from "./parsers.js";
import {
  collectDirs,
  findLuaFiles,
  inferModuleName,
  toDocPath,
} from "./files.js";
import {
  renderCategory,
  renderIndexPage,
  renderModulePage,
} from "./markdown.js";

const DEFAULT_OUTPUT_DIR = "reference";
const DEFAULT_SOURCE_BASE_URL = "https://github.com/natebass/QDtb/blob/master";

/**
 * Colourise for a terminal, plain for a log file.
 *
 * `styleText` drops the escape codes by itself when the stream is not a TTY,
 * so CI logs stay readable without a `process.env.CI` check of our own.
 */
function paint(format: Parameters<typeof styleText>[0], text: string): string {
  return styleText(format, text, { stream: process.stdout });
}

/**
 * Generate a page per Lua file from the Neovim configuration.
 *
 * The plugin owns exactly one directory — `docs/<outputDir>` — and rewrites it
 * from scratch on every build. That boundary is the whole design: an earlier
 * version wrote into `docs/config`, `docs/plugins` and `docs/other` alongside
 * hand-written pages, and cleared those directories first, so a page someone
 * had written by hand was deleted before the check that was meant to protect it
 * ever ran. Prose about the configuration now lives outside this tree and is
 * never touched here.
 */
export default function nvimDocusaurusPlugin(
  context: LoadContext,
  options: PluginOptions,
): Plugin<void> {
  const QDtbPath = options.QDtbPath ?? path.resolve(context.siteDir, "../QDtb");
  const outputDir = options.outputDir ?? DEFAULT_OUTPUT_DIR;
  const sourceBaseUrl = options.sourceBaseUrl ?? DEFAULT_SOURCE_BASE_URL;
  const outputBase = path.resolve(context.siteDir, "docs", outputDir);

  return {
    name: "nvim-docusaurus",

    /**
     * Regenerate `docs/<outputDir>/**` from the Lua sources.
     *
     * Every file operation here is deliberately synchronous. Docusaurus runs
     * all plugins' `loadContent` concurrently (`Promise.all` in
     * core/lib/server/plugins/plugins.js), and the docs content plugin reads
     * the very directory this method deletes and rewrites. Blocking the event
     * loop is what keeps that regeneration atomic from its point of view;
     * awaiting anything in here lets it observe a half-written docs tree and
     * fail with "No docs found in ...".
     */
    async loadContent() {
      console.log(
        `\n🔌 ${paint("bold", "nvim-docusaurus")}: reading ${QDtbPath}`,
      );

      // `force` already swallows ENOENT, so there is no need to stat first.
      fs.rmSync(outputBase, { recursive: true, force: true });
      fs.mkdirSync(outputBase, { recursive: true });

      const luaFiles = findLuaFiles(QDtbPath);
      const modules: LuaModule[] = [];

      for (const filePath of luaFiles) {
        const source = fs.readFileSync(filePath, "utf-8");
        const relativePath = path.relative(QDtbPath, filePath);
        const header = parseHeader(source);

        modules.push({
          relativePath,
          docPath: toDocPath(relativePath),
          name: path.basename(filePath, ".lua"),
          moduleName: header.moduleName || inferModuleName(relativePath),
          hasModuleTag: header.hasModuleTag,
          summary: header.summary,
          description: header.description,
          documented: header.documented,
          functions: parseFunctions(source),
          lineCount: source.split("\n").length,
        });
      }

      for (const dir of collectDirs(modules.map((mod) => mod.docPath))) {
        const dirPath = path.join(outputBase, ...dir.dirPath.split("/"));
        fs.mkdirSync(dirPath, { recursive: true });
        fs.writeFileSync(
          path.join(dirPath, "_category_.json"),
          renderCategory(dir),
        );
      }

      for (const mod of modules) {
        const outFile = path.join(
          outputBase,
          `${mod.docPath.split("/").join(path.sep)}.md`,
        );
        fs.mkdirSync(path.dirname(outFile), { recursive: true });
        fs.writeFileSync(outFile, renderModulePage(mod, sourceBaseUrl));
      }

      fs.writeFileSync(
        path.join(outputBase, "index.md"),
        renderIndexPage(modules, outputDir),
      );

      const documented = modules.filter((mod) => mod.documented).length;
      const functions = modules.reduce(
        (total, mod) => total + mod.functions.length,
        0,
      );
      console.log(
        paint(
          "green",
          `   ${modules.length} pages (${documented} with a header comment, ` +
            `${functions} functions) → docs/${outputDir}\n`,
        ),
      );
      if (documented < modules.length) {
        for (const mod of modules.filter((m) => !m.documented)) {
          console.log(
            `   ${paint("yellow", "no header")}: ${mod.relativePath}`,
          );
        }
        console.log("");
      }
    },

    getPathsToWatch() {
      return [path.join(QDtbPath, "**/*.lua")];
    },
  };
}
