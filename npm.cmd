@echo off
setlocal
set "PROJECT_NODE="
for /d %%D in ("%~dp0work\runtime\node-*-win-x64") do set "PROJECT_NODE=%%~fD"
if not defined PROJECT_NODE (
  for /f "delims=" %%D in ('where.exe node.exe 2^>nul') do if not defined PROJECT_NODE set "PROJECT_NODE=%%~dpD"
)
if not defined PROJECT_NODE (
  echo Install Node.js 24 or restore the portable runtime in work\runtime.
  exit /b 1
)
set "PATH=%PROJECT_NODE%;%PATH%"
set "npm_config_cache=%~dp0work\npm-cache"
"%PROJECT_NODE%\node.exe" "%PROJECT_NODE%\node_modules\npm\bin\npm-cli.js" %*
