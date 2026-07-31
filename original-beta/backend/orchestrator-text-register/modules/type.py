from __future__ import annotations
from pydantic import BaseModel
from typing import List, Optional


class Item(BaseModel):
    id: str
    name: str
    type: str  # 'folder' | 'file'
    items: Optional[List[Item]]
    modified: str
    size: Optional[str]


class Folder(BaseModel):
    id: str
    name: str
    items: List[Item]
