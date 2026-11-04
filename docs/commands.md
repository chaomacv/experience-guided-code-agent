# 分阶段命令

以下命令均在仓库根目录执行；先按根 README 安装依赖并设置 API Key。

## 当前完整 demo

```bash
python scripts/run_practice.py
```

## 分开准备业务数据与运行 Agent

```bash
python scripts/prepare_wine.py
python -m experience_guided_code_agent.cli --config configs/wine_practice.json run
```

## 使用自己的历史记录

```bash
python -m experience_guided_code_agent.cli --config configs/wine_practice.json extract-cases --raw-dir my_data/raw --case-dir my_data/cases
python -m experience_guided_code_agent.cli --config configs/wine_practice.json build-index --case-dir my_data/cases --knowledge-dir outputs/my_knowledge --index-dir outputs/my_index
python -m experience_guided_code_agent.cli --config configs/wine_practice.json search --case-dir my_data/cases --index-dir outputs/my_index --task "替换分类算法" --retrieval-mode hybrid
```

## 检查当前对话检索

把路径替换为 CLI 打印的实际运行目录：

```bash
python scripts/evaluate_history_retrieval.py --run-dir outputs/runs/YOUR_RUN_ID
```

## 自动化检查

```bash
python -m pytest -q
```

受控分支回归程序位于 tests/fixtures，仅用于开发检查。检索消融实验命令见 [独立评测](evaluation.md)。
