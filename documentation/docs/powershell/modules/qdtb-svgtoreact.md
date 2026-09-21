---
title: "QDtb.SvgToReact"
description: "Turn a folder of SVG files into typed React components"
sidebar_label: "QDtb.SvgToReact"
sidebar_position: 40
---

# QDtb.SvgToReact

> Convert SVGs into react components.

Point it at a folder of `.svg` files and get back a folder of `.tsx`
components plus an `index.ts` that re-exports them all.

```powershell
Import-Module QDtb.SvgToReact
Convert-FolderSvgToReact -path ./icons
```

## What a component looks like

Given `arrow-left.svg`, it writes `icon/ArrowLeft.tsx`:

```tsx
import React from 'react';

interface ArrowLeftProps {
    width?: number;
    height?: number;
    className?: string;
    props?: React.SVGProps<SVGSVGElement>;
}

export const ArrowLeft: React.FC<ArrowLeftProps> = ({
    width = 24,
    height = 24,
    className = '',
    ...props
}) => {
    return (
        <svg width={width} height={height} className={className} viewBox="0 0 24 24" {...props}>
            …
        </svg>
    );
};
```

Three decisions are baked into that template:

- **`width` and `height` become props**, and the original attributes are
  stripped from the `<svg>` tag so they cannot fight the props. An SVG with no
  width or height defaults to 24.
- **`className` is a first-class prop**, defaulting to `''`, so the icon can be
  styled by the caller.
- **`...props` spreads last**, so anything the caller passes wins over the
  defaults.

## Exported functions

| Function | What it does |
|---|---|
| `Convert-FolderSvgToReact` | The one you call. Walks a folder, writes a component per file, and an `index.ts` |
| `Convert-ComponentContent` | Builds one component's source from SVG content and a name |
| `Convert-SvgAttributesReact` | Rewrites SVG attribute names into their React spellings |

`Convert-SvgAttributesReact` handles the six that JSX will not accept
hyphenated:

| SVG | React |
|---|---|
| `stroke-linecap` | `strokeLinecap` |
| `stroke-linejoin` | `strokeLinejoin` |
| `stroke-width` | `strokeWidth` |
| `fill-rule` | `fillRule` |
| `clip-rule` | `clipRule` |
| `clip-path` | `clipPath` |

## Layout

```text
QDtb.SvgToReact/
  QDtb.SvgToReact.psd1                   v0.0.1
  QDtb.SvgToReact.psm1                   loads Classes/** then Functions/**
  Classes/Classes.ps1                    empty
  Functions/Public/Svg.ps1               108 lines
  Functions/Private/Filesystem.ps1        44 lines — icon dir, PascalCase, index file
  Functions/Private/Log.ps1               20 lines — Write-ModuleLog
  Resources/SvgToReact.Tests.ps1         154 lines
```

`Classes/Classes.ps1` is zero bytes. The loader has a note about it anyway:

> ⚠️ While dot-sourcing classes in a loop works for internal module use, it can
> sometimes cause issues with inheritance or type renewal if the module is
> reloaded. For complex modules, many developers prefer to use the
> `ScriptsToProcess` field in the `.psd1` manifest.

Worth keeping if a class is ever added; irrelevant while the file is empty.

### Private helpers

- **`New-IconDirectory`** — creates `icon/` when missing.
  `SupportsShouldProcess`, so `-WhatIf` reaches it.
- **`Convert-ToPascalCase`** — strips the extension, replaces everything that
  is not alphanumeric with a space, then title-cases and joins. So
  `arrow-left.svg` becomes `ArrowLeft`, and `icon_24_star.svg` becomes
  `Icon24Star`.
- **`CreateIndexFile`** — sorts the component names and writes
  `export * from './<Name>';` for each. It is the one function here not named
  `Verb-Noun`.

## Two paths are relative to the current directory

`Write-ModuleLog` writes `script.log`, and `New-IconDirectory` creates
`icon/` — both relative to wherever the process happens to be, not to the
folder being converted and not to the module.

That means running it from `~` leaves `~/script.log` and `~/icon/` behind, and
it is exactly why this module's tests were the ones that made the
[sandbox](/docs/powershell/testing#the-sandbox) necessary: they used to leave
both in whatever folder `Invoke-Pester` was started from.

If you use this module, `cd` to where you want the output first.

## Tests

`Resources/SvgToReact.Tests.ps1`, 154 lines — the second module whose suite
lives under `Resources/`. It runs inside a sandbox and loads the module from
`$PSScriptRoot` rather than from the current directory, which is what keeps
the two relative paths above from escaping.

```powershell
./Invoke-Tests.ps1 -Path 'QDtb.SvgToReact'
```

There is also a loose script that does a related job —
`powershell/Scripts/svgtoico.ps1` — and `rsc_ex.ps1` / `rsc_ex.ts` are an
example pair for this module's output.
