# Implementation Plan: Android TV Compatibility

## Overview

本实现计划将 Android TV 兼容性功能分解为可执行的编码任务。采用渐进式实现策略，先建立核心基础设施（TV 模式上下文和样式系统），然后逐步增强各个组件的 TV 模式支持。

## Tasks

- [x] 1. 建立 TV 模式核心基础设施

  - [x] 1.1 创建 TVModeProvider 上下文组件

    - 创建 `src/components/tv/TVModeProvider.tsx`
    - 实现 TV 模式状态管理（isTVMode, setTVMode）
    - 实现 localStorage 持久化
    - 在 document.documentElement 上设置 data-tv-mode 属性
    - _Requirements: 1.2, 1.3, 1.4_

  - [ ]\* 1.2 编写 TVModeProvider 属性测试

    - **Property 1: TV Mode State Persistence Round-Trip**
    - **Property 2: TV Mode Toggle State Inversion**
    - **Validates: Requirements 1.2, 1.3, 1.4**

  - [x] 1.3 创建 TV 模式专用样式文件

    - 创建 `src/styles/tv-mode.css`
    - 定义 CSS 变量（过扫描边距、字体缩放、焦点样式等）
    - 实现焦点环样式
    - 实现 hover 效果禁用
    - _Requirements: 8.1, 8.3, 8.6_

  - [ ]\* 1.4 编写 TV 模式样式属性测试

    - **Property 12: TV Mode Visual Style Application**
    - **Validates: Requirements 8.1, 8.3, 8.6**

  - [x] 1.5 集成 TVModeProvider 到应用根布局
    - 修改 `src/app/layout.tsx` 引入 TVModeProvider
    - 引入 tv-mode.css 样式文件
    - _Requirements: 1.1_

- [x] 2. Checkpoint - 确保 TV 模式基础设施正常工作

  - 确保所有测试通过，如有问题请询问用户

- [x] 3. 实现 TV 模式切换 UI

  - [x] 3.1 创建 TVModeToggle 组件

    - 创建 `src/components/tv/TVModeToggle.tsx`
    - 实现切换按钮 UI（图标 + 文字）
    - 连接 TVModeProvider 上下文
    - _Requirements: 1.1, 1.2_

  - [x] 3.2 将 TVModeToggle 添加到用户设置菜单
    - 修改 `src/components/UserMenu.tsx` 添加 TV 模式切换选项
    - _Requirements: 1.1, 1.6_

- [x] 4. 实现 D-Pad 导航系统

  - [x] 4.1 创建 useTVNavigation Hook

    - 创建 `src/components/tv/useTVNavigation.ts`
    - 实现空间导航算法（findNextFocusableElement）
    - 实现距离计算函数（calculateDistance）
    - 实现全局键盘事件监听
    - _Requirements: 2.1, 2.2, 2.5, 2.6, 2.7_

  - [ ]\* 4.2 编写空间导航属性测试

    - **Property 5: Spatial Navigation Correctness**
    - **Validates: Requirements 2.2, 2.7**

  - [x] 4.3 创建 TV 焦点管理工具函数

    - 创建 `src/lib/tv-utils.ts`
    - 实现 getFocusableElements 函数
    - 实现 scrollIntoViewIfNeeded 函数
    - 实现 isInputElement 检测函数
    - _Requirements: 2.4, 2.6_

  - [ ]\* 4.4 编写焦点可见性属性测试
    - **Property 6: Focus Visibility**
    - **Validates: Requirements 2.4**

- [x] 5. Checkpoint - 确保 D-Pad 导航系统正常工作

  - 确保所有测试通过，如有问题请询问用户

- [x] 6. 增强 VideoCard 组件 TV 模式支持

  - [x] 6.1 为 VideoCard 添加 TV 模式焦点支持

    - 修改 `src/components/VideoCard.tsx`
    - 添加 data-tv-focusable 属性
    - 添加 tabIndex 支持
    - 应用 TV 模式焦点样式
    - _Requirements: 3.1, 3.2, 3.6_

  - [ ]\* 6.2 编写 VideoCard 焦点样式属性测试

    - **Property 8: Focus State Styling Consistency**
    - **Validates: Requirements 3.1**

  - [x] 6.3 实现 VideoCard 网格 TV 导航

    - 确保网格布局支持行列导航
    - 实现自动滚动到焦点元素
    - _Requirements: 3.3, 3.4_

  - [ ]\* 6.4 编写 VideoCard 网格导航属性测试
    - **Property 9: VideoCard Grid Navigation**
    - **Validates: Requirements 3.3**

