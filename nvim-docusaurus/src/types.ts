/**
 * The shapes the generator passes between its four stages: discovery
 * (`files.ts`), parsing (`parsers.ts`), rendering (`markdown.ts`) and writing
 * (`index.ts`).
 */

/** A `@param` on a documented function. */
export interface LuaParam {
  name: string;
  /** LuaCATS type as written, e.g. `string`, `table|nil`, `fun(): boolean`. */
  type: string;
  description: string;
}

/** A `@return` on a documented function. */
export interface LuaReturn {
  type: string;
  /** LuaCATS allows naming a return value before its description. */
  name: string;
  description: string;
}

export interface LuaFunction {
  /** Name as written in the source, e.g. `M.save_all` or `next_closed_fold`. */
  name: string;
  /** The parameter list as written, without the surrounding parentheses. */
  signature: string;
  /** True for `local function` and `local x = function`. */
  isLocal: boolean;
  summary: string;
  description: string;
  params: LuaParam[];
  returns: LuaReturn[];
  /** 1-based line of the declaration. */
  line: number;
}

/**
 * One Lua file.
 *
 * `summary` and `description` come from the header comment block, which is the
 * thing this reference is built around: it is what tells a reader why the file
 * exists. Functions are recorded too, but they are secondary.
 */
export interface LuaModule {
  /** Path relative to the config root, e.g. `lua/config/options.lua`. */
  relativePath: string;
  /** Docs path relative to the reference root, e.g. `config/options`. */
  docPath: string;
  /** Basename without the extension. */
  name: string;
  /** `@module` name when declared, otherwise derived from the path. */
  moduleName: string;
  /** True when `@module` was actually declared in the file. */
  hasModuleTag: boolean;
  /** First sentence of the header comment. */
  summary: string;
  /** Everything after the first sentence, as Markdown paragraphs. */
  description: string;
  /** True when the file opens with a `---` documentation block. */
  documented: boolean;
  functions: LuaFunction[];
  lineCount: number;
}

/** A directory of the reference tree, used for category pages and ordering. */
export interface ReferenceDir {
  /** Path relative to the reference root, e.g. `lua/plugins/fold_this`. */
  dirPath: string;
  label: string;
  position: number;
}

export interface PluginOptions {
  /** Absolute path of the Neovim configuration to read. */
  QDtbPath?: string;
  /** Directory under `docs/` the reference is written to. */
  outputDir?: string;
  /** Base URL used for "view source" links. */
  sourceBaseUrl?: string;
}
