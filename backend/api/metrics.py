from fastapi import APIRouter, Depends
from aggregator import aggregator
from auth import verify_token

router = APIRouter(prefix="/api/metrics", tags=["metrics"])

@router.get("/", dependencies=[Depends(verify_token)])
async def get_metrics():
    return aggregator.current_state
