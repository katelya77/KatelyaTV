# 贡献指南

感谢您对 KatelyaTV 项目的关注！我们欢迎所有形式的贡献，包括但不限于：

- 🐛 报告 Bug
- 💡 提出新功能建议
- 📝 改进文档
- 🔧 提交代码修复
- 🎨 改进用户界面
- 🧪 编写测试用例

## 🚀 快速开始

### 环境要求

- Node.js 18+
- pnpm 8+
- Git

### 本地开发设置

1. **Fork 项目**
   ```bash
   # 在 GitHub 上 Fork 本仓库
   # 然后克隆到本地
   git clone https://github.com/YOUR_USERNAME/katelyatv.git
   cd katelyatv
   ```

2. **安装依赖**
   ```bash
   pnpm install
   ```

3. **环境配置**
   ```bash
   # 复制环境变量文件
   cp .env.example .env.local
   
   # 编辑环境变量
   nano .env.local
   ```

4. **启动开发服务器**
   ```bash
   pnpm dev
   ```

5. **访问应用**
   打开浏览器访问 `http://localhost:3000`

## 📋 开发规范

### 代码风格

我们使用以下工具来保持代码质量：

- **ESLint** - 代码质量检查
- **Prettier** - 代码格式化
- **TypeScript** - 类型安全
- **Husky** - Git hooks

### 代码检查

```bash
# 检查代码质量
pnpm lint

# 自动修复代码问题
pnpm lint:fix

# 类型检查
pnpm typecheck

# 运行测试
pnpm test
```

### Git 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```bash
# 功能开发
git commit -m "feat: 添加观看历史记录功能"

# Bug 修复
git commit -m "fix: 修复播放进度记录丢失问题"

# 文档更新
git commit -m "docs: 更新 README.md 部署说明"

# 代码重构
git commit -m "refactor: 重构数据库存储层"

# 性能优化
git commit -m "perf: 优化搜索接口响应速度"

# 测试相关
git commit -m "test: 添加播放记录 API 测试用例"
```

### 分支管理

- `main` - 主分支，用于生产环境
- `develop` - 开发分支，用于功能集成
- `feature/*` - 功能分支，用于开发新功能
- `bugfix/*` - 修复分支，用于修复 Bug
- `hotfix/*` - 热修复分支，用于紧急修复

## 🎯 贡献流程

### 1. 报告 Bug

在提交 Bug 报告之前，请：

1. 搜索现有的 Issues（仓库 Issues 页面）
2. 检查是否已有相关报告
3. 使用 Bug 报告模板

**Bug 报告模板：**

```markdown
## Bug 描述
简要描述 Bug 的现象

## 重现步骤
1. 打开应用
2. 执行操作 A
3. 执行操作 B
4. 观察结果

## 预期行为
描述期望的正确行为

## 实际行为
描述实际发生的错误行为

## 环境信息
- 操作系统：Windows 11 / macOS 14 / Ubuntu 22.04
- 浏览器：Chrome 120 / Firefox 121 / Safari 17
- 设备：桌面 / 移动端
- 存储类型：localStorage / D1

## 截图/日志
如果适用，请提供截图或错误日志

## 其他信息
任何其他相关信息
```

### 2. 功能建议

在提出功能建议之前，请：

1. 搜索现有的 Discussions（仓库 Discussions 页面）
2. 检查是否已有相关讨论
3. 使用功能建议模板

**功能建议模板：**

```markdown
## 功能描述
简要描述您希望添加的功能

## 使用场景
描述在什么情况下这个功能会很有用

## 实现建议
如果有的话，提供实现思路或技术建议

## 替代方案
描述是否已有其他方式可以实现类似功能

## 优先级
- [ ] 高 - 核心功能，影响用户体验
- [ ] 中 - 有用功能，但不是必需的
- [ ] 低 - 锦上添花的功能

## 其他信息
任何其他相关信息
```

### 3. 代码贡献

#### 提交 Pull Request

1. **创建功能分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **开发功能**
   - 编写代码
   - 添加测试用例
   - 更新文档

3. **代码检查**
   ```bash
   pnpm lint
   pnpm typecheck
   pnpm test
   ```

4. **提交代码**
   ```bash
   git add .
   git commit -m "feat: 添加新功能描述"
   ```

5. **推送分支**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **创建 Pull Request**
   - 在 GitHub 上创建 PR
   - 使用 PR 模板
   - 等待代码审查

#### Pull Request 模板

```markdown
## 变更描述
简要描述本次 PR 的变更内容

## 变更类型
- [ ] Bug 修复
- [ ] 新功能
- [ ] 文档更新
- [ ] 代码重构
- [ ] 性能优化
- [ ] 测试相关
- [ ] 其他

## 测试
- [ ] 本地测试通过
- [ ] 添加了新的测试用例
- [ ] 所有测试用例通过

## 检查清单
- [ ] 代码符合项目规范
- [ ] 更新了相关文档
- [ ] 添加了必要的注释
- [ ] 没有引入新的警告
- [ ] 测试覆盖率没有降低

## 相关 Issue
关联的 Issue 编号：#123

## 截图
如果涉及 UI 变更，请提供截图

## 其他信息
任何其他相关信息
```

## 🧪 测试指南

### 运行测试

```bash
# 运行所有测试
pnpm test

# 监听模式运行测试
pnpm test:watch

# 生成测试覆盖率报告
pnpm test:coverage
```

### 编写测试

我们使用 Jest 作为测试框架：

```typescript
import { render, screen } from '@testing-library/react';
import { VideoCard } from '@/components/VideoCard';

describe('VideoCard', () => {
  it('应该正确显示视频标题', () => {
    const mockProps = {
      id: 'test-id',
      title: '测试视频',
      poster: '/test-poster.jpg',
      year: '2024',
      source: 'test-source',
      source_name: '测试源'
    };

    render(<VideoCard {...mockProps} />);
    
    expect(screen.getByText('测试视频')).toBeInTheDocument();
  });
});
```

## 📚 文档指南

### 文档结构

- `README.md` - 项目主要说明文档
- `CHANGELOG.md` - 版本更新日志
- `CONTRIBUTING.md` - 贡献指南
- `docs/` - 详细文档目录

### 文档规范

- 使用清晰的标题层级
- 提供代码示例
- 包含必要的截图
- 保持文档的时效性

## 🔧 开发工具

### 推荐的工具

- **VS Code** - 代码编辑器
- **GitHub Desktop** - Git 图形界面
- **Postman** - API 测试
- **Chrome DevTools** - 浏览器调试

### VS Code 扩展

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

## 🚀 部署测试

### 本地构建测试

```bash
# 构建项目
pnpm build

# 启动生产服务器
pnpm start
```

## 📞 获取帮助

如果您在贡献过程中遇到问题：

1. **查看文档** - 首先查看项目文档
2. **搜索 Issues** - 查找是否有相关问题
3. **创建 Discussion** - 在 Discussions 中提问
4. **提交 Issue** - 如果是 Bug，请提交 Issue

## 🎉 致谢

感谢所有为 KatelyaTV 项目做出贡献的开发者！

您的贡献让这个项目变得更好。无论是代码、文档、测试还是反馈，我们都非常感激。

---

**注意**: 请确保您的贡献符合项目的 MIT 许可证要求。