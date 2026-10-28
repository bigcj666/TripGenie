from fastapi import APIRouter

from ..config import Settings
from ..schemas.trip import GenerateRequest, GenerateResponse
from ..services.generate import generate_trips

router = APIRouter(prefix="/api/trip", tags=["trip"])


@router.post("/generate", response_model=GenerateResponse)
def generate(request: GenerateRequest) -> GenerateResponse:
    return generate_trips(request, Settings.from_env())
