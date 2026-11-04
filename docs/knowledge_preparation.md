# Knowledge Preparation

入口：`Conversation → LLMCaseExtractor → EngineeringCase → chunk_cases → build_index_from_cases`。实现分别在 `case_pipeline/parser.py`、`schema.py`、`chunker.py` 和 `rag/index_builder.py`。

## 默认业务数据与知识来源

业务数据由 `python scripts/prepare_wine.py` 单独准备：UCI Wine 训练 / 验收 CSV、原算法预测快照、行号划分与哈希。这一步不再生成 RAG 知识消息。

默认知识来自 [历史人机对话样例](../examples/history_dialogues/README.md)：12 段、96 条 user/assistant 消息，6 段与当前分类任务相关，6 段为其他算法替换任务。全部进入抽取与索引，不按相关性预过滤。语料为人工编写样例；其叙述性反馈不冒充实测日志。

CLI 对每段原始对话调用 LLMCaseExtractor，保存 Case 与原始抽取响应，随后生成 task / constraint / solution 三类 Chunk。12 个 Case 应形成 36 个 Chunk。每个 Case、Chunk 和检索结果都延续来源 ID 与 source_provenance。

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
python -m experience_guided_code_agent.cli --config configs/wine_practice.json extract-cases --raw-dir my_data/raw --case-dir my_data/cases
python -m experience_guided_code_agent.cli --config configs/wine_practice.json build-index --case-dir my_data/cases --knowledge-dir outputs/my_knowledge --index-dir outputs/my_index
python -m experience_guided_code_agent.cli --config configs/wine_practice.json search --case-dir my_data/cases --index-dir outputs/my_index --task "替换搜索算法" --retrieval-mode hybrid
```

如果已有结构化 Case，可直接跳过 LLM 抽取。文件名必须是 `<case_id>.json`，例如 `CASE_SEARCH_001.json`；详细字段见 [Case Schema](case_schema.md)。抽取响应保存在旁边的 `extraction_audit/`，源 conversation_id 由程序绑定而非相信模型生成值。成功/失败、约束、测试结论应由知识维护者核对原记录。

业务数据集用于训练/验收目标算法；RAG Case 用于帮助 Agent 迁移工程。不要把目标算法的测试答案写入可检索知识，或把人工标注的成功 Case 当作 Agent 成功率。

大规模文档入口可通过外部解析、分块和向量系统实现；接入位置见 [Retriever 扩展](retriever_extensions.md)。
