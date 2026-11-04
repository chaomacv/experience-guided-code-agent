import json
from pathlib import Path
from algo_rag_demo.case_pipeline.schema import Conversation, EngineeringCase
from algo_rag_demo.case_pipeline.parser import LLMCaseExtractor
from algo_rag_demo.case_pipeline.chunker import chunk_case


def test_history_corpus_has_human_assistant_turns_and_mixed_topics():
    base=Path('examples/history_dialogues')
    manifest=json.loads((base/'manifest.json').read_text(encoding='utf-8'))
    assert len(manifest['records'])==12
    assert sum(row['relevance_to_reference_task']>0 for row in manifest['records'])==6
    for row in manifest['records']:
        raw=json.loads((base/row['file']).read_text(encoding='utf-8'))
        convo=Conversation(**raw)
        assert convo.provenance=='synthetic_authored_human_assistant_dialogue'
        assert [m.role for m in convo.messages]==['user','assistant']*4
        assert 'relevance_to_reference_task' not in raw


def test_provenance_is_bound_from_input_and_preserved_in_chunks():
    class Provider:
        def complete(self,*args,**kwargs):
            return json.dumps({'case_id':'CASE_TEST','module':'classification','task':'migration','final_status':'partial',
                               'source_conversation_id':'forged','source_provenance':'verified_customer'})
    convo=Conversation(conversation_id='HISTORY_001',provenance='synthetic_authored_human_assistant_dialogue',task='migration',messages=[])
    case=LLMCaseExtractor(Provider()).extract(convo)
    assert case.source_conversation_id=='HISTORY_001'
    assert case.source_provenance==convo.provenance
    assert all(c.source_provenance==convo.provenance for c in chunk_case(case))
