# 视频源配置说明

## 配置方式

您有两种方式配置视频源：

### 方式 1：通过管理后台配置（推荐）

1. 访问 `/admin` 管理后台
2. 在"源管理"部分添加视频源
3. 支持实时启用/禁用
4. 数据保存在数据库中，重启不丢失

### 方式 2：通过 config.json 配置

参考 `config.example.json` 文件的格式：

```json
{
  "cache_time": 7200,
  "api_site": {
    "source_key": {
      "api": "https://your-api.com/api.php/provide/vod",
      "name": "源名称",
      "detail": "https://your-api.com/api.php/provide/vod/?ac=detail&ids={ids}",
      "is_adult": false
    }
  }
}
```

## 字段说明

- `source_key`: 源的唯一标识符
- `api`: 视频 API 的搜索接口地址
- `name`: 源的显示名称
- `detail`: 视频详情接口地址（{ids} 会被替换为视频 ID）
- `is_adult`: 是否为成人内容源（true/false）

## 推荐设置

- 建议保持 `config.json` 为空配置：`{"cache_time": 7200, "api_site": {}}`
- 通过管理后台动态添加和管理视频源
- 这样更灵活，支持实时启用/禁用，无需重启服务
