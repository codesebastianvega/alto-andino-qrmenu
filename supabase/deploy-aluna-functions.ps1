$ErrorActionPreference = 'Stop'

$projectRef = 'gqjfjtzsdpslwffbqqyw'
$functions = @(
  'aluna-opening-audit',
  'aluna-agent-action',
  'aluna-agent-chat',
  'aluna-kitchen-action',
  'aluna-operations-action',
  'aluna-brand-web-action',
  'aluna-catalog-management-action',
  'aluna-venue-action'
)

foreach ($functionName in $functions) {
  $functionPath = Join-Path $PSScriptRoot "functions\$functionName\index.ts"
  if (-not (Test-Path -LiteralPath $functionPath)) {
    Write-Warning "Se omitió $functionName porque todavía no existe localmente."
    continue
  }

  Write-Host "Publicando $functionName..."
  & npx.cmd supabase functions deploy $functionName --project-ref $projectRef --use-api
  if ($LASTEXITCODE -ne 0) {
    throw "Falló el despliegue de $functionName. Corrige la sesión o el error antes de continuar."
  }
}

Write-Host 'Todas las funciones disponibles de Aluna fueron publicadas.'
