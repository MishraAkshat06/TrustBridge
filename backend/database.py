import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "trustbridge.db")

def get_db():
    conn = sqlite3.connect(DB_PATH, timeout=20.0)
    conn.row_factory = sqlite3.Row
    # Enable WAL mode for high concurrency
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA synchronous = NORMAL;")
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # Campaigns table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS campaigns (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        creator_address TEXT NOT NULL,
        contract_address TEXT,
        goal_eth REAL NOT NULL,
        hard_cap_eth REAL NOT NULL DEFAULT 20.0,
        deadline_timestamp INTEGER NOT NULL,
        milestones_json TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # AI Assessments table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ai_assessments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        campaign_id TEXT NOT NULL,
        assessment_type TEXT NOT NULL,
        result_json TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (campaign_id) REFERENCES campaigns (id)
    )
    """)

    # Milestone submissions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS milestone_submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        campaign_id TEXT NOT NULL,
        milestone_index INTEGER NOT NULL,
        attempt INTEGER NOT NULL,
        ipfs_hash TEXT NOT NULL,
        repo_url TEXT,
        demo_url TEXT,
        notes TEXT,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (campaign_id) REFERENCES campaigns (id)
    )
    """)

    # KYC sandbox audit table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS kyc_records (
        address TEXT PRIMARY KEY,
        full_name TEXT,
        country TEXT,
        verified INTEGER DEFAULT 0,
        verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        email TEXT PRIMARY KEY,
        name TEXT,
        avatar TEXT,
        role TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # High performance index creation for foreign keys & queries
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_ai_assessments_campaign ON ai_assessments(campaign_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_milestone_submissions_campaign ON milestone_submissions(campaign_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_campaigns_created ON campaigns(created_at DESC);")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully at", DB_PATH)
