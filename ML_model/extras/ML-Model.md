# Safe Steps ML Model

## Overview
The Safe Steps ML model is a core component of the Safe Steps application, designed to evaluate and rank travel routes based on safety. It leverages historical crime data, machine learning, and spatial analysis to predict safety scores for routes and recommend the safest paths for users.

This document provides a detailed explanation of the ML model, its architecture, data flow, and functionality.

---

## Features
1. **Crime Data Loading and Preprocessing**:
   - Reads crime data from a CSV file.
   - Validates the dataset for required columns.
   - Builds a KDTree for efficient spatial queries.
   - Identifies crime hotspots using DBSCAN clustering.

2. **Synthetic Route Generation**:
   - Generates synthetic routes with random coordinates for training.
   - Extracts features such as crime count, severity, and distance for each route.

3. **Machine Learning Model**:
   - Uses a `RandomForestRegressor` to predict route safety scores.
   - Trains the model on synthetic data and evaluates its performance using a custom accuracy metric.

4. **Route Evaluation**:
   - Fetches routes between source and destination using OSRM.
   - Extracts features for each route and predicts safety scores.
   - Ranks routes based on safety scores and returns the safest options.

5. **Custom Accuracy Metric**:
   - Evaluates model performance by calculating the percentage of predictions within a tolerance range of the actual safety score.

6. **API Endpoints**:
   - `/evaluate_routes`: Accepts source, destination, and time category; returns ranked routes with safety scores.
   - `/load_crime_data`: Loads and processes crime data from a CSV file.
   - `/model_performance`: Returns the model's performance metrics.

---

## Data Flow

### 1. **Crime Data Loading**
- **Input**: CSV file containing columns `Latitude`, `Longitude`, `Severity`, `CrimeID`, and `CrimeCategory`.
- **Process**:
  - Validates the dataset for required columns.
  - Converts latitude and longitude to float values.
  - Builds a KDTree for spatial queries.
  - Identifies crime hotspots using DBSCAN clustering.
- **Output**:
  - `crime_data`: DataFrame containing the processed crime data.
  - `kd_tree`: KDTree for spatial queries.
  - `cluster_centroids`: Coordinates of crime hotspots.
  - `cluster_severities`: Average severity of crimes in each hotspot.

---

### 2. **Synthetic Route Generation**
- **Input**: Randomly generated coordinates and time categories.
- **Process**:
  - Generates synthetic routes with random waypoints.
  - Extracts features such as total crimes, severity, distance, and time category.
- **Output**:
  - `X`: Feature matrix for training.
  - `y`: Safety scores for training.

---

### 3. **Model Training**
- **Input**: Feature matrix `X` and target values `y`.
- **Process**:
  - Splits the data into training and testing sets.
  - Trains a `RandomForestRegressor` on the training set.
  - Evaluates the model on the test set using a custom accuracy metric.
- **Output**:
  - Trained model saved as `safe_route_model.pkl`.
  - Performance metrics stored in `model_performance`.

---

### 4. **Route Evaluation**
- **Input**: Source, destination, and time category.
- **Process**:
  - Fetches routes from OSRM.
  - Extracts features for each route.
  - Predicts safety scores using the trained model.
  - Ranks routes based on safety scores.
- **Output**:
  - Ranked list of routes with safety scores, total crimes, and distances.

---

## Key Components

### 1. **Crime Data Preprocessing**
The `load_crime_data` method processes the crime dataset and prepares it for spatial analysis:
- Builds a KDTree for efficient spatial queries.
- Identifies crime hotspots using DBSCAN clustering.
- Calculates the maximum severity of crimes in the dataset.

### 2. **Feature Extraction**
The `extract_features` method extracts the following features for each route:
- **Crime Features**:
  - Total crimes along the route.
  - Average and maximum severity of crimes.
  - Number of high-severity crimes.
  - Number of unique crime categories.
- **Distance Features**:
  - Total distance of the route.
  - Minimum distance to the nearest crime hotspot.
- **Time Features**:
  - Encoded time category (Morning, Afternoon, Evening, Night).
- **Hotspot Features**:
  - Number of hotspots along the route.
  - Number of high-severity hotspots.

### 3. **Machine Learning Model**
The `RandomForestRegressor` is trained on synthetic data to predict safety scores for routes:
- **Training Data**:
  - Synthetic routes with features extracted using `extract_features`.
- **Target Variable**:
  - Safety score calculated based on crime severity, distance, and time category.
- **Performance Evaluation**:
  - Custom accuracy metric: Percentage of predictions within a tolerance range of the actual safety score.

### 4. **Route Evaluation**
The `evaluate_routes` method evaluates and ranks routes based on safety:
- Fetches routes from OSRM.
- Extracts features for each route.
- Predicts safety scores using the trained model.
- Combines raw safety scores and predicted scores to calculate final scores.

---

## API Endpoints

### 1. **Evaluate Routes**
- **Endpoint**: `/evaluate_routes`
- **Method**: POST
- **Request Body**:
  ```json
  {
    "source": [28.7041, 77.1025],
    "destination": [28.5355, 77.3910],
    "time_category": "Evening"
  }
  ```
- **Response**:
  ```json
  [
    {
      "route_name": "Route 1",
      "total_crimes": 15,
      "safety_score": 0.85,
      "total_distance_km": 12.5,
      "nearby_crimes": [...],
      "route_coords": [...],
      "time_category": "Evening"
    },
    ...
  ]
  ```

### 2. **Load Crime Data**
- **Endpoint**: `/load_crime_data`
- **Method**: POST
- **Request Body**:
  ```json
  {
    "file_path": "path/to/crime_data.csv"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Crime data loaded successfully"
  }
  ```

### 3. **Get Model Performance**
- **Endpoint**: `/model_performance`
- **Method**: GET
- **Response**:
  ```json
  {
    "custom_accuracy_percentage": 92.5,
    "note": "This accuracy represents the percentage of predictions within +/- 5 points of the actual safety score."
  }
  ```

---

## Installation and Setup

### Prerequisites
- Python 3.9+
- Required libraries: Flask, Flask-CORS, Pandas, NumPy, Scikit-learn, SciPy, Geopy, Requests.

### Steps
1. **Clone the Repository**:
   ```sh
   git clone https://github.com/your-repo/safe-steps.git
   cd safe-steps/ML_model
   ```

2. **Install Dependencies**:
   ```sh
   pip install -r requirements.txt
   ```

3. **Run the Model**:
   ```sh
   python model.py
   ```

4. **Test the Endpoints**:
   Use tools like Postman or cURL to test the API endpoints.

---

## Future Improvements
- **Model Optimization**:
  - Experiment with other regression models (e.g., Gradient Boosting, XGBoost).
  - Hyperparameter tuning for improved accuracy.
- **Real-Time Data**:
  - Integrate real-time crime data for dynamic safety predictions.
- **Advanced Features**:
  - Incorporate user feedback to improve route recommendations.
  - Add support for multi-modal transportation (e.g., walking, cycling).

---

## Contact
For inquiries, please reach out to the project maintainers via GitHub issues or email at `safestepssafetyapp@gmail.com`.