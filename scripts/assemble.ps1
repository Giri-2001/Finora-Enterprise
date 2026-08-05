param(
    [Parameter(Mandatory = $true)]
    [string]$Module
)

$ProjectRoot = Split-Path $PSScriptRoot -Parent

$AssemblyRoot = Join-Path $ProjectRoot "assembly"
$ModulePath = Join-Path $AssemblyRoot $Module

$DestinationMap = @{
    "CustomerOffice" = "app\renderer\v2\components\customers\office\CustomerOffice"
}

Write-Host ""
Write-Host "========================================"
Write-Host " FINORA ENTERPRISE ASSEMBLER"
Write-Host "========================================"
Write-Host ""

if (!(Test-Path $ModulePath)) {
    Write-Host "[ERROR] Assembly module not found."
    exit
}

if (!$DestinationMap.ContainsKey($Module)) {
    Write-Host "[ERROR] Unknown module."
    exit
}

$Destination = Join-Path $ProjectRoot $DestinationMap[$Module]

Write-Host "Module      : $Module"
Write-Host "Source      : $ModulePath"
Write-Host "Destination : $Destination"

if (Test-Path $Destination) {
    Write-Host ""
    Write-Host "[OK] Destination verified."
}
else {
    Write-Host ""
    Write-Host "[ERROR] Destination does not exist."
}

Write-Host ""
Write-Host "Files to deploy:"
Write-Host "----------------"

$Files = Get-ChildItem `
    -Path $ModulePath `
    -Recurse `
    -File

if ($Files.Count -eq 0) {

    Write-Host "[EMPTY] No files found inside assembly module."

}
else {

    foreach($File in $Files){

        $Relative = $File.FullName.Substring($ModulePath.Length + 1)

        Write-Host " - $Relative"

    }

}
