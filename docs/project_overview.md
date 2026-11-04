# 项目总览

这是可配置的工程 RAG Agent，默认提供可真实运行的 Wine 分类算法替换案例。知识准备、检索、模型规划、文件执行、独立验收与恢复均调用实际实现。

首先按 [Quick start](../README.md#quick-start复现真实模型实战) 复现；再按 [用户业务入口](../README.md#把框架用于自己的业务) 替换知识、模型、工程和验收。

所有业务实现放在 examples/wine_service，通用循环在 workflow.py。每轮保留输入、检索、原始模型响应、执行和验证证据；PASS 后交付文件与差异，FAIL 重试，耗尽则恢复并核验字节。
