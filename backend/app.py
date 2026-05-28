from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import joblib
import os

app = Flask(__name__)
CORS(app)

# Helper to find files in backend/ or root/ directories dynamically
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def get_path(filename):
    local_path = os.path.join(BASE_DIR, filename)
    if os.path.exists(local_path):
        return local_path
    parent_path = os.path.join(BASE_DIR, "..", filename)
    if os.path.exists(parent_path):
        return parent_path
    return local_path  # fallback

model = joblib.load(get_path("saved_model.pkl"))
encoders = joblib.load(get_path("encoders.pkl"))

# Load and compute statistics on startup for frontend dashboards
try:
    df = pd.read_csv(get_path("price_dataset.csv"), keep_default_na=False)
    df["type"] = df["type"].astype(str).str.strip()
    
    localities = sorted(list(encoders["locality"].classes_))
    locality_stats = {}
    for loc in localities:
        rent_subset = df[(df["locality"] == loc) & (df["condition"] == "Rent")]
        buy_subset = df[(df["locality"] == loc) & (df["condition"] == "Buy")]
        
        avg_rent = round(rent_subset["price"].mean()) if not rent_subset.empty else 0
        avg_buy = round(buy_subset["price"].mean()) if not buy_subset.empty else 0
        
        locality_stats[loc] = {
            "Rent": avg_rent,
            "Buy": avg_buy
        }
except Exception as e:
    print(f"Error computing locality stats: {e}")
    locality_stats = {}

@app.route("/metadata", methods=["GET"])
def metadata():
    try:
        return jsonify({
            "localities": sorted(list(encoders["locality"].classes_)),
            "furnished_options": list(encoders["furnished"].classes_),
            "conditions": list(encoders["condition"].classes_),
            "types": list(encoders["type"].classes_),
            "stats": locality_stats
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No JSON payload provided"}), 400

        required_fields = ["locality", "bhk", "furnished", "condition", "type"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing field: {field}"}), 400

        try:
            locality = encoders["locality"].transform([data["locality"]])[0]
            furnished = encoders["furnished"].transform([data["furnished"]])[0]
            condition = encoders["condition"].transform([data["condition"]])[0]
            property_type = encoders["type"].transform([data["type"]])[0]
        except ValueError as val_err:
            return jsonify({"error": f"Invalid feature value: {str(val_err)}"}), 400

        input_data = pd.DataFrame({
            "locality": [locality],
            "bhk": [data["bhk"]],
            "furnished": [furnished],
            "condition": [condition],
            "type": [property_type]
        })

        prediction = model.predict(input_data)

        return jsonify({
            "predicted_price": round(prediction[0])
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
