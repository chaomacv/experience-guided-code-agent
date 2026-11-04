# 当前实战任务

把 WineService 的标准化最近质心分类器替换为真实训练和推理的 sklearn RandomForestClassifier，同时保持输入接口、输出字段、异常输入和旧算法分支兼容。

任务原文：[task.txt](../examples/wine_service/task.txt)；真实数据与来源：[业务说明](../examples/wine_service/README.md)；独立验收：[Validator](validator.md)；实际运行证据：[运行记录](live_practice.md)。

修改只允许 service.py 与 config.json；验证程序、数据和基线快照由工程维护者控制。原仓库保留旧服务作为任务起点，正确目标实现由模型在运行副本中产生。
