#!/usr/bin/env pwsh
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function U {
  param([int[]]$cps)
  return -join ($cps | ForEach-Object { [char]$_ })
}

function Get-TagsDesc {
  $raw = git tag --list --sort=-creatordate | Out-String
  $lines = $raw -split "`r?`n" | Where-Object { $_ -and $_.Trim() -ne '' }
  return ,$lines
}

function Get-TagDate([string]$tag) {
  if (-not $tag) { return '' }
  $date = git log -1 --date=short --pretty=format:%ad $tag | Out-String
  return $date.Trim()
}

function Parse-Subject([string]$subject) {
  $o = [ordered]@{ Type = 'other'; Breaking = $false; Desc = $subject }
  if ($subject -match '^(?<type>feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(?<bang>!)?(\([^)]+\))?:\s*(?<desc>.+)$') {
    $o.Type = $Matches['type']
    $o.Breaking = [bool]$Matches['bang']
    $o.Desc = $Matches['desc']
  } elseif ($subject -match '^(?i)merge') {
    $o.Type = 'merge'
  }
  return [pscustomobject]$o
}

$L_ChangeLog = U 0x66F4,0x65B0,0x65E5,0x5FD7   # 更新日志
$L_Unreleased = U 0x672A,0x53D1,0x5E03         # 未发布
$L_Breaking   = U 0x7834,0x574F,0x6027,0x53D8,0x66F4 # 破坏性变更
$L_Other      = U 0x5176,0x4ED6               # 其他
$L_NoEntries  = U 0x65E0,0x53D8,0x66F4,0x6761,0x76EE # 无变更条目

$categoryLabels = [ordered]@{
  feat     = (U 0x65B0,0x529F,0x80FD) # 新功能
  fix      = (U 0x4FEE,0x590D)       # 修复
  perf     = (U 0x6027,0x80FD)       # 性能
  refactor = (U 0x91CD,0x6784)       # 重构
  docs     = (U 0x6587,0x6863)       # 文档
  test     = (U 0x6D4B,0x8BD5)       # 测试
  style    = (U 0x6837,0x5F0F)       # 样式
  build    = (U 0x6784,0x5EFA)       # 构建
  ci       = 'CI'
  revert   = (U 0x56DE,0x9000)       # 回退
  chore    = (U 0x6742,0x9879)       # 杂项
  merge    = (U 0x5408,0x5E76)       # 合并
  other    = (U 0x5176,0x4ED6)       # 其他
}

function Get-Commits([string]$rangeSpec) {
  $format = '%h|%ad|%s|%an'
  $pretty = "--pretty=format:$format"
  $args = @()
  if ($rangeSpec -and $rangeSpec.Trim() -ne '') { $args += $rangeSpec }
  $args += @('--no-merges','--date=short', $pretty)
  $raw = & git log @args 2>$null | Out-String
  if (-not $raw) { return @() }
  $lines = $raw -split "`r?`n" | Where-Object { $_ -and $_.Trim() -ne '' }
  $result = @()
  foreach ($line in $lines) {
    $parts = $line -split '\|', 4
    if ($parts.Count -lt 4) { continue }
    $hash = $parts[0]
    $date = $parts[1]
    $subject = $parts[2]
    $author = $parts[3]
    $p = Parse-Subject $subject
    $result += [pscustomobject]@{
      Hash = $hash
      Date = $date
      Subject = $subject
      Author = $author
      Type = $p.Type
      Desc = $p.Desc
      Breaking = $p.Breaking
    }
  }
  return $result
}

function Format-Section([string]$title, $commits) {
  if (-not $commits -or $commits.Count -eq 0) { return @() }
  $out = @("## $title")
  foreach ($kv in $categoryLabels.GetEnumerator()) {
    $catKey = $kv.Key; $catLabel = $kv.Value
    $items = $commits | Where-Object { $_.Type -eq $catKey }
    if (-not $items -or $items.Count -eq 0) { continue }
    $out += ""
    $out += "- ${catLabel}:"
    foreach ($c in $items) {
      $breakingMark = if ($c.Breaking) { " [${L_Breaking}]" } else { '' }
      $desc = $c.Desc
      if ([string]::IsNullOrWhiteSpace($desc)) { $desc = $c.Subject }
      $out += "  - $desc$breakingMark ($($c.Hash))"
    }
  }
  $others = $commits | Where-Object { -not $categoryLabels.Contains($_.Type) }
  if ($others -and @($others).Count -gt 0) {
    $out += ""
    $out += "- ${L_Other}:"
    foreach ($c in $others) {
      $out += "  - $($c.Subject) ($($c.Hash))"
    }
  }
  $out += ""
  return ,$out
}

function New-Changelog {
  $tags = Get-TagsDesc
  $output = @("# ${L_ChangeLog}", '')

  if ($tags.Count -gt 0) {
    $latest = $tags[0]
    $ahead = (& git rev-list "$latest..HEAD" --count 2>$null).Trim()
    if ($ahead -and [int]$ahead -gt 0) {
      $unreleased = Get-Commits "$latest..HEAD"
      $output += Format-Section $L_Unreleased $unreleased
    }
  }

  for ($i = 0; $i -lt $tags.Count; $i++) {
    $tag = $tags[$i]
    $date = Get-TagDate $tag
    $title = if ($date) { "$tag - $date" } else { $tag }
    if ($i -lt $tags.Count - 1) {
      $next = $tags[$i + 1]
      $commits = Get-Commits "$next..$tag"
    } else {
      $commits = Get-Commits $tag
    }
    $section = Format-Section $title $commits
    if ($section -and @($section).Count -gt 0) {
      $output += $section
    } else {
      $output += @("## $title", '', "- ${L_Other}:", "  - (${L_NoEntries})", '')
    }
  }

  Set-Content -Path (Join-Path (Get-Location) 'CHANGELOG.md') -Value $output -Encoding utf8BOM
}

New-Changelog

