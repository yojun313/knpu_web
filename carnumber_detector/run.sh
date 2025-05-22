#!/bin/bash

# 백엔드 실행
echo "▶ Starting backend..."
cd back || exit
source venv/bin/activate  # 가상환경 활성화
python3 server.py &  # 백그라운드 실행

# 프론트엔드 실행
cd ../front || exit
echo "▶ Starting frontend..."
npm run dev
