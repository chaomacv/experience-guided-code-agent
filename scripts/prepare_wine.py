"""Prepare real UCI measurements and observed engineering records, without an LLM."""
import argparse
import hashlib
import importlib.util
import json
import platform
import sys
from pathlib import Path
import numpy as np
import sklearn
from sklearn.datasets import load_wine
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import balanced_accuracy_score
from sklearn.model_selection import train_test_split

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from algo_rag_demo.utils.jsonio import write_json


def prepare(output, project=ROOT / 'examples/wine_service'):
    output, project = Path(output), Path(project)
    data_dir = project / 'data'
    data_dir.mkdir(parents=True, exist_ok=True)
    data = load_wine()
    train, test = train_test_split(np.arange(len(data.target)), test_size=0.30, stratify=data.target, random_state=42)
    for name, ids in [('train', train), ('holdout', test)]:
        # Stable row order and decimal representation; source target classes are 0/1/2 in sklearn.
        with (data_dir / (name + '.csv')).open('w', encoding='utf-8', newline='\n') as handle:
            np.savetxt(handle, np.column_stack([data.target[ids], data.data[ids]]),
                       delimiter=',', header='label,' + ','.join(data.feature_names), comments='', fmt='%.12g')
    spec = importlib.util.spec_from_file_location('baseline_wine_service', project / 'service.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    baseline = module.WineService('centroid').fit(data.data[train], data.target[train])
    original_predictions = baseline.predict(data.data[test])
    write_json(data_dir / 'legacy_predictions.json', original_predictions)
    baseline_score = float(balanced_accuracy_score(data.target[test], [row['label'] for row in original_predictions]))
    # Reference experiment is measured history, not a patch or planner action.
    forest = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=1).fit(data.data[train], data.target[train])
    probabilities = forest.predict_proba(data.data[test])
    observations = [
        ('BASELINE', 'Measure the existing centroid service before upgrading',
         {'algorithm':'centroid', 'balanced_accuracy':baseline_score, 'train_rows':len(train), 'holdout_rows':len(test),
          'output_schema':{key:type(value).__name__ for key,value in original_predictions[0].items()},
          'metadata_keys':list(original_predictions[0]['metadata']), 'empty_result':baseline.predict([])}),
        ('RF_API', 'Probe the target sklearn classifier API on training data',
         {'model_type':type(forest).__name__, 'classes':forest.classes_.tolist(), 'probability_shape':list(probabilities.shape),
          'label_dtype':str(forest.classes_.dtype), 'probability_dtype':str(probabilities.dtype),
          'lesson':'Map probability columns through classes_; convert numpy scalars to native Python types.'}),
        ('INPUT_CONTRACT', 'Check invalid input behavior of the existing service', {}),
        ('FALLBACK', 'Record legacy compatibility expectations before migration',
         {'algorithm':'centroid', 'prediction_count':len(original_predictions),
          'prediction_sha256':hashlib.sha256((data_dir / 'legacy_predictions.json').read_bytes()).hexdigest(),
          'lesson':'Retain explicit centroid override and compare original predictions and confidence values.'}),
    ]
    for key, bad in [('wrong_dimension', [[1,2]]), ('non_finite', [[float('nan')]*13])]:
        try:
            baseline.predict(bad)
            result = 'accepted'
        except Exception as exc:
            result = type(exc).__name__ + ': ' + str(exc)
        observations[2][2][key] = result
    manifest = {
        'dataset':'UCI Wine', 'source':'https://archive.ics.uci.edu/dataset/109/wine',
        'doi':'10.24432/C5PC7J', 'license':'CC BY 4.0',
        'loader':'sklearn.datasets.load_wine', 'rows':len(data.target), 'features':len(data.feature_names),
        'classes':data.target_names.tolist(), 'train_rows':len(train), 'holdout_rows':len(test),
        'split':{'method':'stratified train_test_split', 'test_size':0.30, 'random_state':42,
                 'train_source_rows':train.tolist(), 'holdout_source_rows':test.tolist()},
        'python':platform.python_version(), 'sklearn':sklearn.__version__, 'baseline_balanced_accuracy':baseline_score,
        'files':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(data_dir.glob('*')) if p.name != 'manifest.json'},
        'knowledge_origin':'Freshly executed diagnostic experiments; not customer conversations or fabricated incident histories.'
    }
    write_json(data_dir / 'manifest.json', manifest)
    write_json(output / 'provenance.json', manifest)
    for suffix, task, evidence in observations:
        write_json(output / 'observations' / (suffix + '.json'), evidence)
        write_json(output / 'conversations' / (suffix + '.json'), {
            'conversation_id':'WINE_DIAGNOSTIC_' + suffix, 'task':task,
            'messages':[{'role':'user', 'content':task},
                        {'role':'tool', 'name':'executed_python_probe', 'content':json.dumps(evidence, ensure_ascii=False)},
                        {'role':'user', 'content':'Extract reusable engineering facts from the observed probe only. This is a measured diagnostic record, not a completed migration. Do not invent failures, fixes or production history; use partial status and not_run for migration validation.'}]
        })
    print(json.dumps({'preparation':str(output), 'rows':len(data.target), 'train':len(train), 'holdout':len(test),
                      'diagnostic_records':len(observations), 'baseline_balanced_accuracy':baseline_score}))
    return manifest


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', default='outputs/wine_preparation')
    args = parser.parse_args()
    prepare(args.output)
