# Design Document: Android TV Compatibility

## Overview

本设计文档描述了 KatelyaTV 网站在 Android TV 设备上的兼容性优化方案。核心目标是提供一个可手动切换的 TV 模式，该模式遵循 Material Design 3 for TV 设计规范，支持 D-Pad 遥控器导航，同时确保不影响普通网页浏览体验。

### Design Goals

1. **模式隔离**：TV 模式与普通模式完全隔离，通过 CSS 作用域和条件渲染实现
2. **MD3 TV 规范**：遵循 Material Design 3 for TV 的布局、颜色、组件设计原则
3. **焦点导航**：实现基于空间位置的 D-Pad 焦点导航系统
4. **性能优化**：针对 TV 设备的有限资源进行性能优化

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Application Layer                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ TVModeProvider │  │ FocusManager │  │ KeyboardNavigator     │  │
│  │ (Context)      │  │ (Hook)       │  │ (Event Handler)       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                        Component Layer                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ VideoCard   │  │ EpisodeSelector │  │ TVNavigationDrawer  │  │
│  │ (TV variant)│  │ (TV variant)    │  │ (New component)     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                        Style Layer                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ tv-mode.css (scoped with [data-tv-mode="true"])             ││
│  │ - MD3 TV spacing, typography, colors                        ││
│  │ - Focus ring styles                                         ││
│  │ - Card sizing                                               ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### File Structure

```
src/
├── components/
│   ├── tv/
│   │   ├── TVModeProvider.tsx      # TV 模式上下文提供者
│   │   ├── TVModeToggle.tsx        # TV 模式切换按钮
│   │   ├── TVNavigationDrawer.tsx  # TV 导航抽屉
│   │   ├── TVFocusRing.tsx         # 焦点环组件
│   │   └── useTVNavigation.ts      # D-Pad 导航 Hook
│   ├── VideoCard.tsx               # 现有组件（添加 TV 模式支持）
│   ├── EpisodeSelector.tsx         # 现有组件（添加 TV 模式支持）
│   └── ...
├── styles/
│   ├── tv-mode.css                 # TV 模式专用样式
│   └── globals.css                 # 现有全局样式（不修改）
└── lib/
    └── tv-utils.ts                 # TV 模式工具函数
```

## Components and Interfaces

### 1. TVModeProvider

TV 模式的核心上下文提供者，管理 TV 模式状态并提供给所有子组件。

```typescript
// src/components/tv/TVModeProvider.tsx

interface TVModeContextType {
  isTVMode: boolean;
  setTVMode: (enabled: boolean) => void;
  focusedElement: HTMLElement | null;
  setFocusedElement: (element: HTMLElement | null) => void;
}

interface TVModeProviderProps {
  children: React.ReactNode;
}

// 实现要点：
// 1. 从 localStorage 读取初始状态
// 2. 状态变化时同步到 localStorage
// 3. 在 document.documentElement 上设置 data-tv-mode 属性
// 4. 提供焦点管理功能
```

### 2. useTVNavigation Hook

处理 D-Pad 键盘事件和空间导航逻辑。

```typescript
// src/components/tv/useTVNavigation.ts

interface UseTVNavigationOptions {
  containerRef: React.RefObject<HTMLElement>;
  onSelect?: () => void;
  onBack?: () => void;
}

interface UseTVNavigationReturn {
  focusedIndex: number;
  setFocusedIndex: (index: number) => void;
  focusableElements: HTMLElement[];
}

// 空间导航算法：
// 1. 获取当前焦点元素的位置 (getBoundingClientRect)
// 2. 根据按键方向筛选候选元素
// 3. 计算到各候选元素的距离
// 4. 选择距离最近且在正确方向上的元素
```

### 3. TVNavigationDrawer

遵循 MD3 TV Left Overlay Template 的导航抽屉组件。

```typescript
// src/components/tv/TVNavigationDrawer.tsx

interface TVNavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: NavigationItem[];
  activeItem?: string;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType;
  href: string;
}

// 实现要点：
// 1. 从左侧滑入的覆盖层
// 2. 支持 D-Pad 上下导航
// 3. Enter 键选择，Back/Right 键关闭
// 4. 遵循 MD3 TV Navigation Drawer 样式
```

