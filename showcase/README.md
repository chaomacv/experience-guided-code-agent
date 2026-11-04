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

`theme.css` 统一视觉变量与各模块外观。首屏 Agent Workspace 为自动播放的架构示意，不是在线执行控制台；具体证据来自下方运行回放。

默认复现已切换为真实 Wine / DeepSeek / BGE-M3 实战。wine-live-report.html 来源于 docs/evidence/wine-live-run.json；旧脚本分支回放折叠归档，仅用于机制回归。
## Hero 知识流水线

保留蓝白画布、浅紫模型节点、深色上下文面板与横向连续镜头。技术名称作为标题和关键词，中文解释内容与因果；英文模式同步切换说明。聊天、Case、Chunk、索引与上下文都是可编辑的 HTML，不是静态图片。

首屏使用人工编写的 loss 替换对话：短用户消息、较长助手回复、代码块与消息间留白；聊天气泡参考常见即时通信布局。LLM 节点只展示“理解语义 → 结构化抽取”。LLM 后不再单列 EngineeringCase 详情卡；task、constraint、solution 先合为一张知识卡，进入向量化时由同一组 HTML 元素拆成三张 Chunk。字段标题使用 13px，摘要正文使用 10px。聊天人物在左、机器人在右，气泡尾角与角色位置一致。

| 时间 | 叙事 |
| --- | --- |
| 0–2 秒 | 工作区进入历史聊天 |
| 2–8 秒 | loss 对话 → LLM → 一整张知识卡 |
| 8–13 秒 | 知识卡展开为三张 Chunk → Embedding Model → Knowledge Index |
| 13–17.5 秒 | 下一次 User Task → 检索 / 匹配 / 排名 / 选择 → 相关历史经验 |
| 17.5–21 秒 | 保留 Task、Retrieved Cases、Repository Facts、Skill 四路汇入增强任务 |
| 21–24 秒 | 带历史经验的任务 → LLM / MLLM 后续工作；遮罩覆盖循环复位 |

Knowledge Index 使用经验条目与中文说明解释语义、关键词查找；统一检索卡片概括当前 Dense + BM25 + RRF 的职责，没有改动实际检索算法。首屏 loss 对话是架构说明，不是已执行的训练日志；下方 WineService 仍是当前可复现业务实战。

当前代码使用文本 LLM，修改文件与独立验收由工具执行。MLLM 在交接节点明确标为可扩展方向，不表示已经接入多模态模型，也不表示模型直接写入文件或访问受保护验收标签。

实现文件：`index.html` 的 `#knowledge-story`、`knowledge-story.css`、`knowledge-story.js` 与 `locales/en.json`。所有动画共用原生 Web Animations API 的 24 秒时间轴；无外部 CDN 或新增构建依赖。保留自动播放、暂停、重播、阶段跳转、后台和离屏暂停；窄屏简化分镜，减少动态效果时手动阅读。

本地预览：仓库根目录运行 `python -m http.server 8765 --bind 127.0.0.1 --directory showcase`，打开 `http://127.0.0.1:8765/`。发布沿用 GitHub Pages，源码下载包由 `scripts/package_showcase.py` 生成。

镜头节奏：保留起点与抽取，在同一横向画布中经过拆分、编码、入库、检索、汇聚与行动。各段平滑移动，在阶段到达时短暂停留；卡片预先位于轨道中，信息转换和汇入在同一空间发生。

动画检查修正：检索结果与增强任务内容预先完整显示，过程只用轻微高亮和信息流表示，不再让空卡片进入视口。鼠标悬停不自动暂停，避免阅读时意外停走；暂停/播放按钮仍可控制。打包会为样式、脚本和语言包生成内容版本号，避免连续发布后混用新旧资源。

知识卡边展开边前移；Embedding 与 Index 预先位于轨道中，以“文本标签 → 向量条带 → 入库”的同一载体动画建立空间衔接。

卡片标题统一使用 Knowledge Index 的两行格式：12px 英文名称、10px 中文职责说明，统一字体、行高与间距。历史对话、结构化知识、编码、索引、检索、上下文来源与增强任务使用共享样式；拆分说明下方不再使用独立箭头，连接线随知识卡移动延伸。

镜头在入库、检索、汇聚节点各停留 0.6 秒，开场与抽取沿用原有阅读停留，行动节点保留结尾停留；各段用缓入缓出连接，暂停时信息流仍继续，不切换页面。
