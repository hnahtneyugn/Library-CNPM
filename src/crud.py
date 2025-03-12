from .openlibrary_service import *
from .models import *
from .schemas import *
from sqlalchemy.dialects.mysql import insert
from sqlalchemy.orm import Session


def save_books_by_subject(db: Session, subject: str, limit: int = 100):
    """Fetch books data from OpenLibrary API and save to the database

    Args:
        db (Session): database session
        subject (str): the book's subject to fetch
        limit (int, optional): number of books each API call. Defaults to 100.
    """

    # Fetch books data from OpenLibrary API
    books_data = fetch_books_by_subjects(subject, limit)

    # List to bulk insert into the database
    books_to_insert = []
    books_authors_to_insert = []
    books_subjects_to_insert = []
    authors_to_insert = set()
    subjects_to_insert = set()

    for book_data in books_data:
        try:
            book_pydantic = BookSchema(**book_data)
        except Exception as e:
            print(f'Invalid book data: {e}')
            continue

        # convert to SQLAlchemy model
        book = Book(
            work_key=book_pydantic.work_key,
            title=book_pydantic.title,
            cover_id=book_pydantic.cover_id,
            first_publish_year=book_pydantic.first_publish_year,
            publisher=book_pydantic.publisher
        )
        books_to_insert.append(book)

        authors_to_insert.update(book_pydantic.authors)
        subjects_to_insert.update(book_pydantic.subjects)

        for author_key in book_pydantic.authors:
            book_author = {
                'book_work_key': book_pydantic.work_key,
                'author_key': author_key
            }
            books_authors_to_insert.append(book_author)

        for subject_name in book_pydantic.subjects:
            book_subject = {
                'book_work_key': book_pydantic.work_key,
                'subject_name': subject_name
            }
            books_subjects_to_insert.append(book_subject)

    if authors_to_insert:
        db.execute(
            insert(Author).values([{"key": key} for key in authors_to_insert])
            .on_duplicate_key_update({"key": Author.key})
        )

    if subjects_to_insert:
        db.execute(
            insert(Subject).values([{"name": name}
                                    for name in subjects_to_insert])
            .on_duplicate_key_update({"name": Subject.name})
        )

    if books_to_insert:
        db.execute(
            insert(Book).values([
                {
                    "work_key": book.work_key,
                    "title": book.title,
                    "cover_id": book.cover_id,
                    "first_publish_year": book.first_publish_year,
                    "publisher": book.publisher
                }
                for book in books_to_insert
            ]).on_duplicate_key_update(
                {'work_key': Book.work_key,
                 'title': Book.title,
                 'cover_id': Book.cover_id,
                 'first_publish_year': Book.first_publish_year,
                 'publisher': Book.publisher}
            )
        )

    if books_authors_to_insert:
        db.execute(
            insert(books_authors).values(books_authors_to_insert)
            .on_duplicate_key_update({"book_work_key": books_authors.c.book_work_key,
                                     "author_key": books_authors.c.author_key})
        )

    if books_subjects_to_insert:
        db.execute(
            insert(books_subjects).values(books_subjects_to_insert)
            .on_duplicate_key_update({"book_work_key": books_subjects.c.book_work_key,
                                     "subject_name": books_subjects.c.subject_name})
        )

    db.commit()
    print(f'{limit} books saved successfully!')
