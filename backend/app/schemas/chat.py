from pydantic import BaseModel


class ChatHistoryMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str


class GuestChatRequest(ChatRequest):
    history: list[ChatHistoryMessage] = []
    model: str = "meta-llama/Llama-3.3-70B-Instruct-Turbo"
