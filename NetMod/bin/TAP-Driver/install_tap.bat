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

 "%tap_dir%tapinstall.exe" install "%tap_dir%oemvista.inf" tap0901
     if not "%ERRORLEVEL%"=="0" (
        exit /b %ERRORLEVEL%
    )