# 环境配置指南

## 📋 环境变量配置

创建项目后，你需要配置以下环境变量。请在项目根目录创建 `.env.local` 文件：

```bash
# 创建环境变量文件
cp .env.example .env.local  # 如果有示例文件
# 或者直接创建新文件
touch .env.local
```

## 🔧 必需的环境变量

### Supabase 配置

```env
# 从你的Supabase项目仪表板获取这些值
NEXT_PUBLIC_SUPABASE_URL=your-project-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 应用配置

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## 📍 如何获取Supabase配置值

1. **登录Supabase仪表板**: https://supabase.com/dashboard
2. **选择你的项目**
3. **进入Settings > API**
4. **复制以下信息**:
   - **Project URL**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon (public) key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
   - **Service role (secret) key**: `SUPABASE_SERVICE_ROLE_KEY`

## ⚠️ 安全注意事项

- ✅ `.env.local` 文件已在 `.gitignore` 中，不会被提交到版本控制
- ✅ `NEXT_PUBLIC_` 前缀的变量会暴露给浏览器
- ✅ 服务角色密钥仅用于服务端操作，永不暴露给客户端
- 🔒 生产环境请使用不同的数据库和密钥

## 📁 完整的 .env.local 文件示例

```env
# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 应用配置  
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# 现有AI服务配置 (保持不变)
OPENAI_API_KEY=your-existing-key
OPENROUTER_API_KEY=your-existing-key
```

配置完成后，请重启开发服务器使环境变量生效。