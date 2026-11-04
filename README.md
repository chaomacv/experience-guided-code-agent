# 工程经验驱动的代码变更 Agent

**Experience-Guided Code Agent**

从历史人机对话中提取工程经验，通过 RAG 辅助 LLM 规划代码修改，实际执行后由独立程序验收；失败时重新检索与规划，尝试耗尽后恢复检查点。

[展示页](https://chaomacv.github.io/experience-guided-code-agent/) · [文档导航](docs/README.md) · [当前运行记录](docs/history_dialogues.md) · [Agent 能力映射](docs/agent_module_mapping.md)

## Quick start：复现当前 demo

当前业务是 **Wine 分类服务的算法替换**：最近质心 → 随机森林，同时保持接口、返回字段和旧算法回退兼容。业务数据使用 UCI Wine 的 178 条真实测量记录；RAG 知识来自 12 段人工编写的历史对话样例（96 条消息，含相关与干扰主题）。

需要 Python 3.10–3.12、DeepSeek API Key；首次下载 BGE-M3，CPU 可运行，GPU 更快。

```bash
git clone https://github.com/chaomacv/experience-guided-code-agent.git
cd experience-guided-code-agent
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
export DEEPSEEK_API_KEY="your-key"
python scripts/run_practice.py
```

Windows PowerShell 将激活与设置密钥两行分别替换为：

```powershell
.\.venv\Scripts\Activate.ps1
$env:DEEPSEEK_API_KEY="your-key"
```

默认流程：**业务数据准备 → 历史对话抽取 Case → Chunk / Index → 混合检索 → LLM 生成文件动作 → 实际修改 → 独立验收 → 交付 / 重试 / 回滚**。模型响应和尝试轮数不固定，API 按实际调用计费。

CLI 会打印 `outputs/runs/<运行ID>/`。先打开 `report.html`，再查看：

| 目录 / 文件 | 内容 |
| --- | --- |
| `conversations/`、`extraction_audit/`、`cases/` | 原始消息、抽取响应及来源 |
| `knowledge/`、`index/` | 知识块、向量与元数据 |
| `attempts/` | 每轮检索、Prompt、模型响应、动作和验收 |
| `workspace/`、`checkpoint/` | 工作副本与原始快照 |
| `delivery/` | 仅 PASS 后导出的代码、Patch 和哈希 |
| `final_report.json`、`report.html` | 最终状态与运行证据 |

## 接入自己的业务

按下面的入口替换知识与业务适配层，复用通用控制流：

1. [准备自己的历史对话与 Case](docs/knowledge_preparation.md)
2. [替换 Embedding、索引与检索方法](docs/retriever_extensions.md)
3. [切换模型 API](docs/llm_providers.md)
4. [接入目标工程与执行工具](docs/project_adapter.md)
5. [定义独立业务验收](docs/validator.md)
6. [理解重试、交付与恢复](docs/execution_validation.md)

默认配置是 `configs/wine_practice.json`；其他兼容 API 可从 `configs/openai_compatible_example.json` 开始。通用 CLI 使用 `python -m experience_guided_code_agent.cli`，分阶段命令见 [命令手册](docs/commands.md)。

## 文件规划

```text
experience_guided_code_agent/  通用代码：知识处理、RAG、规划、执行、报告
configs/                       当前 demo 与模型 API 配置
examples/
  history_dialogues/            原始对话样例与评价标注
  wine_service/                 业务任务、旧服务、数据与独立验收
scripts/                       运行、准备数据、检查检索、导出与打包入口
tests/                         自动化检查；fixtures/ 为受控测试资产
docs/                          使用与扩展指南；evidence/ 和 archive/ 为记录
benchmarks/                    独立的合成检索评测，非默认 demo 知识库
showcase/                      中英文展示页源码和已发布报告
outputs/                       本地生成产物，不提交 Git
```

## 证据与使用范围

- [历史对话全文与来源说明](examples/history_dialogues/README.md)：样例对话不是客户原始记录；对话中自述的测试结果不等于独立验收。
- [当前建库、检索与真实模型运行记录](docs/history_dialogues.md)：12 Case / 36 Chunk，相关性标签仅用于事后核对。
- [业务数据说明](examples/wine_service/README.md)：UCI Wine，CC BY 4.0；124 条训练 / 54 条验收。
- [独立检索评测](docs/evaluation.md) 与 [早期诊断知识实验](docs/archive/diagnostic-practice.md)：保留历史记录，和当前默认流程分开。

单次验收结果不代表泛化能力或 RAG 增益。文件白名单、固定验收命令和完整性检查不等于操作系统沙箱；不可信代码应使用隔离执行器。

## 开发检查

```bash
python -m pip install -r requirements-core.txt "scikit-learn>=1.4,<1.8"
python -m pytest -q
```

测试中的受控响应仅用于检查失败、重试和回滚分支。贡献说明见 [CONTRIBUTING.md](CONTRIBUTING.md)。
