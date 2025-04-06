#consts.py
import os
from uuid import uuid4


CLOTHING_STORAGE_DIR = os.path.join(os.getcwd(), "clothes")
CLOTHING_METADATA_PATH = os.path.join(os.getcwd(), "clothing_metadata.json")


def generate_random_path() -> str:
    os.makedirs(CLOTHING_STORAGE_DIR, exist_ok=True)
    clothing_path = os.path.join(CLOTHING_STORAGE_DIR, f"{uuid4()}.png")
    return clothing_path
