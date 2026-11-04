# 项目展示页

无构建依赖的静态页面，依次包含：Agent 架构与 12 项能力映射、实施流程与验证/重试/回滚分支、执行回放、30 条查询的四组检索结果、跨系统下载复现路线。

```bash
# 在项目根目录生成页面中的源码下载文件
python scripts/package_showcase.py
python -m http.server 8080 --directory showcase
```

访问 http://localhost:8080/。需要通过 HTTP 服务读取 data.json 与 guide-data.json，直接双击 index.html
时浏览器通常会阻止读取本地 JSON。部署到支持静态托管的平台即可使用。

- guide-data.json：架构职责、模块映射、实施细节与对应源码。
- guide.js / guide.css：交互说明、状态筛选、复现命令切换与响应式布局。
- i18n.js / locales/en.json / locales/guide.en.json：导航栏中英文切换、界面词条与英文架构/流程说明。默认中文，语言选择保存在浏览器本地，刷新后继续使用；切换时保留当前交互选择。
- data.json：固定的 BGE-M3 实验结果与两条实际执行的脚本 Planner 演示。
- evaluation.json：完整检索实验元数据、分通道证据与限制。
- demo-repair.html / demo-rollback.html：独立 HTML 运行记录。
- experience-guided-code-agent-source.zip：运行打包脚本后生成，已忽略，不纳入 Git。

展示页没有连接服务器或模型 API，不收集访问者数据，也不含密钥。
“回放”与“实时推理”有明确区分。脚本 Planner 预设两轮修改；实际文件动作与测试结果用于展示工作流机制。
英文界面提供案例摘要，原始案例摘录可展开核对。源码、计划 JSON、测试日志与独立 HTML 运行记录保持原文。

Agent 思想对照与实现范围见 [架构映射文档](../docs/agent_module_mapping.md)。页面中的 RAG、ReAct、Reflexion 参考不表示完整论文复现。
## GitHub Pages

正式地址：https://chaomacv.github.io/experience-guided-code-agent/

仓库 Settings → Pages → Build and deployment → Source 选择 GitHub Actions。
`.github/workflows/pages.yml` 在 main 更新后自动生成源码下载包，并发布 showcase 目录。
如首次启用时工作流已经运行失败，在 Actions 中重新运行 Deploy showcase to GitHub Pages。

静态资源和数据使用相对路径，适配仓库子路径；GitHub Pages 无需服务器或 API Key。

## 视觉设计

采用统一的蓝白主色、浅紫点缀、细网格工作流画布与深色代码面板。参考 [Teamily](https://teamily.ai/) 的留白和产品展示层次、[Kiro](https://kiro.dev/) 的开发者工具表达与紫色点缀、[Dify](https://dify.ai/zh) 的蓝色节点画布；图形与 UI 为本项目独立实现，未使用参考站点的品牌素材或产品截图。

`theme.css` 统一视觉变量与各模块外观。首屏 Agent Workspace 为静态示例示意，不是在线执行控制台；具体证据来自下方运行回放。

默认复现已切换为真实 Wine / DeepSeek / BGE-M3 实战。wine-live-report.html 来源于 docs/evidence/wine-live-run.json；旧脚本分支回放折叠归档，仅用于机制回归。
## Hero：让非技术观众也能看懂的经验故事

首屏只讲五件事：过去聊过的问题 → 整理经验 → 保存经验 → 找回经验 → 帮助新的行动。具体模型、索引方法、字段名和代码留在下方实现章节；首屏不逐项展开技术流水线。

聊天里，小林的人物头像固定在左，助手的头像固定在右。经验卡使用“遇到的问题、找到的原因、解决的办法、下次要记住”四个通俗标题。所有对话、卡片和行动说明都使用 HTML，未绘制成图片。

语言规则：中文模式完整使用中文叙述，英文模式完整使用英文叙述；Code Agent、Agent、GitHub 等品牌或产品名称保留。首屏的对话、经验卡、阶段名、按钮与辅助说明都随页面语言切换，不固定混排中英术语。

| 时间 | 叙事 |
| --- | --- |
| 0–4 秒 | 人与助手的历史聊天 |
| 4–8 秒 | 对话整理成一张可复用的经验卡 |
| 8–12 秒 | 经验保存进项目经验库，保留来源 |
| 12–17.5 秒 | 新任务找回过去的相关经验 |
| 17.5–24 秒 | 任务、经验与当前要求汇合，帮助 Agent 计划、修改并检查 |

实现仍使用同一条横向轨道和 24 秒 Web Animations 时间轴，关键节点有缓动与停留。保留暂停、重播、阶段跳转、悬停暂停、后台与离屏暂停。移动端使用简化故事卡；减少动态效果时改为手动静态阅读。动画使用示例内容说明原理，不是实际运行证据；实际代码修改与验收仍分别由执行器和独立验证器负责。

文件：`index.html`、`knowledge-story.css`、`knowledge-story.js`、`locales/en.json`。没有新增构建步骤或外部 CDN 依赖。

本地预览：仓库根目录执行 `python -m http.server 8765 --bind 127.0.0.1 --directory showcase`，打开 `http://127.0.0.1:8765/`。发布沿用 GitHub Pages，源码下载包由 `scripts/package_showcase.py` 生成。
