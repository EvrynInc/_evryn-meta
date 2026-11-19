@echo off
rem open-counsel-thread.cmd <threadId> [sessionId]: lets ONE agent read ONE lawyer's Gmail thread, once, within 10
rem minutes, and only the named session if you give one (Justin's guard Ballot 5 (b), 2026-11-17; QCI finding 9).
rem Justin runs it from the vault; never an agent. Windows asks "Yes".
rem Truncation check: the last line of this file should read FULL FILE LOADED.
if "%~1"=="" (echo usage: open-counsel-thread.cmd ^<threadId^> [sessionId] & pause & exit /b 2)
set NODE_OPTIONS=
set NODE_PATH=
"C:\Program Files\nodejs\node.exe" "%~dp0approve-guards.mjs" open-counsel %1 %2
pause
rem Truncation canary - DO NOT REMOVE: FULL FILE LOADED
