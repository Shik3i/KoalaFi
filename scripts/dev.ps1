[Environment]::SetEnvironmentVariable('PATH', $null, 'Process')
Set-Location (Join-Path $PSScriptRoot '..')
npm run dev -- --host 127.0.0.1
