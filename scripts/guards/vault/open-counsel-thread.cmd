@echo off
rem open-counsel-thread.cmd <threadId>: lets ONE agent read ONE lawyer's Gmail thread, once, within 30 minutes
rem (Justin's guard Ballot 5 (b), 2026-11-17). Justin runs it from the vault; never an agent. Windows asks "Yes".
rem Truncation check: the last line of this file should read FULL FILE LOADED.
if "%~1"=="" (echo usage: open-counsel-thread.cmd ^<threadId^> & pause & exit /b 2)
"C:\Program Files\nodejs\node.exe" "%~dp0approve-guards.mjs" open-counsel %1
pause
rem Truncation canary - DO NOT REMOVE: FULL FILE LOADED
