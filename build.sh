#!/bin/bash

# Attack_login 交叉编译脚本
# 支持编译到多个操作系统和架构
# 公众号：知攻善防实验室
# 开发者：ChinaRan404

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 项目名称
PROJECT_NAME="attack_login"
VERSION=${VERSION:-"1.0.0"}

# 输出目录
OUTPUT_DIR="build"
mkdir -p ${OUTPUT_DIR}

# 编译目标平台列表
# 格式: OS/ARCH
PLATFORMS=(
    "linux/amd64"
    "linux/arm64"
    "windows/amd64"
    "windows/arm64"
    "darwin/amd64"
    "darwin/arm64"
)

echo -e "${GREEN}开始交叉编译 ${PROJECT_NAME} v${VERSION}${NC}"
echo ""

# 编译函数
build() {
    local os=$1
    local arch=$2
    local output_name="${PROJECT_NAME}"
    
    # Windows 平台使用 .exe 后缀
    if [ "$os" = "windows" ]; then
        output_name="${output_name}.exe"
    fi
    
    local output_path="${OUTPUT_DIR}/${PROJECT_NAME}-${os}-${arch}-${VERSION}"
    mkdir -p "${output_path}"
    
    echo -e "${YELLOW}正在编译: ${os}/${arch}${NC}"
    
    # 设置环境变量并编译
    GOOS=${os} GOARCH=${arch} go build \
        -ldflags "-s -w -X main.version=${VERSION}" \
        -o "${output_path}/${output_name}" \
        .
    
    # 复制必要的文件
    if [ -d "web" ]; then
        cp -r web "${output_path}/"
    fi
    
    if [ -f "README.md" ]; then
        cp README.md "${output_path}/"
    fi
    
    if [ -f "example.csv" ]; then
        cp example.csv "${output_path}/"
    fi
    
    # 创建压缩包
    cd ${OUTPUT_DIR}
    if [ "$os" = "windows" ]; then
        zip -r "${PROJECT_NAME}-${os}-${arch}-${VERSION}.zip" "${PROJECT_NAME}-${os}-${arch}-${VERSION}" > /dev/null
    else
        tar -czf "${PROJECT_NAME}-${os}-${arch}-${VERSION}.tar.gz" "${PROJECT_NAME}-${os}-${arch}-${VERSION}" > /dev/null
    fi
    cd ..
    
    echo -e "${GREEN}✓ 完成: ${os}/${arch} -> ${output_path}${NC}"
    echo ""
}

# 显示帮助信息
show_help() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help      显示帮助信息"
    echo "  -v, --version   设置版本号 (默认: 1.0.0)"
    echo "  -p, --platform  指定平台 (格式: os/arch, 例如: linux/amd64)"
    echo "  -a, --all       编译所有平台 (默认)"
    echo "  -c, --clean     清理构建目录"
    echo ""
    echo "示例:"
    echo "  $0                          # 编译所有平台"
    echo "  $0 -p linux/amd64          # 只编译 Linux amd64"
    echo "  $0 -v 1.1.0                # 使用版本号 1.1.0 编译"
    echo "  $0 -c                       # 清理构建目录"
}

# 清理函数
clean() {
    echo -e "${YELLOW}清理构建目录...${NC}"
    rm -rf ${OUTPUT_DIR}
    echo -e "${GREEN}✓ 清理完成${NC}"
}

# 解析参数
CLEAN=false
SPECIFIC_PLATFORM=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -v|--version)
            VERSION="$2"
            shift 2
            ;;
        -p|--platform)
            SPECIFIC_PLATFORM="$2"
            shift 2
            ;;
        -a|--all)
            shift
            ;;
        -c|--clean)
            CLEAN=true
            shift
            ;;
        *)
            echo -e "${RED}未知参数: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# 执行清理
if [ "$CLEAN" = true ]; then
    clean
    exit 0
fi

# 检查 Go 环境
if ! command -v go &> /dev/null; then
    echo -e "${RED}错误: 未找到 Go 编译器${NC}"
    exit 1
fi

# 编译
if [ -n "$SPECIFIC_PLATFORM" ]; then
    # 编译指定平台
    IFS='/' read -r os arch <<< "$SPECIFIC_PLATFORM"
    if [ -z "$os" ] || [ -z "$arch" ]; then
        echo -e "${RED}错误: 平台格式不正确，应为 os/arch${NC}"
        exit 1
    fi
    build "$os" "$arch"
else
    # 编译所有平台
    for platform in "${PLATFORMS[@]}"; do
        IFS='/' read -r os arch <<< "$platform"
        build "$os" "$arch"
    done
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}所有编译完成！${NC}"
echo -e "${GREEN}输出目录: ${OUTPUT_DIR}${NC}"
echo -e "${GREEN}========================================${NC}"

