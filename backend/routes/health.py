from fastapi import APIRouter

from database import check_connection

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check():
    db_ok = check_connection()
    return {
        "status": "ok" if db_ok else "degraded",
        "database": "connected" if db_ok else "unreachable",
        "service": "HazardWatch API",
        "version": "0.1.0",
    }
