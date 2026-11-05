# 展示页维护

[项目说明](../README.md) · [English README](../README.en.md) · [在线展示](https://chaomacv.github.io/experience-guided-code-agent/)

无构建依赖的中英文静态页面。展示 Agent 架构、业务执行闭环、能力实现与扩展资源、检索对照和复现入口。页面不调用模型 API；运行报告与实验结果来自已保存的证据。

## 本地预览与发布

在仓库根目录运行：

```bash
python scripts/check_docs.py
python scripts/package_showcase.py
python -m http.server 8080 --directory showcase
```

打开 `http://localhost:8080/`。请通过 HTTP 预览，直接双击 HTML 通常无法读取 JSON。

GitHub Pages 由 [pages.yml](../.github/workflows/pages.yml) 自动生成源码下载包并发布 `showcase/`。`experience-guided-code-agent-source.zip` 是忽略的构建产物，包含中英文 README、源码、示例、文档和展示素材，排除密钥与运行目录。打包脚本会更新交互脚本、样式和语言包的内容版本号。

## 文件职责

| 文件 | 职责 |
| --- | --- |
| `index.html` | 页面章节与 RAG 动画的真实 HTML 元素 |
| `style.css` · `guide.css` · `theme.css` | 基础布局、交互组件与历史报告样式 |
| `studio.css` · `studio.js` | 当前浅色章节外观、渐变光晕、首次滚动显现 |
| `knowledge-story.css` · `knowledge-story.js` | RAG 连续横向动画、阶段跳转与暂停 |
| `guide-data.json` · `guide.js` | 架构职责、源码映射、业务步骤与复现命令 |
| `explore-data.json` · `explore.js` · `explore.css` | 12 项能力的扩展资源、深链接与返回清单 |
| `chapter-tour.js` | 五个板块内部的独立自动轮播 |
| `i18n.js` · `locales/` | 语言切换与翻译；保留当前选择，原始证据不翻译 |
| `app.js` · `data.json` · `evaluation.json` | 检索对照、运行回放与原始实验数据 |
| `*-report.html` · `demo-*.html` | 已保存的真实模型报告与受控分支回归报告 |

## 动画与交互约定

- RAG 动画用人工编写的 loss 替换对话解释知识流，不代表一次已执行的训练任务。当前可运行业务是 Wine 分类服务。
- 聊天、知识块、索引和上下文都是 HTML。38 秒共用时间轴连接起点、抽取、入库、检索、汇聚与行动，镜头平滑横移并在关键节点停留。
- 悬停暂停，移开继续；手动暂停优先。后台与离屏停止播放，减少动态效果时提供手动分镜。
- 章节轮播：架构、流程、检索每 10 秒切换；扩展与复现每 12 秒切换。仅可见板块推进，手动选择后暂停，自动切换不滚动页面。
- 扩展资源仅供探索，不表示已集成。优先保留官方链接；LLM 分 API、开放权重模型与部署工具，其他能力每项精选 4 个资源。
- 宽屏外框对齐，动画内部保持既有比例；移动端使用简化分镜。修改外框时不要同时改变内部镜头坐标。

## 更新内容

1. 改实现映射或流程：同步 `guide-data.json` 与 `locales/guide.en.json`。
2. 改可见文字：同步对应英文语言包；切换语言后确认当前模块与筛选仍保留。
3. 改扩展资源：维护 `explore-data.json` 中的两种语言与官方链接。
4. 改 RAG 动画：检查六个阶段、顺序高亮、悬停暂停、循环复位与窄屏；必要时更新 [README 动画素材](../docs/media/README.md)。
5. 运行文档检查与打包，再通过 HTTP 预览。检索与运行证据需按真实实验重新导出，不能为了外观改写数值或日志。

[Agent 能力映射](../docs/agent_module_mapping.md)记录当前实现范围。`demo-repair.html` 与 `demo-rollback.html` 使用测试 Planner 验证控制流，和真实 API 实战明确区分；原始路径、哈希及历史报告应保留。
