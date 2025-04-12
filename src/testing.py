import pytest
import requests

BASE_URL = 'http://127.0.0.1:8000'


@pytest.fixture
def auth_token():
    payload = {
        "username": "hoangson",
        "password": "Hson2005@#"
    }
    response = requests.post(f"{BASE_URL}/authentication/signin", data=payload)
    assert response.status_code == 200, "Failed to authenticate"
    return response.json().get("access_token")


def test_signup_success():
    payload = {
        "username": "testuser",
        "password": "testpassword"
    }
    response = requests.post(f"{BASE_URL}/authentication/signup", json=payload)
    assert response.status_code == 200, f"Failed to sign up: {response.text}"


def test_invalid_signup():
    payload = {
        "username": "tu",
        "password": "lomdom"
    }
    response = requests.post(f"{BASE_URL}/authentication/signup", json=payload)
    assert response.status_code == 422, f"Expected 422, got {response.status_code}: {response.text}"
    errors = response.json().get('detail')
    assert any(error['msg'] for error in errors if "username" in error['loc']
               ), "Should report username error"


def test_signin_success():
    payload = {
        "username": "testuser",
        "password": "testpassword"
    }
    response = requests.post(f"{BASE_URL}/authentication/signin", data=payload)
    assert response.status_code == 200, f"Failed to sign in: {response.text}"
    assert "access_token" in response.json(), "Access token not found in response"


def test_signin_invalid():
    payload = {
        "username": "testuser",
        "password": "wrongpassword"
    }
    response = requests.post(f"{BASE_URL}/authentication/signin", data=payload)
    assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"


def test_get_current_user(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = requests.get(
        f"{BASE_URL}/authentication/users/me", headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    user_data = response.json()
    assert "username" in user_data, "Response should contain 'username'"


def test_get_books(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    params = {"offset": 0, "limit": 10, "order_by": "title",
              "order": "asc", "search": "the"}
    response = requests.get(f"{BASE_URL}/books/",
                            headers=headers, params=params)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    books = response.json()
    assert isinstance(books, list), "Response should be a list of books"


def test_get_book_details(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    work_key = "OL82537W"
    response = requests.get(f"{BASE_URL}/books/{work_key}", headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"


def test_get_author_details(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    author_key = "OL34257A"
    response = requests.get(
        f"{BASE_URL}/authors/{author_key}", headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"


def test_get_books_of_author(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    author_key = "OL34257A"
    params = {"offset": 0, "limit": 10}
    response = requests.get(
        f"{BASE_URL}/authors/{author_key}/books", headers=headers, params=params)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"


def test_get_books_by_subject(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    subject = "fiction"
    params = {"offset": 0, "limit": 10}
    response = requests.get(
        f"{BASE_URL}/subjects/{subject}", headers=headers, params=params)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"


def test_add_favorite_book(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    book_id = "OL82565W"
    response = requests.post(
        f"{BASE_URL}/users/favorites/{book_id}", headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"


def test_list_favorite_books(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = requests.get(f"{BASE_URL}/users/favorites", headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    favorites = response.json()
    assert "user_id" in favorites, "Response should contain 'user_id'"
    assert "favorite_books" in favorites, "Response should contain 'favorite_books'"
    assert isinstance(favorites["favorite_books"],
                      list), "'favorite_books' should be a list"


def test_remove_favorite_book(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    book_id = "OL82565W"
    response = requests.delete(
        f"{BASE_URL}/users/favorites/{book_id}", headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"


def test_rate_book(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    book_id = "OL82565W"
    payload = {"score": 5}
    response = requests.post(
        f"{BASE_URL}/books/{book_id}/rate", headers=headers, json=payload)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"


def test_rating_summary_and_average(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    book_id = "OL82565W"
    response = requests.get(
        f"{BASE_URL}/books/{book_id}/rate/summary", headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    summary = response.json()
    assert "summary" in summary, "Response should contain 'summary'"
    assert "average_score" in summary, "Response should contain 'average_score'"
    assert "total_ratings" in summary, "Response should contain 'total_ratings'"


def test_delete_rating(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    book_id = "OL82565W"
    response = requests.delete(
        f"{BASE_URL}/books/{book_id}/rate", headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"


def test_add_comment(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    book_id = "OL82565W"
    payload = {"content": "Great book!"}
    response = requests.post(
        f"{BASE_URL}/books/{book_id}/comments", headers=headers, json=payload)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"


def test_get_comment(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    book_id = "OL82565W"
    response = requests.get(
        f"{BASE_URL}/books/{book_id}/comments", headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    comments = response.json()
    assert isinstance(comments, list), "Response should be a list"
    if comments:
        assert "comment_id" in comments[0], "Comment should have 'comment_id'"
        assert "content" in comments[0], "Comment should have 'content'"


def test_reply_comment(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    comment_id = 1
    payload = {"content": "I agree!"}
    response = requests.post(
        f"{BASE_URL}/books/OL82565W/comments/{comment_id}/replies", headers=headers, json=payload)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"


def test_get_replies(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    comment_id = 1
    response = requests.get(
        f"{BASE_URL}/books/OL82565W/comments/{comment_id}/replies", headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    replies = response.json()
    assert isinstance(replies, list), "Response should be a list"
    if replies:
        assert "comment_id" in replies[0], "Reply should have 'comment_id'"
        assert "content" in replies[0], "Reply should have 'content'"


def test_like_or_dislike_comment(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    comment_id = 1
    params = {"is_like": 1}
    response = requests.post(
        f"{BASE_URL}/books/OL82565W/comments/{comment_id}/like", headers=headers, params=params)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"


def test_get_comment_like_count(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    comment_id = 1
    response = requests.get(
        f"{BASE_URL}/books/OL82565W/comments/{comment_id}/like", headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    like_count = response.json()
    assert "likes_count" in like_count, "Response should contain 'like_count'"
    assert "dislikes_count" in like_count, "Response should contain 'dislike_count'"


def test_delete_comment(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    comment_id = 1
    response = requests.delete(
        f"{BASE_URL}/books/OL82565W/comments/{comment_id}", headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"


def test_get_recommendations(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    params = {"limit": 5}
    response = requests.get(
        f"{BASE_URL}/recommendations/", headers=headers, params=params)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    recommendations = response.json()
    assert isinstance(recommendations, list), "Response should be a list"
    if recommendations:
        assert "work_key" in recommendations[0], "Book should have 'work_key'"
        assert "title" in recommendations[0], "Book should have 'title'"
