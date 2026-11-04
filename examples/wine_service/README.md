# Wine 分类服务的算法替换业务

数据：[UCI Wine](https://archive.ics.uci.edu/dataset/109/wine)，Aeberhard, S. & Forina, M. (1992), DOI 10.24432/C5PC7J，CC BY 4.0。13 个化学测量特征、178 条记录、三个类别；由 sklearn.datasets.load_wine 提供的副本加载，标签映射为 0/1/2。保留原始来源、署名与许可证链接：https://creativecommons.org/licenses/by/4.0/ 。本项目仅做格式转换和固定分层划分。

`service.py` 是可运行的旧服务；`task.txt` 指定实际升级目标。目标随机森林的代码由 LLM 写入运行工作副本，原仓库不提供自动注入的正确补丁。

`data/train.csv` 124 条；`data/holdout.csv` 54 条；`manifest.json` 记录原始行号、种子、文件哈希和环境；`legacy_predictions.json` 是旧服务真实预测快照。重新运行 `python scripts/prepare_wine.py` 可重建业务数据与旧算法快照，RAG 知识另从 examples/history_dialogues/raw 读取，环境版本会记录到输出。

`validate.py` 由工程所有者维护，不属于模型文件白名单。完整运行执行 `python scripts/run_practice.py`。该业务用于演示真实工程迁移，不承诺新算法优于旧算法；验收阈值在模型规划之前固定。
