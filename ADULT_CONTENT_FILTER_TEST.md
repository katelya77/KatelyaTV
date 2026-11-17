# 成人内容过滤功能验证指南

## 🔒 过滤功能说明

### 工作原理

1. **默认行为**：所有用户默认开启成人内容过滤
2. **源级别标记**：每个视频源都有 `is_adult` 标记
3. **用户设置**：用户可通过设置页面控制过滤开关
4. **API 级别分离**：搜索 API 将结果分为 `regular_results` 和 `adult_results`

### 过滤逻辑

```typescript
// 1. 获取用户设置
shouldFilterAdult = userSettings?.filter_adult_content !== false; // 默认true

// 2. 源分离
getAvailableApiSites() // 返回 is_adult: false 的源
getAdultApiSites()     // 返回 is_adult: true 的源

// 3. 搜索分离
regular_results: [...] // 来自常规源
adult_results: [...]   // 来自成人源（仅在用户关闭过滤且明确请求时）
```

## 🧪 测试步骤

### 1. 添加测试源

在管理后台添加以下测试源：

**常规源：**

```
源标识：test_regular
源名称：测试常规源
API地址：https://okzy.tv/api.php/provide/vod
详情地址：https://okzy.tv/api.php/provide/vod/?ac=detail&ids={ids}
是否成人内容：❌ 否
```

**成人内容源：**

```
源标识：test_adult
源名称：测试成人源
API地址：https://adult-test.com/api.php/provide/vod
详情地址：https://adult-test.com/api.php/provide/vod/?ac=detail&ids={ids}
是否成人内容：✅ 是
```

### 2. 验证过滤开启状态

- 访问用户设置页面，确认"成人内容过滤"开关为**开启**
- 搜索任意关键词，应该只返回常规源的结果
- API 响应中 `adult_results` 应为空数组

### 3. 验证过滤关闭状态

- 关闭"成人内容过滤"开关
- 搜索相同关键词
- 应该看到结果分为两组：常规内容 + 成人内容

### 4. API 级别验证

```bash
# 开启过滤（默认）
curl "http://localhost:3001/api/search?q=test"
# 预期：adult_results = []

# 关闭过滤且明确请求成人内容
curl "http://localhost:3001/api/search?q=test&include_adult=true" -H "Authorization: Bearer username"
# 预期：adult_results 包含成人源结果
```

## ✅ 验证要点

1. **默认保护**：新用户默认开启过滤
2. **源级别隔离**：is_adult 标记正确分离源
3. **用户可控**：设置页面可以切换过滤状态
4. **API 响应分离**：结果明确分组
5. **明确请求**：关闭过滤后需明确请求成人内容才返回

## 🚨 安全检查

- [ ] 默认开启过滤
- [ ] 设置页面有明确的年龄警告
- [ ] API 不会意外返回成人内容
- [ ] 源标记 `is_adult: true` 的源被正确隔离
- [ ] 前端正确处理分组结果
