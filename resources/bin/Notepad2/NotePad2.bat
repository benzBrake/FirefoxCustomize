@echo off

%1 %2
ver|find "5.">nul&&goto :st
mshta vbscript:createobject("shell.application").shellexecute("%~s0","goto :st","","runas",1)(window.close)&goto :eof
:st
copy "%~0" "%windir%\system32\" 

@echo off
set regkey=HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Image File Execution Options\notepad.exe
reg add "%regkey%" /v "test" /f 1>nul 2>nul && (reg delete "%regkey%" /v "test" /f) || (echo.&echo.&echo 缺少权限，请右键点击此脚本，选择“以管理员身份运行”。&pause>nul&exit)

:begin
cls
for /L %%i in (1,1,5) do echo.
set num=0
reg query "%regkey%" /v "Debugger" 1>nul 2>nul && goto undo || goto done

:done
set /P num=默认记事本替换为NotePad2[未开启]，是否开启？（ 1--是，其他--否 ） :
echo %num%
if %num% equ 1 reg add "%regkey%" /v "Debugger" /d "\"%~dp0Notepad2.exe\" /z" /f
goto begin

:undo
set /P num=默认记事本替换为NotePad2[已开启]，是否取消？（ 1--是，其他--否 ） :
echo %num%
if %num% equ 1 reg delete "%regkey%" /f
goto begin
＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