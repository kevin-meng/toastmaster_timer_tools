#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Toastmaster Tools 本地开发环境启动脚本 ===${NC}"

# 1. 启动后端
echo -e "${GREEN}正在准备后端环境...${NC}"
cd backend

# 创建虚拟环境
if [ ! -d "venv" ]; then
    echo "创建 Python 虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
source venv/bin/activate

# 安装依赖
echo "安装/更新后端依赖..."
pip install -r requirements.txt > /dev/null

# 设置环境变量使用 SQLite
export USE_SQLITE=True

# 启动后端
echo -e "${GREEN}启动后端服务 (Port 8000)...${NC}"
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# 等待后端启动
sleep 3

# 2. 启动前端
cd ..
echo -e "${GREEN}正在准备前端环境...${NC}"

# 检查 Node 版本
source ~/.nvm/nvm.sh
nvm use 18

# 安装前端依赖（如果需要）
if [ ! -d "node_modules" ]; then
    echo "安装前端依赖..."
    pnpm install
fi

echo -e "${GREEN}启动前端服务...${NC}"
pnpm dev

# 退出处理
kill $BACKEND_PID
