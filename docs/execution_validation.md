# 执行、验收、重试与回滚

通用控制器 `experience_guided_code_agent/agent/workflow.py:run_agent` 负责以下真实分支：

1. 建立检查点，第一次检索使用原始任务。
2. 把检索结果、当前可编辑文件、业务 Skill 和已有失败信息交给 LLMPlanner。
3. 保存原始请求/响应与结构化 Plan，Executor 校验动作后实际写入。
4. 独立 Validator 运行固定命令并收集实际退出码、stdout、stderr。
5. passed 严格为 True：导出交付代码 / Patch / 哈希，生成成功报告，立即结束。
6. FAIL 且仍可重试：把实际失败序列化进入新检索查询与下一次规划上下文，不注入修复代码。
7. 次数耗尽：恢复检查点并比较原始字节，报告 rolled_back 或 rollback_failed。
8. 检索等基础设施异常或中断：尝试恢复、保存失败报告并向调用方报告异常。

Error Analysis 当前是基于失败检查的结构化观察与分支选择；修复推理由下一轮 LLM 完成，不另设一个声称已验证的自评模型。验收命令不由 LLM 的 validation_plan 决定。

[接入自己的执行器](project_adapter.md) · [设计独立验收](validator.md) · [真实运行记录](archive/diagnostic-practice.md)