### 4. VideoCard TV Enhancement

为现有 VideoCard 组件添加 TV 模式支持。

```typescript
// 在 VideoCard.tsx 中添加 TV 模式支持

// 新增 props
interface VideoCardProps {
  // ... 现有 props
  tvFocusable?: boolean; // 是否在 TV 模式下可聚焦
}

// TV 模式下的样式变化：
// 1. 添加 tabIndex={0} 使其可聚焦
// 2. 聚焦时应用 scale(1.05) 和高对比度边框
// 3. 移除 hover 效果，改用 focus 效果
// 4. 使用 MD3 TV 推荐的卡片尺寸
```

### 5. EpisodeSelector TV Enhancement

为现有 EpisodeSelector 组件添加 TV 模式支持。

```typescript
// 在 EpisodeSelector.tsx 中添加 TV 模式支持

// TV 模式下的变化：
// 1. 集数按钮添加 tabIndex 支持焦点导航
// 2. Tab 切换支持 D-Pad 左右键
// 3. 使用 MD3 TV Grid Template 布局
// 4. 焦点状态使用 MD3 TV 推荐样式
```

## Data Models

### TV Mode State

```typescript
// localStorage key: 'tv_mode_enabled'
interface TVModeState {
  enabled: boolean;
  lastUpdated: number;
}
```

### Focus State

```typescript
interface FocusState {
  currentElement: HTMLElement | null;
  previousElement: HTMLElement | null;
  focusHistory: string[]; // element IDs
}
```

## Spatial Navigation Algorithm

```typescript
// 空间导航核心算法

function findNextFocusableElement(
  currentElement: HTMLElement,
  direction: 'up' | 'down' | 'left' | 'right',
  container: HTMLElement
): HTMLElement | null {
  const currentRect = currentElement.getBoundingClientRect();
  const focusables = getFocusableElements(container);

  // 根据方向筛选候选元素
  const candidates = focusables.filter((el) => {
    const rect = el.getBoundingClientRect();
    switch (direction) {
      case 'up':
        return rect.bottom <= currentRect.top;
      case 'down':
        return rect.top >= currentRect.bottom;
      case 'left':
        return rect.right <= currentRect.left;
      case 'right':
        return rect.left >= currentRect.right;
    }
  });

  if (candidates.length === 0) return null;

  // 计算距离并选择最近的元素
  return candidates.reduce((closest, el) => {
    const distance = calculateDistance(
      currentRect,
      el.getBoundingClientRect(),
      direction
    );
    const closestDistance = calculateDistance(
      currentRect,
      closest.getBoundingClientRect(),
      direction
    );
    return distance < closestDistance ? el : closest;
  });
}

function calculateDistance(
  from: DOMRect,
  to: DOMRect,
  direction: 'up' | 'down' | 'left' | 'right'
): number {
  // 使用加权距离算法
  // 主轴方向距离权重较高，垂直方向距离权重较低
  const primaryAxis = direction === 'up' || direction === 'down' ? 'y' : 'x';
  const secondaryAxis = primaryAxis === 'y' ? 'x' : 'y';

  const fromCenter = {
    x: from.left + from.width / 2,
    y: from.top + from.height / 2,
  };
  const toCenter = {
    x: to.left + to.width / 2,
    y: to.top + to.height / 2,
  };

  const primaryDist = Math.abs(toCenter[primaryAxis] - fromCenter[primaryAxis]);
  const secondaryDist = Math.abs(
    toCenter[secondaryAxis] - fromCenter[secondaryAxis]
  );

  // 主轴权重 1.0，次轴权重 0.3
  return primaryDist + secondaryDist * 0.3;
}
```

## MD3 TV Style System

### CSS Variables for TV Mode

