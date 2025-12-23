# Requirements Document

## Introduction

本文档定义了 KatelyaTV 网站在 Android TV 设备上通过 BrowseHere 等网页浏览器访问时的兼容性优化需求。目标是提供适合遥控器操作的用户体验，包括焦点导航、大屏幕布局优化、以及 D-Pad（方向键）交互支持。

## Glossary

- **Android_TV**: 基于 Android 系统的智能电视操作系统，使用遥控器作为主要输入设备
- **D_Pad**: 方向键控制器，包含上、下、左、右四个方向键和确认键
- **Focus_Ring**: 焦点环，用于指示当前选中元素的视觉高亮效果
- **TV_Mode**: 电视模式，专为大屏幕和遥控器操作优化的界面模式，由用户手动启用
- **Normal_Mode**: 普通模式，默认的网页浏览模式，支持鼠标和触摸操作
- **Focusable_Element**: 可聚焦元素，能够通过 D-Pad 导航选中的 UI 元素
- **Spatial_Navigation**: 空间导航，基于元素在屏幕上的物理位置进行焦点移动的导航方式
- **BrowseHere**: Android TV 上常用的网页浏览器应用
- **Leanback_UI**: Android TV 推荐的大屏幕 UI 设计模式，强调横向滚动和卡片式布局
- **MD3_TV**: Material Design 3 for TV，Google 官方的电视端 UI 设计规范
- **Overscan_Margin**: 过扫描边距，屏幕边缘的安全区域（约 5%），防止内容被电视边框裁切
- **Browse_Template**: 浏览模板，MD3 TV 推荐的内容展示布局，使用垂直堆叠的横向滚动行

## Design Reference

