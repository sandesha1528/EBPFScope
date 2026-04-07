from fastapi import APIRouter, Depends
from aggregator import aggregator
from auth import verify_token

router = APIRouter(prefix="/api/alerts", tags=["alerts"])

@router.get("/", dependencies=[Depends(verify_token)])
async def get_alerts():
    return aggregator.current_state.get("alerts", [])
