/**
 * Every mapping this configuration installs.
 *
 * Transcribed from `after/plugin/keymaps.lua`, plus the mappings the plugins
 * set up in `after/plugin/mini.lua`, `after/plugin/other.lua` and
 * `lua/plugins/session_manager/sessions.lua`. The plugin ones are here because
 * the question the keyboard answers — "is this key free?" — cannot be answered
 * from `keymaps.lua` alone: `mini.jump` owns `l` and `m`, `mini.jump2d` owns
 * `v`, and `mini.surround` owns six mappings under `x`.
 *
 * Kept as data rather than parsed out of the Lua at build time. The right-hand
 * sides here are Lua functions as often as they are key sequences, and a
 * description of what a function does is not something a parser can write.
 */

/** Vim's mode short names, as `vim.keymap.set` takes them. */
export type Mode = "n" | "i" | "v" | "x" | "s" | "o" | "c" | "t";

export interface Mapping {
  /** Left-hand side in Vim notation. */
  lhs: string;
  /** The modes the mapping was created for, verbatim. */
  modes: Mode[];
  /** Right-hand side: a key sequence, a command, or a description of a Lua function. */
  rhs: string;
  /** What it is for, when the right-hand side does not say. */
  desc?: string;
  /** Which file installs it. */
  source: string;
  /** Anything surprising about it. */
  note?: string;
}

const KEYMAPS = "after/plugin/keymaps.lua";
const MINI = "after/plugin/mini.lua";
const SESSIONS = "session_manager/sessions.lua";
const FOLD = "fold_this";