```css
/* src/styles/tv-mode.css */

/* 仅在 TV 模式下生效 */
[data-tv-mode='true'] {
  /* MD3 TV 布局变量 */
  --tv-overscan-x: 58px; /* 左右过扫描边距 */
  --tv-overscan-y: 28px; /* 上下过扫描边距 */
  --tv-column-width: 52px; /* 列宽 */
  --tv-gutter: 20px; /* 列间距 */
  --tv-row-gap: 4px; /* 行间距 */

  /* MD3 TV 字体缩放 */
  --tv-font-scale: 1.2; /* 字体放大 20% */

  /* MD3 TV 焦点样式 */
  --tv-focus-ring-width: 4px;
  --tv-focus-ring-color: #4caf50;
  --tv-focus-ring-offset: 4px;
  --tv-focus-scale: 1.05;

  /* MD3 TV 卡片尺寸 */
  --tv-card-width-1: 844px;
  --tv-card-width-2: 412px;
  --tv-card-width-3: 268px;
  --tv-card-width-4: 196px;
  --tv-card-width-5: 124px;

  /* MD3 TV 动画 */
  --tv-transition-duration: 200ms;
  --tv-transition-easing: cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Focus Ring Styles

```css
/* 焦点环样式 */
[data-tv-mode='true'] [data-tv-focusable='true']:focus {
  outline: none;
  transform: scale(var(--tv-focus-scale));
  box-shadow: 0 0 0 var(--tv-focus-ring-width) var(--tv-focus-ring-color), 0 8px
      16px rgba(0, 0, 0, 0.3);
  transition: transform var(--tv-transition-duration) var(
        --tv-transition-easing
      ), box-shadow var(--tv-transition-duration) var(--tv-transition-easing);
  z-index: 100;
}

/* 禁用 hover 效果 */
[data-tv-mode='true'] [data-tv-focusable='true']:hover {
  transform: none;
  box-shadow: none;
}
```

### VideoCard TV Styles

```css
/* VideoCard TV 模式样式 */
[data-tv-mode='true'] .video-card {
  /* 使用 MD3 TV 卡片尺寸 */
  width: var(--tv-card-width-4);

  /* 增加间距 */
  margin: calc(var(--tv-gutter) / 2);

  /* 圆角 */
  border-radius: 12px;

  /* 过渡动画 */
  transition: transform var(--tv-transition-duration) var(
        --tv-transition-easing
      ), box-shadow var(--tv-transition-duration) var(--tv-transition-easing);
}

[data-tv-mode='true'] .video-card:focus {
  transform: scale(var(--tv-focus-scale));
  box-shadow: 0 0 0 var(--tv-focus-ring-width) var(--tv-focus-ring-color), 0
      12px 24px rgba(0, 0, 0, 0.4);
}

/* 标题字体放大 */
[data-tv-mode='true'] .video-card .title {
  font-size: calc(1rem * var(--tv-font-scale));
  font-weight: 600;
}
```

### Layout Adjustments

```css
/* 主内容区域 TV 模式布局 */
[data-tv-mode='true'] .main-content {
  padding-left: var(--tv-overscan-x);
  padding-right: var(--tv-overscan-x);
  padding-top: var(--tv-overscan-y);
  padding-bottom: var(--tv-overscan-y);
}

/* 内容行 - Browse Template */
[data-tv-mode='true'] .content-row {
  display: flex;
  flex-direction: row;
  overflow-x: auto;
  scroll-behavior: smooth;
  gap: var(--tv-gutter);
  padding: var(--tv-row-gap) 0;

  /* 隐藏滚动条 */
  scrollbar-width: none;
  -ms-overflow-style: none;
}

[data-tv-mode='true'] .content-row::-webkit-scrollbar {
  display: none;
}

/* 网格布局 */
[data-tv-mode='true'] .video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, var(--tv-card-width-4));
  gap: var(--tv-gutter);
  justify-content: center;
}
```

## Keyboard Event Handling

### Key Mapping

```typescript
// D-Pad 键码映射
const TV_KEY_CODES = {
  // 方向键
  DPAD_UP: ['ArrowUp', 'Up'],
  DPAD_DOWN: ['ArrowDown', 'Down'],
  DPAD_LEFT: ['ArrowLeft', 'Left'],
  DPAD_RIGHT: ['ArrowRight', 'Right'],

  // 确认键
  DPAD_CENTER: ['Enter', ' '], // Enter 或 Space

  // 返回键
  BACK: ['Escape', 'Backspace', 'XF86Back'],

  // 媒体控制键
  PLAY_PAUSE: ['MediaPlayPause', 'p', 'P'],
  FAST_FORWARD: ['MediaFastForward'],
  REWIND: ['MediaRewind'],
} as const;
```

### Global Keyboard Handler

```typescript
// src/components/tv/useTVNavigation.ts

