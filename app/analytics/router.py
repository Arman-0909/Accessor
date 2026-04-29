from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func
from typing import List

from app.database import get_session
from app.models import UsageLog, APIKey, User
from app.schemas import UsageLogResponse, AnalyticsSummary
from app.deps import get_current_user

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/logs", response_model=List[UsageLogResponse])
def get_usage_logs(session: Session = Depends(get_session), limit: int = 100, current_user: User = Depends(get_current_user)):
    statement = (
        select(UsageLog)
        .join(APIKey)
        .where(APIKey.user_id == current_user.id)
        .order_by(UsageLog.timestamp.desc())
        .limit(limit)
    )
    logs = session.exec(statement).all()
    return logs

@router.get("/summary", response_model=List[AnalyticsSummary])
def get_analytics_summary(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    keys = session.exec(select(APIKey).where(APIKey.user_id == current_user.id)).all()
    
    summary_list = []
    for key in keys:
        total = session.exec(select(func.count(UsageLog.id)).where(UsageLog.api_key_id == key.id)).first() or 0
        
        if total == 0:
            summary_list.append(AnalyticsSummary(
                key_name=key.name,
                total_requests=0,
                success_rate=0.0,
                error_rate=0.0,
                avg_response_time_ms=0.0
            ))
            continue
            
        successes = session.exec(
            select(func.count(UsageLog.id))
            .where(UsageLog.api_key_id == key.id)
            .where(UsageLog.status_code < 400)
        ).first() or 0
        
        avg_time = session.exec(
            select(func.avg(UsageLog.response_time_ms))
            .where(UsageLog.api_key_id == key.id)
        ).first() or 0.0
        
        success_rate = (successes / total) * 100
        error_rate = 100 - success_rate
        
        summary_list.append(AnalyticsSummary(
            key_name=key.name,
            total_requests=total,
            success_rate=round(success_rate, 2),
            error_rate=round(error_rate, 2),
            avg_response_time_ms=round(avg_time, 2)
        ))
        
    return summary_list
