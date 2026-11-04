# 受控测试夹具

这些资产用于自动化检查，不参与默认 Wine / 历史对话实战。

- `ranking_project/`：小型排序服务，便于触发接口失败、成功与恢复。
- `custom_data/`：最小 Conversation / Case 输入，检查 Schema、索引与碰撞处理。
- `ranking_config.json`：仅供排序测试使用的执行配置。
- `run_workflow_fixture.py`：使用 ScriptedPlanner / Mock embedding 检查控制分支。

```bash
python tests/fixtures/run_workflow_fixture.py outputs/fixture-repair
python tests/fixtures/run_workflow_fixture.py outputs/fixture-rollback --scenario rollback
```

上述动作受控，不能作为模型能力证据。真实模型入口是根目录的 `python scripts/run_practice.py`。
