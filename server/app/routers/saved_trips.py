import re
from typing import Any

from fastapi import APIRouter, HTTPException

from ..trips import store

router = APIRouter(prefix="/api/trips", tags=["trips"])
_ID = re.compile(r"^[0-9a-f]{16}$")


@router.post("", status_code=201)
def create(trip: dict[str, Any]) -> dict[str, str]:
    try:
        trip_id = store.save_trip(trip)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"id": trip_id}


@router.get("/{trip_id}")
def read(trip_id: str) -> dict[str, Any]:
    if not _ID.fullmatch(trip_id):
        raise HTTPException(status_code=404, detail="找不到这套行程")
    trip = store.get_trip(trip_id)
    if trip is None:
        raise HTTPException(status_code=404, detail="找不到这套行程")
    return trip
