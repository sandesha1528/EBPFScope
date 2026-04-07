from fastapi import APIRouter, Depends
from aggregator import aggregator
from auth import verify_token

router = APIRouter(prefix="/api/network", tags=["network"])

@router.get("/", dependencies=[Depends(verify_token)])
async def get_network():
    return aggregator.current_state.get("network", [])
