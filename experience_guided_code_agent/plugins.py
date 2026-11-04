"""Explicit configuration entrypoints for alternative indexing/retrieval backends."""
from importlib import import_module


def resolve(spec, default):
    if not spec:
        return default
    module, name = spec.split(':', 1)
    return getattr(import_module(module), name)


def index_builder(config):
    from experience_guided_code_agent.rag.index_builder import build_index_from_cases
    return resolve(config.get('retrieval', {}).get('index_factory'), build_index_from_cases)


def retriever(config, **kwargs):
    from experience_guided_code_agent.rag.retriever import Retriever
    return resolve(config.get('retrieval', {}).get('factory'), Retriever)(**kwargs)