export const MAPPINGS: Mapping[] = [
  // ── Leader: single letters ────────────────────────────────────────────────
  { lhs: "<leader>A", modes: ["n"], rhs: "", desc: "Disabled — reserved", source: KEYMAPS },
  {
    lhs: "<leader>a",
    modes: ["n"],
    rhs: "<cmd>silent !npx prettier --write % &<CR>",
    desc: "Format the current file with Prettier, in the background",
    source: KEYMAPS,
  },
  { lhs: "<leader>B", modes: ["n"], rhs: "<cmd>Telescope buffers<CR>", source: KEYMAPS },
  { lhs: "<leader>bh", modes: ["n"], rhs: "<cmd>bprevious<cr>", desc: "Prev Buffer", source: KEYMAPS },
  { lhs: "<leader>bl", modes: ["n"], rhs: "<cmd>bnext<cr>", desc: "Next Buffer", source: KEYMAPS },
  { lhs: "<leader>bb", modes: ["n"], rhs: "<cmd>e #<cr>", desc: "Switch to Other Buffer", source: KEYMAPS },
  { lhs: "<leader>bD", modes: ["n"], rhs: "<cmd>:bd<cr>", desc: "Delete Buffer and Window", source: KEYMAPS },
  { lhs: "<leader>`", modes: ["n"], rhs: "<cmd>e #<cr>", desc: "Switch to Other Buffer", source: KEYMAPS },
  { lhs: "<leader>C", modes: ["n"], rhs: "<cmd>Telescope help_tags<CR>", source: KEYMAPS },
  { lhs: "<leader>cd", modes: ["n"], rhs: "vim.diagnostic.open_float", desc: "Line Diagnostics", source: KEYMAPS },
  { lhs: "<leader>D", modes: ["n"], rhs: "<cmd>Telescope colorscheme<CR>", source: KEYMAPS },
  { lhs: "<leader>d", modes: ["n"], rhs: "<cmd>restart<CR>", desc: "Restart Neovim", source: KEYMAPS },
  { lhs: "<leader>E", modes: ["n"], rhs: "MiniPick.builtin.files()", source: KEYMAPS },
  { lhs: "<leader>e", modes: ["n"], rhs: "MiniPick.builtin.grep()", source: KEYMAPS },
  { lhs: "<leader>F", modes: ["n"], rhs: "<cmd>restart<cr>", desc: "Restart Neovim — same as <leader>d", source: KEYMAPS },
  {
    lhs: "<leader>f",
    modes: ["n"],
    rhs: "<cmd><up><cr>",
    desc: "Repeat the last command-line command",
    source: KEYMAPS,
    note: "Shadowed by a timeout: <leader>fn also exists, so this waits 'timeoutlen' before running.",
  },
  { lhs: "<leader>fn", modes: ["n"], rhs: "<cmd>enew<cr>", desc: "New File", source: KEYMAPS },
  { lhs: "<leader>G", modes: ["n"], rhs: "MiniPick.builtin.cli()", source: KEYMAPS },
  { lhs: "<leader>g", modes: ["n"], rhs: "<cmd>set wrap<cr><cmd>Goyo<cr>", desc: "Prose mode: wrap on, Goyo", source: KEYMAPS },
  { lhs: "<leader>H", modes: ["n"], rhs: "MiniPick.builtin.help()", desc: "MiniPick Help", source: KEYMAPS },
  { lhs: "<leader>h", modes: ["n"], rhs: "<cmd>set nowrap<cr>:Goyo<cr>", desc: "Code mode: wrap off, Goyo", source: KEYMAPS },
  { lhs: "<leader>I", modes: ["n"], rhs: "", desc: "Disabled — reserved", source: KEYMAPS },
  { lhs: "<leader>i", modes: ["n"], rhs: "<cmd>Limelight!!<cr>", desc: "Toggle paragraph dimming", source: KEYMAPS },
  { lhs: "<leader>J", modes: ["n"], rhs: ":<c-p><cr>", desc: "Run the previous command line", source: KEYMAPS },
  { lhs: "<leader>j", modes: ["n"], rhs: ":<c-p>", desc: "Recall the previous command line, do not run it", source: KEYMAPS },
  { lhs: "<leader>K", modes: ["n"], rhs: "/<c-f>", desc: "Open the search history window", source: KEYMAPS },
  { lhs: "<leader>k", modes: ["n"], rhs: "/<up>", desc: "Recall the previous search", source: KEYMAPS },
  { lhs: "<leader>L", modes: ["n"], rhs: "MiniPick.builtin.grep_live()", source: KEYMAPS },
  { lhs: "<leader>l", modes: ["n"], rhs: "<cmd>cw<cr>", desc: "Open the quickfix window if it has entries", source: KEYMAPS },
  { lhs: "<leader>m", modes: ["n"], rhs: "=ip", desc: "Reindent the current paragraph", source: KEYMAPS },
  { lhs: "<leader>N", modes: ["n"], rhs: "", desc: "Disabled — reserved", source: KEYMAPS },
  { lhs: "<leader>n", modes: ["n"], rhs: "<cmd>NERDTree<cr>", source: KEYMAPS },
  { lhs: "<leader>O", modes: ["n"], rhs: "", desc: "Disabled — reserved", source: KEYMAPS },
  { lhs: "<leader>o", modes: ["n"], rhs: "<cmd>cd %:p:h<CR>", desc: "cd to the current file's directory", source: KEYMAPS },
  { lhs: "<leader>P", modes: ["n"], rhs: "", desc: "Disabled — reserved", source: KEYMAPS },
  { lhs: "<leader>p", modes: ["n"], rhs: "MiniExtra.pickers.colorschemes()", source: KEYMAPS },
  { lhs: "<leader>Q", modes: ["n"], rhs: "", desc: "Disabled — reserved", source: KEYMAPS },
  { lhs: "<leader>qq", modes: ["n"], rhs: "<cmd>qa<cr>", desc: "Quit All", source: KEYMAPS },
  { lhs: "<leader>R", modes: ["n"], rhs: "qq", desc: "Record Macro to 'q'", source: KEYMAPS },
  { lhs: "<leader>r", modes: ["n"], rhs: "q", desc: "Stop recording, or pick a register", source: KEYMAPS },
  { lhs: "<leader>S", modes: ["n"], rhs: ":%s//<left>", desc: "Start a file-wide substitution", source: KEYMAPS },
  { lhs: "<leader>s", modes: ["n"], rhs: "ma", desc: "Set mark a — 'm' itself is mini.jump", source: KEYMAPS },
  { lhs: "<leader>T", modes: ["n"], rhs: ":nmap ", desc: "Start a :nmap command", source: KEYMAPS },
  { lhs: "<leader>t", modes: ["n"], rhs: "", desc: "Disabled — reserved", source: KEYMAPS },
  { lhs: "<leader>U", modes: ["n"], rhs: "MiniPick.builtin.buffers()", source: KEYMAPS },
  { lhs: "<leader>ui", modes: ["n"], rhs: "vim.show_pos", desc: "Inspect Pos", source: KEYMAPS },
  { lhs: "<leader>uI", modes: ["n"], rhs: "vim.treesitter.inspect_tree", desc: "Inspect Tree", source: KEYMAPS },
  {
    lhs: "<leader>ur",
    modes: ["n"],
    rhs: "<Cmd>nohlsearch<Bar>diffupdate<Bar>normal! <C-L><CR>",
    desc: "Redraw / Clear hlsearch / Diff Update",
    source: KEYMAPS,
  },
  { lhs: "<leader>V", modes: ["n"], rhs: "", desc: "Disabled — reserved", source: KEYMAPS },
  { lhs: "<leader>v", modes: ["n"], rhs: "<cmd>TZNarrow<CR>", desc: "true-zen: narrow to the selection", source: KEYMAPS },
  { lhs: "<leader>W", modes: ["n"], rhs: "", desc: "Disabled — reserved", source: KEYMAPS },
  {
    lhs: "<leader>w",
    modes: ["n"],
    rhs: "plugins.QDtb.lua_format.format",
    desc: "Run stylua on the current buffer",
    source: KEYMAPS,
    note: "Shadowed by a timeout: <leader>wd also exists, so this waits 'timeoutlen' before running.",
  },
  { lhs: "<leader>wd", modes: ["n"], rhs: "<C-W>c", desc: "Delete Window", source: KEYMAPS },
  { lhs: "<leader>X", modes: ["n"], rhs: "<cmd>Telescope find_files<CR>", source: KEYMAPS },
  { lhs: "<leader>xl", modes: ["n"], rhs: "toggle the location list", desc: "Location List", source: KEYMAPS },
  { lhs: "<leader>xq", modes: ["n"], rhs: "toggle the quickfix list", desc: "Quickfix List", source: KEYMAPS },
  { lhs: "<leader>Y", modes: ["n"], rhs: "", desc: "Disabled — reserved", source: KEYMAPS },
  { lhs: "<leader>y", modes: ["n"], rhs: "<cmd>Telescope live_grep<CR>", source: KEYMAPS },
  { lhs: "<leader>Z", modes: ["n"], rhs: "", desc: "Disabled — reserved", source: KEYMAPS },
  {
    lhs: "<leader>z",
    modes: ["n"],
    rhs: "prompt for a help tag, then :only",
    desc: "Open help in single window",
    source: KEYMAPS,
    note: "Defined twice. Line 9 binds it to plugins.QDtb.package_json.check_npm_project; line 70 replaces it with this. The NPM check has no key.",
  },
  { lhs: "<leader>/", modes: ["n"], rhs: "MiniPick.builtin.files()", source: KEYMAPS },
  { lhs: "<leader>-", modes: ["n"], rhs: "<C-W>s", desc: "Split Window Below", source: KEYMAPS },
  { lhs: "<leader>|", modes: ["n"], rhs: "<C-W>v", desc: "Split Window Right", source: KEYMAPS },

  // ── Leader: tab group ─────────────────────────────────────────────────────
  { lhs: "<leader><tab><tab>", modes: ["n"], rhs: "<cmd>tabnew<cr>", desc: "New Tab", source: KEYMAPS },
  { lhs: "<leader><tab>l", modes: ["n"], rhs: "<cmd>tablast<cr>", desc: "Last Tab", source: KEYMAPS },
  { lhs: "<leader><tab>o", modes: ["n"], rhs: "<cmd>tabonly<cr>", desc: "Close Other Tabs", source: KEYMAPS },
  { lhs: "<leader><tab>f", modes: ["n"], rhs: "<cmd>tabfirst<cr>", desc: "First Tab", source: KEYMAPS },
  { lhs: "<leader><tab>]", modes: ["n"], rhs: "<cmd>tabnext<cr>", desc: "Next Tab", source: KEYMAPS },
  { lhs: "<leader><tab>[", modes: ["n"], rhs: "<cmd>tabprevious<cr>", desc: "Previous Tab", source: KEYMAPS },
  { lhs: "<leader><tab>d", modes: ["n"], rhs: "<cmd>tabclose<cr>", desc: "Close Tab", source: KEYMAPS },

  // ── Leader: session group ─────────────────────────────────────────────────
  { lhs: "<leader>Ms", modes: ["n"], rhs: "sessions.save_cwd", desc: "Save Session for this Directory", source: SESSIONS },
  { lhs: "<leader>MS", modes: ["n"], rhs: "sessions.save_as", desc: "Save Session As…", source: SESSIONS },
  { lhs: "<leader>Mf", modes: ["n"], rhs: "sessions.pick", desc: "Find Session (<C-d> delete, <C-r> rename)", source: SESSIONS },
  { lhs: "<leader>Ml", modes: ["n"], rhs: "sessions.load_last", desc: "Load Last Session", source: SESSIONS },
  { lhs: "<leader>Mq", modes: ["n"], rhs: "sessions.close", desc: "Close Session", source: SESSIONS },
  { lhs: "<leader>Md", modes: ["n"], rhs: "<cmd>SDelete<cr>", desc: "Delete Session (prompt)", source: SESSIONS },

  // ── Home-row motion, and what it displaced ────────────────────────────────
  { lhs: "A", modes: ["n"], rhs: "v", desc: "Enter charwise Visual — 'v' is mini.jump2d", source: KEYMAPS },
  { lhs: "a", modes: ["n"], rhs: "V", desc: "Enter linewise Visual", source: KEYMAPS },
  { lhs: "I", modes: ["n"], rhs: "a", desc: "Append after the cursor", source: KEYMAPS },
  { lhs: "V", modes: ["n"], rhs: "A", desc: "Append at end of line", source: KEYMAPS },
  { lhs: "L", modes: ["n"], rhs: "l", desc: "Move right — 'l' is mini.jump", source: KEYMAPS },
  { lhs: ",", modes: ["n"], rhs: "h", desc: "Move left", source: KEYMAPS },
  { lhs: "X", modes: ["n"], rhs: "x", desc: "Delete the character under the cursor", source: KEYMAPS },
  {
    lhs: "x",
    modes: ["n"],
    rhs: "@q",
    desc: "Replay the q macro",
    source: KEYMAPS,
    note: "Shadowed by a timeout: mini.surround owns xa, xd, xf, xF, xh and xr.",
  },
  { lhs: "q", modes: ["n", "v"], rhs: ":q<cr>", desc: "Close the window", source: KEYMAPS },
  { lhs: "Q", modes: ["n", "v"], rhs: ":qa<cr>", desc: "Quit everything", source: KEYMAPS },
  { lhs: "E", modes: ["n"], rhs: "<cmd>pwd<CR>", desc: "Print the working directory", source: KEYMAPS },
  { lhs: "e", modes: ["n"], rhs: ":Startify<CR>", desc: "Open the dashboard", source: KEYMAPS },
  { lhs: "U", modes: ["n"], rhs: "<cmd>cd %:p:h<CR>", desc: "cd to the current file's directory", source: KEYMAPS },
  { lhs: "r", modes: ["n"], rhs: "/", desc: "Search forward", source: KEYMAPS },
  { lhs: "/", modes: ["n"], rhs: "<cmd>Telescope find_files<CR>", source: KEYMAPS },
  { lhs: "`", modes: ["n", "v"], rhs: "~", desc: "Toggle case", source: KEYMAPS },
  { lhs: "<CR>", modes: ["n"], rhs: "yyp", desc: "Duplicate the current line", source: KEYMAPS },
  { lhs: "ds", modes: ["n"], rhs: "d/", desc: "Delete up to a search", source: KEYMAPS },
  { lhs: "dl", modes: ["n"], rhs: "dl", desc: "Delete a character (explicit, so 'l' stays mini.jump here)", source: KEYMAPS },
  { lhs: "-", modes: ["n"], rhs: "mini.files.open()", desc: "Open MiniFiles at the working directory", source: KEYMAPS },
  { lhs: "h", modes: ["n"], rhs: "mini.files.open(current file)", desc: "Open MiniFiles on the current file", source: KEYMAPS },
  { lhs: "G", modes: ["n"], rhs: "GzR", desc: "End of file, all folds open", source: KEYMAPS },
  { lhs: "gg", modes: ["n"], rhs: "ggzM", desc: "Top of file, all folds closed", source: KEYMAPS },
  { lhs: "M", modes: ["n", "v"], rhs: "zM{zozz", desc: "Fold all, reopen this one, centre", source: KEYMAPS },

  // ── Folding ───────────────────────────────────────────────────────────────
  { lhs: "f", modes: ["n"], rhs: "z", desc: "The fold prefix, moved to the home row", source: KEYMAPS },
  { lhs: "ff", modes: ["n"], rhs: "zz", desc: "Centre the cursor line", source: KEYMAPS },
  { lhs: "fj", modes: ["n"], rhs: "zt", desc: "Cursor line to the top", source: KEYMAPS },
  { lhs: "fk", modes: ["n"], rhs: "zb", desc: "Cursor line to the bottom", source: KEYMAPS },
  { lhs: "ft", modes: ["n"], rhs: "zf", desc: "Create a fold", source: KEYMAPS },
  { lhs: "[f", modes: ["n"], rhs: "[z", desc: "Start of the current open fold", source: KEYMAPS },
  { lhs: "]f", modes: ["n"], rhs: "]z", desc: "End of the current open fold", source: KEYMAPS },
  { lhs: "zq", modes: ["n"], rhs: "fold_this.set_marker(false)", desc: "Fold: marker method", source: KEYMAPS },
  { lhs: "zQ", modes: ["n"], rhs: "fold_this.set_marker(true)", desc: "Fold: marker method, close all", source: KEYMAPS },
  { lhs: "zY", modes: ["n"], rhs: "fold_this.apply_default", desc: "Fold: revert to treesitter/indent", source: KEYMAPS },
  { lhs: "zj", modes: ["n"], rhs: "fold_navigation.next_closed_fold('j')", desc: "Next closed fold", source: FOLD },
  { lhs: "zk", modes: ["n"], rhs: "fold_navigation.next_closed_fold('k')", desc: "Previous closed fold", source: FOLD },
  {
    lhs: "<Tab>",
    modes: ["n"],
    rhs: "za",
    desc: "Toggle the fold under the cursor",
    source: FOLD,
    note: "Buffer-local. A terminal sends the same byte for <Tab> and <C-i>, so this takes jump-forward with it.",
  },

  // ── Buffers, quickfix, diagnostics ────────────────────────────────────────
  { lhs: "[b", modes: ["n"], rhs: "<cmd>bprevious<cr>", desc: "Prev Buffer", source: KEYMAPS },
  { lhs: "]b", modes: ["n"], rhs: "<cmd>bnext<cr>", desc: "Next Buffer", source: KEYMAPS },
  { lhs: "[q", modes: ["n"], rhs: "vim.cmd.cprev", desc: "Previous Quickfix", source: KEYMAPS },
  { lhs: "]q", modes: ["n"], rhs: "vim.cmd.cnext", desc: "Next Quickfix", source: KEYMAPS },
  { lhs: "[d", modes: ["n"], rhs: "vim.diagnostic.jump", desc: "Prev Diagnostic", source: KEYMAPS },
  { lhs: "]d", modes: ["n"], rhs: "vim.diagnostic.jump", desc: "Next Diagnostic", source: KEYMAPS },
  { lhs: "[e", modes: ["n"], rhs: "vim.diagnostic.jump (ERROR)", desc: "Prev Error", source: KEYMAPS },
  { lhs: "]e", modes: ["n"], rhs: "vim.diagnostic.jump (ERROR)", desc: "Next Error", source: KEYMAPS },
  { lhs: "[w", modes: ["n"], rhs: "vim.diagnostic.jump (WARN)", desc: "Prev Warning", source: KEYMAPS },
  { lhs: "]w", modes: ["n"], rhs: "vim.diagnostic.jump (WARN)", desc: "Next Warning", source: KEYMAPS },

  // ── Movement and search, LazyVim defaults ─────────────────────────────────
  { lhs: "j", modes: ["n", "x"], rhs: "v:count == 0 ? 'gj' : 'j'", desc: "Down, by screen line when no count", source: KEYMAPS },
  { lhs: "k", modes: ["n", "x"], rhs: "v:count == 0 ? 'gk' : 'k'", desc: "Up, by screen line when no count", source: KEYMAPS },
  { lhs: "<Down>", modes: ["n", "x"], rhs: "v:count == 0 ? 'gj' : 'j'", desc: "Down", source: KEYMAPS },
  { lhs: "<Up>", modes: ["n", "x"], rhs: "v:count == 0 ? 'gk' : 'k'", desc: "Up", source: KEYMAPS },
  { lhs: "n", modes: ["n", "x", "o"], rhs: "'Nn'[v:searchforward]", desc: "Next Search Result, always forward", source: KEYMAPS },
  { lhs: "N", modes: ["n", "x", "o"], rhs: "'nN'[v:searchforward]", desc: "Prev Search Result, always backward", source: KEYMAPS },
  { lhs: "<esc>", modes: ["i", "n", "s"], rhs: "<cmd>noh<cr><esc>", desc: "Escape and Clear hlsearch", source: KEYMAPS },

  // ── Windows ───────────────────────────────────────────────────────────────
  {
    lhs: "<C-h>",
    modes: ["n"],
    rhs: "<C-w>h",
    desc: "Go to Left Window",
    source: KEYMAPS,
    note: "mini.basics sets up the same window mappings later, on its own. Same behaviour either way.",
  },
  { lhs: "<C-j>", modes: ["n"], rhs: "<C-w>j", desc: "Go to Lower Window", source: KEYMAPS },
  { lhs: "<C-k>", modes: ["n"], rhs: "<C-w>k", desc: "Go to Upper Window", source: KEYMAPS },
  { lhs: "<C-l>", modes: ["n"], rhs: "<C-w>l", desc: "Go to Right Window", source: KEYMAPS },
  { lhs: "<C-Up>", modes: ["n"], rhs: "<cmd>resize +2<cr>", desc: "Increase Window Height", source: KEYMAPS },
  { lhs: "<C-Down>", modes: ["n"], rhs: "<cmd>resize -2<cr>", desc: "Decrease Window Height", source: KEYMAPS },
  { lhs: "<C-Left>", modes: ["n"], rhs: "<cmd>vertical resize -2<cr>", desc: "Decrease Window Width", source: KEYMAPS },
  { lhs: "<C-Right>", modes: ["n"], rhs: "<cmd>vertical resize +2<cr>", desc: "Increase Window Width", source: KEYMAPS },

  // ── Save, undo, editing ───────────────────────────────────────────────────
  { lhs: "<C-s>", modes: ["i", "x", "n", "s"], rhs: "<cmd>w<cr><esc>", desc: "Save File", source: KEYMAPS },
  { lhs: "<c-z>", modes: ["n"], rhs: "u", desc: "Undo", source: KEYMAPS },
  { lhs: "<c-z>", modes: ["i", "v"], rhs: "<c-o>u", desc: "Undo without leaving the mode", source: KEYMAPS },
  { lhs: "<BS>", modes: ["n"], rhs: "<LEFT><DEL>", desc: "Backspace in Normal mode", source: KEYMAPS },
  { lhs: "<BS>", modes: ["v"], rhs: "x", desc: "Delete the selection", source: KEYMAPS },
  { lhs: "<A-BS>", modes: ["n"], rhs: "diw", desc: "Delete the word under the cursor", source: KEYMAPS },
  { lhs: "<A-BS>", modes: ["i"], rhs: "<ESC>ciw", desc: "Change the word under the cursor", source: KEYMAPS },
  { lhs: "<C-BS>", modes: ["n"], rhs: "db", desc: "Delete back a word", source: KEYMAPS },
  { lhs: "<C-BS>", modes: ["i"], rhs: "<ESC><RIGHT>dbi", desc: "Delete back a word, staying in Insert", source: KEYMAPS },
  { lhs: "<C-CR>", modes: ["i"], rhs: "<ESC>o", desc: "Open a line below", source: KEYMAPS },
  { lhs: "<C-S-CR>", modes: ["i"], rhs: "<ESC>O", desc: "Open a line above", source: KEYMAPS },
  { lhs: "<A-j>", modes: ["n"], rhs: "move the line down", source: KEYMAPS, note: "Overridden by mini.move in Normal and Visual mode, which is set up later." },
  { lhs: "<A-k>", modes: ["n"], rhs: "move the line up", source: KEYMAPS, note: "Overridden by mini.move in Normal and Visual mode, which is set up later." },
  { lhs: "<A-j>", modes: ["i"], rhs: "<esc><cmd>m .+1<cr>==gi", desc: "Move Down — the Insert-mode version survives", source: KEYMAPS },
  { lhs: "<A-k>", modes: ["i"], rhs: "<esc><cmd>m .-2<cr>==gi", desc: "Move Up — the Insert-mode version survives", source: KEYMAPS },
  { lhs: "<A-j>", modes: ["v"], rhs: "move the selection down", source: KEYMAPS },
  { lhs: "<A-k>", modes: ["v"], rhs: "move the selection up", source: KEYMAPS },
  { lhs: "<", modes: ["x"], rhs: "<gv", desc: "Outdent and keep the selection", source: KEYMAPS },
  { lhs: ">", modes: ["x"], rhs: ">gv", desc: "Indent and keep the selection", source: KEYMAPS },
  { lhs: "gco", modes: ["n"], rhs: "add a comment line below", desc: "Add Comment Below", source: KEYMAPS },
  { lhs: "gcO", modes: ["n"], rhs: "add a comment line above", desc: "Add Comment Above", source: KEYMAPS },

  // ── Insert-mode Emacs movement ────────────────────────────────────────────
  { lhs: "<c-a>", modes: ["n"], rhs: "|", desc: "Go to column 1", source: KEYMAPS },
  { lhs: "<c-a>", modes: ["i"], rhs: "<ESC>|i", desc: "Beginning of line", source: KEYMAPS },
  { lhs: "<c-b>", modes: ["i"], rhs: "<LEFT>", desc: "Back one character", source: KEYMAPS },
  { lhs: "<c-e>", modes: ["i"], rhs: "<ESC>A", desc: "End of line", source: KEYMAPS },
  { lhs: "<c-f>", modes: ["i"], rhs: "<RIGHT>", desc: "Forward one character", source: KEYMAPS },
  { lhs: "<c-d>", modes: ["i"], rhs: "<DEL>", desc: "Delete forward", source: KEYMAPS },
  { lhs: "<c-l>", modes: ["i"], rhs: "<c-o>J", desc: "Join the next line up", source: KEYMAPS },
  { lhs: ",", modes: ["i"], rhs: ",<c-g>u", desc: "Undo break point", source: KEYMAPS },
  { lhs: ".", modes: ["i"], rhs: ".<c-g>u", desc: "Undo break point", source: KEYMAPS },
  { lhs: ";", modes: ["i"], rhs: ";<c-g>u", desc: "Undo break point", source: KEYMAPS },

  // ── Plugin mappings that claim a key ──────────────────────────────────────
  { lhs: "s", modes: ["n", "x", "o"], rhs: "<Plug>(leap)", desc: "leap forward", source: `${KEYMAPS} / leap.nvim` },
  { lhs: "S", modes: ["n", "x", "o"], rhs: "<plug>(leap-backward)", desc: "leap backward", source: `${KEYMAPS} / leap.nvim` },
  { lhs: "gs", modes: ["n", "x", "o"], rhs: "<plug>(leap-from-window)", desc: "leap from another window", source: `${KEYMAPS} / leap.nvim` },
  { lhs: "gS", modes: ["n", "x", "o"], rhs: "<plug>(leap)", desc: "leap", source: `${KEYMAPS} / leap.nvim` },
  { lhs: "l", modes: ["n", "x", "o"], rhs: "mini.jump forward", desc: "Jump to the next occurrence of a character — replaces 'f'", source: `${MINI} / mini.jump` },
  { lhs: "m", modes: ["n", "x", "o"], rhs: "mini.jump backward", desc: "Jump back to a character — replaces 'F', and displaces mark-setting", source: `${MINI} / mini.jump` },
  { lhs: "t", modes: ["n", "x", "o"], rhs: "mini.jump forward till", source: `${MINI} / mini.jump` },
  { lhs: "T", modes: ["n", "x", "o"], rhs: "mini.jump backward till", source: `${MINI} / mini.jump` },
  { lhs: "v", modes: ["n", "x", "o"], rhs: "mini.jump2d start", desc: "Jump anywhere on screen — displaces charwise Visual to 'A'", source: `${MINI} / mini.jump2d` },
  { lhs: "xa", modes: ["n", "x"], rhs: "mini.surround add", source: `${MINI} / mini.surround` },
  { lhs: "xd", modes: ["n"], rhs: "mini.surround delete", source: `${MINI} / mini.surround` },
  { lhs: "xf", modes: ["n"], rhs: "mini.surround find", source: `${MINI} / mini.surround` },
  { lhs: "xF", modes: ["n"], rhs: "mini.surround find left", source: `${MINI} / mini.surround` },
  { lhs: "xh", modes: ["n"], rhs: "mini.surround highlight", source: `${MINI} / mini.surround` },
  { lhs: "xr", modes: ["n"], rhs: "mini.surround replace", source: `${MINI} / mini.surround` },
  { lhs: "<M-h>", modes: ["n", "x"], rhs: "mini.move left", source: `${MINI} / mini.move` },
  { lhs: "<M-l>", modes: ["n", "x"], rhs: "mini.move right", source: `${MINI} / mini.move` },
  { lhs: "<M-j>", modes: ["n", "x"], rhs: "mini.move down", source: `${MINI} / mini.move` },
  { lhs: "<M-k>", modes: ["n", "x"], rhs: "mini.move up", source: `${MINI} / mini.move` },
  { lhs: "gcc", modes: ["n"], rhs: "mini.comment: toggle the current line", source: `${MINI} / mini.comment` },
  { lhs: "gc", modes: ["n", "x", "o"], rhs: "mini.comment: toggle a motion or selection", source: `${MINI} / mini.comment` },
  { lhs: "\\", modes: ["n"], rhs: "mini.basics option toggles", desc: "\\s spell, \\w wrap, \\l list, \\n number, and more", source: `${MINI} / mini.basics` },
];

