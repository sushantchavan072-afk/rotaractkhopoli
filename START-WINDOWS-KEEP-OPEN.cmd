@echo off
rem Starts an additional command window that remains open even if the starter fails.
cd /d "%~dp0"
cmd.exe /k "call ""%~dp0START-WINDOWS.bat"""
