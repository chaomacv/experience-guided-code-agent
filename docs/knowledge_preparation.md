# Knowledge Preparation

入口：`Conversation → LLMCaseExtractor → EngineeringCase → chunk_cases → build_index_from_cases`。实现分别在 `case_pipeline/parser.py`、`schema.py`、`chunker.py` 和 `rag/index_builder.py`。

## 默认业务数据与知识来源

`python scripts/prepare_wine.py` 从 sklearn 内置 UCI Wine 数据生成训练 / 验收 CSV、原算法预测快照、行号划分、来源与 SHA-256。随后实际运行四组诊断：原服务基线、RandomForest 原生输出 API、异常输入、旧算法兼容快照。原始结果写入 `outputs/wine_preparation/observations/`；对应 `conversations/` 里的 user/tool 消息是这些真实实验的结构化记录。

这些记录是当前项目的诊断证据，没有伪装成历史生产事故。知识抽取任务要求模型不得虚构已完成的迁移；保留 partial / not_run 状态。

## 使用自己的历史记录

先脱敏，再为每份记录生成 JSON：

```json
{
  "conversation_id": "ticket-2026-001",
  "task": "更换检索算法并保持搜索接口兼容",
  "messages": [
    {"role":"user", "content":"工单中的实际要求"},
    {"role":"assistant", "content":"实际执行过的方案"},
    {"role":"tool", "name":"pytest", "content":"实际命令输出，不填想象的 PASS"}
  ]
}
```

```bash
python -m algo_rag_demo.cli --config configs/wine_practice.json extract-cases --raw-dir my_data/raw --case-dir my_data/cases
python -m algo_rag_demo.cli --config configs/wine_practice.json build-index --case-dir my_data/cases --knowledge-dir outputs/my_knowledge --index-dir outputs/my_index
python -m algo_rag_demo.cli --config configs/wine_practice.json search --case-dir my_data/cases --index-dir outputs/my_index --task "替换搜索算法" --retrieval-mode hybrid
```

如果已有结构化 Case，可直接跳过 LLM 抽取。文件名必须是 `<case_id>.json`，例如 `CASE_SEARCH_001.json`；详细字段见 [Case Schema](case_schema.md)。抽取响应保存在旁边的 `extraction_audit/`，源 conversation_id 由程序绑定而非相信模型生成值。成功/失败、约束、测试结论应由知识维护者核对原记录。

业务数据集用于训练/验收目标算法；RAG Case 用于帮助 Agent 迁移工程。不要把目标算法的测试答案写入可检索知识，或把人工标注的成功 Case 当作 Agent 成功率。

大规模文档入口可通过外部解析、分块和向量系统实现；接入位置见 [Retriever 扩展](retriever_extensions.md)。
