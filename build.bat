@echo off
REM Attack_login Windows 交叉编译脚本
REM 公众号：知攻善防实验室
REM 开发者：ChinaRan404

setlocal enabledelayedexpansion

set PROJECT_NAME=attack_login
set VERSION=%VERSION%
if "%VERSION%"=="" set VERSION=1.0.0
set OUTPUT_DIR=build

if not exist %OUTPUT_DIR% mkdir %OUTPUT_DIR%

echo 开始交叉编译 %PROJECT_NAME% v%VERSION%
echo.

REM 编译目标平台
set PLATFORMS=linux/amd64 linux/arm64 windows/amd64 windows/arm64 darwin/amd64 darwin/arm64

for %%p in (%PLATFORMS%) do (
    for /f "tokens=1,2 delims=/" %%o in ("%%p") do (
        set OS=%%o
        set ARCH=%%a
        
        echo 正在编译: !OS!/!ARCH!
        
        set OUTPUT_NAME=%PROJECT_NAME%
        if "!OS!"=="windows" set OUTPUT_NAME=%PROJECT_NAME%.exe
        
        set OUTPUT_PATH=%OUTPUT_DIR%\%PROJECT_NAME%-!OS!-!ARCH!-%VERSION%
        if not exist !OUTPUT_PATH! mkdir !OUTPUT_PATH!
        
        set GOOS=!OS!
        set GOARCH=!ARCH!
        go build -ldflags "-s -w -X main.version=%VERSION%" -o !OUTPUT_PATH!\!OUTPUT_NAME! .
        
        REM 复制文件
        if exist web xcopy /E /I /Y web !OUTPUT_PATH!\web
        if exist README.md copy /Y README.md !OUTPUT_PATH!\
        if exist example.csv copy /Y example.csv !OUTPUT_PATH!\
        
        echo ✓ 完成: !OS!/!ARCH! -^> !OUTPUT_PATH!
        echo.
    )
)

echo ========================================
echo 所有编译完成！
echo 输出目录: %OUTPUT_DIR%
echo ========================================

pause

