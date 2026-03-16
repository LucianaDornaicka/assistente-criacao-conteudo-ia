# iniciar.ps1 — Carrega as variáveis de ambiente do .env para a sessão atual do PowerShell
# Uso: . .\iniciar.ps1  (o ponto no início é obrigatório para carregar na sessão atual)

$envFile = Join-Path $PSScriptRoot ".env"

if (-not (Test-Path $envFile)) {
    $dir = $PSScriptRoot
    for ($i = 0; $i -lt 3; $i++) {
        $dir = Split-Path $dir -Parent
        $candidate = Join-Path $dir ".env"
        if (Test-Path $candidate) {
            $envFile = $candidate
            break
        }
    }
}

if (-not (Test-Path $envFile)) {
    Write-Host "❌ Arquivo .env não encontrado." -ForegroundColor Red
    return
}

$carregadas = 0
Get-Content $envFile | ForEach-Object {
    $linha = $_.Trim()
    if ($linha -and -not $linha.StartsWith("#")) {
        $partes = $linha -split "=", 2
        if ($partes.Length -eq 2) {
            $nome  = $partes[0].Trim()
            $valor = $partes[1].Trim().Trim('"').Trim("'")
            [System.Environment]::SetEnvironmentVariable($nome, $valor, "Process")
            $carregadas++
        }
    }
}

Write-Host "✅ $carregadas variáveis carregadas do .env para esta sessão." -ForegroundColor Green
Write-Host "   Arquivo: $envFile" -ForegroundColor DarkGray
