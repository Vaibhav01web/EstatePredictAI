import pandas as pd
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score
import joblib

# ---------------- READ DATASET ----------------

data = pd.read_csv(
    "price_dataset.csv",
    keep_default_na=False
)

# ---------------- CLEAN DATA ----------------

data["type"] = data["type"].astype(str)
data["type"] = data["type"].str.strip()

# ---------------- USER CHOICE ----------------

decision = input(
    "\nDo you want Rent or Buy?: "
).strip().title()

# ---------------- LABEL ENCODING ----------------

label_encoders = {}

categorical_columns = [
    "locality",
    "furnished",
    "condition",
    "type"
]

for column in categorical_columns:

    le = LabelEncoder()

    data[column] = le.fit_transform(
        data[column]
    )

    label_encoders[column] = le

# ---------------- FILTER DATA ----------------

if decision == "Rent":

    filtered_data = data[
        data["condition"] ==
        label_encoders["condition"].transform(
            ["Rent"]
        )[0]
    ]

else:

    filtered_data = data[
        data["condition"] ==
        label_encoders["condition"].transform(
            ["Buy"]
        )[0]
    ]

# ---------------- FEATURES ----------------

X = filtered_data[[
    "locality",
    "bhk",
    "furnished",
    "condition",
    "type"
]]

y = filtered_data["price"]

# ---------------- TRAIN TEST SPLIT ----------------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

# ---------------- RANDOM FOREST MODEL ----------------

model = RandomForestRegressor(
    n_estimators=100,
    random_state=42
)

model.fit(X_train, y_train)

predictions = model.predict(X_test)

score = r2_score(
    y_test,
    predictions
)

print(
    "\nModel Accuracy:",
    round(score * 100, 2),
    "%"
)

# ---------------- SHOW LOCALITIES ----------------
print("\nAvailable Localities:\n")

decoded_localities = label_encoders[
    "locality"
].classes_

for locality_name in decoded_localities:

    print(locality_name)

locality_avg_prices = []

for loc in data["locality"].unique():

    locality_data = data[
        data["locality"] == loc
    ]

    avg_price = locality_data[
        "price"
    ].mean()

    locality_avg_prices.append(
        (loc, avg_price)
    )

locality_avg_prices.sort(
    key=lambda x: x[1]
)

localities = [
    item[0]
    for item in locality_avg_prices
]

decoded_localities = label_encoders[
    "locality"
].inverse_transform(
    localities
)
# ---------------- USER PROPERTY DETAILS ----------------

locality = input(
    "\nEnter locality: "
).strip()

bhk = int(
    input("Enter BHK: ")
)

furnished = input(
    "Furnished or Non-Furnished: "
).strip().lower()

if furnished == "furnished":

    furnished = "Furnished"

else:

    furnished = "Non-Furnished"

# ---------------- PROPERTY TYPE ----------------

if decision == "Buy":

    property_type = input(
        "New or PreOwned: "
    ).strip().lower()

    if property_type == "new":

        encoded_type = label_encoders[
            "type"
        ].transform(["New"])[0]

    else:

        encoded_type = label_encoders[
            "type"
        ].transform(["PreOwned"])[0]

else:

    encoded_type = 0

# ---------------- INPUT DATA ----------------

input_data = pd.DataFrame({

    "locality": [
        label_encoders["locality"].transform(
            [locality]
        )[0]
    ],

    "bhk": [bhk],

    "furnished": [
        label_encoders["furnished"].transform(
            [furnished]
        )[0]
    ],

    "condition": [
        label_encoders["condition"].transform(
            [decision]
        )[0]
    ],

    "type": [encoded_type]

})

# ---------------- PREDICTION ----------------

prediction = model.predict(
    input_data
)

if decision == "Rent":

    print(
        "\nPredicted Monthly Rent: ₹",
        round(prediction[0])
    )

else:

    print(
        "\nPredicted Flat Price: ₹",
        round(prediction[0])
    )


joblib.dump(model, "saved_model.pkl")
joblib.dump(label_encoders, "encoders.pkl")

# ---------------- LOCALITY BASED PLOT ----------------

localities = sorted(
    data["locality"].unique()
)

decoded_localities = label_encoders[
    "locality"
].inverse_transform(
    localities
)

plt.figure(figsize=(18, 8))

# ---------------- RENT PLOT ----------------

