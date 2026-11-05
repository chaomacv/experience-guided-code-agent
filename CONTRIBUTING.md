# 贡献指南

先阅读 [文档导航](docs/README.md) 和 [架构](docs/architecture.md)。

- 通用能力放在 `experience_guided_code_agent/`，业务模型与验收放在 `examples/`。
- 新增历史对话样例放在 `examples/history_dialogues/raw/`，注明来源并同步 manifest；评价标注不进入检索文本。
- 受控响应和失败场景放到 `tests/fixtures/`，不要混入用户默认入口。
- 运行证据不得包含密钥；历史记录的编号和源码哈希不因改名而改写。

提交前运行：

```bash
python -m pip install -r requirements-core.txt "scikit-learn>=1.4,<1.8"
python -m pytest -q
python scripts/check_docs.py
python scripts/package_showcase.py
```

若修改模型、工具或验收接口，请更新对应文档，并描述实际检查结果与范围。

根目录 README 提供中英文两份入口，内容修改请同步 `README.md` 和 `README.en.md`。展示素材放在 `docs/media/`；网页维护说明集中在 `showcase/README.md`，不追加重复的改版记录。
