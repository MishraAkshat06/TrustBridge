import os
import json
import sqlite3
import logging
from typing import Optional, Dict, Any, List

logger = logging.getLogger("trustbridge.db")

# Path for SQLite local fallback
LOCAL_DB_PATH = os.path.join(os.path.dirname(__file__), "trustbridge.db")

class DatabaseAdapter:
    """Unified interface for TrustBridge persistence (Supabase / SQLite)."""

    def __init__(self):
        self.provider = "sqlite"
        self.supabase_client = None
        
        supabase_url = os.environ.get("SUPABASE_URL", "").strip()
        supabase_key = (
            os.environ.get("SUPABASE_SECRET_KEY") or
            os.environ.get("SUPABASE_KEY") or
            os.environ.get("SUPABASE_PUBLISHABLE_KEY") or
            os.environ.get("SUPABASE_ANON_KEY", "")
        ).strip()

        if supabase_url and supabase_key:
            try:
                from supabase import create_client
                self.supabase_client = create_client(supabase_url, supabase_key)
                self.provider = "supabase"
                logger.info("Connected to Supabase PostgreSQL database at %s", supabase_url)
            except Exception as e:
                logger.warning("Supabase initialization failed (%s). Falling back to SQLite.", e)
                self.provider = "sqlite"
        else:
            logger.info("SUPABASE_URL not configured. Using local SQLite database.")

    def _get_sqlite_conn(self):
        conn = sqlite3.connect(LOCAL_DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn

    # -------------------------------------------------------------------------
    # Campaigns
    # -------------------------------------------------------------------------
    def list_campaigns(self) -> List[Dict[str, Any]]:
        if self.provider == "supabase" and self.supabase_client:
            try:
                res = self.supabase_client.table("campaigns").select("*").execute()
                if res.data:
                    return res.data
            except Exception as e:
                logger.error("Supabase list_campaigns error: %s. Falling back to SQLite.", e)

        # SQLite fallback
        conn = self._get_sqlite_conn()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM campaigns ORDER BY created_at DESC")
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return rows

    def get_campaign(self, campaign_id: str) -> Optional[Dict[str, Any]]:
        if self.provider == "supabase" and self.supabase_client:
            try:
                res = self.supabase_client.table("campaigns").select("*").eq("id", campaign_id).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                logger.error("Supabase get_campaign error: %s. Falling back to SQLite.", e)

        # SQLite fallback
        conn = self._get_sqlite_conn()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM campaigns WHERE id = ?", (campaign_id,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None

    def create_campaign(self, data: Dict[str, Any]) -> bool:
        if self.provider == "supabase" and self.supabase_client:
            try:
                payload = {
                    "id": data.get("id"),
                    "title": data.get("title"),
                    "description": data.get("description", ""),
                    "category": data.get("category", "General"),
                    "creator_address": data.get("creator_address"),
                    "contract_address": data.get("contract_address"),
                    "goal_eth": float(data.get("goal_eth", 10.0)),
                    "hard_cap_eth": float(data.get("hard_cap_eth", 20.0)),
                    "deadline_timestamp": int(data.get("deadline_timestamp", 0)),
                    "milestones_json": data.get("milestones_json", "[]"),
                    "status": data.get("status", "ACTIVE"),
                    "total_raised_eth": float(data.get("total_raised_eth", 0.0)),
                    "ml_score": int(data.get("ml_score", 85)),
                    "risk_level": data.get("risk_level", "LOW")
                }
                self.supabase_client.table("campaigns").insert(payload).execute()
                logger.info("Saved campaign %s to Supabase.", data.get("id"))
                return True
            except Exception as e:
                logger.error("Supabase create_campaign error: %s. Falling back to SQLite.", e)

        # SQLite fallback
        conn = self._get_sqlite_conn()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO campaigns (
                id, title, description, category, creator_address, contract_address,
                goal_eth, hard_cap_eth, deadline_timestamp, milestones_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data.get("id"),
            data.get("title"),
            data.get("description", ""),
            data.get("category", "General"),
            data.get("creator_address"),
            data.get("contract_address"),
            float(data.get("goal_eth", 10.0)),
            float(data.get("hard_cap_eth", 20.0)),
            int(data.get("deadline_timestamp", 0)),
            json.dumps(data.get("milestones_json", [])) if not isinstance(data.get("milestones_json"), str) else data.get("milestones_json")
        ))
        conn.commit()
        conn.close()
        return True

    # -------------------------------------------------------------------------
    # AI Assessments
    # -------------------------------------------------------------------------
    def save_ai_assessment(self, campaign_id: str, assessment_type: str, result_json: Any) -> bool:
        res_str = json.dumps(result_json) if not isinstance(result_json, str) else result_json
        if self.provider == "supabase" and self.supabase_client:
            try:
                self.supabase_client.table("ai_assessments").insert({
                    "campaign_id": campaign_id,
                    "assessment_type": assessment_type,
                    "result_json": json.loads(res_str)
                }).execute()
                return True
            except Exception as e:
                logger.error("Supabase save_ai_assessment error: %s. Falling back to SQLite.", e)

        # SQLite fallback
        conn = self._get_sqlite_conn()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO ai_assessments (campaign_id, assessment_type, result_json)
            VALUES (?, ?, ?)
        """, (campaign_id, assessment_type, res_str))
        conn.commit()
        conn.close()
        return True

    # -------------------------------------------------------------------------
    # Activity Ledger
    # -------------------------------------------------------------------------
    def log_activity(self, event_data: Dict[str, Any]) -> bool:
        if self.provider == "supabase" and self.supabase_client:
            try:
                self.supabase_client.table("activity_ledger").insert({
                    "campaign_id": event_data.get("campaign_id", "1"),
                    "tx_hash": event_data.get("txHash") or event_data.get("tx_hash"),
                    "event_type": event_data.get("event") or event_data.get("event_type", "Event"),
                    "actor_address": event_data.get("actor") or event_data.get("actor_address", "0x0"),
                    "amount_eth": float(event_data.get("amount") or event_data.get("amount_eth", 0.0)),
                    "block_number": int(event_data.get("blockNumber") or event_data.get("block_number", 0)),
                    "details": event_data.get("details", "")
                }).execute()
                return True
            except Exception as e:
                logger.error("Supabase log_activity error: %s.", e)

        return True

# Singleton instance
db_adapter = DatabaseAdapter()
