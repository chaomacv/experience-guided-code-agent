# 替换 Embedding、索引与检索

默认链路：Case 三类 Chunk → 归一化 BGE-M3 dense 向量 → FAISS（未安装时用 NumPy 精确检索）；BM25 独立计算词法排序，Hybrid 用 RRF 融合，可按 Case 去重。无需修改 LLMPlanner 或 workflow。

## 替换模型

配置文件的 `embedding`：

```json
{"provider":"sentence-transformer", "model":"BAAI/bge-small-en-v1.5"}
```

先安装 `sentence-transformers`。适配器使用 `encode(..., normalize_embeddings=True)`；某些模型要求不同的 query/document 前缀，应采用下述自定义 Provider，不能假定所有模型协议相同。更换 Provider、模型、维度或编码规则后必须重新建索引；Retriever 会拒绝 Provider / model 不匹配的旧索引。

自定义 `embedding.provider="my_package.embedding:create_encoder"`，工厂签名 `create_encoder(model_name=None)`，返回对象实现：

```python
encode_documents(texts: list[str]) -> numpy.ndarray  # float32 [n,d]，有限值、L2 归一化
encode_query(text: str) -> numpy.ndarray            # float32 [d]，相同语义空间
```

适合接远程 Embedding API、多语模型或专门的代码模型；密钥从工厂内部读取环境变量。

## 调整检索方法

`retrieval.mode` 可为 dense / bm25 / hybrid；`candidate_k`、`rrf_constant`、`top_k` 和 `max_per_case` 控制候选、融合及上下文预算。BM25 模式搜索时不需要加载向量模型，但默认建索引仍会生成向量。

## 替换整个 RAG 后端

配置 `retrieval.index_factory="my_package.backend:build_index"` 和 `retrieval.factory="my_package.backend:Retriever"`。`algo_rag_demo/plugins.py` 负责实际加载：

- build_index 接受默认 `build_index_from_cases` 的同名关键字：provider_name、embedding_model、case_dir、knowledge_dir、index_dir；返回 `(case_count, chunk_count, dimension)`。
- Retriever 接受 index_dir、provider_name、embedding_model、case_dir、mode、candidate_k、rrf_constant、max_per_case；提供 `search(query, top_k=5, module=None)`。
- search 返回 `list[RetrievalResult]`（`rag/models.py`），保留 case_id、chunk_id、text、source、score 等可追溯字段。若外部系统以文档为知识单元，应将来源和可引用片段映射到这些字段。

参考：[Qdrant Quickstart](https://qdrant.tech/documentation/quickstart/)、[FAISS](https://github.com/facebookresearch/faiss)、[SentenceTransformers](https://www.sbert.net/docs/quickstart.html)。这些是可选后端参考，本仓库默认运行不依赖 Qdrant 或外部 RAG 框架。
