$ErrorActionPreference = 'Stop'

function Find-Executable([string]$Name) {
    $fromPath = Get-Command $Name -ErrorAction SilentlyContinue
    if ($fromPath) { return $fromPath.Source }

    $roots = @(
        $env:LOCALAPPDATA,
        $env:ProgramFiles,
        ${env:ProgramFiles(x86)}
    ) | Where-Object { $_ }

    foreach ($root in $roots) {
        $match = Get-ChildItem -LiteralPath $root -Filter $Name -File -Recurse -ErrorAction SilentlyContinue |
            Select-Object -First 1
        if ($match) { return $match.FullName }
    }

    return $null
}

$figcraft = Find-Executable 'figcraft.exe'
$cli = Find-Executable 'figcraft-cli.exe'

if (-not $figcraft) { throw 'Could not find figcraft.exe.' }
if (-not $cli) { throw 'Could not find figcraft-cli.exe.' }

Write-Host "Found FigCraft: $figcraft"
Write-Host "Found FigCraft CLI: $cli"
Start-Process -FilePath $figcraft -ArgumentList '--control', '7979'
Write-Host "Attach the Codex MCP server with: `"$cli`" mcp --attach 7979"
