# 算法替换：历史人机对话样例语料

这组语料为本项目人工编写的历史对话样例，不是真实客户聊天。对话中“我测试通过了”等反馈属于样例叙述，不等于本项目实际运行的测试证据。真正运行的 API、索引、执行和验收另存于每次运行目录。

共 12 段对话、96 条消息，每段 4 轮 user/assistant。所有主题都涉及算法替换；相对于当前 Wine 分类服务任务，6 段相关、6 段不相关。原始对话不含当前任务的完整修复代码或验收标签。

| 来源 ID | 主题 | 与当前分类服务任务的关系 |
| --- | --- | --- |
| HISTORY_001 | 分类服务从线性模型迁移到随机森林时保留响应协议 | 相关 |
| HISTORY_002 | 模型替换时保存旧分类器回退与输出快照 | 相关 |
| HISTORY_003 | 替换分类器后空批次与异常数值处理发生变化 | 相关 |
| HISTORY_004 | 分类算法升级时避免训练测试泄漏并固定验收标准 | 相关 |
| HISTORY_005 | 替换分类算法后批量与逐条预测不一致 | 相关 |
| HISTORY_006 | 证明模型替换真正生效而不是只改算法标签 | 相关 |
| HISTORY_007 | 全文搜索从 TF-IDF 替换为 BM25 并保留分页 | 不相关 / 干扰项 |
| HISTORY_008 | 图像缩放从双线性替换为 Lanczos | 不相关 / 干扰项 |
| HISTORY_009 | 缓存淘汰从 LRU 替换为 LFU | 不相关 / 干扰项 |
| HISTORY_010 | 最短路径从 Dijkstra 替换为 A* | 不相关 / 干扰项 |
| HISTORY_011 | 音频重采样算法升级后修复采样率与长度 | 不相关 / 干扰项 |
| HISTORY_012 | 数值求解从梯度下降替换为 L-BFGS | 不相关 / 干扰项 |

`raw/` 只包含原始消息、任务、来源 ID 与 synthetic provenance。`manifest.json` 的相关性标注供离线核对，不送入 Case 抽取、向量编码或检索查询，不预先排除干扰对话。

默认执行：`python scripts/run_practice.py`。`prepare_wine.py` 只准备业务训练数据与原算法验收快照；CLI 从 `configs/wine_practice.json` 指定的 `examples/history_dialogues/raw` 读取所有对话，真实调用 DeepSeek 抽取 Case，再构建 BGE-M3 + BM25 / RRF。

抽取器用程序绑定 conversation_id 和 source_provenance；Chunk 和 RetrievalResult 延续来源声明，规划 Prompt 明示知识来源。用户自述的测试不是独立验证结果。用户可将 raw 目录替换为自己的真实历史对话，保留来源并先脱敏。

检索核对：`python scripts/evaluate_history_retrieval.py --run-dir <实际运行目录>`。输出 Dense、BM25、Hybrid 各自的 Top-5 来源与相关性，报告干扰项是否进入结果；不会用标注影响排序。这是单任务小语料检查，不代表独立基准评测或 RAG 效果增益。
