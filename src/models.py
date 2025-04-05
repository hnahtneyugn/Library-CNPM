from tortoise.models import Model
from tortoise import fields


class Book(Model):
    work_key = fields.CharField(max_length=255, pk=True, index=True)
    title = fields.CharField(max_length=1000)
    cover_id = fields.IntField(null=True)
    first_publish_year = fields.IntField(null=True)
    views = fields.IntField(default=0)

    authors = fields.ManyToManyField(
        'models.Author', related_name='books', through='books_authors')
    subjects = fields.ManyToManyField(
        'models.Subject', related_name='books', through='books_subjects')

    class Meta:
        table = 'books'


class Author(Model):
    key = fields.CharField(max_length=255, pk=True, index=True)
    name = fields.CharField(max_length=500, null=True)

    class Meta:
        table = 'authors'


class Subject(Model):
    name = fields.CharField(max_length=500, pk=True)

    class Meta:
        table = 'subjects'

class User(Model):
    user_id = fields.IntField(primary_key=True, auto_increment=True)
    username = fields.CharField(max_length=255, unique=True)
    hashed_password = fields.CharField(max_length=255)

    class Meta:
        table = 'users'

class UserActivity(Model):
    id = fields.IntField(primary_key=True, auto_increment=True)
    tracking_id = fields.CharField(max_length=36)  
    user_id = fields.IntField(null=True) 
    username = fields.CharField(max_length=255, null=True) 
    path = fields.CharField(max_length=255)  
    timestamp = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "user_activity"


class FavoriteBook(Model):
    user = fields.ForeignKeyField(
        "models.User", related_name="favorite_books", on_delete=fields.CASCADE
    )
    book = fields.ForeignKeyField(
        "models.Book", related_name="favorited_users", on_delete=fields.CASCADE
    )

    class Meta:
        table = "favorite_books"
        unique_together = ("user", "book")


class Rating(Model):
    rating_id = fields.IntField(pk=True)
    user = fields.ForeignKeyField("models.User", related_name="ratings", on_delete=fields.CASCADE)
    book = fields.ForeignKeyField("models.Book", related_name="ratings", on_delete=fields.CASCADE)
    score = fields.IntField()
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "ratings"
        unique_together = ("user", "book")


class Comment(Model):
    comment_id = fields.IntField(pk=True)
    book = fields.ForeignKeyField('models.Book', related_name='comments', on_delete=fields.CASCADE)
    user = fields.ForeignKeyField('models.User', related_name='comments', on_delete=fields.CASCADE)
    content = fields.TextField()
    parent = fields.ForeignKeyField('models.Comment', related_name='replies', null=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "comments"


class CommentLike(Model):
    commentlike_id = fields.IntField(pk=True)
    comment = fields.ForeignKeyField('models.Comment', related_name='likes', on_delete=fields.CASCADE)
    user = fields.ForeignKeyField('models.User', related_name='liked_comments', on_delete=fields.CASCADE)
    is_like = fields.IntField(choices=[(1, 'Like'), (-1, 'Dislike')])
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "comment_likes"
        unique_together = ("comment", "user")