if decision == "Rent":

    furnished_rent = []
    nonfurnished_rent = []

    for loc in localities:

        locality_data = data[
            (data["locality"] == loc)
            &
            (data["bhk"] == bhk)
            &
            (
                data["condition"] ==
                label_encoders["condition"].transform(
                    ["Rent"]
                )[0]
            )
        ]

        furnished_avg = locality_data[
            locality_data["furnished"] ==
            label_encoders["furnished"].transform(
                ["Furnished"]
            )[0]
        ]["price"].mean()

        nonfurnished_avg = locality_data[
            locality_data["furnished"] ==
            label_encoders["furnished"].transform(
                ["Non-Furnished"]
            )[0]
        ]["price"].mean()

        furnished_rent.append(
            furnished_avg
        )

        nonfurnished_rent.append(
            nonfurnished_avg
        )

    plt.plot(
        decoded_localities,
        furnished_rent,
        marker='o',
        linewidth=3,
        color='blue',
        label='Furnished Rent'
    )

    plt.plot(
        decoded_localities,
        nonfurnished_rent,
        marker='o',
        linewidth=3,
        color='red',
        label='Non-Furnished Rent'
    )

# ---------------- BUY PLOT ----------------

else:

    furnished_new = []
    furnished_preowned = []

    nonfurnished_new = []
    nonfurnished_preowned = []

    for loc in localities:

        locality_data = data[
            (data["locality"] == loc)
            &
            (data["bhk"] == bhk)
            &
            (
                data["condition"] ==
                label_encoders["condition"].transform(
                    ["Buy"]
                )[0]
            )
        ]

        furnished_new_avg = locality_data[
            (locality_data["furnished"] ==
             label_encoders["furnished"].transform(
                 ["Furnished"]
             )[0])

            &

            (locality_data["type"] ==
             label_encoders["type"].transform(
                 ["New"]
             )[0])

        ]["price"].mean()

        furnished_preowned_avg = locality_data[
            (locality_data["furnished"] ==
             label_encoders["furnished"].transform(
                 ["Furnished"]
             )[0])

            &

            (locality_data["type"] ==
             label_encoders["type"].transform(
                 ["PreOwned"]
             )[0])

        ]["price"].mean()

        nonfurnished_new_avg = locality_data[
            (locality_data["furnished"] ==
             label_encoders["furnished"].transform(
                 ["Non-Furnished"]
             )[0])

            &

            (locality_data["type"] ==
             label_encoders["type"].transform(
                 ["New"]
             )[0])

        ]["price"].mean()

        nonfurnished_preowned_avg = locality_data[
            (locality_data["furnished"] ==
             label_encoders["furnished"].transform(
                 ["Non-Furnished"]
             )[0])

            &

            (locality_data["type"] ==
             label_encoders["type"].transform(
                 ["PreOwned"]
             )[0])

        ]["price"].mean()

        furnished_new.append(
            furnished_new_avg
        )

        furnished_preowned.append(
            furnished_preowned_avg
        )

        nonfurnished_new.append(
            nonfurnished_new_avg
        )

        nonfurnished_preowned.append(
            nonfurnished_preowned_avg
        )

    plt.plot(
        decoded_localities,
        furnished_new,
        marker='o',
        linewidth=3,
        color='blue',
        label='Furnished New'
    )

    plt.plot(
        decoded_localities,
        furnished_preowned,
        marker='o',
        linewidth=3,
        color='green',
        label='Furnished PreOwned'
    )

    plt.plot(
        decoded_localities,
        nonfurnished_new,
        marker='o',
        linewidth=3,
        color='red',
        label='Non-Furnished New'
    )

    plt.plot(
        decoded_localities,
        nonfurnished_preowned,
        marker='o',
        linewidth=3,
        color='orange',
        label='Non-Furnished PreOwned'
    )

# ---------------- PREDICTION POINT ----------------

plt.scatter(
    locality,
    prediction[0],
    color="black",
    s=300,
    marker="X",
    label="Predicted Price"
)

plt.text(
    locality,
    prediction[0],
    f' ₹ {round(prediction[0])}',
    fontsize=10
)

# ---------------- GRAPH SETTINGS ----------------

plt.xlabel("Localities")
plt.ylabel("Average Price")

plt.title(
    f"{bhk} BHK Property Price Comparison"
)

plt.xticks(rotation=45)

plt.ticklabel_format(
    style='plain',
    axis='y'
)

def format_coordinates(x, y):

    return f"Price: ₹ {y:,.0f}"

plt.gca().format_coord = format_coordinates

plt.legend()

plt.grid(True)

plt.tight_layout()

plt.show()