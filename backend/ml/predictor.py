import os
import joblib
import numpy as np

MODEL_DIR = os.path.dirname(__file__)
CLASSIFIER_PATH = os.path.join(MODEL_DIR, "classifier.joblib")
ANOMALY_PATH = os.path.join(MODEL_DIR, "anomaly_detector.joblib")

CATEGORY_MAP = {
    "AI/ML": 0,
    "DeFi": 1,
    "Infrastructure": 2,
    "Social": 3,
    "GreenTech": 4,
    "Other": 5
}

def extract_features(campaign_dict):
    """
    Extracts zero-leakage launch features:
    [goal_eth, duration_days, category_code, title_len, desc_len, milestone_count]
    """
    goal_eth = float(campaign_dict.get("goal_eth", 10.0))
    duration_days = int(campaign_dict.get("duration_days", 30))
    category = campaign_dict.get("category", "Other")
    category_code = CATEGORY_MAP.get(category, 5)
    title = campaign_dict.get("title", "")
    description = campaign_dict.get("description", "")
    title_len = len(title)
    desc_len = len(description.split())
    milestone_count = int(campaign_dict.get("milestone_count", 4))

    return np.array([[
        goal_eth,
        duration_days,
        category_code,
        title_len,
        desc_len,
        milestone_count
    ]])

def predict_success(campaign_dict):
    if not os.path.exists(CLASSIFIER_PATH):
        raise FileNotFoundError(
            f"Trained classifier artifact missing at '{CLASSIFIER_PATH}'. "
            "Execute 'python backend/ml/train.py' to generate calibrated model."
        )
    clf = joblib.load(CLASSIFIER_PATH)
    X = extract_features(campaign_dict)
    prob = float(clf.predict_proba(X)[0][1])
    return round(prob, 4)

def detect_risk(campaign_dict):
    if not os.path.exists(ANOMALY_PATH):
        raise FileNotFoundError(
            f"Trained anomaly detector artifact missing at '{ANOMALY_PATH}'. "
            "Execute 'python backend/ml/train.py' to generate detector."
        )
    iso = joblib.load(ANOMALY_PATH)
    X = extract_features(campaign_dict)
    score = float(iso.decision_function(X)[0])
    # decision_function: lower is more anomalous
    if score < -0.10:
        risk_tier = "HIGH"
    elif score < 0.05:
        risk_tier = "MEDIUM"
    else:
        risk_tier = "LOW"
    return {
        "anomaly_score": round(score, 4),
        "risk_tier": risk_tier
    }
