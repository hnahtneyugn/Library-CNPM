from sqlalchemy import Column, Integer, String, Text, Date, ForeignKey, Table
from sqlalchemy.orm import relationship
from .database import Base


books_authors = Table(
    'books_authors',
    Base.metadata,
    Column('book_work_key', String(255), ForeignKey('books.work_key')),
    Column('author_key', String(255), ForeignKey('authors.key'))
)

books_subjects = Table(
    'books_subjects',
    Base.metadata,
    Column('book_work_key', String(255), ForeignKey('books.work_key')),
    Column('subject_name', String(255), ForeignKey('subjects.name'))
)


class Subject(Base):
    __tablename__ = 'subjects'
    name = Column(String(255), primary_key=True)
    books = relationship('Book', secondary=books_subjects,
                         back_populates='subjects')


class Author(Base):
    __tablename__ = 'authors'
    key = Column(String(255), primary_key=True, index=True)
    name = Column(String(255), nullable=True)
    birth_date = Column(Date, nullable=True)
    bio = Column(Text, nullable=True)
    photo_id = Column(Integer, nullable=True)
    books = relationship('Book', secondary=books_authors,
                         back_populates='authors')


class Book(Base):
    __tablename__ = 'books'
    work_key = Column(String(255), primary_key=True, index=True)
    title = Column(String(255))
    cover_id = Column(Integer, nullable=True)
    first_publish_year = Column(Integer, nullable=True)
    publisher = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    authors = relationship(
        'Author', secondary=books_authors, back_populates='books')
    subjects = relationship(
        'Subject', secondary=books_subjects, back_populates='books')
