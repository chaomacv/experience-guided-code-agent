# 常用命令

默认完整实战：

```bash
python -m pip install -r requirements-practice.txt
# 设置 DEEPSEEK_API_KEY 后
python scripts/run_practice.py
```

逐步运行：

```bash
python scripts/prepare_wine.py
python -m algo_rag_demo.cli --config configs/wine_practice.json run
```

自己的知识：[准备与检索命令](knowledge_preparation.md)。其他 API / Embedding：[配置接口](retriever_extensions.md)、[模型 API](llm_providers.md)。

框架检查：

```bash
python -m pytest -q
```

单独重放旧分支测试夹具（受控响应，不作为模型能力证据）：

```bash
python scripts/offline_demo.py outputs/branch-test-repair
python scripts/offline_demo.py outputs/branch-test-rollback --scenario rollback
```

原检索消融实验仍使用独立 benchmarks 语料：[评测说明](evaluation.md)。
