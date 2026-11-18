@echo off
rem release-brake.cmd: releases the scheduled Admiral's runaway brake (review finding 10). Justin runs it from the vault;
rem never an agent. Windows asks "Yes".
rem Truncation check: the last line of this file should read FULL FILE LOADED.
"C:\Program Files\nodejs\node.exe" "%~dp0approve-guards.mjs" release-brake
pause
rem Truncation canary - DO NOT REMOVE: FULL FILE LOADED
