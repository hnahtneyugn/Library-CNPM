from datetime import datetime, timedelta, timezone
from typing import Annotated, Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends, Request
from fastapi.security import OAuth2PasswordBearer
from src.models import User

SECRET_KEY = "bacccfb18c0e7d9b709d3371692a385554ddebf1fd9c5a63ea419b028ec4e859"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="authentication/signin")
oauth2_scheme_non_required = OAuth2PasswordBearer(tokenUrl="authentication/signin", auto_error=False)

def get_hashed_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# New custom dependency for optional authentication (for get_book_details)
async def get_current_user_optional(token: Annotated[Optional[str], Depends(oauth2_scheme_non_required)]):
    if not token:
        print("No token provided")
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        print(f"Extracted username: {username}")
        if username is None:
            print("No username in token")
            return None
    except JWTError as e:
        print(f"JWT error: {e}")
        return None
    
    user = await User.filter(username=username).first()
    if user:
        print(f"Found user: {user.username}")
    else:
        print(f"No user found for username: {username}")
    if user is None:
        return None
    return user

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        print(f"Extracted username: {username}")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await User.filter(username=username).first()
    if user:
        print(f"Found user: {user.username}")
    else:
        print("No user found!")
    if user is None:
        raise credentials_exception
    return user

