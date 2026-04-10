from pydantic import BaseModel, Field
from fastapi import APIRouter

from app.chatbot import process_message


router = APIRouter()


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)


@router.post("/chat")
def chat(payload: ChatRequest) -> dict:
    return process_message(payload.message)
