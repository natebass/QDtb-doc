---
title: "PodcastDownload"
description: "Download episodes from a local RSS file"
sidebar_label: "PodcastDownload"
sidebar_position: 50
---

# PodcastDownload

> Dowload podcast episodes via RSS.

One exported function. Parses an RSS XML file you already have on disk and
downloads the first *n* episodes out of it.

```powershell
Import-Module PodcastDownload
Save-RSSEpisode -RSSFile ./feed.xml -TargetFolder ~/Podcasts -EpisodeNumber 5
```

## `Save-RSSEpisode`

| Parameter | Type | Meaning |
|---|---|---|
| `-RSSFile` | string | Path to the RSS XML **on disk** |
| `-TargetFolder` | string | Where the files go; created if missing |
| `-EpisodeNumber` | int | How many items to take, from the top of the feed |

The whole body is six lines:

```powershell
[xml]$rss = Get-Content $RSSFile
if (!(Test-Path -Path $targetFolder)) {
    New-Item -ItemType Directory -Path $targetFolder | Out-Null
}
$episodes = $rss.rss.channel.item | Select-Object -First $EpisodeNumber
foreach ($episode in $episodes) {
    Save-Mp3File -episode $episode -targetFolder $TargetFolder
}
```

`[xml]` is PowerShell's XML cast, which turns the document into an object
graph — so `$rss.rss.channel.item` is the item list with no XPath.

:::note[It reads a file, not a URL]
There is no `Invoke-WebRequest` on the feed itself. You fetch the RSS yourself
and hand over the path:

```powershell
Invoke-WebRequest 'https://example.com/feed.xml' -OutFile feed.xml
Save-RSSEpisode -RSSFile feed.xml -TargetFolder ~/Podcasts -EpisodeNumber 3
```
:::

:::warning[The documented defaults are Windows paths that no longer apply]
The comment-based help says `-RSSFile` defaults to
`C:\Users\nateb\Source\Temp\a.xml` and `-TargetFolder` to
`C:\Users\nateb\Source\Temp`, with `-EpisodeNumber` defaulting to 2.

The `param()` block declares no defaults at all. Calling it with no arguments
gets `$null` for all three, and `Get-Content $null` is the error you see. Pass
all three.
:::

## Layout

```text
Podcast Download/
  PodcastDownload.psd1              v0.0.1
  PodcastDownload.psm1              reads PrivateData, then loads Source/**
  Source/Public/RSS.ps1              42 lines — Save-RSSEpisode
  Source/Private/Utility.ps1        162 lines — Save-Mp3File, Convert-ToJpeg
  Test/AllPodcast.Tests.ps1         101 lines
  Readme.md                         empty
```

### The loader reads the manifest

This is the only module here that pulls settings out of its own manifest at
import time:

```powershell
$macroSettings = $ExecutionContext.SessionState.Module.PrivateData
$script:DefaultPath = $macroSettings.DefaultDownloadPath
$script:MaxDownloads = $macroSettings.MaxConcurrentDownloads
```

`PrivateData` in a `.psd1` is a free-form hashtable, and this reads two keys
out of it into module scope. Neither is used by `Save-RSSEpisode` today.

The loader also carries a comment about a bug it fixed: it used to load
`Public` only, and `Save-RSSEpisode` is built out of the helpers in
`Private` — so the public function was there and its private dependency was
not.

## `Save-Mp3File`

The private helper doing the actual work. It sanitises the episode title into
a valid filename, builds the output path, and downloads the enclosure. The
sanitising matters: podcast titles routinely contain `/`, `:` and `?`.

`Utility.ps1` also holds `Convert-ToJpeg`, which converts RAW and other image
formats to JPEG. It is adapted from
[ConvertTo-Jpeg](https://github.com/DavidAnson/ConvertTo-Jpeg) and has nothing
to do with podcasts — it is here because this is where it landed.

## Tests

`Test/AllPodcast.Tests.ps1`, 101 lines, inside a sandbox with the network
mocked.

```powershell
./Invoke-Tests.ps1 -Path 'Podcast Download'
```
