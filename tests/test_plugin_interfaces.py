import numpy as np
from experience_guided_code_agent.rag.embedding import get_embedding_provider
from experience_guided_code_agent import plugins
from experience_guided_code_agent.agent.llm_provider import build_chat_provider


def test_configured_factories_are_used_without_changing_workflow(tmp_path, monkeypatch):
    (tmp_path / 'custom_backend.py').write_text('''
import numpy as np
class Encoder:
    def __init__(self, model_name=None): self.model_name = model_name
    def encode_documents(self, texts): return np.ones((len(texts), 2), dtype='float32') / np.sqrt(2)
    def encode_query(self, text): return self.encode_documents([text])[0]
def build(**kwargs): return (2, 6, 2)
class Search:
    def __init__(self, **kwargs): self.config = kwargs
    def search(self, query, top_k=5, module=None): return []
class Chat:
    def __init__(self, config): self.config = config
    def complete(self, messages, response_format=None): return '{"actions": []}'
''')
    monkeypatch.syspath_prepend(str(tmp_path))
    encoder = get_embedding_provider('custom_backend:Encoder', 'my-model')
    assert encoder.model_name == 'my-model'
    assert encoder.encode_documents(['a', 'b']).shape == (2, 2)
    assert np.allclose(np.linalg.norm(encoder.encode_query('a')), 1)
    config = {'retrieval':{'factory':'custom_backend:Search', 'index_factory':'custom_backend:build'}}
    assert plugins.index_builder(config)(case_dir=tmp_path) == (2, 6, 2)
    assert plugins.retriever(config, index_dir=tmp_path).search('query') == []
    assert build_chat_provider({'factory':'custom_backend:Chat', 'model':'custom'}).config['model'] == 'custom'
