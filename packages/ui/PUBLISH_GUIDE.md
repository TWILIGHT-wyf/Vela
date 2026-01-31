# @vela/ui 发布指南

## 问题原因

npm 在启用 2FA 后，某些终端环境不会弹出 OTP 输入提示，直接返回 403 Forbidden。

## 解决方案

### 方案 1: 使用 Access Token (推荐)

1. **在 npm 网站生成 token**
   - 访问 https://www.npmjs.com/settings/twi1i9ht/tokens
   - 点击 "Generate New Token" → "Classic Token"
   - 选择类型：**Automation** (自动化部署)
   - 勾选权限：**Publish**
   - 生成后复制 token (以 `npm_` 开头)

2. **配置本地 npm 使用 token**

   ```bash
   # 在项目根目录执行
   echo "//registry.npmjs.org/:_authToken=YOUR_TOKEN_HERE" > .npmrc
   ```

3. **发布**
   ```bash
   cd packages/ui
   npm publish --access public
   ```

### 方案 2: 使用 --otp 参数 (适合手动)

1. 先在手机查看 Authenticator App 的 6 位验证码
2. 在 30 秒内执行：
   ```bash
   cd packages/ui
   npm publish --access public --otp=123456  # 替换为实际验证码
   ```

### 方案 3: 配置 .npmrc 文件 (推荐长期方案)

创建 `C:\Users\TWILIGHT\.npmrc` 文件：

```ini
registry=https://registry.npmjs.org/
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
```

然后设置环境变量：

```bash
set NPM_TOKEN=your_token_here
```

## 验证发布

```bash
# 查看包信息
npm view @vela/ui

# 查看版本
npm view @vela/ui versions
```

## 发布后的更新

发布后，生成的项目可以立即通过以下方式使用：

```bash
# 生成的项目安装依赖时
npm install
# 会自动从 npm 下载 @vela/ui
```

## 故障排除

### 如果还是 403 错误

1. 检查 token 权限是否包含 "Publish"
2. 检查是否使用了正确的 registry: `npm config get registry`
3. 检查包名是否被占用: `npm view @vela/ui`

### 如果 token 泄露

立即在 npm 网站撤销 token 并重新生成。

### 版本号冲突

如果 1.0.0 已存在，需要更新版本号：

```bash
cd packages/ui
npm version patch  # 变成 1.0.1
npm publish --access public
```
