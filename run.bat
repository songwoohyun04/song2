@echo off
chcp 65001 > nul
title 스마트 GIF 생성기 실행기

echo ==========================================================
echo        [스마트 GIF 생성기] 프로그램을 시작합니다.
echo ==========================================================

where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo 파이썬 환경을 감지했습니다. 로컬 서버를 통해 실행합니다...
    python app.py
) else (
    where py >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo 파이썬 런처를 감지했습니다. 로컬 서버를 통해 실행합니다...
        py app.py
    ) else (
        echo 파이썬 환경이 감지되지 않아 기본 웹 브라우저로 바로 실행합니다...
        start "" "%~dp0index.html"
    )
)

pause

