# Experiment A: Pre-Launch Machine Learning Benchmark

Strictly trained on pre-launch features with zero post-campaign telemetry leakage.

## Dataset & Protocol
- **Total Samples**: 2000
- **Training Set**: 1500 samples (75%)
- **Test Set**: 500 samples (25%, stratified)
- **Features Used**: `[goal_eth, duration_days, category_code, title_len, desc_len, milestone_count]`
- **Leakage Audit**: Verified 0% post-campaign variables included.

## Model Performance Comparison Table

| Model Architecture | Accuracy | Precision | Recall | F1-Score | ROC-AUC | Brier Loss |
|---|---|---|---|---|---|---|
| **Logistic Regression** | 0.7040 | 0.7162 | 0.8682 | 0.7849 | 0.7474 | 0.1921 |
| **Random Forest** | 0.6860 | 0.6985 | 0.8714 | 0.7754 | 0.7300 | 0.1995 |
| **Gradient Boosting** | 0.6820 | 0.7111 | 0.8232 | 0.7630 | 0.7032 | 0.2094 |

## Selection Rational
**Logistic Regression** achieved the highest discriminative power (ROC-AUC 0.7474) and balanced F1-score (0.7849). Serialized to `classifier.joblib` for live serving.
