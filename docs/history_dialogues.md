# 历史人机对话 → RAG：当前默认知识来源

语料见 [12 段历史对话样例](../examples/history_dialogues/README.md)：96 条 user/assistant 消息。所有主题均为算法替换；相对当前分类服务任务，6 段相关、6 段不相关。它们为人工编写样例，不是真实客户聊天；对话里的用户测试反馈不是本项目独立运行证据。

## 实际服务器运行

运行 ID：`20261104-071820-algorithm-upgrade-13a34a2f`，2026-11-04。完整运行实际调用 DeepSeek 抽取 12 个 Case，生成 36 个 Chunk，计算 1024 维 BGE-M3 向量。没有预先删除不相关对话，也没有把人工相关性标签交给抽取器或检索器。

所有 Case 的 source_provenance 已核对为 synthetic_authored_human_assistant_dialogue；Chunk 和 RetrievalResult 延续该声明，规划 Prompt 明示来源。默认 config.raw_dir 已指向原始对话，prepare_wine.py 只处理业务数据和旧算法快照。

## 检索结果

同一任务、Top-5、每个 Case 最多一条；依据人工标注核对：

| 检索方案 | Top-5 相关对话数 | 干扰对话数 |
| --- | ---: | ---: |
| Dense | 5 | 0 |
| BM25 | 2 | 3 |
| Hybrid / RRF | 5 | 0 |

Hybrid 实际选择 HISTORY_006（实际模型调用）、HISTORY_001（输出协议）、HISTORY_003（异常输入）、HISTORY_004（质量验收）、HISTORY_005（批处理一致性）。BM25 还取到了路径、图像和缓存对话，说明共享的算法/接口关键词会引入干扰。

这是当前人工小语料与单个任务上的检查，不能推出普遍性能，也没有证明 Hybrid 比 Dense 更好。标注文件仅在检索完成后用于核对。

## 工程执行

使用以上检索结果，DeepSeek 生成修改并通过首轮独立验收。实际加载 12 Case / 36 Chunk，验收集 balanced accuracy=1.0，接口、目标库调用、质量回归、异常输入、旧算法兼容和文件完整性检查均通过。未触发重试或回滚。

- [检索逐条结果](evidence/history-retrieval-check.json)
- [运行与来源摘要](evidence/history-live-summary.json)
- [新运行 HTML 报告](https://chaomacv.github.io/algorithm-upgrade-rag-agent-demo-zh/history-live-report.html)

## 复现

```bash
python scripts/run_practice.py
python scripts/evaluate_history_retrieval.py --run-dir <CLI打印的运行目录>
```

自己的真实历史消息只需按 Conversation Schema 放入独立 raw 目录并修改配置。保留源 ID、脱敏、明确记录来源；工程任务与验收根据自己的业务设置。
