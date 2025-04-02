import asyncio
import httpx

headers = {'User-Agent': 'BookHub (hs.hoangson15062005@gmail.com)'}


async def fetch_books_by_subjects(subject: str, limit: int):
    """Fetch books by subjects from Open Library API

    Args:
        subject (str): subject to search
        limit (int): limit of books to fetch each api call
    """

    base_url = f'https://openlibrary.org/subjects/{subject}.json?details=true'
    books = []
    offset = 0
    retries = 5
    async with httpx.AsyncClient(timeout=30.0) as client:
        while offset < 2000:
            params = {
                'limit': limit,
                'offset': offset
            }

            try:
                response = await client.get(
                    base_url, params=params, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    works = data.get('works', [])

                    # Break if no more books to fetch
                    if not works:
                        break

                    for work in works:
                        work_key = work.get('key', '').split('/')[-1]
                        title = work.get('title', 'No title')
                        title = title if len(title) < 1000 else title[:999]
                        authors = work.get('authors', [])
                        cover_id = work.get('cover_id', '')
                        first_publish_year = work.get(
                            'first_publish_year', None)

                        books.append({
                            'work_key': work_key,
                            'title': title,
                            'authors': authors,
                            'cover_id': cover_id,
                            'first_publish_year': first_publish_year,
                        })

                    offset += limit
                    retries = 5
                    await asyncio.sleep(1)

                else:
                    print(f'Error: {response.status_code}')
                    retries -= 1
                    if retries == 0:
                        break
                    await asyncio.sleep(1)
            except Exception as e:
                print(f'Error: {e}')
                retries -= 1
                if retries == 0:
                    break
                await asyncio.sleep(1)
    return books


async def fetch_book_details(work_key: str):
    """Fetch book details from Open Library API

    Args:
        work_key (str): work key of the book

    Returns:
        dict: book details
    """
    base_url = f'https://openlibrary.org/works/{work_key}.json'
    book = {}

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.get(base_url, headers=headers)
            if response.status_code == 200:
                work_data = response.json()
                subjects = work_data.get('subject', [])
                description = work_data.get('description', '')
                if isinstance(description, dict):
                    description = description.get('value', '')
                book = {
                    'subjects': subjects,
                    'description': description,
                }

            else:
                print(f"Error: {response.status_code}")
        except Exception as e:
            print(f"Error: {e}")
    return book


async def fetch_book_edition(work_key: str):
    """Fetch book editions from Open Library API

    Args:
        work_key (str): book's work key
    """

    base_url = f'https://openlibrary.org/works/{work_key}/editions.json?limit=1'
    edition = {}

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.get(base_url, headers=headers)
            if response.status_code == 200:
                edition_data = response.json()
                entry = edition_data.get('entries')[0]
                isbn = entry.get('isbn_13', [])
                publishers = entry.get('publishers', [])
                source_records = entry.get('source_records', [])
                edition_key = entry.get('key', '').split('/')[-1]
                number_of_pages = entry.get('number_of_pages', -1)

                edition = {
                    'isbn': isbn,
                    'publishers': publishers,
                    'source_records': source_records,
                    'edition_key': edition_key,
                    'number_of_pages': number_of_pages
                }

            else:
                print(f'Error: {response.status_code}')
        except Exception as e:
            print(f'Error: {e}')

    return edition


async def fetch_book_ratings(work_key: str):
    """Fetch book ratings from Open Library API

    Args:
        work_key (str): book's work key
    """

    base_url = f'https://openlibrary.org/works/{work_key}/ratings.json'
    ratings = {}

    async with httpx.AsyncClient(timeout=30) as client:
        try:
            response = await client.get(base_url, headers=headers)

            if response.status_code == 200:
                ratings = response.json()

            else:
                print(f'Error: {response.status_code}')

        except Exception as e:
            print(f'Error: {e}')

    return ratings


async def fetch_author_details(key: str):
    """Fetch author details from Open Library API

    Args:
        key (str): author's key
    """

    base_url = f'https://openlibrary.org/authors/{key}.json'
    async with httpx.AsyncClient(timeout=30) as client:
        try:
            response = await client.get(base_url, headers=headers)
            data = response.json()

            if response.status_code == 200:
                personal_name = data.get('personal_name', '')
                birth_date = data.get('birth_date', '')
                links = data.get('links', [])
                alternate_names = data.get('alternate_names', [])
                name = data.get('name', '')
                bio = data.get('bio')
                if isinstance(bio, dict):
                    bio = bio.get('value', '')
                photos = data.get('photos', [])
                source_records = data.get('source_records', [])

                author_details = {
                    'personal_name': personal_name,
                    'birth_date': birth_date,
                    'links': links,
                    'alternate_names': alternate_names,
                    'name': name,
                    'bio': bio,
                    'photos': photos,
                    'source_records': source_records
                }

            else:
                print(f'Error: {response.status_code}')

        except Exception as e:
            print(f'Error: {str(e)}')

    return author_details
