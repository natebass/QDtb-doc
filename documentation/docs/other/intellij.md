---
title: "IntelliJ"
description: "IdeaVim configuration for the JetBrains IDEs"
sidebar_label: "IntelliJ"
sidebar_position: 30
---

# IntelliJ

:::note[Stub]
This page is a placeholder. The IdeaVim mappings are not documented yet.
:::

[`QDtb/IntelliJ/`](https://github.com/natebass/QDtb/tree/master/IntelliJ) is
the JetBrains side of the configuration, and it is
[IdeaVim](https://plugins.jetbrains.com/plugin/164-ideavim) — the Vim
emulation plugin — rather than IDE settings.

| File | What it is |
|---|---|
| `ideavimrc.txt` | The entry point. Two `source` lines |
| `base.txt` | Mappings shared by every platform |
| `unix.txt` | Linux and macOS |
| `windows.txt` | Windows |
| `settings.jar` | An exported IDE settings bundle |

`ideavimrc.txt` sources `base.txt` and then the platform file:

```vim
source /home/nwb/.var/app/dev.neovide.neovide/config/nvim/IntelliJ/base.txt
source /home/nwb/.var/app/dev.neovide.neovide/config/nvim/IntelliJ/unix.txt
```

Install it by pointing `~/.ideavimrc` at `ideavimrc.txt`.

The mappings use IdeaVim's `<ACTION>` form, which invokes an IDE action rather
than a Vim command:

```vim
nmap <s-TAB> <ACTION>(Forward)
```

That is the bridge between the two worlds, and it is why the mappings here do
not match
[the Neovim ones](/docs/neovim/keymaps) one for one: what Neovim does with a
plugin, IdeaVim does by calling the IDE.

The absolute paths in `ideavimrc.txt` are the Flatpak Neovim config directory,
so the JetBrains IDEs read their Vim configuration out of this repository the
same way everything else does.
