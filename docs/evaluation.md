# 检索实验：结果、指标与边界

## 实验问题

1. Dense 与 BM25 对语义问题、代码标识符和错误信息的匹配有什么差别？
2. RRF 融合能否让相关经验排得更靠前？
3. 每个 Case 限制一条 Chunk，能否减少上下文重复？会损失什么？

这是一组**合成开发集实验**。案例、查询与标注共同编写，没有独立留出测试集。
不能用它证明真实业务收益，亦不能测量 Agent 成功率。当前版本不包含微调或模型训练。

## 数据与复现条件

- 20 个手工合成工程案例、60 个按 Schema 对齐的 Chunk、30 条查询。
- 覆盖 Ranking、Embedding、Retrieval、Execution、Dependency、Configuration 等模块。
- 查询 category 包括 identifier、semantic、multi；标注等级 1 / 2 / 3 表示不同相关程度。
- 所有案例标记为 partial、validation=not_run、来源以 SYNTHETIC_ 开头，表示虚构工程情景。
- 模型 BAAI/bge-m3，snapshot `5617a9f61b028005a4858fdac845db406aefb181`。
- RTX 4090，Python 3.10.20。完整环境和时间见原始 JSON。
- 数据指纹：`4a87f1943a4d653b783be1d754d62512f032419d6c5475f789e6806ecd697fd0`。
- 相同语料、查询与 K=5；关闭 Dense 原有的成功案例 +0.01 先验，避免先验混淆对比。
- BM25 k1=1.5、b=0.75；中文二元片段和工程标识符分词，不依赖分词词典。
- RRF constant=60，每通道 candidate_k=50；按分数降序，平分时按 chunk_id 确定性排序。
- hybrid_diverse 在融合后、截断 Top-K 前限制每个 case_id 最多一条 Chunk。

```bash
python -m pip install -r requirements.txt
python -m experience_guided_code_agent.evaluation \
  --provider bge-m3 --model BAAI/bge-m3 \
  --case-dir benchmarks/cases --queries benchmarks/queries.jsonl \
  --output-dir outputs/evaluation --k 5
```

不需要 LLM API Key。首次运行需要下载向量模型。
Mock 仅用于离线验证评测通路，不能代表语义模型质量。改变模型或数据后应使用新目录。

## 指标怎样计分

计分单位是 Top-K **Chunk 上下文槽位**。同一 Case 出现多次，只有第一次得到相关性收益。

- Recall@K：前 K 个槽位覆盖的相关 Case 数 / 标注相关 Case 总数。
- MRR@K：首个相关 Case 所在槽位的倒数，无相关项为 0。
- nDCG@K：gain=`2^grade-1`，按 `log2(rank+1)` 折扣；重复 Case 的 gain 为 0，
  理想序列按不同 Case 的相关性等级降序排列。
- unique_cases：前 K 个槽位包含的不同案例数。

因此这里的 nDCG 衡量上下文预算中的一次性案例收益，不能直接和先去重再重排 Case 的其他评测结果比较。

## 实际结果

| 方案 | Recall@5 | MRR@5 | nDCG@5 | 不同 Case 数 | P95 ms |
| --- | ---: | ---: | ---: | ---: | ---: |
| Dense | 0.9333 | 0.9111 | 0.9194 | 3.23 | 13.25 |
| BM25 | 0.8667 | 0.9111 | 0.9086 | 3.10 | 0.34 |
| Hybrid | 0.8833 | 0.9667 | 0.9483 | 3.00 | 14.74 |
| Hybrid + Case 限额 | 0.9000 | 0.9667 | 0.9516 | 5.00 | 26.98 |

原始逐查询依据：[bge-m3-v1.json](evaluation/bge-m3-v1.json)。

P95 是每种方案预热后对 30 条查询进行一次顺序测量，不包含模型初始化或建索引；
没有做多次重复、并发压测或显著性检验，不应将几毫秒差别归因于稳定的架构性能。

## 怎样解读

融合使第一条相关依据更靠前（MRR 0.9111 → 0.9667），
Case 限额增加了上下文中的不同经验数量（3.23 → 5.00）。
但 Dense 的 Recall 仍更高：融合去重为 0.9000，Dense 为 0.9333。

这不支持“混合检索全面优于纯向量检索”的说法。可根据下游任务优先级选择：
看重首条相关依据可考虑融合，看重相关经验覆盖需继续验证候选预算、
多条 Chunk 的互补性和上下文长度。强制一条/Case 也可能丢掉同一案例中的重要约束，
所以生产接入时应比较每 Case 1 条、2 条或按 token 预算聚合完整 Case。

## 下一阶段真正需要的实验

1. 建立独立采集并标注的真实历史工程案例，按来源任务分组切分，防止相似故障泄漏。
2. 在多种目标项目上，固定模型、预算、验证命令，比较无 RAG / Dense / Hybrid。
3. 重复运行，报告任务通过率、平均修复轮次、调用成本、延迟分布及区间。
4. 保存失败分类：检索缺失、规划错误、执行越界、验证不足、恢复失败。

以上为未完成的后续实验方向，当前版本没有相应业务收益数字。