- [x] 7. 增强 EpisodeSelector 组件 TV 模式支持

  - [x] 7.1 为 EpisodeSelector 添加 TV 模式支持

    - 修改 `src/components/EpisodeSelector.tsx`
    - 为集数按钮添加 tabIndex 和焦点样式
    - 实现 Tab 切换的 D-Pad 左右键支持
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.6_

  - [ ]\* 7.2 编写 EpisodeSelector Tab 导航属性测试
    - **Property 15: Tab Navigation in EpisodeSelector**
    - **Validates: Requirements 4.5**

- [x] 8. 实现播放器 TV 控制

  - [x] 8.1 为播放器添加 TV 模式 D-Pad 控制

    - 修改 `src/app/play/page.tsx`
    - 实现 D-Pad 方向键控制（快进/快退/音量）
    - 实现 Enter 键播放/暂停
    - 实现长按快进/快退
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]\* 8.2 编写播放器 D-Pad 控制属性测试

    - **Property 10: Player D-Pad Control Accuracy**
    - **Validates: Requirements 5.2, 5.3, 5.4, 5.5**

  - [x] 8.3 实现视频结束后的下一集提示
    - 在视频结束时显示下一集提示
    - 自动聚焦到下一集按钮
    - _Requirements: 5.7_

- [x] 9. Checkpoint - 确保组件 TV 模式增强正常工作

  - 确保所有测试通过，如有问题请询问用户

- [x] 10. 实现 TV 导航抽屉

  - [x] 10.1 创建 TVNavigationDrawer 组件

    - 创建 `src/components/tv/TVNavigationDrawer.tsx`
    - 实现从左侧滑入的覆盖层
    - 实现 D-Pad 上下导航
    - 实现 Enter 选择和 Back/Right 关闭
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]\* 10.2 编写导航抽屉 D-Pad 行为属性测试

    - **Property 11: Navigation Drawer D-Pad Behavior**
    - **Validates: Requirements 7.3, 7.4, 7.5**

  - [x] 10.3 集成 TVNavigationDrawer 到 PageLayout
    - 修改 `src/components/PageLayout.tsx`
    - 在 TV 模式下隐藏 Sidebar 和 MobileBottomNav
    - 实现 D-Pad 左键打开导航抽屉
    - _Requirements: 7.1, 7.6_

- [x] 11. 实现搜索功能 TV 优化

  - [x] 11.1 优化搜索页面 TV 模式体验

    - 修改 `src/app/search/page.tsx`
    - 实现搜索结果自动聚焦
    - 优化搜索输入框 TV 模式交互
    - _Requirements: 6.1, 6.4, 6.5_

  - [ ]\* 11.2 编写搜索结果自动聚焦属性测试
    - **Property 16: Search Results Auto-Focus**
    - **Validates: Requirements 6.5**

- [x] 12. 实现返回键处理

  - [x] 12.1 创建全局返回键处理逻辑

    - 在 useTVNavigation 中添加 Back 键处理
    - 实现模态/覆盖层优先关闭
    - 实现页面返回导航
    - _Requirements: 11.1, 11.2, 11.3_

  - [ ]\* 12.2 编写 Back 键模态优先级属性测试

    - **Property 13: Back Key Modal Priority**
    - **Validates: Requirements 11.1**

  - [x] 12.3 实现首页退出确认对话框
    - 在首页按 Back 键时显示退出确认
    - 实现确认/取消逻辑
    - _Requirements: 11.4, 11.5, 11.6_

- [ ] 13. 实现性能优化

  - [ ] 13.1 禁用 TV 模式下的装饰元素

    - 修改 `src/app/layout.tsx`
    - 在 TV 模式下不渲染 FloatingShapes
    - _Requirements: 10.4_

  - [ ]\* 13.2 编写装饰元素禁用属性测试

    - **Property 14: Decorative Elements Disabled in TV Mode**
    - **Validates: Requirements 10.4**

  - [ ] 13.3 实现图片懒加载优化
    - 确保 TV 模式下图片使用 loading="lazy"
    - _Requirements: 10.2_

- [x] 14. 实现模式隔离验证

  - [x] 14.1 确保模式切换完全隔离

    - 验证切换到普通模式时所有 TV 特性移除
    - 验证 TV 模式不影响普通模式功能
    - _Requirements: 9.1, 9.4, 9.6_

  - [ ]\* 14.2 编写模式隔离完整性属性测试
    - **Property 3: Mode Isolation Completeness**
    - **Validates: Requirements 1.5, 9.1, 9.4**

- [ ] 15. Final Checkpoint - 确保所有功能正常工作
  - 确保所有测试通过，如有问题请询问用户
  - 在 BrowseHere 浏览器上进行端到端测试

## Notes

- 任务标记 `*` 的为可选测试任务，可跳过以加快 MVP 开发
- 每个任务引用了具体的需求编号以便追溯
- Checkpoint 任务用于阶段性验证，确保增量开发的稳定性
- 属性测试验证通用正确性属性，确保功能在各种输入下都能正确工作
