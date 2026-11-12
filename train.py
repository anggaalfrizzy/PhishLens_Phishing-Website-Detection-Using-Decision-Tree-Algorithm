"""Latih Model A (tanpa batas) dan Model B (pruned), lalu simpan model dan metrik.

Jalankan:  python train.py
"""
import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.metrics import confusion_matrix, f1_score
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier

BASE = Path(__file__).resolve().parent
DATA_PATH = BASE / "data" / "phishing_websites_1500.csv"
MODEL_PATH = BASE / "models" / "model.joblib"
METRICS_PATH = BASE / "models" / "metrics.json"
TREE_PNG = BASE / "reports" / "tree_model_b.png"

TARGET = "Result"          # -1 = phishing, 1 = legitimate
MAX_DEPTH_B = 5            # dipilih lewat cross-validation (kedalaman 3 sampai 8)
RANDOM_STATE = 42


def _scores(model, X_tr, y_tr, X_te, y_te):
    pred = model.predict(X_te)
    return {
        "train_accuracy": round(float(model.score(X_tr, y_tr)), 4),
        "test_accuracy": round(float(model.score(X_te, y_te)), 4),
        "test_f1_macro": round(float(f1_score(y_te, pred, average="macro")), 4),
        "depth": int(model.get_depth()),
        "leaves": int(model.get_n_leaves()),
    }


def run(save_plot=True):
    df = pd.read_csv(DATA_PATH)
    X, y = df.drop(columns=TARGET), df[TARGET]
    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y, test_size=0.3, random_state=RANDOM_STATE, stratify=y
    )

    model_a = DecisionTreeClassifier(max_depth=None, random_state=RANDOM_STATE).fit(X_tr, y_tr)
    model_b = DecisionTreeClassifier(max_depth=MAX_DEPTH_B, random_state=RANDOM_STATE).fit(X_tr, y_tr)

    importances = (
        pd.Series(model_b.feature_importances_, index=X.columns)
        .sort_values(ascending=False)
        .round(4)
    )
    metrics = {
        "dataset": {"rows": int(len(df)), "features": int(X.shape[1]), "train": int(len(X_tr)), "test": int(len(X_te))},
        "model_a": _scores(model_a, X_tr, y_tr, X_te, y_te),
        "model_b": {**_scores(model_b, X_tr, y_tr, X_te, y_te), "max_depth": MAX_DEPTH_B},
        "confusion_b": confusion_matrix(y_te, model_b.predict(X_te), labels=[-1, 1]).tolist(),
        "importances": {k: float(v) for k, v in importances.items()},
    }

    artifact = {
        "model": model_b,
        "features": list(X.columns),
        "defaults": {c: int(X[c].mode().iloc[0]) for c in X.columns},
        "classes": [int(c) for c in model_b.classes_],
    }

    MODEL_PATH.parent.mkdir(exist_ok=True)
    joblib.dump(artifact, MODEL_PATH, compress=3)
    METRICS_PATH.write_text(json.dumps(metrics, indent=2), encoding="utf-8")

    if save_plot:
        try:
            import matplotlib
            matplotlib.use("Agg")
            import matplotlib.pyplot as plt
            from sklearn.tree import plot_tree

            TREE_PNG.parent.mkdir(exist_ok=True)
            fig = plt.figure(figsize=(26, 12))
            plot_tree(model_b, feature_names=list(X.columns), class_names=["Phishing", "Legitimate"],
                      filled=True, rounded=True, fontsize=7, max_depth=4)
            plt.title(f"Decision Tree (Model B, max_depth={MAX_DEPTH_B}), tampil sampai kedalaman 4")
            fig.savefig(TREE_PNG, dpi=110, bbox_inches="tight")
            plt.close(fig)
        except Exception as exc:  # plot hanya pelengkap laporan
            print("Plot dilewati:", exc)

    return artifact, metrics


if __name__ == "__main__":
    _, m = run()
    for name in ("model_a", "model_b"):
        print(name, m[name])
    print("Model disimpan di", MODEL_PATH)
