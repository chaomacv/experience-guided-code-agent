"""Dependency-free BM25 for Chinese text and engineering identifiers."""
import math
import re
from collections import Counter


def tokenize(text):
    tokens = []
    for word in re.findall(r"[\u3400-\u9fff]+|[A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)*", text):
        if re.fullmatch(r"[\u3400-\u9fff]+", word):
            tokens.extend(word if len(word) == 1 else [word[i:i+2] for i in range(len(word)-1)])
        else:
            tokens.append(word.lower())
            parts = re.sub(r"([a-z0-9])([A-Z])", r"\1 \2", word)
            parts = re.split(r"[_.\s]+", parts.lower())
            if parts != [word.lower()]:
                tokens.extend(parts)
    return tokens


class BM25Index:
    def __init__(self, texts, k1=1.5, b=0.75):
        self.k1, self.b = k1, b
        self.documents = [Counter(tokenize(text)) for text in texts]
        self.lengths = [sum(doc.values()) for doc in self.documents]
        self.average_length = sum(self.lengths) / max(1, len(self.lengths))
        frequency = Counter(term for doc in self.documents for term in doc)
        self.idf = {term: math.log(1 + (len(self.documents)-count+0.5)/(count+0.5))
                    for term, count in frequency.items()}

    def scores(self, query):
        terms = set(tokenize(query))
        scores = {}
        for idx, (doc, length) in enumerate(zip(self.documents, self.lengths)):
            norm = self.k1 * (1 - self.b + self.b * length / (self.average_length or 1))
            score = sum(self.idf.get(term, 0) * doc[term] * (self.k1+1) / (doc[term]+norm)
                        for term in terms if doc[term])
            if score > 0:
                scores[idx] = score
        return scores


def reciprocal_rank_fusion(rankings, constant=60):
    """Fuse ranks without mixing incompatible cosine and BM25 score scales."""
    if constant < 1:
        raise ValueError("RRF constant must be positive.")
    fused = {}
    for ranking in rankings:
        for rank, idx in enumerate(dict.fromkeys(ranking), 1):
            fused[idx] = fused.get(idx, 0.0) + 1.0 / (constant + rank)
    return fused
