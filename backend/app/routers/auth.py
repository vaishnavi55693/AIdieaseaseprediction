from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Role, User
from app.schemas import LoginRequest, SignupRequest, TokenResponse, UserProfileUpdate, UserResponse
from app.security import create_access_token, get_password_hash, verify_password


router = APIRouter()


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    role = db.query(Role).filter(Role.name == payload.role.lower()).first()
    if not role:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role")

    user = User(
        full_name=payload.full_name,
        email=payload.email,
        password_hash=get_password_hash(payload.password),
        role_id=role.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.email)
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user.id,
            full_name=user.full_name,
            email=user.email,
            role=role.name,
            age=user.age,
            gender=user.gender,
            height_cm=user.height_cm,
            weight_kg=user.weight_kg,
            medical_history=user.medical_history,
        ),
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    role_name = user.role.name if user.role else "user"
    token = create_access_token(user.email)
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user.id,
            full_name=user.full_name,
            email=user.email,
            role=role_name,
            age=user.age,
            gender=user.gender,
            height_cm=user.height_cm,
            weight_kg=user.weight_kg,
            medical_history=user.medical_history,
        ),
    )


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    role_name = current_user.role.name if current_user.role else "user"
    return UserResponse(
        id=current_user.id,
        full_name=current_user.full_name,
        email=current_user.email,
        role=role_name,
        age=current_user.age,
        gender=current_user.gender,
        height_cm=current_user.height_cm,
        weight_kg=current_user.weight_kg,
        medical_history=current_user.medical_history,
    )


@router.put("/profile", response_model=UserResponse)
def update_profile(payload: UserProfileUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    current_user.full_name = payload.full_name
    current_user.age = payload.age
    current_user.gender = payload.gender
    current_user.height_cm = payload.height_cm
    current_user.weight_kg = payload.weight_kg
    current_user.medical_history = payload.medical_history
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    role_name = current_user.role.name if current_user.role else "user"
    return UserResponse(
        id=current_user.id,
        full_name=current_user.full_name,
        email=current_user.email,
        role=role_name,
        age=current_user.age,
        gender=current_user.gender,
        height_cm=current_user.height_cm,
        weight_kg=current_user.weight_kg,
        medical_history=current_user.medical_history,
    )
