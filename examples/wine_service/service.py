"""Existing classification service. Upgrade this implementation through the Agent."""
import json
from pathlib import Path
import numpy as np
from sklearn.preprocessing import StandardScaler


class WineService:
    def __init__(self, algorithm=None):
        self.algorithm = algorithm or json.loads(Path(__file__).with_name('config.json').read_text())['algorithm']
        if self.algorithm != 'centroid':
            raise ValueError('Unsupported algorithm: ' + self.algorithm)

    def fit(self, X, y):
        X, y = np.asarray(X, dtype=float), np.asarray(y, dtype=int)
        if X.ndim != 2 or X.shape[1] != 13 or not np.isfinite(X).all():
            raise ValueError('Expected finite [n, 13] features')
        self.scaler = StandardScaler().fit(X)
        z = self.scaler.transform(X)
        self.classes = np.unique(y)
        self.centers = np.array([z[y == label].mean(axis=0) for label in self.classes])
        return self

    def predict(self, X):
        if len(X) == 0:
            return []
        X = np.asarray(X, dtype=float)
        if X.ndim != 2 or X.shape[1] != 13 or not np.isfinite(X).all():
            raise ValueError('Expected finite [n, 13] features')
        distances = ((self.scaler.transform(X)[:, None] - self.centers) ** 2).sum(axis=2)
        probabilities = np.exp(-(distances - distances.min(axis=1, keepdims=True)))
        probabilities /= probabilities.sum(axis=1, keepdims=True)
        return [{'label': int(self.classes[p.argmax()]), 'confidence': float(p.max()),
                 'metadata': {'algorithm': self.algorithm, 'reason': 'standardized nearest centroid'}}
                for p in probabilities]
