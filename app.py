"""
스마트 GIF 생성기 - 로컬 웹 서버 실행 스크립트
Python 3 내장 라이브러리만 사용하여 추가 패키지 설치 없이 즉시 실행 가능합니다.
"""

import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8080

class CustomHTTPHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Cache-Control 방지 및 CORS 헤더 추가
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

def main():
    # 현재 스크립트 위치로 작업 디렉토리 변경
    current_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(current_dir)

    handler = CustomHTTPHandler
    
    # 포트 자동 탐색 (8080이 이미 사용 중이면 다음 포트 시도)
    port = PORT
    httpd = None
    for p in range(PORT, PORT + 20):
        try:
            httpd = socketserver.TCPServer(("", p), handler)
            port = p
            break
        except OSError:
            continue

    if not httpd:
        print("서버를 시작할 수 있는 포트를 찾지 못했습니다.")
        sys.exit(1)

    url = f"http://localhost:{port}/index.html"
    print("=" * 60)
    print(" [스마트 GIF 생성기] 로컬 웹 서버가 정상적으로 시작되었습니다!")
    print(f" 접속 주소: {url}")
    print(" 웹 브라우저가 자동으로 열립니다.")
    print(" 종료하려면 터미널에서 Ctrl + C 를 누르세요.")
    print("=" * 60)

    # 기본 웹 브라우저 자동 오픈
    try:
        webbrowser.open(url)
    except Exception as e:
        print(f"브라우저 자동 열기 실패: {e}")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n서버를 안전하게 종료합니다.")
        httpd.server_close()

if __name__ == '__main__':
    main()

