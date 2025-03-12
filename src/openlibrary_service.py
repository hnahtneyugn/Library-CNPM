import requests
import time


def fetch_books_by_subjects(subject: str, limit: int):
    """Fetch books by subjects from Open Library API

    Args:
        subject (str): subject to search
        limit (int): limit of books to fetch each api call
    """

    base_url = f'https://openlibrary.org/subjects/{subject}.json?details=true'
    books = []
    offset = 0
    retries = 5

    while True:
        params = {
            'limit': limit,
            'offset': offset
        }

        try:
            response = requests.get(base_url, params=params, timeout=30)
            if response.status_code == 200:
                data = response.json()
                works = data.get('works', [])

                # Break if no more books to fetch
                if not works:
                    break

                for work in works:
                    work_key = work.get('key', '').split('/')[-1]
                    title = work.get('title', 'No title')
                    authors = work.get('authors', [])
                    authors = list(map(lambda author: author.get(
                        'key', '').split('/')[-1], authors)) if authors else []
                    subjects = work.get('subject', [])
                    cover_id = work.get('cover_id', '')
                    first_publish_year = work.get('first_publish_year', None)
                    publishers = work.get('publishers', [])
                    publisher = publishers[0].get(
                        'name', '') if publishers else ''

                    books.append({
                        'work_key': work_key,
                        'title': title,
                        'authors': authors,
                        'subjects': subjects,
                        'cover_id': cover_id,
                        'first_publish_year': first_publish_year,
                        'publisher': publisher
                    })

                # Increase offset before next request
                offset += limit

                # Reset retries if request is successful
                retries = 5

                # Break 1 second
                time.sleep(1)
                break
            else:
                # Retry if request failed
                print(f"Error: {response.status_code}")
                retries -= 1
                if retries == 0:
                    break
                time.sleep(1)
        except Exception as e:
            print(f"Error: {e}")
            retries -= 1
            if retries == 0:
                break
            time.sleep(1)
    return books
