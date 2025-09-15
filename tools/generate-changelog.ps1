#!/usr/bin/env pwsh
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$script = Join-Path $PSScriptRoot 'generate-changelog.zh.ps1'
if (-not (Test-Path $script)) {
  throw "Missing script: $script"
}
& $script

