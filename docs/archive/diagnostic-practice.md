# 真实模型实战：Wine 分类服务算法替换

2026-11-04 实际运行：`20261104-054012-algorithm-upgrade-9de31a86`。默认入口 `python scripts/run_practice.py`；没有 ScriptedPlanner、Mock embedding 或预设修复补丁。

任务由工程所有者提前定义：将标准化最近质心分类服务升级为 sklearn RandomForestClassifier，同时保持 fit/predict 签名、输出字段、异常输入行为与旧算法回退。

## 数据与知识准备

UCI Wine 的 178 条真实化学测量记录、13 个特征、3 类标签；固定分层划分为训练 124 / 验收 54，random_state=42。准备程序实际执行原服务基线、目标库 API、错误输入和回退快照诊断，得到 4 份观测记录。DeepSeek 从这些记录抽取 4 个 Case，生成 12 个 Chunk，BGE-M3 产生 1024 维向量；本次向量索引使用 NumPy 精确内积后端，词法 BM25 与 Dense 经 RRF 融合。FAISS 是可选等价精确内积后端。

数据来源及许可证：[UCI Wine](https://archive.ics.uci.edu/dataset/109/wine)，DOI 10.24432/C5PC7J，CC BY 4.0；数据由 sklearn.datasets.load_wine 提供。它是公开基准数据上的工程案例，不是客户生产数据。原始诊断记录没有伪装成历史客户对话。

## 实际结果

| 项目 | 本次观察 |
| --- | --- |
| Planner | DeepSeek API，返回 model=`deepseek-flash` |
| 模型响应 ID | `c8205b10-7031-4a2e-90e3-2f15eb0b0666` |
| 规划轮数 | 1，首次独立验收通过 |
| 代码修改 | `service.py`：实现真实随机森林分支，保留 centroid；`config.json`：默认启用 random_forest |
| 模型选择 | 300 棵树，random_state=42，n_jobs=1（由本次模型响应给出） |
| 原服务 balanced accuracy | 0.984127 |
| 新服务 balanced accuracy | 1.000000，54 条验收数据 |
| 预先固定验收阈值 | max(0.95, 原服务−0.02) = 0.964127 |
| 实际运行探针 | RandomForest.fit=1 次，predict_proba=1 次 |
| 接口 / Runtime / 质量回归 / 边界 / 旧算法 | 全部通过 |
| 验收文件与数据完整性 | 字节检查通过 |
| 重试 / 回滚 | 本次没有触发；没有为了展示分支故意制造失败 |

控制循环耗时约 62.6 秒，其中规划 59.2 秒、验收 3.4 秒；这不包含数据准备、4 次知识抽取和模型/索引初始化。原始 usage 随每次 API 响应保存，规划请求 total_tokens=12935，包含服务报告的 reasoning token 计数；不导出隐藏推理文本。

## 可核对的证据

- [完整文本证据包](../evidence/wine-live-run.json)：42 个文件的快照，含原始观测、抽取响应、Case、Chunk、Prompt、模型响应、修改、检查点、验收和交付哈希。
- [HTML 运行报告](https://chaomacv.github.io/experience-guided-code-agent/wine-live-report.html)：逐轮展开查看。
- 交付 service.py 的 SHA-256：`89f15a3a5a38f373b7d5c87c5fec9bdc4e8232cadcabb59bedbcaba167eefb97`。

文本证据导出时把绝对运行目录替换为 `<run_dir>`，项目目录替换为 `<project_root>`；保存导出前各文件 SHA-256。二进制向量索引不随文本证据发布，可用相同配置重建。`run_metadata.json` 记录执行时的源码哈希，便于区分后续文档或框架维护版本。

这是一份真实调用、真实写入和真实验收的单次运行记录，不代表成功率统计。54 条固定留出数据是本项目的验收集；正式评估需另设未用于调试/重试的独立测试集。本次结果也没有证明 RAG 相比不使用 RAG 的增益；检验该问题需要相同任务、预算与独立标注的对照实验。

复现环境版本与 BGE 缓存 revision 见 [环境记录](../evidence/wine-environment.json)。默认依赖固定为实测版本，BGE 配置固定到该快照；CPU / CUDA 构建随平台选择。

## 当前运行入口（知识输入已更新）

本页记录改名和历史对话语料接入之前的一次诊断知识实验。证据中的路径、源码哈希和运行编号保持历史值。当前默认入口已改为人机历史对话语料，以下命令运行当前版本，结果不会复现本页四个诊断 Case。当前实战见 [历史对话记录](../history_dialogues.md)。

按根 README 安装依赖并设置自己的 API Key，可拆开运行：

```bash
python scripts/prepare_wine.py
python -m experience_guided_code_agent.cli --config configs/wine_practice.json run
```

运行目录由 CLI 打印，模型回答与尝试轮数可能不同。CLI 自动生成 report.html；成功才生成 delivery。失败会保存检查日志与恢复结果。

机制测试使用受控响应覆盖立即成功、失败后检索重试、耗尽恢复、恢复失败、超时和中断；这些测试与此处的真实 API 证据分开。`tests/test_wine_practice.py` 还会将本次捕获的真实响应重放到实际文件执行器和独立验收器，检查日后框架修改是否破坏兼容性。
