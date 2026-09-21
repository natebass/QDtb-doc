# Neovim configuration documentation

This repository contains the _documentation_ for my personal Neovim configuration.

> [!NOTE]
> The main repository is [github.com/natebass/QDtb](https://github.com/natebass/QDtb).
> The code should be periodically kept up to date by manually copy/pasting the code into the `QDtb/` folder.

## Requirements

- Node.js 26+
- pnpm 12.5.1

Lua and LDoc are not needed to build the site. `config.ld`, `dump.lua` and
`dkjson.lua` are left over from an earlier pipeline — see
[The LDoc files](https://natebass.github.io/qdtb-doc/docs/docusaurus/ldoc).

## Get started

1. `pnpm i`
2. `pnpm build-plugin` — required; the site loads the plugin's compiled output
3. `pnpm start`

Full instructions:
[Development](https://natebass.github.io/qdtb-doc/docs/docusaurus/development).
