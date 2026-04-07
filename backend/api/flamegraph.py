from fastapi import APIRouter, Depends
from aggregator import aggregator
from auth import verify_token

router = APIRouter(prefix="/api/flamegraph", tags=["flamegraph"])

@router.get("/", dependencies=[Depends(verify_token)])
async def get_flamegraph():
    return aggregator.current_state.get("flamegraph", {})
