from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from app.db.supabase import supabase_db

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


class AlertCreateRequest(BaseModel):
    symbol: str
    metric: str          # e.g. 'PE', 'Price', 'DivYield'
    operator: str        # '<' or '>'
    value: float


def _get_user_id(authorization: Optional[str]) -> Optional[str]:
    """
    Extract the Supabase user_id from a Bearer JWT token.
    Returns None when no valid token is provided (anonymous / MVP mode).
    """
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ", 1)[1]
    try:
        user_resp = supabase_db.auth.get_user(token)
        return user_resp.user.id if user_resp and user_resp.user else None
    except Exception:
        return None


@router.get("/")
async def get_alerts(authorization: Optional[str] = Header(default=None)):
    """
    Return all alerts for the current user.
    Falls back to returning all public (user_id IS NULL) alerts in MVP mode.
    """
    if not supabase_db:
        raise HTTPException(status_code=500, detail="Database not connected")

    user_id = _get_user_id(authorization)

    try:
        if user_id:
            res = supabase_db.table("alerts").select("*").eq("user_id", user_id).execute()
        else:
            # MVP fallback: return alerts with no user attached
            res = supabase_db.table("alerts").select("*").is_("user_id", "null").execute()
        return res.data or []
    except Exception as e:
        print(f"Alerts table error (table might be missing): {e}")
        return []


@router.post("/")
async def create_alert(req: AlertCreateRequest, authorization: Optional[str] = Header(default=None)):
    """
    Create a new alert, optionally scoped to the logged-in user.
    """
    if not supabase_db:
        raise HTTPException(status_code=500, detail="Database not connected")

    user_id = _get_user_id(authorization)

    payload = {
        "symbol": req.symbol.strip().upper(),
        "condition": f"{req.metric}_{req.operator}_{req.value}",
        "target_value": req.value,
        "message": f"{req.metric} {req.operator} {req.value} for {req.symbol.upper()}",
        "is_active": True,
    }
    if user_id:
        payload["user_id"] = user_id

    try:
        res = supabase_db.table("alerts").insert(payload).execute()
        return {"status": "success", "alert": res.data[0] if res.data else {}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating alert: {str(e)}")


@router.delete("/{alert_id}")
async def delete_alert(alert_id: str, authorization: Optional[str] = Header(default=None)):
    """
    Delete an alert by ID. Users can only delete their own alerts.
    """
    if not supabase_db:
        raise HTTPException(status_code=500, detail="Database not connected")

    user_id = _get_user_id(authorization)

    try:
        query = supabase_db.table("alerts").delete().eq("id", alert_id)
        if user_id:
            query = query.eq("user_id", user_id)
        query.execute()
        return {"status": "success", "message": f"Alert {alert_id} deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting alert: {str(e)}")


@router.patch("/{alert_id}/toggle")
async def toggle_alert(alert_id: str, authorization: Optional[str] = Header(default=None)):
    """
    Toggle the is_active flag of an alert.
    """
    if not supabase_db:
        raise HTTPException(status_code=500, detail="Database not connected")

    user_id = _get_user_id(authorization)

    try:
        # Fetch current state
        res = supabase_db.table("alerts").select("is_active").eq("id", alert_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Alert not found")

        current = res.data[0]["is_active"]
        query = supabase_db.table("alerts").update({"is_active": not current}).eq("id", alert_id)
        if user_id:
            query = query.eq("user_id", user_id)
        query.execute()
        return {"status": "success", "is_active": not current}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error toggling alert: {str(e)}")