function useTVKeyboardHandler() {
  const { isTVMode } = useTVMode();

  useEffect(() => {
    if (!isTVMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 忽略输入框中的按键
      if (isInputElement(e.target)) return;

      const key = e.key;

      // 方向导航
      if (TV_KEY_CODES.DPAD_UP.includes(key)) {
        e.preventDefault();
        navigateFocus('up');
      } else if (TV_KEY_CODES.DPAD_DOWN.includes(key)) {
        e.preventDefault();
        navigateFocus('down');
      } else if (TV_KEY_CODES.DPAD_LEFT.includes(key)) {
        e.preventDefault();
        navigateFocus('left');
      } else if (TV_KEY_CODES.DPAD_RIGHT.includes(key)) {
        e.preventDefault();
        navigateFocus('right');
      }

      // 确认键
      else if (TV_KEY_CODES.DPAD_CENTER.includes(key)) {
        e.preventDefault();
        activateFocusedElement();
      }

      // 返回键
      else if (TV_KEY_CODES.BACK.includes(key)) {
        e.preventDefault();
        handleBackNavigation();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isTVMode]);
}
```

## Player TV Controls

### Video Player Key Bindings

```typescript
// 播放器 TV 模式控制
const PLAYER_TV_CONTROLS = {
  // 播放/暂停
  togglePlayPause: () => {
    artPlayerRef.current?.toggle();
  },

  // 快进 10 秒
  seekForward: () => {
    if (artPlayerRef.current) {
      artPlayerRef.current.currentTime += 10;
    }
  },

  // 快退 10 秒
  seekBackward: () => {
    if (artPlayerRef.current) {
      artPlayerRef.current.currentTime -= 10;
    }
  },

  // 音量增加 10%
  volumeUp: () => {
    if (artPlayerRef.current) {
      artPlayerRef.current.volume = Math.min(
        1,
        artPlayerRef.current.volume + 0.1
      );
    }
  },

  // 音量减少 10%
  volumeDown: () => {
    if (artPlayerRef.current) {
      artPlayerRef.current.volume = Math.max(
        0,
        artPlayerRef.current.volume - 0.1
      );
    }
  },

  // 长按快进/快退
  startFastForward: () => {
    artPlayerRef.current?.playbackRate = 2;
  },

  stopFastForward: () => {
    artPlayerRef.current?.playbackRate = 1;
  },
};
```

## Error Handling

### Graceful Degradation

```typescript
// TV 模式错误处理
function withTVModeErrorBoundary<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function TVModeErrorBoundary(props: P) {
    const { isTVMode, setTVMode } = useTVMode();

    const handleError = useCallback(
      (error: Error) => {
        console.error('TV Mode Error:', error);
        // 发生错误时自动切换回普通模式
        setTVMode(false);
        // 可选：显示错误提示
      },
      [setTVMode]
    );

    return (
      <ErrorBoundary onError={handleError}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
```

## Testing Strategy

### Unit Tests

1. **TVModeProvider 测试**

   - 初始状态从 localStorage 正确读取
   - 状态变化正确同步到 localStorage
   - data-tv-mode 属性正确设置

2. **useTVNavigation Hook 测试**

   - 空间导航算法正确计算最近元素
   - 边界情况处理（无候选元素时保持当前焦点）
   - 键盘事件正确映射

3. **组件 TV 模式测试**
   - VideoCard 在 TV 模式下正确应用焦点样式
   - EpisodeSelector 在 TV 模式下支持 D-Pad 导航
   - TVNavigationDrawer 正确响应键盘事件

### Property-Based Tests

详见下方 Correctness Properties 章节。

### Integration Tests

1. **模式切换测试**

   - 切换到 TV 模式后所有组件正确响应
   - 切换回普通模式后所有 TV 特性完全移除

2. **导航流程测试**
   - 从首页到播放页的完整 D-Pad 导航流程
   - 返回键正确处理各种场景

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: TV Mode State Persistence Round-Trip

_For any_ TV mode state change (enabled/disabled), persisting to localStorage and then reading back SHALL produce the same state value.

**Validates: Requirements 1.3, 1.4**

### Property 2: TV Mode Toggle State Inversion

_For any_ initial TV mode state (true or false), clicking the toggle button SHALL result in the opposite state.

**Validates: Requirements 1.2**

### Property 3: Mode Isolation Completeness

_For any_ component in Normal_Mode (TV mode disabled), the DOM SHALL NOT contain any elements with `data-tv-mode="true"` attribute or TV-specific event listeners.

**Validates: Requirements 1.5, 9.1, 9.4**

### Property 4: Focusable Elements in TV Mode

_For any_ interactive element (buttons, links, cards) when TV_Mode is enabled, the element SHALL have a valid tabindex attribute making it focusable.

**Validates: Requirements 2.1**

### Property 5: Spatial Navigation Correctness

_For any_ focused element and D-Pad direction press, the next focused element SHALL be the geometrically nearest focusable element in that direction, or focus SHALL remain unchanged if no valid target exists.

**Validates: Requirements 2.2, 2.7**

### Property 6: Focus Visibility

_For any_ element that receives focus in TV_Mode, the element SHALL be within the visible viewport (scrolled into view if necessary).

**Validates: Requirements 2.4**

### Property 7: Enter Key Activation

_For any_ focusable element in TV_Mode, pressing Enter/OK key SHALL trigger the element's click handler or navigation action.

**Validates: Requirements 2.5, 3.5, 4.4, 5.1**

### Property 8: Focus State Styling Consistency

_For any_ focusable element that receives focus in TV_Mode, the element SHALL display the MD3 TV focus indicator (scale transform and high-contrast border).

**Validates: Requirements 2.3, 3.1, 4.3, 4.6**

### Property 9: VideoCard Grid Navigation

_For any_ VideoCard in a grid layout, pressing D-Pad down SHALL focus a card in the next row (if exists), and pressing D-Pad right SHALL focus the next card in the same row (if exists).

**Validates: Requirements 3.3**

### Property 10: Player D-Pad Control Accuracy

_For any_ video playback state in TV_Mode:

- D-Pad left SHALL decrease currentTime by 10 seconds (minimum 0)
- D-Pad right SHALL increase currentTime by 10 seconds (maximum duration)
- D-Pad up SHALL increase volume by 0.1 (maximum 1.0)
- D-Pad down SHALL decrease volume by 0.1 (minimum 0.0)

**Validates: Requirements 5.2, 5.3, 5.4, 5.5**

### Property 11: Navigation Drawer D-Pad Behavior

_For any_ open navigation drawer in TV_Mode:

- D-Pad up/down SHALL navigate between menu items
- Enter SHALL navigate to selected item and close drawer
- D-Pad right or Back SHALL close drawer and return focus to content

**Validates: Requirements 7.3, 7.4, 7.5**

### Property 12: TV Mode Visual Style Application

_For any_ page rendered in TV_Mode:

- Content area SHALL have MD3 TV overscan margins applied
- Text elements SHALL have font-size scaled by 1.2x
- Interactive elements SHALL NOT respond to hover events

**Validates: Requirements 8.1, 8.3, 8.6**

### Property 13: Back Key Modal Priority

_For any_ open modal/overlay in TV_Mode, pressing Back key SHALL close the modal before any other navigation action.

**Validates: Requirements 11.1**

### Property 14: Decorative Elements Disabled in TV Mode

_For any_ page rendered in TV_Mode, FloatingShapes decorative elements SHALL NOT be rendered in the DOM.

**Validates: Requirements 10.4**

### Property 15: Tab Navigation in EpisodeSelector

_For any_ EpisodeSelector in TV_Mode with multiple tabs, D-Pad left/right at tab level SHALL switch between tabs.

**Validates: Requirements 4.5**

### Property 16: Search Results Auto-Focus

_For any_ search results displayed in TV_Mode, the first result card SHALL automatically receive focus.

**Validates: Requirements 6.5**
