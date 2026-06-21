@echo off
setlocal ENABLEDELAYEDEXPANSION

set "curr_path=%~dp0"

set arch=%PROCESSOR_ARCHITECTURE%

if defined PROCESSOR_ARCHITEW6432 (
    set arch=%PROCESSOR_ARCHITEW6432%
)

if /i "%arch%"=="AMD64" (
    set "tap_dir=%curr_path%x64\"
) else if /i "%arch%"=="ARM64" (
    set "tap_dir=%curr_path%arm64\"
) else if /i %arch%=="x86" (
    set "tap_dir=%curr_path%x86\"
)

for /f "tokens=4-5 delims=.[] " %%a in ('ver') do (
    set major=%%a
)

if !major! GEQ 10 (
    set "tap_dir=%tap_dir%win10\"
)

set "provider=TAP-Windows Provider V9"

"%tap_dir%tapinstall.exe" remove tap0901
if not "%ERRORLEVEL%"=="0" (
      exit /b %ERRORLEVEL%
)

if exist "%SystemRoot%\Sysnative\pnputil.exe" (
    set "pnppath=%SystemRoot%\Sysnative\pnputil.exe"
) else (
    set "pnppath=%SystemRoot%\System32\pnputil.exe"
)

set "tempfile=%temp%\pnputil_output_%random%.txt"
"%pnppath%" -e > "%tempfile%"

set "current_published="
for /f "usebackq tokens=*" %%A in ("%tempfile%") do (
    set "line=%%A"
    
    if "!line:Published name=!" neq "!line!" (
        for /f "tokens=2 delims=:" %%B in ("%%A") do (
            set "current_published=%%B"
            set "current_published=!current_published: =!"
        )
    )
    
    if "!line:Driver package provider=!" neq "!line!" (
        if "!line:%provider%=!" neq "!line!" (
            if defined current_published (
                "%pnppath%" -f -d "!current_published!" >nul 2>&1
                set "current_published="
            )
        )
    )
)

if exist "%tempfile%" del "%tempfile%" >nul 2>&1
exit /b 0