/**
 * Mappings that exist but are not on a keyboard, so the layout cannot show
 * them. Listed under it instead.
 */
export const OFF_KEYBOARD: Mapping[] = [
  { lhs: "<X1Mouse>", modes: ["n"], rhs: "<c-o>", desc: "Back thumb button: jump backwards", source: KEYMAPS },
  {
    lhs: "<X2Mouse>",
    modes: ["n"],
    rhs: "<c-i>",
    desc: "Forward thumb button: jump forwards",
    source: KEYMAPS,
    note: "This exists because <Tab> is mapped to za, and a terminal cannot tell <Tab> and <C-i> apart.",
  },
];

/** Prefixes worth inspecting on their own. */
export const PREFIXES: { tokens: string[]; label: string; hint: string }[] = [
  { tokens: [], label: "none", hint: "The first key of a mapping" },
  { tokens: ["<leader>"], label: "<leader>", hint: "Space — the main group" },
  { tokens: ["<leader>", "<tab>"], label: "<leader><tab>", hint: "Tab pages" },
  { tokens: ["<leader>", "M"], label: "<leader>M", hint: "Sessions" },
  { tokens: ["<leader>", "b"], label: "<leader>b", hint: "Buffers" },
  { tokens: ["<leader>", "u"], label: "<leader>u", hint: "UI" },
  { tokens: ["<leader>", "x"], label: "<leader>x", hint: "Lists" },
  { tokens: ["g"], label: "g", hint: "Comments, leap, and Vim's own g commands" },
  { tokens: ["z"], label: "z", hint: "Folds and scrolling" },
  { tokens: ["f"], label: "f", hint: "Folds, moved to the home row" },
  { tokens: ["x"], label: "x", hint: "mini.surround" },
  { tokens: ["["], label: "[", hint: "Backwards" },
  { tokens: ["]"], label: "]", hint: "Forwards" },
  { tokens: ["d"], label: "d", hint: "Delete operator" },
];

export const MODE_LABELS: { mode: Mode; label: string; hint: string }[] = [
  { mode: "n", label: "Normal", hint: "n" },
  { mode: "i", label: "Insert", hint: "i" },
  { mode: "x", label: "Visual", hint: "x" },
  { mode: "s", label: "Select", hint: "s" },
  { mode: "o", label: "Operator", hint: "o" },
  { mode: "c", label: "Command", hint: "c" },
  { mode: "t", label: "Terminal", hint: "t" },
];

/**
 * Expand a mapping's declared modes to the ones it really applies in.
 *
 * `v` is Visual *and* Select, which is why `vim.keymap.set("v", ...)` catches
 * mappings people expect to be Visual-only. This configuration uses both `v`
 * and `x`, so the distinction shows up on the keyboard.
 */
export function expandModes(modes: Mode[]): Set<Mode> {
  const out = new Set<Mode>();
  for (const mode of modes) {
    if (mode === "v") {
      out.add("x");
      out.add("s");
    } else {
      out.add(mode);
    }
  }
  return out;
}
