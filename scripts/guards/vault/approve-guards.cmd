@echo off
rem approve-guards.cmd: Justin double-clicks this to approve guard changes into the vault. Never run by an agent.
rem It shows what changes, asks you to type APPROVE, then Windows asks "Yes". Click Yes only because you started this.
rem After the first install, use the vault's own copy: C:\Program Files\ClaudeCode\evryn-guards\approve-guards.cmd
rem Truncation check: the last line of this file should read FULL FILE LOADED.
set NODE_OPTIONS=
set NODE_PATH=
"C:\Program Files\nodejs\node.exe" "%~dp0approve-guards.mjs" stage %*
pause
rem Truncation canary - DO NOT REMOVE: FULL FILE LOADED
