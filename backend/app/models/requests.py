from pydantic import BaseModel

class InterrogateRequest(BaseModel):
    prompt: str
    symbol: str
