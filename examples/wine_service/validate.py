"""Application-owned acceptance checks; never writable by model actions."""
import hashlib
import inspect
import json
from pathlib import Path
from unittest.mock import patch
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import balanced_accuracy_score, confusion_matrix
import service

ROOT = Path(__file__).parent


def load_data(name):
    rows = np.loadtxt(ROOT / 'data' / name, delimiter=',', skiprows=1)
    return rows[:, 1:], rows[:, 0].astype(int)


def validate():
    X, y = load_data('train.csv')
    H, labels = load_data('holdout.csv')
    checks, metrics = [], {}
    def check(name, fn):
        try:
            fn()
            checks.append({'name': name, 'passed': True})
        except Exception as exc:
            checks.append({'name': name, 'passed': False, 'error': type(exc).__name__ + ': ' + str(exc)})
    def trained(algorithm=None):
        model = service.WineService(algorithm)
        assert model.fit(X.copy(), y.copy()) is model, 'fit must return self'
        return model
    def interface():
        assert list(inspect.signature(service.WineService.__init__).parameters) == ['self', 'algorithm']
        assert list(inspect.signature(service.WineService.fit).parameters) == ['self', 'X', 'y']
        assert list(inspect.signature(service.WineService.predict).parameters) == ['self', 'X']
        rows = trained().predict(H[:5].copy())
        assert isinstance(rows, list) and len(rows) == 5
        for row in rows:
            assert type(row['label']) is int and row['label'] in (0, 1, 2)
            assert type(row['confidence']) is float and 0 <= row['confidence'] <= 1
            assert row['metadata']['algorithm'] == 'random_forest'
            assert isinstance(row['metadata']['reason'], str) and row['metadata']['reason'].strip()
    def runtime():
        calls = {'fit': 0, 'predict_proba': 0}
        original_fit, original_predict = RandomForestClassifier.fit, RandomForestClassifier.predict_proba
        def fit(model, a, b, *args, **kwargs):
            calls['fit'] += 1
            assert np.array_equal(a, X) and np.array_equal(b, y), 'Training must use provided train data'
            return original_fit(model, a, b, *args, **kwargs)
        def predict(model, a, *args, **kwargs):
            calls['predict_proba'] += 1
            return original_predict(model, a, *args, **kwargs)
        with patch.object(RandomForestClassifier, 'fit', fit), patch.object(RandomForestClassifier, 'predict_proba', predict):
            model = trained()
            rows = model.predict(H[:7].copy())
            assert len(rows) == 7
        assert calls['fit'] >= 1 and calls['predict_proba'] >= 1, calls
        metrics['runtime_calls'] = calls
    def quality():
        model = trained()
        rows = model.predict(H.copy())
        predicted = [row['label'] for row in rows]
        score = balanced_accuracy_score(labels, predicted)
        metrics.update(balanced_accuracy=float(score), holdout_size=len(labels), confusion_matrix=confusion_matrix(labels, predicted).tolist())
        baseline_score = json.loads((ROOT / 'data' / 'manifest.json').read_text())['baseline_balanced_accuracy']
        threshold = max(0.95, baseline_score - 0.02)
        metrics['acceptance_threshold'] = threshold
        assert score >= threshold, 'Holdout balanced accuracy below fixed acceptance threshold: ' + str(threshold)
        assert rows == trained().predict(H.copy()), 'Training must be deterministic'
        assert rows == [model.predict([row])[0] for row in H], 'Batch and single-row results differ'
        order = np.random.default_rng(19).permutation(len(H))
        assert model.predict(H[order]) == [rows[i] for i in order], 'Predictions depend on row position'
    def edge_cases():
        model = trained()
        assert model.predict([]) == []
        for bad in ([[1., 2.]], [[float('nan')] * 13], [[float('inf')] * 13]):
            try:
                model.predict(bad)
            except ValueError:
                continue
            raise AssertionError('Invalid features must raise ValueError')
    def fallback():
        expected = json.loads((ROOT / 'data' / 'legacy_predictions.json').read_text())
        assert trained('centroid').predict(H.copy()) == expected, 'Legacy behavior changed'
    check('interface', interface)
    check('actual_random_forest_runtime', runtime)
    check('holdout_quality_and_regression', quality)
    check('edge_cases', edge_cases)
    check('legacy_fallback', fallback)
    return {'passed': all(c['passed'] for c in checks), 'checks': checks, 'metrics': metrics}


if __name__ == '__main__':
    result = validate()
    print(json.dumps(result, indent=2))
    raise SystemExit(0 if result['passed'] else 1)
