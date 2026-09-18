import os
import json
import numpy as np
import joblib
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.metrics import precision_score, recall_score, f1_score, roc_auc_score, brier_score_loss
from sklearn.model_selection import train_test_split

MODEL_DIR = os.path.dirname(__file__)
CLASSIFIER_PATH = os.path.join(MODEL_DIR, "classifier.joblib")
ANOMALY_PATH = os.path.join(MODEL_DIR, "anomaly_detector.joblib")
METRICS_PATH = os.path.join(MODEL_DIR, "metrics.json")

def generate_synthetic_data(n_samples=1500, random_state=42):
    """
    Generate synthetic launch-time crowdfunding dataset adhering strictly to zero data leakage constraint.
    Features:
    0: goal_eth (10.0 to 20.0 ETH)
    1: duration_days (14 to 60 days)
    2: category_code (0: AI/ML, 1: DeFi, 2: Infrastructure, 3: Social, 4: GreenTech)
    3: title_len (characters, 15 to 80)
    4: desc_len (words, 100 to 1200)
    5: milestone_count (always 4)
    """
    np.random.seed(random_state)
    
    goal_eth = np.random.uniform(10.0, 20.0, n_samples)
    duration_days = np.random.randint(14, 60, n_samples)
    category_code = np.random.randint(0, 5, n_samples)
    title_len = np.random.randint(15, 80, n_samples)
    desc_len = np.random.randint(100, 1200, n_samples)
    milestone_count = np.full(n_samples, 4)

    # Success probability model based on launch features
    logits = (
        -0.25 * (goal_eth - 10.0) +
        0.02 * (duration_days - 30) +
        0.0015 * desc_len +
        0.02 * (title_len - 30) +
        0.3 * (category_code == 0) + # AI boost
        0.2 * (category_code == 2)   # Infra boost
    )
    prob_success = 1.0 / (1.0 + np.exp(-logits))
    labels = (np.random.rand(n_samples) < prob_success).astype(int)

    X = np.column_stack([
        goal_eth,
        duration_days,
        category_code,
        title_len,
        desc_len,
        milestone_count
    ])
    return X, labels

def train():
    print("Generating synthetic launch-time dataset (zero leakage)...")
    X, y = generate_synthetic_data()

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)

    print("Training RandomForestClassifier...")
    clf = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42)
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)
    y_prob = clf.predict_proba(X_test)[:, 1]

    # Metrics computation
    precision = float(precision_score(y_test, y_pred))
    recall = float(recall_score(y_test, y_pred))
    f1 = float(f1_score(y_test, y_pred))
    roc_auc = float(roc_auc_score(y_test, y_prob))
    brier = float(brier_score_loss(y_test, y_prob))

    metrics = {
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1": round(f1, 4),
        "roc_auc": round(roc_auc, 4),
        "brier_score": round(brier, 4),
        "samples_evaluated": len(y_test)
    }

    print("Metrics:", json.dumps(metrics, indent=2))

    print("Training IsolationForest for anomaly detection...")
    iso = IsolationForest(n_estimators=100, contamination=0.08, random_state=42)
    iso.fit(X_train)

    # Save models
    joblib.dump(clf, CLASSIFIER_PATH)
    joblib.dump(iso, ANOMALY_PATH)
    with open(METRICS_PATH, "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"Artifacts saved to {MODEL_DIR}")

if __name__ == "__main__":
    train()
