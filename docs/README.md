# 文档导航

新读者先按 [中文 Quick start](../README.md#quick-start) / [English Quick start](../README.en.md#quick-start) 跑通当前 demo，再按目标阅读下面的指南。

| 目标 | 文档 |
| --- | --- |
| 理解通用模块和业务边界 | [架构](architecture.md)、[Agent 能力映射](agent_module_mapping.md) |
| 看人机对话如何变成知识库 | [知识准备](knowledge_preparation.md)、[Case Schema](case_schema.md) |
| 看当前语料、检索和运行结果 | [历史对话实战记录](history_dialogues.md) |
| 换知识索引与检索算法 | [Retriever 扩展](retriever_extensions.md)、[RAG 链路](rag_pipeline.md) |
| 换模型服务 | [LLM Provider](llm_providers.md) |
| 接自己的工程和工具 | [Project Adapter](project_adapter.md) |
| 编写业务验收 | [Independent Validator](validator.md) |
| 理解交付、重试和恢复 | [执行控制流](execution_validation.md) |
| 找分阶段命令 | [命令手册](commands.md) |

`evidence/` 保存发布时的运行证据，内部旧路径、源码哈希和运行编号保持原样；它们不是当前复现命令。`archive/` 保存早期诊断知识实验。独立合成检索评测见 [evaluation.md](evaluation.md)，其数据位于 [benchmarks](../benchmarks/README.md)。

旧排序工程与脚本响应已移入 [测试夹具](../tests/fixtures/README.md)，不属于用户默认业务示例。
