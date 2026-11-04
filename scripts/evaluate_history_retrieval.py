"""Inspect related and unrelated dialogues in actual retrieval; labels are evaluation-only."""
import argparse
import json
from pathlib import Path
import sys
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from experience_guided_code_agent.rag.retriever import Retriever
from experience_guided_code_agent.utils.jsonio import read_json, write_json


def evaluate(run_dir, output=None):
    run_dir=Path(run_dir)
    manifest=read_json(ROOT/'examples/history_dialogues/manifest.json')
    labels={row['conversation_id']:row for row in manifest['records']}
    provider=read_json(run_dir/'index/metadata.json')['_provider']
    query=read_json(run_dir/'task.json')['task']
    report={'scope':'One authored mixed-corpus sanity check, not an independent retrieval benchmark or RAG benefit study.',
            'label_source':'examples/history_dialogues/manifest.json; labels not used during extraction/indexing/search',
            'corpus_dialogues':len(labels),'query':query,'modes':{}}
    for mode in ['dense','bm25','hybrid']:
        retriever=Retriever(index_dir=run_dir/'index',case_dir=run_dir/'cases',provider_name=provider['name'],
                            embedding_model=provider['model'],mode=mode,max_per_case=1,candidate_k=30)
        results=retriever.search(query,top_k=5,prefer_success=False)
        rows=[{'source':item.source,'case_id':item.case_id,'chunk_type':item.chunk_type,'score':item.score,
               'dense_rank':item.dense_rank,'lexical_rank':item.lexical_rank,
               'grade':labels[item.source]['relevance_to_reference_task'],'title':labels[item.source]['title']}
              for item in results]
        report['modes'][mode]={'related_in_top5':sum(row['grade']>0 for row in rows),'returned':len(rows),'results':rows}
    write_json(Path(output) if output else run_dir/'history_retrieval_check.json',report)
    print(json.dumps({mode:{k:v for k,v in row.items() if k!='results'} for mode,row in report['modes'].items()}))
    return report


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--run-dir',required=True)
    parser.add_argument('--output')
    args=parser.parse_args()
    evaluate(args.run_dir,args.output)