本功能的 UI 设计遵循 [Material Design 3 for TV](https://developer.android.com/design/ui/tv) 设计规范，参考 [Jet Stream](https://developer.android.com/design/ui/tv/samples/jet-stream) 示例应用。

### MD3 TV 核心设计原则

1. **布局系统**

   - 基准设计分辨率：960px × 540px（可按比例缩放至 HD/4K）
   - 过扫描边距：左右 58dp，上下 28dp（约 5% 屏幕边距）
   - 12 列网格系统：列宽 52dp，列间距 20dp
   - 行间距：4dp

2. **颜色系统**

   - 以深色主题为基础，创造沉浸式观影体验
   - 使用 Material 色彩角色：Primary、Secondary、Tertiary、Surface、Outline
   - 支持基于内容的动态配色（如从海报提取主色调）

3. **布局模板**

   - Browse Template：垂直堆叠的横向滚动内容行
   - Content Details Template：左侧标题/元数据，右侧操作按钮
   - Grid Template：网格布局展示内容集合
   - Overlay Templates：左侧/右侧/中央/底部覆盖层

4. **卡片布局**

   - 1 卡片布局：844dp 宽
   - 2 卡片布局：412dp 宽
   - 3 卡片布局：268dp 宽
   - 4 卡片布局：196dp 宽
   - 5 卡片布局：124dp 宽

5. **认知负荷**
   - 避免过多面板分组，减少认知负担
   - 将相关内容放在同一面板中
   - 焦点路径应与用户阅读习惯一致

## Requirements

### Requirement 1: TV 模式手动切换

**User Story:** As a user accessing the site from an Android TV device, I want to manually enable TV mode through a toggle button, so that I can receive an optimized TV viewing experience without affecting normal browsing.

#### Acceptance Criteria

1. THE System SHALL provide a TV_Mode toggle button in the user settings menu
2. WHEN the user clicks the TV_Mode toggle button, THE System SHALL switch between TV_Mode and Normal_Mode
3. WHEN TV_Mode is enabled, THE System SHALL persist the mode preference in localStorage
4. WHEN the user revisits the site, THE System SHALL restore the previously saved mode preference
5. WHEN TV_Mode is disabled, THE System SHALL completely restore Normal_Mode without any TV-specific styles or behaviors
6. THE TV_Mode toggle SHALL be accessible from both the desktop sidebar settings and mobile bottom navigation

### Requirement 2: 焦点导航系统

**User Story:** As a TV user using a remote control, I want to navigate the interface using D-Pad directional keys, so that I can browse and select content without a mouse or touch input.

#### Acceptance Criteria

1. WHEN TV_Mode is enabled, THE Focus_Manager SHALL make all interactive elements focusable via tabindex
2. WHEN a user presses a D_Pad direction key, THE Spatial_Navigator SHALL move focus to the nearest focusable element in that direction
3. WHEN an element receives focus, THE System SHALL display a visible Focus_Ring around the element
4. WHEN focus moves between elements, THE System SHALL smoothly scroll the viewport to keep the focused element visible
5. WHEN the user presses the Enter/OK key on a focused element, THE System SHALL trigger the element's click action
6. WHEN focus reaches the edge of a scrollable container, THE System SHALL scroll the container to reveal more focusable elements
7. IF no focusable element exists in the pressed direction, THEN THE System SHALL maintain focus on the current element

### Requirement 3: 视频卡片焦点优化（遵循 MD3 TV 规范）

**User Story:** As a TV user browsing video content, I want video cards to follow Material Design 3 for TV card guidelines, so that I can quickly find and select content with clear visual feedback.

#### Acceptance Criteria

1. WHEN a VideoCard receives focus in TV_Mode, THE VideoCard SHALL display MD3 TV recommended focus state (scale 1.05x, high-contrast border)
2. WHEN a VideoCard is focused, THE System SHALL display the video title in a larger, more readable font following MD3 TV typography
3. WHEN navigating through a grid of VideoCards, THE Focus_Manager SHALL maintain logical row-by-row navigation aligned with user reading path
4. WHEN a VideoCard row extends beyond the viewport, THE System SHALL auto-scroll horizontally following MD3 TV Browse Template behavior
5. WHEN the user presses Enter on a focused VideoCard, THE System SHALL navigate to the video detail/play page
6. WHEN TV_Mode is enabled, THE VideoCard grid SHALL use MD3 TV recommended card widths based on column count (4-card: 196dp, 5-card: 124dp equivalent)

### Requirement 4: 选集器 TV 优化（遵循 MD3 TV 规范）

**User Story:** As a TV user watching a series, I want the episode selector to follow Material Design 3 for TV guidelines, so that I can easily navigate and select episodes using my remote.

#### Acceptance Criteria

1. WHEN TV_Mode is enabled, THE EpisodeSelector SHALL use MD3 TV Grid Template for episode display
2. WHEN navigating episodes with D_Pad, THE Focus_Manager SHALL move focus one episode at a time following MD3 TV navigation logic
3. WHEN an episode button receives focus, THE System SHALL display MD3 TV focus indicator distinguishing it from the current playing episode
4. WHEN the user presses Enter on a focused episode, THE System SHALL start playing that episode
5. WHEN switching between "选集" and "换源" tabs, THE System SHALL use MD3 TV Tab component behavior with D_Pad left/right navigation
6. WHEN a source item receives focus in the source list, THE System SHALL follow MD3 TV List component focus states

### Requirement 5: 播放器 TV 控制

**User Story:** As a TV user watching video content, I want to control playback using my remote control, so that I can play, pause, seek, and adjust volume without a mouse.

#### Acceptance Criteria

1. WHEN TV_Mode is enabled and video is playing, THE Player SHALL respond to D_Pad center/Enter key for play/pause toggle
2. WHEN the user presses D_Pad left during playback, THE Player SHALL seek backward by 10 seconds
3. WHEN the user presses D_Pad right during playback, THE Player SHALL seek forward by 10 seconds
4. WHEN the user presses D_Pad up during playback, THE Player SHALL increase volume by 10%
5. WHEN the user presses D_Pad down during playback, THE Player SHALL decrease volume by 10%
6. WHEN the user long-presses D_Pad left/right, THE Player SHALL fast-forward/rewind at 2x speed
7. WHEN the video ends and more episodes exist, THE System SHALL display a "下一集" prompt with auto-focus
8. IF the user presses Back key during playback, THEN THE System SHALL show playback controls overlay first, then exit on second press

### Requirement 6: 搜索功能 TV 优化

**User Story:** As a TV user wanting to search for content, I want to use an on-screen keyboard optimized for remote control input, so that I can search without a physical keyboard.

#### Acceptance Criteria

1. WHEN the search input receives focus in TV_Mode, THE System SHALL display a TV-optimized on-screen keyboard
2. WHEN navigating the on-screen keyboard, THE Focus_Manager SHALL support D_Pad navigation between keys
3. WHEN the user presses Enter on a keyboard key, THE System SHALL input that character
4. WHEN the user selects the search/submit button, THE System SHALL execute the search and focus on the first result
5. WHEN search results are displayed, THE System SHALL auto-focus on the first result card
6. WHEN the user presses Back key on the keyboard, THE System SHALL close the keyboard and return focus to the search input

### Requirement 7: 导航栏 TV 优化（遵循 MD3 TV 规范）

**User Story:** As a TV user navigating the site, I want the navigation menu to follow Material Design 3 for TV Navigation Drawer guidelines, so that I can move between different sections intuitively.

#### Acceptance Criteria

1. WHEN TV_Mode is enabled, THE Sidebar SHALL be hidden by default following MD3 TV Left Overlay Template
2. WHEN the user presses D_Pad left from the main content area, THE System SHALL reveal the navigation drawer with MD3 TV animation
3. WHEN the navigation drawer is visible, THE Focus_Manager SHALL support vertical D_Pad navigation following MD3 TV Navigation Drawer behavior
4. WHEN the user presses Enter on a menu item, THE System SHALL navigate to that section and hide the drawer
5. WHEN the user presses D_Pad right or Back from the drawer, THE System SHALL hide the drawer and return focus to content
6. WHEN TV_Mode is enabled, THE MobileBottomNav SHALL be hidden in favor of the MD3 TV Navigation Drawer

### Requirement 8: 视觉样式 TV 优化（遵循 MD3 TV 规范）

**User Story:** As a TV user viewing content from a distance, I want the interface to follow Material Design 3 for TV guidelines, so that I can have a familiar, comfortable, and visually appealing experience.

#### Acceptance Criteria

1. WHEN TV_Mode is enabled, THE System SHALL apply MD3 TV overscan margins (58dp sides, 28dp top/bottom equivalent)
2. WHEN TV_Mode is enabled, THE System SHALL use a dark theme as the base to create cinematic experience
3. WHEN TV_Mode is enabled, THE System SHALL increase base font size by 20% for 10-foot viewing distance
4. WHEN TV_Mode is enabled, THE System SHALL use MD3 TV card sizing guidelines for VideoCard components
5. WHEN TV_Mode is enabled, THE Focus_Ring SHALL use MD3 TV recommended focus indicator styles (high-contrast border, subtle scale effect)
6. WHEN TV_Mode is enabled, THE System SHALL disable hover effects and replace with focus-based interactions
7. WHEN displaying content rows, THE System SHALL follow MD3 TV Browse Template with horizontal scrolling rows
8. WHEN TV_Mode is enabled, THE System SHALL reduce cognitive load by grouping related content and minimizing panel divisions

### Requirement 9: 模式隔离与兼容性

**User Story:** As a user who switches between TV and normal browsing, I want TV mode changes to be completely isolated, so that enabling TV mode does not affect my normal browsing experience.

#### Acceptance Criteria

1. WHEN TV_Mode is disabled, THE System SHALL render all components using their original Normal_Mode styles and behaviors
2. WHEN TV_Mode is enabled, THE System SHALL apply TV-specific styles through a separate CSS scope (e.g., `[data-tv-mode="true"]` selector)
3. THE System SHALL NOT modify any existing component logic when TV_Mode is disabled
4. WHEN switching from TV_Mode to Normal_Mode, THE System SHALL immediately remove all TV-specific event listeners and styles
5. THE TV_Mode implementation SHALL use conditional rendering or CSS scoping rather than modifying base component code
6. IF any TV_Mode feature causes issues in Normal_Mode, THEN THE System SHALL gracefully degrade to Normal_Mode behavior

### Requirement 10: 性能优化

**User Story:** As a TV user with potentially limited device resources, I want the site to perform smoothly on my TV, so that I can have a lag-free browsing experience.

#### Acceptance Criteria

1. WHEN TV_Mode is enabled, THE System SHALL reduce animation complexity to improve performance
2. WHEN TV_Mode is enabled, THE System SHALL lazy-load images that are not in the current viewport
3. WHEN scrolling through content lists, THE System SHALL implement virtual scrolling for lists exceeding 50 items
4. WHEN TV_Mode is enabled, THE System SHALL disable floating decorative elements (FloatingShapes)
5. IF the device shows signs of low performance, THEN THE System SHALL further reduce visual effects

### Requirement 11: 返回键处理

**User Story:** As a TV user, I want the Back button on my remote to behave predictably, so that I can navigate backwards through the app without confusion.

#### Acceptance Criteria

1. WHEN the user presses Back key and a modal/overlay is open, THE System SHALL close the modal first
2. WHEN the user presses Back key and the navigation menu is open, THE System SHALL close the menu
3. WHEN the user presses Back key on a detail/play page, THE System SHALL navigate to the previous page
4. WHEN the user presses Back key on the home page, THE System SHALL show an exit confirmation dialog
5. WHEN the user confirms exit, THE System SHALL attempt to close the browser tab or show instructions for exiting
6. IF the user cancels exit, THEN THE System SHALL dismiss the dialog and maintain current state
