@echo off
chcp 65001 >nul
echo ===================================
echo  正在提交 Vue Travel 项目...
echo ===================================

REM 切换到项目目录
cd /d "D:\Users\mcj51\source\repos\vue-travel"
if errorlevel 1 (
    echo [错误] 无法切换到项目目录！
    pause
    exit /b 1
)

echo.
echo  当前状态：
git status --short
if errorlevel 1 (
    echo [错误] Git 命令执行失败，请检查 Git 是否安装并添加到环境变量！
    pause
    exit /b 1
)

echo.
echo  添加所有更改...
git add .
if errorlevel 1 (
    echo [错误] git add 失败！
    pause
    exit /b 1
)

echo.
set /p msg=" 输入提交信息（直接回车使用默认信息）："
if "%msg%"=="" set msg=update: %date% %time%

echo.
echo  提交代码：%msg%
git commit -m "%msg%"
if errorlevel 1 (
    echo [警告] git commit 失败（可能没有要提交的更改）
)

echo.
echo  推送到 GitHub...
git push origin main
if errorlevel 1 (
    echo [错误] git push 失败！
    pause
    exit /b 1
)

echo.
echo ===================================
echo  完成！代码已推送到 GitHub
echo ===================================
pause
