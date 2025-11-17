# Attack-Login

一个基于 Golang 的网页批量连接工具，用于红队攻防演练中批量测试各种服务的连接。

## 功能特性

- ✅ 支持多种服务类型：Redis、FTP、PostgreSQL、MySQL、RabbitMQ、SSH、MongoDB
- ✅ CSV 批量导入连接信息
- ✅ 手动添加单个连接
- ✅ 批量连接和单个连接测试
- ✅ 按服务类型分类显示
- ✅ 自动检测未授权访问（无密码连接）
- ✅ SSH 连接成功后自动执行 `whoami` 和 `ip addr` 命令
- ✅ 全中文界面
- ✅ 实时连接状态更新

## 安装和运行

### 前置要求

- Go 1.21 或更高版本

### 安装依赖

```bash
go mod download
```

### 运行

```bash
go run main.go
```

服务器将在 `http://localhost:18921` 启动。

### 交叉编译

项目提供了交叉编译脚本，支持编译到多个平台和架构。

#### Linux/macOS 使用 build.sh

```bash
# 编译所有平台
./build.sh

# 编译指定平台
./build.sh -p linux/amd64

# 指定版本号
./build.sh -v 1.1.0

# 清理构建目录
./build.sh -c

# 查看帮助
./build.sh -h
```

#### Windows 使用 build.bat

```cmd
# 编译所有平台
build.bat

# 指定版本号（需要先设置环境变量）
set VERSION=1.1.0
build.bat
```

#### 支持的平台

- Linux (amd64, arm64)
- Windows (amd64, arm64)
- macOS (amd64, arm64)

编译后的文件会输出到 `build/` 目录，包含：
- 可执行文件
- web 目录（前端资源）
- README.md
- example.csv
- 压缩包（.tar.gz 或 .zip）

## CSV 文件格式

CSV 文件应包含以下列（表头必须存在）：

- `Type`: 服务类型（Redis、FTP、PostgreSQL、MySQL、RabbitMQ、SSH、MongoDB）
- `IP`: IP 地址
- `Port`: 端口号
- `User`: 用户名（可选）
- `Pass`: 密码（可选）

示例 CSV 文件：

```csv
Type,IP,Port,User,Pass
Redis,192.168.1.100,6379,,
MySQL,192.168.1.101,3306,root,password123
SSH,192.168.1.102,22,admin,admin123
```

## 使用说明

1. **导入 CSV 文件**：点击"导入连接"标签页，选择 CSV 文件并上传
2. **手动添加**：点击"手动添加"标签页，填写连接信息并添加
3. **查看连接列表**：点击"连接列表"标签页，查看所有连接记录
4. **批量连接**：在连接列表中勾选多个连接，点击"批量连接选中"按钮
5. **单个连接**：点击连接卡片上的"重新连接"按钮
6. **筛选连接**：使用顶部的类型筛选下拉框按服务类型筛选

## 未授权访问检测

工具会自动尝试以下未授权访问方式：

- **Redis**: 无密码连接
- **FTP**: 匿名登录（anonymous/anonymous）
- **PostgreSQL**: 默认用户 postgres 无密码
- **MySQL**: root 用户无密码
- **RabbitMQ**: 默认用户 guest/guest
- **MongoDB**: 无认证连接
- **SSH**: 密钥认证或无密码（需要配置）

## SSH 命令执行

SSH 连接成功后，工具会自动执行以下命令并显示结果：

- `whoami`: 显示当前用户
- `ip addr`: 显示网络接口信息

## 项目结构

```
.
├── main.go                    # 主程序入口
├── go.mod                     # Go 模块定义
├── internal/
│   ├── handlers/             # HTTP 处理器
│   │   └── handler.go
│   ├── models/               # 数据模型
│   │   └── connection.go
│   └── services/             # 业务逻辑
│       ├── connector.go
│       └── connectors.go
└── web/
    ├── templates/            # HTML 模板
    │   └── index.html
    └── static/              # 静态资源
        ├── style.css
        └── script.js
```

## 注意事项

⚠️ **安全提示**：此工具仅用于合法的安全测试和红队演练。请确保您有权限测试目标系统。

## 许可证

MIT License

