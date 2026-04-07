from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import structlog

from database import init_db
from aggregator import aggregator
from websocket import wsm
from auth import verify_token

from api import metrics, flamegraph, processes, files, network, alerts

logger = structlog.get_logger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database...")
    await init_db()
    logger.info("Starting eBPF scope...")
    aggregator.start_all()
    yield
    logger.info("Shutting down...")

app = FastAPI(title="EBPFScope", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await wsm.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        wsm.disconnect(websocket)

app.include_router(metrics.router)
app.include_router(flamegraph.router)
app.include_router(processes.router)
app.include_router(files.router)
app.include_router(network.router)
app.include_router(alerts.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
