"""Prepare UCI business data and legacy acceptance snapshots; knowledge comes from separate dialogues."""
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
from sklearn.metrics import balanced_accuracy_score
from sklearn.model_selection import train_test_split

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from experience_guided_code_agent.utils.jsonio import write_json


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
    manifest = {
        'dataset':'UCI Wine', 'source':'https://archive.ics.uci.edu/dataset/109/wine',
        'doi':'10.24432/C5PC7J', 'license':'CC BY 4.0',
        'loader':'sklearn.datasets.load_wine', 'rows':len(data.target), 'features':len(data.feature_names),
        'classes':data.target_names.tolist(), 'train_rows':len(train), 'holdout_rows':len(test),
        'split':{'method':'stratified train_test_split', 'test_size':0.30, 'random_state':42,
                 'train_source_rows':train.tolist(), 'holdout_source_rows':test.tolist()},
        'python':platform.python_version(), 'sklearn':sklearn.__version__, 'baseline_balanced_accuracy':baseline_score,
        'files':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(data_dir.glob('*')) if p.name != 'manifest.json'},
        'preparation_note':'Business training/acceptance data only. RAG knowledge is loaded separately from historical human-assistant dialogues.'
    }
    write_json(data_dir / 'manifest.json', manifest)
    write_json(output / 'provenance.json', manifest)
    print(json.dumps({'preparation':str(output), 'rows':len(data.target), 'train':len(train), 'holdout':len(test),
                      'knowledge_source':'separate historical dialogue corpus', 'baseline_balanced_accuracy':baseline_score}))
    return manifest


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', default='outputs/wine_preparation')
    args = parser.parse_args()
    prepare(args.output)
