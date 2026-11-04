# 通用架构与业务边界

控制层 `run_agent()` 管理检索 → 规划 → 执行 → 验收 → 成功 / 重试 / 恢复，不包含 Wine 算法或正确补丁。

| Agent 职责 | 通用实现 | 当前业务提供 |
| --- | --- | --- |
| Input | CLI / config | Wine 升级任务与工程事实 |
| Memory / Knowledge | Conversation、Case Schema、抽取、Chunk | 历史人机对话样例、来源与 provenance |
| RAG | BGE-M3、BM25、RRF、工厂接口 | 从 Case 构建的经验索引 |
| LLM / Planning | ChatProvider、LLMPlanner | 模型配置、业务 Skill |
| Tool Use / Execution | ProjectAdapter、write_file | service.py / config.json 白名单 |
| Observation | 退出码、日志、trace、模型响应 | 业务验收结果 |
| Reflection | 失败进入下一轮查询和上下文 | 接口/运行/质量/兼容性错误 |
| Evaluation / Guardrails | 固定命令、受保护文件检查 | Wine 独立验收与阈值 |
| Output | delivery、changes.patch、final_report、HTML | 经验证的分类服务修改 |

扩展入口按顺序见 [README](../README.md#把框架用于自己的业务)。旧 ranking 示例和离线脚本是机制测试资产，不参与默认实战执行。
