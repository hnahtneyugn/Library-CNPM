from src.models import *
import tortoise
from typing import List

import random
import faiss
import numpy as np
from transformers import BertTokenizer, BertModel
import torch

tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
model = BertModel.from_pretrained('bert-base-uncased')


async def get_embedding(text: str, publish_year: int) -> torch.Tensor:
    inputs = tokenizer(text, return_tensors='pt',
                       padding=True, truncation=True, max_length=512)
    with torch.no_grad():
        outputs = model(**inputs)
        outputs = outputs.last_hidden_state.mean(dim=1).squeeze()

    normalized_year = (publish_year - 1900) / (2025 - 1900)
    normalized_year = torch.tensor([normalized_year], dtype=outputs.dtype)
    embedding = torch.cat((outputs, normalized_year), dim=0)
    return embedding.tolist()


async def create_book_embedding(work_key: str) -> None:
    """Create a book embedding for the given book.

    Args:
        work_key (str): The work key of the book.
    """
    # Get the book details from the database
    book = await Book.get_or_none(work_key=work_key).prefetch_related("authors", "subjects")

    # Make text input for the embedding model
    if not book:
        return
    authors = [author.name for author in book.authors] if book.authors else []
    subjects = [
        subject.name for subject in book.subjects] if book.subjects else []
    input_text = f"{book.title} {' '.join(authors)} {' '.join(subjects)}"

    # Generate the embedding using the get_embedding function
    embedding = await get_embedding(input_text, book.first_publish_year)

    # Create or update the BookEmbedding entry in the database
    await BookEmbedding.update_or_create({"book": book, "embedding": embedding})


async def find_similar_books(work_key: str, limit: int = 10) -> List[Book]:
    """Find similar books to the given book.

    Args:
        work_key (str): The work key of the book.
        limit (int): The maximum number of similar books to return.

    Returns:
        List[Book]: A list of similar books.
    """
    # Get the embedding for the given book
    book = await Book.get_or_none(work_key=work_key)
    if not book:
        return []

    # Get the embedding for the book
    book_embedding = await BookEmbedding.get_or_none(book=book)
    if not book_embedding:
        return []

    # Get the embedding for other books
    book_embeddings = await BookEmbedding.all().exclude(
        book=book).prefetch_related("book")

    # Set up data and mapping
    embedding_list = []
    book_map = []

    for emb in book_embeddings:
        embedding_list.append(np.array(emb.embedding, dtype=np.float32))
        book_map.append(emb.book)

    # Create a FAISS index
    index = faiss.IndexFlatL2(embedding_list[0].shape[0])
    index.add(np.stack(embedding_list))

    # Find similar books based on the embedding
    query_embedding = np.array(
        book_embedding.embedding, dtype=np.float32).reshape(1, -1)
    _, indices = index.search(query_embedding, limit)
    similar_books = [book_map[i] for i in indices[0]]
    return similar_books


async def recommend_books(username: str, limit: int = 10) -> List[Book]:
    """Recommend books to a user based on their favorite books.

    Args:
        username (str): The username of the user.
        limit (int): The maximum number of recommended books to return.

    Returns:
        List[Book]: A list of recommended books.
    """
    # Get the user's favorite books
    user = await User.get_or_none(username=username)
    if not user:
        return []

    favorite_books = await FavoriteBook.filter(user=user).prefetch_related("book")

    # Find similar books for each favorite book
    similar_books = set()
    for favorite_book in favorite_books:
        similar_books.update(await find_similar_books(favorite_book.book.work_key, limit))

    # Randomly select a subset of similar books to return
    if len(similar_books) > limit:
        similar_books = random.sample(similar_books, limit)
        return list(similar_books)[:limit]

    else:
        return list(similar_books)
