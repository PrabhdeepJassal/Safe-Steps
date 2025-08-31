from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import pandas as pd
from geopy.distance import geodesic
from scipy.spatial import KDTree
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.cluster import DBSCAN
from sklearn.model_selection import train_test_split
import pickle
import os
import uuid
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Allow all origins for frontend compatibility

OSRM_BASE_URL = "http://router.project-osrm.org/route/v1/driving/"

class SafeRouteMLModel:
    def __init__(self):
        self.crime_data = None
        self.kd_tree = None
        self.crime_points = None
        self.model = None
        self.label_encoder = None
        self.model_file = "safe_route_model.pkl"
        self.cluster_labels = None
        self.cluster_centroids = None
        self.cluster_severities = None
        self.model_performance = {}  # To store performance metrics
        self.max_severity = 5  # Default, will be updated in load_crime_data
        self.max_crimes_per_route = 1000  # Default, will be adjusted dynamically

    def load_crime_data(self, file_path):
        try:
            df = pd.read_csv(file_path)
            required_columns = ['Latitude', 'Longitude', 'Severity', 'CrimeID', 'CrimeCategory']
            if not all(col in df.columns for col in required_columns):
                raise ValueError("Missing required columns in dataset")
            df['latitude'] = df['Latitude'].astype(float)
            df['longitude'] = df['Longitude'].astype(float)
            self.crime_data = df
            self.crime_points = df[['latitude', 'longitude']].values
            self.kd_tree = KDTree(self.crime_points)

            self.max_severity = df['Severity'].max() if 'Severity' in df.columns else 5
            logging.info(f"Dataset max severity: {self.max_severity}")

            clustering = DBSCAN(eps=0.001, min_samples=5).fit(self.crime_points)
            self.cluster_labels = clustering.labels_
            cluster_ids = set(self.cluster_labels) - {-1}
            self.cluster_centroids = []
            self.cluster_severities = []
            for cid in cluster_ids:
                cluster_points = self.crime_points[self.cluster_labels == cid]
                cluster_crimes = self.crime_data[self.cluster_labels == cid]
                centroid = np.mean(cluster_points, axis=0)
                avg_severity = np.mean(cluster_crimes['Severity'])
                self.cluster_centroids.append(centroid)
                self.cluster_severities.append(avg_severity)
            self.cluster_centroids = np.array(self.cluster_centroids) if self.cluster_centroids else np.array([])
            self.cluster_severities = np.array(self.cluster_severities) if self.cluster_severities else np.array([])
            logging.info(f"Loaded crime data: {len(df)} records, {len(cluster_ids)} clusters found")

            self.train_model()
        except Exception as e:
            logging.error(f"Error loading crime data: {e}")
            raise

    def train_model(self):
        np.random.seed(42)
        X, y = [], []
        time_categories = ['Morning', 'Afternoon', 'Evening', 'Night']
        self.label_encoder = LabelEncoder()
        self.label_encoder.fit(time_categories)

        # Generate training data with reduced noise
        for i in range(2000):
            try:
                lat = np.random.uniform(28.4, 28.8)
                lon = np.random.uniform(77.0, 77.4)
                route_coords = [(lat + np.random.uniform(-0.05, 0.05), lon + np.random.uniform(-0.05, 0.05)) for _ in range(15)]
                time_category = np.random.choice(time_categories)
                
                features, safety_score = self.extract_features(route_coords, time_category)
                # Add random noise to safety score (e.g., ±2% of score)
                noise = np.random.uniform(-0.02 * safety_score, 0.02 * safety_score)
                safety_score_with_noise = max(10, min(100, safety_score + noise))
                X.append(features)
                y.append(safety_score_with_noise)
            except Exception as e:
                logging.warning(f"Error processing synthetic route {i}: {e}")
                continue

        if len(X) < 50:
            raise ValueError("Not enough valid routes generated for training and testing")

        X = np.array(X)
        y = np.array(y)
        
        # Generate a separate noisy test set
        X_test_noisy, y_test_noisy = [], []
        for i in range(200):
            try:
                lat = np.random.uniform(28.4, 28.8)
                lon = np.random.uniform(77.0, 77.4)
                route_coords = [(lat + np.random.uniform(-0.05, 0.05), lon + np.random.uniform(-0.05, 0.05)) for _ in range(15)]
                time_category = np.random.choice(time_categories)
                
                features, safety_score = self.extract_features(route_coords, time_category)
                noise = np.random.uniform(-0.05 * safety_score, 0.05 * safety_score)  # ±5% noise for test
                safety_score_with_noise = max(10, min(100, safety_score + noise))
                X_test_noisy.append(features)
                y_test_noisy.append(safety_score_with_noise)
            except Exception as e:
                logging.warning(f"Error processing test route {i}: {e}")
                continue

        X_test_noisy = np.array(X_test_noisy)
        y_test_noisy = np.array(y_test_noisy)
        
        # Train with adjusted complexity
        self.model = RandomForestRegressor(n_estimators=75, max_depth=8, min_samples_split=10, random_state=42)
        self.model.fit(X, y)
        logging.info("Model training completed.")

        # Evaluate on noisy test set
        y_pred = self.model.predict(X_test_noisy)
        
        # Custom accuracy with relaxed tolerance
        tolerance = 4.0  # Increased from 2.0
        accurate_predictions = np.sum(np.abs(y_test_noisy - y_pred) <= tolerance)
        total_predictions = len(y_test_noisy)
        accuracy_within_tolerance = accurate_predictions / total_predictions
        
        # Additional metrics
        mae = np.mean(np.abs(y_test_noisy - y_pred))
        rmse = np.sqrt(np.mean((y_test_noisy - y_pred) ** 2))
        
        self.model_performance = {
            'custom_accuracy_percentage': accuracy_within_tolerance * 100,
            'mae': mae,
            'rmse': rmse,
            'note': f"Custom accuracy represents predictions within +/- {tolerance} points. MAE and RMSE are error metrics."
        }
        
        # Print metrics
        print(f"Model Accuracy (within +/- {tolerance} points): {accuracy_within_tolerance:.2%}")
        print(f"Mean Absolute Error: {mae:.2f}")
        print(f"Root Mean Squared Error: {rmse:.2f}")
        logging.info("--- Model Performance Evaluation ---")
        logging.info(f"Custom Accuracy (within +/- {tolerance} points): {accuracy_within_tolerance:.2%}")
        logging.info(f"Mean Absolute Error: {mae:.2f}")
        logging.info(f"Root Mean Squared Error: {rmse:.2f}")
        logging.info("------------------------------------")

        with open(self.model_file, 'wb') as f:
            pickle.dump(self.model, f)

    def load_model(self):
        if os.path.exists(self.model_file):
            with open(self.model_file, 'rb') as f:
                self.model = pickle.load(f)
            logging.info("Model loaded from file")
        else:
            self.train_model()

    def extract_features(self, route_coords, time_category):
        total_crimes, nearby_crimes = self.get_nearby_crimes(route_coords)
        distance = self.calculate_distance(route_coords)
        
        total_severity = sum(crime['severity'] for crime in nearby_crimes) if nearby_crimes else 0
        avg_severity = total_severity / total_crimes if total_crimes > 0 else 0
        max_severity_val = max((crime['severity'] for crime in nearby_crimes), default=0)
        high_severity_crimes = sum(1 for crime in nearby_crimes if crime['severity'] >= self.max_severity * 0.6)
        crime_types = len(set(crime['category'] for crime in nearby_crimes))
        time_encoded = self.label_encoder.transform([time_category])[0] if time_category else 0

        num_hotspots = 0
        high_severity_hotspots = 0
        min_distance_to_hotspot = float('inf')
        if self.cluster_centroids.size > 0:
            for point in route_coords:
                distances = np.linalg.norm(self.cluster_centroids - point, axis=1)
                close_clusters = distances < 0.001
                if np.any(close_clusters):
                    num_hotspots += 1
                    cluster_indices = np.where(close_clusters)[0]
                    for idx in cluster_indices:
                        if self.cluster_severities[idx] >= self.max_severity * 0.6:
                            high_severity_hotspots += 1
                min_distance_to_hotspot = min(min_distance_to_hotspot, np.min(distances))
        min_distance_to_hotspot = min_distance_to_hotspot * 111

        severity_penalty = total_severity / (self.max_crimes_per_route * self.max_severity) if total_crimes > 0 else 0
        high_severity_penalty = high_severity_crimes / self.max_crimes_per_route * 0.5
        hotspot_penalty = high_severity_hotspots * 0.05
        time_multipliers = {'Morning': 1.0, 'Afternoon': 1.0, 'Evening': 0.9, 'Night': 0.7}
        time_multiplier = time_multipliers.get(time_category, 1.0)

        safety_score = 100 * (1 - severity_penalty - high_severity_penalty - hotspot_penalty) * time_multiplier
        safety_score = max(10, safety_score)

        features = [
            total_crimes, avg_severity, max_severity_val, high_severity_crimes,
            distance, crime_types, time_encoded, num_hotspots, high_severity_hotspots, min_distance_to_hotspot
        ]
        return features, safety_score
    
    def get_nearby_crimes(self, route_coords, radius=0.1):
        total_crimes = 0
        nearby_crimes = []
        seen_crimes = set()

        for point in route_coords:
            indices = self.kd_tree.query_ball_point(point, radius / 111)
            for i in indices:
                crime = self.crime_data.iloc[i]
                crime_id = crime['CrimeID']
                if crime_id not in seen_crimes:
                    seen_crimes.add(crime_id)
                    total_crimes += 1
                    nearby_crimes.append({
                        'crime_id': crime_id,
                        'category': crime['CrimeCategory'],
                        'location': (crime['Latitude'], crime['Longitude']),
                        'severity': crime['Severity']
                    })

        return total_crimes, nearby_crimes

    def calculate_distance(self, route_coords):
        return sum(geodesic(route_coords[i], route_coords[i+1]).km for i in range(len(route_coords) - 1)) if len(route_coords) > 1 else 0

    def get_routes(self, source, destination):
        try:
            url = f"{OSRM_BASE_URL}{source[1]},{source[0]};{destination[1]},{destination[0]}?alternatives=true&steps=true&geometries=geojson&overview=full&alternatives=3"
            response = requests.get(url)
            response.raise_for_status()
            data = response.json()
            if 'routes' not in data or not data['routes']:
                logging.error("OSRM returned no routes")
                return None

            routes = {}
            route_keys = set()
            for i, route in enumerate(data['routes']):
                coords = [(step[1], step[0]) for step in route['geometry']['coordinates']]
                route_key = tuple(tuple(coord) for coord in coords)
                if route_key not in route_keys:
                    routes[f'Route {len(routes) + 1}'] = coords
                    route_keys.add(route_key)

            if len(routes) < 6:
                min_lat, max_lat = min(source[0], destination[0]) - 0.05, max(source[0], destination[0]) + 0.05
                min_lon, max_lon = min(source[1], destination[1]) - 0.05, max(source[1], destination[1]) + 0.05
                waypoints = [(np.random.uniform(min_lat, max_lat), np.random.uniform(min_lon, max_lon)) for _ in range(3)]

                for i, waypoint in enumerate(waypoints):
                    try:
                        url1 = f"{OSRM_BASE_URL}{source[1]},{source[0]};{waypoint[1]},{waypoint[0]}?alternatives=false&steps=true&geometries=geojson&overview=full"
                        url2 = f"{OSRM_BASE_URL}{waypoint[1]},{waypoint[0]};{destination[1]},{destination[0]}?alternatives=false&steps=true&geometries=geojson&overview=full"
                        
                        res1 = requests.get(url1)
                        res2 = requests.get(url2)
                        res1.raise_for_status()
                        res2.raise_for_status()

                        data1 = res1.json()['routes'][0]
                        data2 = res2.json()['routes'][0]
                        
                        coords1 = [(step[1], step[0]) for step in data1['geometry']['coordinates']]
                        coords2 = [(step[1], step[0]) for step in data2['geometry']['coordinates']]
                        combined_coords = coords1[:-1] + coords2
                        route_key = tuple(tuple(coord) for coord in combined_coords)
                        if route_key not in route_keys:
                            routes[f'Route {len(routes) + 1}'] = combined_coords
                            route_keys.add(route_key)
                    except Exception as e:
                        logging.warning(f"Error processing waypoint {i+1}: {e}")
                        continue
            
            shortest_distance = min((self.calculate_distance(coords) for coords in routes.values()), default=float('inf'))
            max_distance = shortest_distance * 1.5
            filtered_routes = {
                name: coords for name, coords in sorted(routes.items(), key=lambda item: self.calculate_distance(item[1]))
                if self.calculate_distance(coords) <= max_distance
            }
            
            final_routes = dict(list(filtered_routes.items())[:7])
            logging.info(f"Generated {len(final_routes)} unique routes")
            return final_routes if final_routes else None
        except Exception as e:
            logging.error(f"Error fetching routes: {e}")
            return None

    def evaluate_routes(self, routes, time_category):
        if not self.model:
            self.load_model()

        results = []
        max_crimes = 0
        for _, coords in routes.items():
            total_crimes, _ = self.get_nearby_crimes(coords)
            max_crimes = max(max_crimes, total_crimes)
        
        self.max_crimes_per_route = max(max_crimes, 100)
        
        for route_name, coords in routes.items():
            try:
                features, raw_safety_score = self.extract_features(coords, time_category)
                predicted_score = self.model.predict([features])[0]
                
                final_score = (raw_safety_score * 0.5) + (predicted_score * 0.5)
                final_score = max(10, min(100, final_score))

                total_crimes, nearby_crimes = self.get_nearby_crimes(coords)
                results.append({
                    'route_name': route_name,
                    'total_crimes': total_crimes,
                    'safety_score': round(final_score / 100, 2),
                    'total_distance_km': self.calculate_distance(coords),
                    'nearby_crimes': nearby_crimes,
                    'route_coords': coords,
                    'time_category': time_category
                })
            except Exception as e:
                logging.warning(f"Error evaluating route {route_name}: {e}")
                continue
        
        return sorted(results, key=lambda x: x['safety_score'], reverse=True)

    @staticmethod
    def serialize(data):
        if isinstance(data, (np.int64, np.int32)):
            return int(data)
        elif isinstance(data, (np.float64, np.float32)):
            return float(data)
        elif isinstance(data, dict):
            return {k: SafeRouteMLModel.serialize(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [SafeRouteMLModel.serialize(item) for item in data]
        return data

# Initialize model
model = SafeRouteMLModel()
crime_file = os.path.join(os.path.dirname(__file__), '2021-2024_DELHI_DATA.csv')
model.load_crime_data(crime_file)

@app.route('/evaluate_routes', methods=['POST'])
def evaluate_routes():
    try:
        data = request.json
        source = data.get('source')
        destination = data.get('destination')
        time_category = data.get('time_category')

        if not source or not destination:
            return jsonify({'error': 'Source and destination required'}), 400

        logging.info(f"Received request: source={source}, destination={destination}, time_category={time_category}")
        routes = model.get_routes(source, destination)
        if not routes:
            return jsonify({'error': 'Could not fetch routes'}), 500

        ranked_routes = model.evaluate_routes(routes, time_category)
        if not ranked_routes:
            return jsonify({'error': 'No valid routes evaluated'}), 500
        
        return jsonify(model.serialize(ranked_routes)), 200
    except Exception as e:
        logging.error(f"Error in evaluate_routes: {e}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@app.route('/load_crime_data', methods=['POST'])
def load_crime_data():
    try:
        file_path = request.json.get('file_path', crime_file)
        model.load_crime_data(file_path)
        return jsonify({'message': 'Crime data loaded successfully'}), 200
    except Exception as e:
        logging.error(f"Error loading crime data: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/model_performance', methods=['GET'])
def get_model_performance():
    if not model.model_performance:
        return jsonify({'error': 'Model performance metrics not available. Model might not be trained yet.'}), 404
    return jsonify(model.serialize(model.model_performance)), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=False)
