from typing import Optional

from pydantic import BaseModel


class RetrievalResult(BaseModel):
    score: float
    case_id: str
    chunk_id: str
    chunk_type: str
    text: str
    module: str
    final_status: str
    source: str
    source_provenance: Optional[str] = None
    case_path: Optional[str] = None
    dense_score: Optional[float] = None
    lexical_score: Optional[float] = None
    dense_rank: Optional[int] = None
    lexical_rank: Optional[int] = None
    retrieval_mode: str = "dense"
