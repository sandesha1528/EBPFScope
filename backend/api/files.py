from fastapi import APIRouter, Depends
from aggregator import aggregator
from auth import verify_token

router = APIRouter(prefix="/api/files", tags=["files"])

@router.get("/", dependencies=[Depends(verify_token)])
async def get_files():
    return aggregator.current_state.get("files", [])
