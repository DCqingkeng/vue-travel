# vue-travel

基于 Vue 3 + Spring Boot + MySQL + Redis 的旅游推荐系统。

## 技术栈

- **前端**：Vue 3 + Vite + Tailwind CSS + Element Plus
- **后端**：Spring Boot + MyBatis + Redis
- **数据库**：MySQL 5.7
- **缓存**：Redis 7

---

## 快速启动（推荐：Docker 一键部署）

### 前置要求

1. 安装 [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. （国内网络）配置 Docker 镜像加速器：
   - 打开 Docker Desktop → Settings → Docker Engine
   - 在 JSON 中添加：
     ```json
     {
       "registry-mirrors": [
         "https://docker.m.daocloud.io",
         "https://docker.mirrors.ustc.edu.cn",
         "https://hub-mirror.c.163.com"
       ]
     }
     ```
   - 点击 Apply & Restart

### 启动步骤

1. 克隆项目后进入根目录：
   ```bash
   cd vue-travel
   ```

2. 一键启动所有服务（MySQL + Redis + 后端 + 前端）：
   ```bash
   docker-compose up --build
   ```
   首次启动需要下载镜像并构建项目，大约需要 5-10 分钟，请耐心等待。

3. 访问应用：
   - 前端页面：`http://localhost:5173`
   - 后端 API：`http://localhost:8080`

### 停止服务

```bash
# 在终端按 Ctrl + C 停止
# 或另开终端执行：
docker-compose down
```

### 完全重置（清空数据库）

```bash
docker-compose down -v
```

---

## 项目目录结构

```text
vue-travel/
├── docker-compose.yml          # Docker 编排配置
├── Dockerfile                    # 前端镜像构建
├── .dockerignore                 # 排除本地 node_modules 等
├── init-db/
│   ├── 01-schema.sql             # 数据库建表语句（先执行）
│   └── 02-data.sql               # 初始数据（后执行）
├── TravelSystem/
│   ├── Dockerfile                # 后端镜像构建
│   ├── pom.xml
│   └── src/...
├── src/                          # 前端源码
├── package.json
└── vite.config.js
```

---

## 手动启动（不使用 Docker）

如果你不想使用 Docker，需要手动确保以下环境：

1. 启动本地 MySQL（端口 3306），创建数据库 `travel` 并导入 `init-db/` 下的 SQL 文件
2. 启动本地 Redis（端口 6379）
3. 启动后端：
   ```bash
   cd TravelSystem
   ./mvnw spring-boot:run
   ```
4. 启动前端：
   ```bash
   npm install
   npm run dev
   ```

---


