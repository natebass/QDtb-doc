---
title: "MELPA"
description: "The package archive this configuration adds, and why its output is not committed"
sidebar_label: "MELPA"
sidebar_position: 25
---

# MELPA

One line in [`init.el`](/docs/other/emacs) adds it:

```elisp
(require 'package)
(add-to-list 'package-archives '("melpa" . "https://melpa.org/packages/") t)
(package-initialize)
```

## What MELPA is

Emacs ships with **GNU ELPA** enabled — the official archive, which only
accepts packages whose authors have assigned copyright to the FSF. It is
small, and much of what people actually install is not in it.

[MELPA](https://melpa.org) is the community archive, and it is where most of
the Emacs ecosystem lives. It builds packages **straight from their source
repositories**, so a MELPA version is whatever was on the branch when the
build ran. Version numbers are timestamps: `atomic-chrome-20230304.112` is a
build from 4 March 2023.

There is also **MELPA Stable**, which builds from git tags instead. This
configuration uses the rolling archive.

| Archive | Enabled here | Versioning | Contents |
|---|---|---|---|
| GNU ELPA | yes, by default | Release numbers | FSF-assigned packages |
| MELPA | yes, added | `YYYYMMDD.HHMM` | Most of the ecosystem, from git |
| MELPA Stable | no | Tag-based | The same packages, at tagged releases |

### The `t` at the end

```elisp
(add-to-list 'package-archives '("melpa" . "…") t)
```

The third argument is `append`. It puts MELPA at the **end** of the list, so
when a package exists in both archives, GNU ELPA's copy is preferred.

That is the conservative choice, and it is worth knowing you made it: a
package available in both will be the GNU ELPA version, which is often older.
Dropping the `t` reverses the preference.

Ordering is not the whole story — `package-archive-priorities` is the setting
that decides properly, and nothing here sets it. With it unset, Emacs falls
back to the highest version number it can find across the archives, and
because MELPA versions are timestamps like `20260301.157` they are almost
always numerically larger than a release number like `1.2`. So in practice
**MELPA usually wins anyway**, whatever the list order suggests.

To make the preference real:

```elisp
(setq package-archive-priorities '(("gnu" . 10) ("melpa" . 5)))
```

## Installing

```text
M-x package-refresh-contents     download the archive indexes
M-x package-list-packages        browse, then `i` to mark and `x` to execute
M-x package-install RET <name>   install one by name
```

`package-refresh-contents` has to run at least once on a new machine, or
`package-install` reports the package as unavailable — the archive index is
not fetched automatically.

## What is installed

One package:

```elisp
(require 'atomic-chrome)
(atomic-chrome-start-server)
```

[atomic-chrome](https://github.com/alpha22jp/atomic-chrome) runs a WebSocket
server that a browser extension connects to, so a `<textarea>` in the browser
can be edited in Emacs instead. It pulls in `websocket` as a dependency.

`custom.el` records it as
`(package-selected-packages '(atomic-chrome))` — and `custom.el` is not
committed, which is the subject of the next section.

## What is not committed

Two entries in `QDtb/.gitignore` cover MELPA's output:

```gitignore
/elpa/
elpa/
gnupg/
```

Plus the compiled forms every package brings with it:

```gitignore
*.elc
/eln-cache/
native-lisp/
```

### Why `elpa/` stays out

`elpa/` is a download cache. Committing it means committing:

- **Third-party source you did not write**, under its own licences, in your
  configuration repository.
- **Byte-compiled and natively-compiled output**, which is tied to the Emacs
  version and the CPU architecture that produced it. A checkout on another
  machine would load bytecode built for an Emacs that is not there.
- **A timestamp-versioned snapshot** that is stale the moment MELPA rebuilds
  the package.

None of that is configuration. The configuration is the *list* of packages,
which is one line of `init.el` here.

The same argument applies to
[Neovim's `parser/`](/docs/neovim/general#parser) and to `node_modules` — and
it is the same reason `nvim-pack-lock.json` **is** committed while the plugins
themselves are not. A lockfile is a record; a download is not.

### Why `gnupg/` stays out

`package.el` verifies archive signatures and keeps its keyring in
`~/.emacs.d/gnupg/`. It is machine state with key material in it, and it is
regenerated on demand.

:::note[If signature verification fails on a fresh machine]
The GNU ELPA signing key expires and is rotated. On a new checkout you may see
`Failed to verify signature`. The fix is to install the current key:

```text
M-x package-install RET gnu-elpa-keyring-update RET
```

Or, as a last resort, `(setq package-check-signature nil)` — which turns the
verification off rather than fixing it, and is worth undoing afterwards.
:::

### What that means on a new machine

```text
M-x package-refresh-contents
M-x package-install RET atomic-chrome RET
```

Then restart. `init.el`'s `(require 'atomic-chrome)` will fail on the first
start, before the package is there — which is the cost of recording the
package list as a `require` rather than as data.

## Pinning what is installed

With one package this is not a problem. With ten it is, and there are three
common answers:

**1. `package-selected-packages` in `init.el`.** Declare the list yourself and
let Emacs install what is missing:

```elisp
(setq package-selected-packages '(atomic-chrome magit vertico))
(package-install-selected-packages)
```

This is the smallest change from what is here now, and it stops the list
living in an ignored `custom.el`.

**2. `use-package` with `:ensure t`.** Built in since Emacs 29 — each package
is declared beside its configuration, and installed if missing:

```elisp
(use-package atomic-chrome
  :ensure t
  :config (atomic-chrome-start-server))
```

**3. A version-pinning manager** — [straight.el](https://github.com/radian-software/straight.el)
or [Elpaca](https://github.com/progfolio/elpaca) — which records a commit per
package in a lockfile, the way
[`nvim-pack-lock.json`](/docs/neovim/general#supporting-files) does for
Neovim. `.gitignore` already has `/straight/` and `/elpaca/` entries, so the
decision to keep their downloads out has been made in advance.

Given MELPA's timestamp versions, option 3 is the only one that reproduces an
exact set. Options 1 and 2 reproduce the *list*, which for a configuration
this size is enough.
