---
title: "The LDoc files"
description: "config.ld, dump.lua and dkjson.lua — what they are, and what still uses them"
sidebar_label: "The LDoc files"
sidebar_position: 5
---

# The LDoc files

Three files sit at the root of `QDtb/` that are not editor configuration:

| File | Lines | What it is |
|---|---|---|
| `config.ld` | 6 | LDoc's project configuration |
| `dump.lua` | 1031 | A saved LDoc parse, as a Lua table |
| `dkjson.lua` | 773 | David Kolf's JSON module, vendored |

They are the remains of an LDoc-based documentation pipeline that
[nvim-docusaurus](/docs/docusaurus/nvim-docusaurus) replaced.

:::note[Nothing in the build uses them]
`pnpm build` runs `tsc` and then `docusaurus build`. Neither invokes `ldoc`,
and nothing in `QDtb/` `require`s `dkjson` or `dump`.

The repository README lists **Lua 5.1** and **LDoc** as requirements. For
building the site, neither is needed — see
[Development](/docs/docusaurus/development#prerequisites). They are still what
you need to *run* LDoc by hand, which is what the rest of this page is about.
:::

The [reference generator skips all three](/docs/docusaurus/nvim-docusaurus#what-is-skipped),
so none of them gets a page in the Lua reference.

## `config.ld`

LDoc's configuration file. Running `ldoc .` in a directory containing one
reads its settings from it:

```lua
project='Neovim Configuration'
title='Neovim Lua Configuration Documentation'
description='Documentation for the Neovim lua configuration files.'
file={'.', exclude={'doc'}}
dir='doc'
format='markdown'
```

| Field | Effect |
|---|---|
| `project` | The name in the sidebar |
| `title` | The `<title>` of every generated page |
| `description` | The project blurb |
| `file` | What to parse: everything under `.`, except `doc` |
| `dir` | Where to write: `doc/` |
| `format` | Comment bodies are Markdown, not LDoc's own markup |

`exclude={'doc'}` and `dir='doc'` are the same directory, which is the
standard arrangement — without the exclusion, a second run would try to parse
its own output.

`doc/` is the first entry in `QDtb/.gitignore`, so LDoc's output has never
been committed.

To run it:

```bash
cd QDtb
ldoc .
```

That produces a static HTML site under `QDtb/doc/`, entirely separate from
this one.

## `dump.lua`

Not a module. It is a Lua table literal — `return { … }` — holding LDoc's
parsed view of the configuration, one entry per module:

```lua
{
  description = [[

 Writes modified file buffers when Neovim loses focus or is about to exit.]],
  file = "/home/nwb/Source/Repos/QDtb-doc/QDtb/lua/plugins/QDtb/autosave.lua",
  inferred = true,
  items = {},
  kind = "modules",
  lineno = 5,
  mod_name = "autosave",
  modifiers = {},
  name = "plugins.QDtb.autosave",
  names_hierarchy = { "plugins", "QDtb", "autosave" },
  package = "plugins.QDtb",
  sections = { by_name = {} },
  summary = "Autosave Configuration.",
  tags = {},
  type = "module",
}
```

This is LDoc's internal representation, written out with Penlight's
`pretty.write` — the shape you get from a `--filter` run rather than from a
normal HTML build. It was captured to see what LDoc had actually understood
about each file before deciding how to render it, which is precisely the
problem `nvim-docusaurus` now solves in TypeScript.

:::warning[It is a stale snapshot]
Two things date it:

- **The paths are `/home/nwb/Source/Repos/QDtb-doc/…`.** This repository now
  lives under `Source/Keep/`, so not one of the 39 paths in the file resolves.
- **It documents a module that no longer exists.**
  `plugins.QDtb.colorscheme_cycler`, with its `init_colorschemes` and
  `next_colorscheme` functions, has an entry. The file was deleted from the
  configuration; this dump still describes it.

Nothing reads the file, so neither causes a failure — but it means `dump.lua`
cannot be used to answer a question about the current configuration. The
[Lua reference](/docs/reference) is regenerated on every build and can.
:::

It is kept as a record of what the previous pipeline produced. Regenerating it
means running LDoc with a dumping filter; deleting it loses nothing the
reference does not now cover.

## `dkjson.lua`

[David Kolf's JSON module](http://dkolf.de/src/dkjson-lua.fsl/), version 2.5,
vendored whole. MIT licensed, and the licence text is in the file.

A pure-Lua JSON encoder and decoder with three features worth noting:

- **It uses [LPeg](https://www.inf.puc-rio.br/~roberto/lpeg/) when available.**
  `always_try_using_lpeg` is `true` at the top of the file, and a `pcall` at
  the bottom swaps in an LPeg-based decoder if the library is installed. There
  is a guard for a known bug in LPeg 0.11, which it refuses to use.
- **It is locale-independent.** `num2str` and `str2num` detect the decimal
  point the current locale uses and normalise it, so a number does not become
  `1,5` in a locale that writes it that way. That is a real class of bug in
  Lua JSON encoders.
- **It does not pollute the global namespace.** `register_global_module_table`
  is `false`, and the module sets `local _ENV = nil` to block accidental
  global access in Lua 5.2 and later.

It is here because LDoc's toolchain wants a JSON library and there is no
package manager in this repository to fetch one — vendoring it is how a
single-file Lua dependency travels. Nothing in the Neovim configuration
requires it; Neovim has `vim.json` built in, which is what
[`dump-theme-highlights.lua`](/docs/neovim/color-themes) uses.

## Keeping or removing them

All three are inert, so there is no urgency either way. The argument for each:

| File | Keep if | Remove if |
|---|---|---|
| `config.ld` | You still want `ldoc .` to work as a second opinion | The Lua reference is the only view you need |
| `dump.lua` | As a record of the previous pipeline | The stale paths and the deleted module make it misleading |
| `dkjson.lua` | `config.ld` stays — it is LDoc's dependency, not yours | LDoc goes |

They travel together: `dkjson.lua` only exists for LDoc, and `dump.lua` is
only LDoc's output. Removing `config.ld` makes the other two unreferenced by
anything at all.
