import json
import os
from pathlib import Path

import joblib
import pandas as pd
from flask import Flask, jsonify, render_template, request

from features import FORM_FEATURES, PRESETS

BASE = Path(__file__).resolve().parent
MODEL_PATH = BASE / "models" / "model.joblib"
METRICS_PATH = BASE / "models" / "metrics.json"
AUTHOR = os.environ.get("APP_AUTHOR", "Praktikum Pembelajaran Mesin, TA-05")

UNCERTAIN_LOW, UNCERTAIN_HIGH = 0.35, 0.65  # zona abu-abu: model kurang yakin

app = Flask(__name__)
app.json.sort_keys = False


def load_artifacts():
    """Muat model. Jika gagal (misalnya beda versi scikit-learn), latih ulang otomatis."""
    try:
        artifact = joblib.load(MODEL_PATH)
        metrics = json.loads(METRICS_PATH.read_text(encoding="utf-8"))
    except Exception as exc:
        app.logger.warning("Model tidak bisa dimuat (%s). Melatih ulang.", exc)
        import train

        artifact, metrics = train.run(save_plot=False)
    return artifact, metrics


ARTIFACT, METRICS = load_artifacts()
MODEL = ARTIFACT["model"]
FEATURES = ARTIFACT["features"]
DEFAULTS = ARTIFACT["defaults"]
PHISH_IDX = ARTIFACT["classes"].index(-1)
ALLOWED = {f["id"]: {o["v"] for o in f["options"]} for f in FORM_FEATURES}


@app.after_request
def add_headers(resp):
    resp.headers.setdefault("X-Content-Type-Options", "nosniff")
    resp.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    resp.headers.setdefault("X-Frame-Options", "DENY")
    return resp


@app.get("/")
def index():
    labels = {f["id"]: f["short"] for f in FORM_FEATURES}
    ranked = [
        {"id": k, "value": v, "label": labels.get(k)}
        for k, v in METRICS["importances"].items()
        if v > 0
    ][:8]
    return render_template(
        "index.html",
        schema=FORM_FEATURES,
        presets=PRESETS,
        metrics=METRICS,
        ranked=ranked,
        author=AUTHOR,
    )


@app.get("/health")
def health():
    return jsonify(status="ok")


def _parse(payload):
    values = (payload or {}).get("values")
    if not isinstance(values, dict):
        return None, "invalid_payload", None
    clean = {}
    for fid, allowed in ALLOWED.items():
        v = values.get(fid)
        if isinstance(v, bool) or not isinstance(v, (int, float)) or int(v) != v or int(v) not in allowed:
            return None, "invalid_value", fid
        clean[fid] = int(v)
    return clean, None, None


@app.post("/api/predict")
def predict():
    clean, err, field = _parse(request.get_json(silent=True))
    if err:
        return jsonify(error=err, field=field), 400

    row = {**DEFAULTS, **clean}
    X = pd.DataFrame([[row[c] for c in FEATURES]], columns=FEATURES)
    p_phish = float(MODEL.predict_proba(X)[0][PHISH_IDX])

    if p_phish >= UNCERTAIN_HIGH:
        label = "phishing"
    elif p_phish <= UNCERTAIN_LOW:
        label = "legitimate"
    else:
        label = "uncertain"

    tree = MODEL.tree_
    steps, seen = [], set()
    for node in MODEL.decision_path(X).indices:
        if tree.children_left[node] == tree.children_right[node]:
            continue
        feat = FEATURES[tree.feature[node]]
        if feat in seen:
            continue
        seen.add(feat)
        steps.append({"feature": feat, "value": int(row[feat]), "provided": feat in clean})

    return jsonify(label=label, p_phishing=round(p_phish, 4), steps=steps[:6])


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=False)
