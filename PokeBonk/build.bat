@echo off
cd /d "%~dp0"
echo Closing the app if it is running...
taskkill /f /im PokeBonk.exe >nul 2>&1
taskkill /f /im PokeBonkApp.exe >nul 2>&1
timeout /t 2 >nul
if exist dist rmdir /s /q dist
if exist build rmdir /s /q build
py -m pip install pywebview pyinstaller
py -m PyInstaller --onefile --noconsole --name PokeBonkApp --icon pokebonk.ico ^
 --add-data "pokebonk.ico;." --add-data "typedex.json;." --add-data "maps.json;." --add-data "hub.js;." --add-data "rpc_index.json;." ^
 pokebonk.py
if errorlevel 1 goto error
if not exist "dist\PokeBonkApp.exe" goto error
echo.
echo DONE! The new app is here:
echo %~dp0dist\PokeBonkApp.exe
dir "dist\PokeBonkApp.exe" | find "PokeBonkApp.exe"
pause
exit /b 0
:error
echo.
echo ERROR! The app did not build. Take a screenshot of this window and send it.
pause
exit /b 1
