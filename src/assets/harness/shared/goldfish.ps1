<#
.SYNOPSIS
  Goldfish para Cline: revisor con contexto aislado y solo lectura.

.DESCRIPTION
  Cline no tiene subagentes, así que el aislamiento se logra con un proceso
  nuevo por revisión (modo plan, sin auto-approve). Este script arma el
  handoff según ~/.agents/HANDOFF.md, corre Cline y extrae el veredicto.

  Limitación real: en Cline el "read-only" no se enforza, se pide. Un revisor
  que puede escribir no es un goldfish; verificá el diff después de correrlo.

.EXAMPLE
  pwsh ~/.agents/goldfish.ps1 -Spec "La fórmula canónica es x = 1 - comp/propio" -Repo C:\ruta\repo
#>
[CmdletBinding()]
param(
  [string]$Repo = (Get-Location).Path,
  [Parameter(Mandatory = $true)][string]$Spec,
  [string]$Diff,
  [string]$Out,
  [string]$Model
)

$ErrorActionPreference = 'Stop'

function Get-RepoDiff {
  param([string]$Path)
  $diff = git -C $Path diff 2>$null
  if (-not $diff) { throw "No hay diff en $Path (¿sin cambios sin commitear?). Pasá -Diff explícito." }
  return ($diff -join "`n")
}

function New-HandoffPrompt {
  param([string]$Path, [string]$Criterion, [string]$Patch)
  return @"
REPO: $Path
OBJETIVO: revisar el diff de abajo y reportar defectos reales.
CONTEXTO MÍNIMO: $Criterion
RESTRICCIONES: solo lectura. No edites, no escribas archivos, no corras comandos que modifiquen nada, no instales dependencias.
CRITERIO DE ACEPTACIÓN: un hallazgo es crítico solo si podés mostrar la evidencia concreta (archivo:línea y por qué es incorrecto).
SALIDA ESPERADA: exactamente este esquema, sin texto extra alrededor.
VEREDICTO: APROBADO | CONDICIONAL | RECHAZADO
CRÍTICOS: <n> | ninguno
  - [archivo:línea] <hallazgo> — <evidencia>
ADVERTENCIAS: <n> | ninguna
NO VERIFICADO: <qué no pudiste comprobar y por qué>

DIFF:
$Patch
"@
}

function Invoke-ClineReview {
  param([string]$Path, [string]$Prompt, [string]$ModelId)
  $args = @('--plan', '--auto-approve', 'false', '--cwd', $Path)
  if ($ModelId) { $args += @('--model', $ModelId) }
  $raw = & cline @args $Prompt 2>&1 | Out-String
  if ($LASTEXITCODE -ne 0) { throw "cline falló (exit $LASTEXITCODE):`n$raw" }
  return $raw
}

function Select-Verdict {
  param([string]$Raw)
  $clean = $Raw -replace '\x1b\[[0-9;]*[A-Za-z]', ''
  # El modelo a veces escribe un borrador del veredicto antes del final: nos
  # quedamos con la última aparición, que es la respuesta definitiva.
  $last = $clean.LastIndexOf('VEREDICTO:')
  if ($last -ge 0) { return $clean.Substring($last).Trim() }
  return $clean.Trim()
}

if (-not $Diff) { $Diff = Get-RepoDiff -Path $Repo }

$prompt = New-HandoffPrompt -Path $Repo -Criterion $Spec -Patch $Diff
Write-Host "Goldfish (Cline) revisando $Repo..." -ForegroundColor Cyan

$verdict = Select-Verdict -Raw (Invoke-ClineReview -Path $Repo -Prompt $prompt -ModelId $Model)

if ($Out) { $verdict | Set-Content -Path $Out -Encoding utf8; Write-Host "Guardado en $Out" -ForegroundColor DarkGray }
Write-Output $verdict
