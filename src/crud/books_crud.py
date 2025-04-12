import tortoise.transactions
from src.models import *
from src.openlibrary_service import *
from src.schemas import *
from tortoise.exceptions import DoesNotExist
import tortoise


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

    try:
        async with tortoise.transactions.in_transaction():
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
                        f"Error processing book {book_data.get('title', '')}: {str(e)}")
            print('Books and authors gotten and created!')
    except Exception as e:
        print(f'Transaction failed: {str(e)}')
    finally:
        print('Transaction Complete!')


async def get_books(offset: int = 0, limit: int = 100, order_by: str = 'title', order: str = 'asc', search: str = None):
    """Get books data from database

    Args:
        offset (int, optional): the offset from the starting point of books table. Defaults to 0.
        limit (int, optional): limit the number of instances return. Defaults to 0.
        order_by (str, optional): order by this param. Defaults to 'title'.
        order (str, optional): the order, like desc or asc. Defaults to 'asc'.
        search (str, optional): search books by title. Defaults to None.

    Returns:
        _type_: _description_
    """
    order_dict = {
        'asc': order_by,
        'desc': f'-{order_by}'
    }
    if search:
        search = search.lower()
        books = await Book.filter(title__icontains=search).offset(offset).limit(limit).order_by(order_dict.get(order))
        return books

    books = await Book.all().offset(offset).limit(limit).order_by(order_dict.get(order))
    return books if books else []


async def get_book_details(work_key: str):
    """Get the book's detail information

    Args:
        work_key (str): the book's work key
    """

    try:
        details = await fetch_book_details(work_key=work_key)
        edition = await fetch_book_edition(work_key=work_key)
        ratings = await fetch_book_ratings(work_key=work_key)

    except Exception as e:
        print(f'Fetch book details failed: {str(e)}')

    book = await Book.filter(work_key=work_key).first(
    ).prefetch_related('authors')
    book.views += 1
    await book.save(update_fields=['views'])

    book_details = {
        'work_key': book.work_key,
        'title': book.title,
        'cover_id': book.cover_id,
        'first_publish_year': book.first_publish_year,
        'views': book.views,
    }

    authors_data = []
    for author in book.authors:
        authors_data.append({
            'key': author.key,
            'name': author.name
        })

    book_details.update({
        'authors': authors_data
    })
    book_details.update(details)
    book_details.update(edition)
    book_details.update({'ratings': ratings})

    return book_details


async def get_books_by_author(key: str, offset: int = 0, limit: int = 12):
    """Get books data of a specific author

    Args:
        key (str): author's key
        offset(int): offset of the books return 
        limit(int): limit the number of books return in case there's too much books
    """

    books = await Book.filter(authors__key=f'/authors/{key}').prefetch_related('authors').offset(offset=offset).limit(limit=limit)
    return books


async def get_books_by_subject(subject: str, offset: int = 0, limit: int = 12):
    """Get books data of a specific subject

    Args:
        subject (str): book's subject
        offset(int): offset of the books return 
        limit(int): limit the number of books return in case there's too much books
    """

    books = await Book.filter(subjects__name=subject).prefetch_related('subjects').offset(offset=offset).limit(limit=limit)
    return books
