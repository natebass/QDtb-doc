---
title: "The LDoc files"
description: "config.ld, dump.lua and dkjson.lua — what they were, and why they were removed"
sidebar_label: "The LDoc files"
sidebar_position: 5
---

# The LDoc files

Three files used to sit at the root of `QDtb/` that were not editor
configuration:

| File | Lines | What it was |
|---|---|---|
| `config.ld` | 6 | LDoc's project configuration |
| `dump.lua` | 1031 | A saved LDoc parse, as a Lua table |
| `dkjson.lua` | 773 | David Kolf's JSON module, vendored |

They were the remains of an LDoc-based documentation pipeline that
[nvim-docusaurus](/docs/docusaurus/nvim-docusaurus) replaced, and they have
been deleted.

## Why they were removed

Nothing used them. `pnpm build` runs `tsc` and then `docusaurus build`;
neither invokes `ldoc`, and nothing in `QDtb/` `require`d `dkjson` or `dump`.

They did cause one problem: the repository README listed **Lua 5.1** and
**LDoc** as requirements because of them, so a new clone looked like it needed
a Lua toolchain to build a TypeScript site. Neither is needed — see
[Development](/docs/docusaurus/development#prerequisites).

Each file was also unhelpful in its own way:

- **`config.ld`** ran `ldoc .` over `QDtb/` and wrote a static HTML site to
  `QDtb/doc/`, entirely separate from this one. The
  [Lua reference](/docs/reference) covers the same ground and is regenerated
  on every build.
- **`dump.lua`** was LDoc's internal representation, written out with
  Penlight's `pretty.write` from a `--filter` run. It was a stale snapshot:
  every path in it pointed at `/home/nwb/Source/Repos/QDtb-doc/…`, which no
  longer exists, and it described `plugins.QDtb.colorscheme_cycler`, a module
  that had already been deleted from the configuration.
- **`dkjson.lua`** was only there because LDoc's toolchain wants a JSON
  library. The Neovim configuration never required it; Neovim has `vim.json`
  built in, which is what
  [`dump-theme-highlights.lua`](/docs/neovim/color-themes) uses.

They travelled together — `dkjson.lua` only existed for LDoc, and `dump.lua`
was only LDoc's output — so they went together.

## What else changed

The reference generator used to skip `dkjson.lua` and `dump.lua` by name so
that neither got a page in the Lua reference. With the files gone, that list
was removed from `nvim-docusaurus/src/files.ts`.

:::warning[Remove them upstream too]
`QDtb/` is a hand-maintained copy of the
[main repository](https://github.com/natebass/QDtb). If the files are still
there, the next copy brings them back — and without the skip list,
`dkjson.lua` and `dump.lua` would each get a page in the Lua reference. Delete
them from the main repository as well.
:::

## Getting them back

They are in git history. To restore all three:

```bash
git log --diff-filter=D --format=%h -1 -- QDtb/config.ld
git checkout <commit>^ -- QDtb/config.ld QDtb/dump.lua QDtb/dkjson.lua
```

Running LDoc again also needs Lua 5.1 and LDoc installed, then:

```bash
cd QDtb
ldoc .
```
