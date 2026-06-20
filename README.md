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

## 常见问题

### 1. 端口冲突：3306 被本地 MySQL 占用

如果本地已安装 MySQL，Docker 容器可能无法绑定 3306 端口。已在 `docker-compose.yml` 中将 MySQL 映射为 `3307:3306`，不影响容器内部通信。

### 2. SQL 初始化顺序

`init-db/` 下的文件按字母顺序执行：
- `01-schema.sql`：先建表
- `02-data.sql`：后插入数据

**请勿随意修改文件名顺序**，否则会导致 "Table doesn't exist" 错误。

### 3. 前端 `node_modules` 平台不兼容

`.dockerignore` 已配置排除本地 `node_modules`，确保容器内重新安装 Linux 版本的依赖。如果前端容器报错 `Cannot find module`，请检查 `.dockerignore` 是否存在。

### 4. 前端 API 请求地址

前端通过环境变量 `VITE_API_BASE_URL` 连接后端，默认值为 `http://localhost:8080`。如需修改，可在 `docker-compose.yml` 的 `frontend` 服务中调整。

---

## 提交代码注意事项

以下文件必须提交到 Git：
- `docker-compose.yml`
- `Dockerfile`
- `TravelSystem/Dockerfile`
- `init-db/` 下的 SQL 文件

以下文件**不应提交**（已配置 `.gitignore`）：
- `node_modules/`
- `dist/`
- `TravelSystem/target/`
- `.env.local`
