#!/bin/bash
cd "$(dirname "$0")"

echo ""
echo "  ╔═══════════════════════════════════╗"
echo "  ║       AI Studio  启动中...        ║"
echo "  ╚═══════════════════════════════════╝"
echo ""

if [ ! -d "node_modules" ]; then
  echo "📦 首次运行，安装依赖..."
  npm install
  echo ""
fi

echo "🔧 启动后端代理服务器..."
node server.mjs &
SERVER_PID=$!

sleep 1

echo "🎨 启动前端开发服务器..."
npx vite &
VITE_PID=$!

echo ""
echo "  ✅ 全部启动完成！"
echo "     前端: http://localhost:5173"
echo "     后端: http://localhost:3001"
echo ""
echo "  按 Ctrl+C 停止所有服务"
echo ""

cleanup() {
  echo ""
  echo "  🛑 正在停止服务..."
  kill $SERVER_PID 2>/dev/null
  kill $VITE_PID 2>/dev/null
  echo "  ✅ 已停止"
  exit 0
}

trap cleanup SIGINT SIGTERM

wait
