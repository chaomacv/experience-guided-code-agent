# Independent Validator

验收逻辑由业务所有者提前定义，和 Planner 分离。模型可以看到契约与失败日志，不能通过 write_file 修改验收代码或数据。当前业务的验收实现位于 `examples/wine_service/validate.py`，由独立 Python 子进程运行，退出码 0 才可能 PASS。

| 类别 | Wine 业务的实际检查 | 换业务时设计什么 |
| --- | --- | --- |
| Interface | 构造/fit/predict 签名，label/confidence/metadata 类型与字段 | API Schema、函数签名、数据形状、上下游契约 |
| Runtime | patch sklearn 的真实 fit / predict_proba，观测调用和训练输入 | 新组件是否真实调用，配置是否生效，超时与资源 |
| Quality / Regression | 54 条留出数据 balanced accuracy ≥ max(0.95, 原算法−0.02)；批处理/逐条/重排一致、重复训练一致 | 预先约定的业务质量阈值，原系统对照、边界和不变量 |
| Edge cases | 空输入、错误维数、NaN / Inf | 空值、极端值、异常恢复、错误语义 |
| Legacy fallback | 显式 centroid 分支与改造前完整预测/置信度快照一致 | 旧组件回退、接口与数值是否仍兼容 |
| Integrity | 受保护测试和数据的字节不变 | 验收资产由独立权限或外部进程持有 |

“旧算法可调用”与“整个项目回滚”不同：前者是业务验收项；后者是 workflow 耗尽尝试后的文件恢复，并比较原始字节。

## 用户接口与工具参考

默认适配器接受任意固定 validation_commands，适合接入现有 CI；退出码、stdout、stderr 和超时记录自动成为下一轮上下文。示例：`["{python}","-m","pytest","tests/acceptance","-q"]`。JavaScript、Go 或容器命令同样使用 argv 数组；需要特殊环境时实现自己的 Adapter.validate。

- [pytest](https://docs.pytest.org/en/stable/getting-started.html)：接口、回归、夹具和参数化验收。
- [Hypothesis / NumPy](https://hypothesis.readthedocs.io/en/latest/reference/strategies.html#numpy)：随机输入与性质测试，减少只迎合固定样例。
- [scikit-learn 模型评估](https://scikit-learn.org/stable/modules/model_evaluation.html)：分类、排序等业务指标定义。
- [GitHub Actions](https://docs.github.com/en/actions)：在独立 CI 环境重跑固定验收。

默认 Wine 验收不是完整安全证明，也不宣称经过独立测试集泛化评估。模型在重试时能看到汇总反馈，正式业务应另设不可见最终测试集，必要时增加性能、漂移、数据泄漏和资源限制检查。
