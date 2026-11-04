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
## Hero 知识流水线

首页首屏用实际 HTML 卡片展示从历史对话到行动的过程；文案支持中英文。模拟对话、候选顺序、向量外观和成功路径是架构说明，不是新的运行证据。

实现文件：`index.html` 中的 `#knowledge-story`、`knowledge-story.css`、`knowledge-story.js`。没有新增构建步骤或外部 CDN 依赖；浏览器原生 Web Animations API 的所有动画共用一个 24 秒时间轴。`requestAnimationFrame` 只同步阶段文案与秒数，位移和透明度交给动画引擎。镜头使用 X 轴轨道与缓动，在重要节点停留。

| 时间 | 叙事 |
| --- | --- |
| 0–2 秒 | 工作区开场，进入历史聊天 |
| 2–8 秒 | 聊天滚动与高亮 → LLM 抽取 → 三张案例卡片 |
| 8–13 秒 | Case 拆为 task / constraint / solution → BGE-M3 → FAISS；同源文本用于 BM25 |
| 13–17.5 秒 | WineService 新任务 → Dense + BM25 → RRF → 相关 Chunk |
| 17.5–21 秒 | Task、Case、Repository Facts、Skill 汇入 Prompt |
| 21–24 秒 | LLM Planner → write_file → Executor → Independent Validator；遮罩覆盖循环复位 |

源码对照：`case_pipeline/parser.py` 抽取并保留来源；`chunker.py` 每 Case 生成三类 Chunk；BM25 在检索器中从索引元数据文本构建。Skill 由 `workflow.py` 并入 Repository Facts，再由 Prompt Builder 组织上下文。动画未向规划器展示受保护的验收标签。

控制：自动播放、暂停/播放、重播、阶段跳转（选择后暂停便于阅读）、鼠标悬停暂停；后台页面与离屏状态自动暂停。`prefers-reduced-motion` 使用手动分阶段静态视图，窄屏使用简化 HTML 叙事，不缩小整条轨道。

本地预览：仓库根目录运行 `python -m http.server 8765 --bind 127.0.0.1 --directory showcase`，打开 `http://127.0.0.1:8765/`。发布仍使用现有 GitHub Pages 工作流；`scripts/package_showcase.py` 会将新资源纳入源码下载包。
