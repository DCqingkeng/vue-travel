@echo off
chcp 65001 >nul
echo ===================================
echo 🚀 正在提交 Vue Travel 项目...
echo ===================================
cd /d "D:\Users\mcj51\source\repos\vue-travel"

echo.
echo 📋 当前状态：
"D:\program\Git\cmd\git.exe" status --short

echo.
echo ➕ 添加所有更改...
"D:\program\Git\cmd\git.exe" add .

echo.
set /p msg="📝 输入提交信息（直接回车使用默认信息）："
if "%msg%"=="" set msg="update: %date% %time%"

echo.
echo 💾 提交代码：%msg%
"D:\program\Git\cmd\git.exe" commit -m "%msg%"

echo.
echo 📤 推送到 GitHub...
"D:\program\Git\cmd\git.exe" push origin main

echo.
echo ===================================
echo ✅ 完成！代码已推送到 GitHub
echo ===================================
pause
