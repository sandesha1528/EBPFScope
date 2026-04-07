from fastapi import APIRouter, Depends
from aggregator import aggregator
from auth import verify_token

router = APIRouter(prefix="/api/processes", tags=["processes"])

@router.get("/", dependencies=[Depends(verify_token)])
async def get_processes():
    return aggregator.current_state.get("syscalls", {})
