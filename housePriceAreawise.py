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

# ---------------- USER INPUT ----------------

decision = input(
    "\nDo you want Rent or Buy?: "
).strip().title()

# ---------------- AREA TYPE ----------------

area_types = []

for locality in data["locality"]:

    if locality in [
        "Koregaon Park",
        "Viman Nagar",
        "Kothrud",
        "Shivaji Nagar",
        "Baner",
        "Kharadi",
        "Aundh"
    ]:

        area_types.append("Urban")

    elif locality in [
        "Wakad",
        "Hadapsar",
        "Magarpatta",
        "Balewadi",
        "Hinjewadi",
        "Pimpri",
        "Yerwada"
    ]:

        area_types.append("SemiUrban")

    else:

        area_types.append("Rural")

data["area_type"] = area_types

# ---------------- LABEL ENCODING ----------------

label_encoders = {}

categorical_columns = [
    "locality",
    "area_type",
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

# ---------------- FILTER RENT / BUY ----------------

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
    "area_type",
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

all_localities = sorted(
    data["locality"].unique()
)

decoded_localities = label_encoders[
    "locality"
].inverse_transform(
    all_localities
)

for locality in decoded_localities:

    print(locality)

# ---------------- USER PROPERTY DETAILS ----------------

locality = input(
    "\nEnter locality: "
).strip()

if locality in [
    "Koregaon Park",
    "Viman Nagar",
    "Kothrud",
    "Shivaji Nagar",
    "Baner",
    "Kharadi",
    "Aundh"
]:

    area_type = "Urban"

elif locality in [
    "Wakad",
    "Hadapsar",
    "Magarpatta",
    "Balewadi",
    "Hinjewadi",
    "Pimpri",
    "Yerwada"
]:

    area_type = "SemiUrban"

else:

    area_type = "Rural"

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

# ---------------- INPUT DATAFRAME ----------------

input_data = pd.DataFrame({

    "locality": [
        label_encoders["locality"].transform(
            [locality]
        )[0]
    ],

    "area_type": [
        label_encoders["area_type"].transform(
            [area_type]
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

print("\nArea Type:", area_type)

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

# ---------------- PLOT ----------------

region_types = [
    "Urban",
    "SemiUrban",
    "Rural"
]

plt.figure(figsize=(14, 8))

# ---------------- RENT PLOT ----------------

if decision == "Rent":

    rent_furnished = []
    rent_nonfurnished = []

    for region in region_types:

        encoded_region = label_encoders[
            "area_type"
        ].transform([region])[0]

        region_data = data[
            (data["area_type"] == encoded_region)
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

        furnished_avg = region_data[
            region_data["furnished"] ==
            label_encoders["furnished"].transform(
                ["Furnished"]
            )[0]
        ]["price"].mean()

        nonfurnished_avg = region_data[
            region_data["furnished"] ==
            label_encoders["furnished"].transform(
                ["Non-Furnished"]
            )[0]
        ]["price"].mean()

        rent_furnished.append(
            furnished_avg
        )

        rent_nonfurnished.append(
            nonfurnished_avg
        )

    plt.plot(
        region_types,
        rent_furnished,
        marker='o',
        linewidth=3,
        color='blue',
        label='Furnished Rent'
    )

    plt.plot(
        region_types,
        rent_nonfurnished,
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

    for region in region_types:

        encoded_region = label_encoders[
            "area_type"
        ].transform([region])[0]

        region_data = data[
            (data["area_type"] == encoded_region)
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

        furnished_new_avg = region_data[
            (region_data["furnished"] ==
             label_encoders["furnished"].transform(
                 ["Furnished"]
             )[0])

            &

            (region_data["type"] ==
             label_encoders["type"].transform(
                 ["New"]
             )[0])

        ]["price"].mean()

        furnished_preowned_avg = region_data[
            (region_data["furnished"] ==
             label_encoders["furnished"].transform(
                 ["Furnished"]
             )[0])

            &

            (region_data["type"] ==
             label_encoders["type"].transform(
                 ["PreOwned"]
             )[0])

        ]["price"].mean()

        nonfurnished_new_avg = region_data[
            (region_data["furnished"] ==
             label_encoders["furnished"].transform(
                 ["Non-Furnished"]
             )[0])

            &

            (region_data["type"] ==
             label_encoders["type"].transform(
                 ["New"]
             )[0])

        ]["price"].mean()

        nonfurnished_preowned_avg = region_data[
            (region_data["furnished"] ==
             label_encoders["furnished"].transform(
                 ["Non-Furnished"]
             )[0])

            &

            (region_data["type"] ==
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
        region_types,
        furnished_new,
        marker='o',
        linewidth=3,
        color='blue',
        label='Furnished New'
    )

    plt.plot(
        region_types,
        furnished_preowned,
        marker='o',
        linewidth=3,
        color='green',
        label='Furnished PreOwned'
    )

    plt.plot(
        region_types,
        nonfurnished_new,
        marker='o',
        linewidth=3,
        color='red',
        label='Non-Furnished New'
    )

    plt.plot(
        region_types,
        nonfurnished_preowned,
        marker='o',
        linewidth=3,
        color='orange',
        label='Non-Furnished PreOwned'
    )

# ---------------- PREDICTION POINT ----------------

plt.scatter(
    area_type,
    prediction[0],
    color="black",
    s=250,
    marker="X",
    label="Predicted Price"
)

plt.text(
    area_type,
    prediction[0],
    f' ₹ {round(prediction[0])}',
    fontsize=10
)

# ---------------- GRAPH SETTINGS ----------------

plt.xlabel("Region Type")
plt.ylabel("Average Price")

plt.title(
    f"{bhk} BHK Property Price Comparison"
)

plt.ticklabel_format(
    style='plain',
    axis='y'
)
def format_coordinates(x, y):

    return f"Price: ₹ {y:,.0f}"

plt.gca().format_coord = format_coordinates


plt.legend()

plt.grid(True)

plt.show()