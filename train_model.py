import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score
import joblib

# 1. READ DATASET
print("Reading dataset...")
data = pd.read_csv("price_dataset.csv", keep_default_na=False)

# 2. CLEAN DATA
data["type"] = data["type"].astype(str).str.strip()

# 3. LABEL ENCODING ON ALL DATA (NO Rent/Buy FILTERING)
print("Encoding categorical columns...")
label_encoders = {}
categorical_columns = ["locality", "furnished", "condition", "type"]

for column in categorical_columns:
    le = LabelEncoder()
    data[column] = le.fit_transform(data[column])
    label_encoders[column] = le

# 4. DEFINE FEATURES AND TARGET
X = data[["locality", "bhk", "furnished", "condition", "type"]]
y = data["price"]

# 5. SPLIT AND TRAIN
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

print("Training RandomForestRegressor model...")
model = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
model.fit(X_train, y_train)

# 6. EVALUATE
predictions = model.predict(X_test)
score = r2_score(y_test, predictions)
print(f"Model Accuracy (R^2 Score): {round(score * 100, 2)}%")

# 7. SAVE ENCODERS AND MODEL
print("Saving model and encoders...")
joblib.dump(model, "saved_model.pkl")
joblib.dump(label_encoders, "encoders.pkl")
print("Training completed successfully! Saved saved_model.pkl and encoders.pkl.")
