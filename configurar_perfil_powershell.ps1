# configurar_perfil_powershell.ps1
# Rode UMA UNICA VEZ na raiz do projeto:
#   .\configurar_perfil_powershell.ps1

$caminhoIniciar = Join-Path $PSScriptRoot "iniciar.ps1"
$linhaParaAdicionar = ". '$caminhoIniciar'"

$pastaPerfil = "C:\Users\$env:USERNAME\Documents\WindowsPowerShell"
if (-not (Test-Path $pastaPerfil)) {
    New-Item -ItemType Directory -Force -Path $pastaPerfil
    Write-Host "Pasta criada: $pastaPerfil"
}

$arquivoPerfil = "$pastaPerfil\Microsoft.PowerShell_profile.ps1"
if (-not (Test-Path $arquivoPerfil)) {
    New-Item -Path $arquivoPerfil -ItemType File -Force
    Write-Host "Arquivo de perfil criado: $arquivoPerfil"
}

$conteudo = Get-Content $arquivoPerfil -Raw -ErrorAction SilentlyContinue
if ($conteudo -and $conteudo.Contains($caminhoIniciar)) {
    Write-Host "Perfil ja configurado! Nada a fazer."
    return
}

Add-Content -Path $arquivoPerfil -Value "`n$linhaParaAdicionar"
Write-Host "Perfil configurado com sucesso!"
Write-Host "Feche e reabra o terminal para ativar."
