# 选集点击偏移 Bug 修复

## 问题描述

用户报告在选集界面中，点击第 6 集（紫色框框选中的区域）时，系统错误地选择了第 7 集（绿色填充的区域）。这是一个经典的点击目标偏移问题。

## 根因分析

1. **CSS 网格布局问题**：原来使用 `grid-cols-[repeat(auto-fill,minmax(40px,1fr))]`

   - `1fr` 使每个按钮占据相同的可用空间
   - 这导致视觉按钮大小和实际点击区域不匹配
   - auto-fill 在某些屏幕尺寸下可能导致不可预测的布局

2. **点击事件处理**：原有的点击处理没有足够的事件控制

## 修复方案

### 1. 布局修复

将 CSS 网格布局改为 Flexbox 布局：

```css
/* 原来的布局 */
grid grid-cols-[repeat(auto-fill,minmax(40px,1fr))] auto-rows-[40px] gap-x-3 gap-y-3

/* 修复后的布局 */
flex flex-wrap justify-start gap-3
```

### 2. 按钮尺寸固定

- 设置固定的按钮尺寸：`w-12 h-10`（48px × 40px）
- 添加 `flex-shrink-0` 确保按钮不会收缩
- 使用明确的尺寸避免布局计算错误

### 3. 点击事件优化

```javascript
onClick={(e) => {
  e.preventDefault();
  e.stopPropagation();
  handleEpisodeClick(episodeNumber);
}}
```

- 添加 `preventDefault()` 和 `stopPropagation()` 防止事件冒泡
- 设置 `type="button"` 明确按钮类型
- 添加聚焦样式 `focus:ring-2 focus:ring-green-400`

### 4. 样式改进

- 添加 `border-0 outline-none` 移除默认边框
- 保持悬停和选中状态的视觉反馈
- 确保按钮在所有主题下都有清晰的视觉边界

## 预期效果

修复后，用户点击哪个集数按钮就会选择对应的集数，不再出现点击偏移的问题。每个按钮都有：

- 精确的 48px 宽度和 40px 高度
- 清晰的点击边界
- 正确的事件处理
- 良好的视觉反馈

## 测试方法

1. 打开任意多集剧集的播放页面
2. 在选集面板中点击不同的集数按钮
3. 验证点击的集数和实际选中的集数是否一致
4. 测试不同屏幕尺寸下的表现
5. 验证键盘导航和聚焦状态

## 技术细节

- 文件位置：`src/components/EpisodeSelector.tsx`
- 主要修改：布局从 CSS Grid 改为 Flexbox
- 兼容性：保持所有现有功能不变
- 性能：无性能影响，反而可能更好

这个修复确保了点击精确性，解决了用户体验问题。
