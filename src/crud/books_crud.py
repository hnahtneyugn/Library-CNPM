from src.models import *
from src.openlibrary_service import *
from src.schemas import *
from tortoise.exceptions import DoesNotExist
import tortoise


@tortoise.transactions.atomic()
async def save_books_by_subject(subject: str, limit: int = 100):
    """Fetch books data from Open Library API and save to the database

    Args:
        subject (str): book's subject to fetch
        limit (int, optional): number of books each API call. Defaults to 100.
    """
    try:
        print(subject, limit)
        print('Fetching data')
        books_data = await fetch_books_by_subjects(subject=subject, limit=limit)
        print('Success!')
    except Exception as e:
        raise Exception(f'Failed to fetch books: {str(e)}')

    # Create new Subject instance if not created and add to Many2Many relationship with Book
    subject_instance, created = await Subject.get_or_create(name=subject, defaults={'name': subject})

    for book_data in books_data:
        try:
            # Create new Book instance if not created
            book, created = await Book.get_or_create(work_key=book_data.get('work_key'), defaults={'work_key': book_data.get('work_key'),
                                                                                                   'title': book_data.get('title', ''),
                                                                                                   'cover_id': book_data.get('cover_id', -1),
                                                                                                   'first_publish_year': book_data.get('first_publish_year', -1), })

            await book.subjects.add(subject_instance)

            # Create new Author instance if not created and add to Many2Many relationship with Book
            authors_list = []
            for author_data in book_data.get('authors', []):
                author, created = await Author.get_or_create(key=author_data.get('key'), defaults={'key': author_data.get('key'), 'name': author_data.get('name', '')})
                authors_list.append(author)

            if authors_list:
                await book.authors.add(*authors_list)

        except Exception as e:
            raise Exception(
                f'Error processing book {book_data.get('title', '')}: {str(e)}')
