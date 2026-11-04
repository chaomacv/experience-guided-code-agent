# 替换 LLM API

`LLMPlanner` 只依赖 `ChatProvider.complete(messages, response_format=None)->str`，不绑定算法业务。默认 DeepSeek 使用 Chat Completions JSON 输出；实际请求、原始文本响应、返回模型名、request ID 和 usage 保存于每轮 `model_exchange.json`。密钥和 HTTP Authorization 不写入运行证据。

兼容协议改配置即可：

```json
{"llm": {
  "provider":"openai-compatible",
  "base_url":"https://your-gateway.example/v1",
  "model":"your-code-model",
  "api_key_env":"MY_LLM_API_KEY",
  "timeout":180,
  "verify_ssl":true
}}
```

Base URL 填到 `/chat/completions` 之前；服务必须接受 messages 和 JSON object response_format。环境变量由用户自己设置，不提交密钥文件。模型需要返回包含 write_file Actions 的 JSON，而不只是解释性文字；解析和动作校验失败会作为下一轮观测。

非兼容协议设置 `llm.factory="my_package.chat:create_provider"`，工厂接受整个 llm 配置并返回 ChatProvider。适配器负责把厂商响应映射成纯文本 JSON；可提供 `last_response_metadata` 保存非敏感用量信息。

参考：[DeepSeek 多轮接口](https://api-docs.deepseek.com/guides/multi_round_chat/)、[JSON 输出](https://api-docs.deepseek.com/guides/json_mode/)。重试由 workflow 带入错误与当前项目文件；请求本身不依赖服务端记忆。
