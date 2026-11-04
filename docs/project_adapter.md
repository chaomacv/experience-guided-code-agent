# Project Adapter / Executor

默认实现是 `algo_rag_demo/agent/executor.py:FileProjectAdapter`。它创建新的工作副本，读取真实可编辑文件供 Planner 规划，验证整批结构化 Actions 后写入，执行固定验收命令；成功后导出文件、哈希与 changes.patch。模型只具备 write_file 动作。

## 接入自己的项目

复制 `configs/wine_practice.json` 并修改 paths 与 execution：

```json
{"execution": {
  "factory":"algo_rag_demo.agent.executor:FileProjectAdapter",
  "template_dir":"my_project",
  "allowed_files":["src/search.py", "config.json"],
  "validation_commands":[["{python}", "-m", "pytest", "tests/acceptance", "-q"]],
  "skill_file":"my_project/migration_skill.md",
  "max_attempts":3,
  "timeout":120
}}
```

`{python}` 替换为当前解释器，命令以 argv 数组运行，shell=False；模型不能临时选择任意 shell 命令。验证程序与数据不在白名单中，其原始字节会在验收前后检查，发生改变则 FAIL。检查点保存编辑前的字节，失败恢复后再次比较。交付文件只在 PASS 后导出。

## Git、容器和外部工具

需要 git worktree、远程执行或其他工具时，设置自己的 `execution.factory="my_package.adapter:Adapter"`。构造函数 `(config, run_dir)`；实现 `facts()`、`checkpoint()`、`execute(plan)`、`validate()`、`rollback()`，可选 `deliver(output_dir)`。validate 返回 `{"passed": bool, "checks": [...]}`；rollback 返回 `{"restored": bool, ...}`。接口定义在 ProjectAdapter Protocol。

| 方法 / 参考 | 对接职责 |
| --- | --- |
| [git worktree](https://git-scm.com/docs/git-worktree) | 每个任务独立工作树，保留原始提交；在事实中提供 diff / status |
| [git diff](https://git-scm.com/docs/git-diff) | 给审阅者导出修改差异，不让模型自行声称已交付 |
| [Docker run](https://docs.docker.com/engine/containers/run/) | 把目标代码和测试放到隔离容器，限制网络与挂载 |
| [Docker 资源约束](https://docs.docker.com/engine/containers/resource_constraints/) | 设置 CPU / 内存 / 超时，返回实际退出码和日志 |
| [MCP tools](https://modelcontextprotocol.io/specification/2025-06-18/server/tools) | 把受控工具结果映射成 execution / observation；权限由适配器决定 |

上述外部工具是扩展参考；默认适配器不自动调用 Git、Docker 或 MCP。代码执行权限由工程所有者设置，不由模型输出扩张。白名单与哈希检查不是 OS 沙箱，模型生成的 Python 在验证时仍具有子进程权限；不可信目标应使用隔离执行器和外部只读验收资产。
