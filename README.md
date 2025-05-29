# BookHub

## Description
A FastAPI-based web application for book enthusiasts to explore and manage their favorite books

## Table of Contents
- [Installation](#introduction)
- [Usage](#usage)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Screenshots](#screenshots)
- [Contributors](#contributors)

## Installation
Follow these step to set up the project locally

### 1. Clone the repository
### 2. Create a new conda enviroment and load the enviroment.yml file
```bash
conda env create -f environment.yml
```
### 3. Start the web backend server
Before you run the app, you have to uncomment the init_db() in main.py to intialize to database tables

And add a .env file in the src folder, declare DATABASE_URL as follow
```
DATABASE_URL=postgres://your_postgres_username:your_password@127.0.0.1/your_database_name
```

then run the app with:
```bash
fastapi dev src/main.py
```
Then navigate to `localhost:8000` in your web browser to access the web
or `localhost:8000/docs` to access the API docs 

If you don't want to uncomment in main.py, you can use
```bash
aerich init-db
aerich migrate
aerich upgrade
```

### 4. Start the web frontend server
After running the backend, you change directory to frontend folder, install dependencies and start server
```bash
cd /bookhub-fe
npm install
npm run dev
```

## Usage
- Navigate to `localhost:3000` in your web browser to access the web
- Browse books, add them to your favorites, explore author details and have disscusions with other users to your heart content

## Features
- User authentication and authorization
- Book search and detailed book view
- Favorite books management
- Author information pages
- Personalized recommendation
- Ratings and comments
- Have a meaningful discussion with other book enthusiasts
- And so much more

## Technologies Used
- FastAPI
- PostgreSQL
- HTML/CSS
- Javascript

## Screenshots

## Contributing
Contributions are welcome! Please fork the repository and submit pull requests.

## Contributors
- Hoàng Sơn (Team leader/Backend Developer)
- Tạ Nguyên Thành (Backend Developer)
- Đào Tự Phát (Backend Developer)
- Hoàng Minh Quyền (Frontend Developer)
- Nguyễn Năng Thịnh (Frontend Developer)
