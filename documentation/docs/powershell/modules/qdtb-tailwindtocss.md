---
title: "QDtb.TailwindToCSS"
description: "Turn a string of Tailwind utility classes into plain CSS rules"
sidebar_label: "QDtb.TailwindToCSS"
sidebar_position: 30
---

# QDtb.TailwindToCSS

> Convert Tailwind classes to CSS.

One exported function, and 600 lines behind it. It takes a string of Tailwind
utility classes and prints the CSS they mean — no Node, no Tailwind install,
no build step.

```powershell
Import-Module QDtb.TailwindToCSS
Convert-TailwindToCSS -TailwindContent 'md:hover:text-red-500 pt-4' -ClassName 'my-button'
```

```css
@media (min-width: 768px) {
    .my-button:hover {
        color: #ef4444;
    }
}
.my-button {
    padding-top: 1rem;
}
```

## Why

Reading a component whose class attribute is forty utilities long, and wanting
to know what it actually renders as. Or lifting a design out of a Tailwind
project into a stylesheet that does not use Tailwind.

## `Convert-TailwindToCSS`

| Parameter | Required | Default | Notes |
|---|---|---|---|
| `-TailwindContent` | yes | — | Space-separated class names. Accepts pipeline input |
| `-ClassName` | no | `a` | The selector the rules hang off |

What it handles:

- **Responsive variants** — `sm:` `md:` `lg:` `xl:` `2xl:`, emitted as
  `@media (min-width: …)` blocks.
- **State variants** — `hover:` `focus:` `active:` and the rest, emitted as
  pseudo-class selectors.
- **Dark mode** — `dark:`.
- **Programmatic scales** — spacing, sizing and typography are computed rather
  than looked up, so `pt-4`, `pt-96` and everything between work without an
  entry each.
- **Arbitrary values** — `w-[300px]`, `text-[1.1rem]`.

Variants stack, and the order in the class name is preserved:
`md:hover:text-red-500` becomes a `:hover` rule inside an `@media` block.

## Layout

```text
QDtb.TailwindToCSS/
  TailwindToCSS.psd1                             v0.0.1
  TailwindToCSS.psm1                             loads Functions/**
  Functions/Public/Convert-TailwindToCSS.ps1      83 lines — the entry point
  Functions/Private/Get-TailwindMap.ps1          420 lines — the data
  Functions/Private/Convert-TailwindClassToCss.ps1  187 lines — one class at a time
  Resources/TailwindToCSS.Tests.ps1              120 lines
  Resources/prompt.txt                           a transcript
  TailwindToCSS.png
```

### `Get-TailwindMap` is the interesting file

420 lines, and almost all of it is data rather than logic. It returns one
hashtable holding:

- **Breakpoints** — `sm` 640px through `2xl` 1536px.
- **The colour palette** — every Tailwind family (`slate`, `gray`, `zinc`,
  `neutral`, `stone`, `red`, `orange`, `amber`, …) at every step from `50` to
  `950`, as hex.
- **Spacing, sizing and font-size scales.**
- **A static map** for the one-to-one utilities that are not computable —
  `flex`, `hidden`, `italic` and their kind.

Its own description says why it is separate: centralising the data makes the
conversion logic cleaner and easier to maintain. It also means adding a colour
or a breakpoint is a data edit.

`Convert-TailwindClassToCss` is the per-class engine: strip the variants off
the front, resolve what is left against the map or the scales, and hand back a
property and a value for the caller to wrap.

## The `begin` block

```powershell
begin {
    # $privateFunctionsPath = Join-Path -Path $PSScriptRoot -ChildPath '..\\Private'
    # Get-ChildItem -Path $privateFunctionsPath -Filter '*.ps1' | ForEach-Object { . $_.FullName }
    $tailwindMap = Get-TailwindMap
}
```

The commented-out block is a function dot-sourcing its own module's private
helpers, which was needed while the file was being run standalone. The
`.psm1` loads them now, so it is redundant — and building the map once in
`begin` rather than per class is what makes a pipeline of many strings
reasonable.

## `Resources/prompt.txt`

Not a resource the module loads. It is a saved terminal transcript from the
session that generated the module — tool call counts, wall time, and Gemini
2.5 Pro token usage.

It is kept as provenance rather than as documentation: this module was largely
generated, and the file says so.

## Tests

`Resources/TailwindToCSS.Tests.ps1`, 120 lines, in `Resources/` rather than
`Test/` — one of the two modules where the runner finds the suite under that
name.

```powershell
./Invoke-Tests.ps1 -Path 'QDtb.TailwindToCSS'
```
