from fastapi import APIRouter, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from src.auth import *
from src.models import User
from src.schemas import UserSchema

router = APIRouter()

@router.post("/signup")
async def signup(user: UserSchema):
    if await User.filter(username=user.username).exists():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists",
        )
    
    hashed_password = get_hashed_password(user.password)
    db_user = await User.create(username=user.username, hashed_password=hashed_password)
    return {"message": "User created successfully", "username": db_user.username}

@router.post("/signin")
async def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    user = await User.filter(username=form_data.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Can't find user! Please sign in!",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password! Please try again!",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)    # create token
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    print(f"Generated token: {access_token}")
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/users/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    print(f"Got username: {current_user.username}")
    return {"username": current_user.username}