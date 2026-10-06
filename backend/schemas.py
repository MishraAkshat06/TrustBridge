from typing import Any, Dict, Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")

class StandardResponse(BaseModel, Generic[T]):
    status: str = "success"
    data: Optional[T] = None
    error: Optional[str] = None

class MilestoneItemSchema(BaseModel):
    title: str
    tranche_bps: int = Field(default=2500, ge=100, le=10000)
    evidence: Optional[str] = ""

class CampaignCreateSchema(BaseModel):
    id: Optional[str] = None
    title: str = Field(..., min_length=1, max_length=120)
    description: Optional[str] = ""
    category: Optional[str] = "Other"
    creator_address: Optional[str] = "0x0000000000000000000000000000000000000000"
    contract_address: Optional[str] = ""
    goal_eth: float = Field(default=10.0, gt=0, le=20.0)
    hard_cap_eth: float = Field(default=20.0, ge=0.01, le=20.0)
    deadline_timestamp: Optional[int] = 0
    milestones: Optional[List[Dict[str, Any]]] = None

class PredictRequestSchema(BaseModel):
    id: Optional[str] = None
    campaign_id: Optional[str] = None
    title: Optional[str] = ""
    description: Optional[str] = ""
    category: Optional[str] = "Other"
    goal_eth: Optional[float] = 10.0
    duration_days: Optional[int] = 30
    milestone_count: Optional[int] = 4

class RiskRequestSchema(BaseModel):
    id: Optional[str] = None
    campaign_id: Optional[str] = None
    title: Optional[str] = ""
    description: Optional[str] = ""
    category: Optional[str] = "Other"
    goal_eth: Optional[float] = 10.0
    duration_days: Optional[int] = 30
    milestone_count: Optional[int] = 4

class AIAnalyzeRequestSchema(BaseModel):
    id: Optional[str] = None
    campaign_id: Optional[str] = None
    title: Optional[str] = ""
    description: Optional[str] = ""
    category: Optional[str] = "Other"
    goal_eth: Optional[float] = 10.0
    duration_days: Optional[int] = 30
    milestones: Optional[List[Any]] = None

class AIExplainRequestSchema(BaseModel):
    id: Optional[str] = None
    campaign_id: Optional[str] = None
    title: Optional[str] = ""
    description: Optional[str] = ""
    category: Optional[str] = "Other"
    goal_eth: Optional[float] = 10.0
    duration_days: Optional[int] = 30

class AIReviewEvidenceRequestSchema(BaseModel):
    milestone: Optional[Dict[str, Any]] = None
    evidence: Optional[Dict[str, Any]] = None

class KYCRequestSchema(BaseModel):
    address: str
    full_name: Optional[str] = "Anonymous Creator"
    country: Optional[str] = "US"

class AuthGoogleSchema(BaseModel):
    email: str
    name: Optional[str] = "Google User"
    avatar: Optional[str] = ""
    role: Optional[str] = "Contributor"

class AuthGoogleVerifySchema(BaseModel):
    credential: Optional[str] = None
    token: Optional[str] = None
    role: Optional[str] = "Contributor"

class SIWEVerifySchema(BaseModel):
    message: str
    signature: str
    address: str
    role: Optional[str] = "Contributor"

class FirebaseVerifySchema(BaseModel):
    user: Optional[Dict[str, Any]] = None
    role: Optional[str] = "Contributor"

class ChatRequestSchema(BaseModel):
    message: str
