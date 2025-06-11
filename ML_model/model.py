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

            # Update max_severity based on dataset
            self.max_severity = df['Severity'].max() if 'Severity' in df.columns else 5
            logging.info(f"Dataset max severity: {self.max_severity}")

            # Perform DBSCAN clustering
            clustering = DBSCAN(eps=0.001, min_samples=5).fit(self.crime_points)  # ~100m radius
            self.cluster_labels = clustering.labels_
            # Calculate centroids and severities for non-noise clusters (label != -1)
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

        # Generate 2000 synthetic routes with realistic crime distributions
        for i in range(2000):
            try:
                lat = np.random.uniform(28.4, 28.8)
                lon = np.random.uniform(77.0, 77.4)
                route_coords = [(lat + np.random.uniform(-0.05, 0.05), lon + np.random.uniform(-0.05, 0.05)) for _ in range(15)]
                time_category = np.random.choice(time_categories)
                
                # Simulate realistic crime counts and severities
                total_crimes, nearby_crimes = self.get_nearby_crimes(route_coords)
                if nearby_crimes:
                    severities = [crime['severity'] for crime in nearby_crimes]
                    total_severity = sum(severities)
                    high_severity_crimes = sum(1 for s in severities if s >= self.max_severity * 0.6)
                else:
                    total_severity, high_severity_crimes = 0, 0
                
                features, safety_score = self.extract_features(route_coords, time_category)
                X.append(features)
                y.append(safety_score)
            except Exception as e:
                logging.warning(f"Error processing synthetic route {i}: {e}")
                continue

        if not X:
            raise ValueError("No valid routes generated for training")

        X = np.array(X)
        y = np.array(y)
        self.model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.model.fit(X, y)
        logging.info("Model trained successfully")

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
        
        # Severity-based features
        total_severity = sum(crime['severity'] for crime in nearby_crimes) if nearby_crimes else 0
        avg_severity = total_severity / total_crimes if total_crimes > 0 else 0
        max_severity = max((crime['severity'] for crime in nearby_crimes), default=0)
        high_severity_crimes = sum(1 for crime in nearby_crimes if crime['severity'] >= self.max_severity * 0.6)  # Dynamic threshold
        crime_types = len(set(crime['category'] for crime in nearby_crimes))
        time_encoded = self.label_encoder.transform([time_category])[0] if time_category else 0

        # Cluster-based features (patterns)
        num_hotspots = 0
        high_severity_hotspots = 0
        min_distance_to_hotspot = float('inf')
        if self.cluster_centroids.size > 0:
            for point in route_coords:
                distances = np.linalg.norm(self.cluster_centroids - point, axis=1)
                close_clusters = distances < 0.001  # ~100m
                if np.any(close_clusters):
                    num_hotspots += 1
                    # Check for high-severity clusters
                    cluster_indices = np.where(close_clusters)[0]
                    for idx in cluster_indices:
                        if self.cluster_severities[idx] >= self.max_severity * 0.6:
                            high_severity_hotspots += 1
                min_distance_to_hotspot = min(min_distance_to_hotspot, np.min(distances))
        min_distance_to_hotspot = min_distance_to_hotspot * 111  # Convert to km

        # Safety score calculation (normalized per route set in evaluate_routes)
        severity_penalty = total_severity / (self.max_crimes_per_route * self.max_severity) if total_crimes > 0 else 0
        high_severity_penalty = high_severity_crimes / self.max_crimes_per_route * 0.5  # Reduced weight
        hotspot_penalty = high_severity_hotspots * 0.05  # Reduced penalty per hotspot
        time_multipliers = {'Morning': 1.0, 'Afternoon': 1.0, 'Evening': 0.9, 'Night': 0.7}
        time_multiplier = time_multipliers.get(time_category, 1.0)

        # Raw safety score (will be normalized later)
        safety_score = 100 * (1 - severity_penalty - high_severity_penalty - hotspot_penalty) * time_multiplier
        safety_score = max(10, safety_score)  # Prevent negative scores, but expect normalization

        # Log raw values for debugging
        logging.info(f"Route features: crimes={total_crimes}, total_severity={total_severity:.2f}, "
                     f"high_severity_crimes={high_severity_crimes}, high_severity_hotspots={high_severity_hotspots}, "
                     f"severity_penalty={severity_penalty:.4f}, high_severity_penalty={high_severity_penalty:.4f}, "
                     f"hotspot_penalty={hotspot_penalty:.4f}, raw_safety_score={safety_score:.2f}")

        features = [
            total_crimes, avg_severity, max_severity, high_severity_crimes,
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
            # Fetch direct routes from OSRM with up to 3 alternatives (max allowed)
            url = f"{OSRM_BASE_URL}{source[1]},{source[0]};{destination[1]},{destination[0]}?alternatives=true&steps=true&geometries=geojson&overview=full&alternatives=3"
            logging.info(f"Fetching direct routes from OSRM: {url}")
            response = requests.get(url)
            if response.status_code != 200:
                logging.error(f"OSRM error: {response.status_code} - {response.text}")
                return None
            data = response.json()
            if 'routes' not in data or not data['routes']:
                logging.error("OSRM returned no routes")
                return None

            # Store unique routes
            routes = {}
            route_keys = set()
            for i, route in enumerate(data['routes']):
                coords = [(step[1], step[0]) for step in route['geometry']['coordinates']]
                route_key = tuple(tuple(coord) for coord in coords)
                if route_key not in route_keys:
                    routes[f'Route {len(routes) + 1}'] = coords
                    route_keys.add(route_key)

            # If fewer than 6 routes, generate additional routes using waypoints
            if len(routes) < 6:
                min_lat = min(source[0], destination[0]) - 0.05
                max_lat = max(source[0], destination[0]) + 0.05
                min_lon = min(source[1], destination[1]) - 0.05
                max_lon = max(source[1], destination[1]) + 0.05

                # Generate up to 3 waypoints
                waypoints = [
                    (np.random.uniform(min_lat, max_lat), np.random.uniform(min_lon, max_lon))
                    for _ in range(3)
                ]

                for i, waypoint in enumerate(waypoints):
                    url1 = f"{OSRM_BASE_URL}{source[1]},{source[0]};{waypoint[1]},{waypoint[0]}?alternatives=true&steps=true&geometries=geojson&overview=full&alternatives=1"
                    url2 = f"{OSRM_BASE_URL}{waypoint[1]},{waypoint[0]};{destination[1]},{destination[0]}?alternatives=true&steps=true&geometries=geojson&overview=full&alternatives=1"
                    logging.info(f"Fetching waypoint {i+1} routes: {url1} and {url2}")

                    try:
                        response1 = requests.get(url1)
                        response2 = requests.get(url2)
                        if response1.status_code != 200 or response2.status_code != 200:
                            logging.warning(f"Waypoint {i+1} fetch failed: {response1.status_code}, {response2.status_code}")
                            continue
                        data1 = response1.json()
                        data2 = response2.json()

                        for r1 in data1['routes']:
                            for r2 in data2['routes']:
                                coords1 = [(step[1], step[0]) for step in r1['geometry']['coordinates']]
                                coords2 = [(step[1], step[0]) for step in r2['geometry']['coordinates']]
                                combined_coords = coords1[:-1] + coords2
                                route_key = tuple(tuple(coord) for coord in combined_coords)
                                if route_key not in route_keys:
                                    routes[f'Route {len(routes) + 1}'] = combined_coords
                                    route_keys.add(route_key)
                    except Exception as e:
                        logging.warning(f"Error processing waypoint {i+1}: {e}")
                        continue

            # Filter routes by distance and limit to 6–7
            shortest_distance = min(self.calculate_distance(coords) for coords in routes.values()) if routes else float('inf')
            max_distance = shortest_distance * 1.5
            filtered_routes = {}
            route_list = [(name, coords, self.calculate_distance(coords)) for name, coords in routes.items()]
            route_list = sorted(route_list, key=lambda x: x[2])  # Sort by distance

            for name, coords, distance in route_list:
                if distance <= max_distance and len(filtered_routes) < 7:
                    filtered_routes[name] = coords

            logging.info(f"Generated {len(filtered_routes)} unique routes (target 6–7)")
            return filtered_routes if filtered_routes else None
        except Exception as e:
            logging.error(f"Error fetching routes: {e}")
            return None

    def evaluate_routes(self, routes, time_category):
        if not self.model:
            self.load_model()

        results = []
        raw_scores = []
        max_crimes = 0
        max_total_severity = 0

        # First pass: Collect stats for normalization
        for route_name, coords in routes.items():
            total_crimes, nearby_crimes = self.get_nearby_crimes(coords)
            total_severity = sum(crime['severity'] for crime in nearby_crimes) if nearby_crimes else 0
            max_crimes = max(max_crimes, total_crimes)
            max_total_severity = max(max_total_severity, total_severity)

        # Update max_crimes_per_route dynamically
        self.max_crimes_per_route = max(max_crimes, 100)  # Ensure non-zero
        logging.info(f"Dynamic max_crimes_per_route: {self.max_crimes_per_route}, max_total_severity: {max_total_severity}")

        # Second pass: Evaluate routes
        for route_name, coords in routes.items():
            try:
                total_crimes, nearby_crimes = self.get_nearby_crimes(coords)
                features, raw_safety_score = self.extract_features(coords, time_category)
                predicted_score = self.model.predict([features])[0]

                # Normalize raw safety score based on route set
                normalized_score = 100 * (raw_safety_score / max(100, max_total_severity / self.max_severity)) if raw_safety_score > 10 else raw_safety_score
                final_score = 0.5 * normalized_score + 0.5 * predicted_score  # Equal weight
                final_score = max(10, min(100, final_score))

                results.append({
                    'route_name': route_name,
                    'total_crimes': total_crimes,
                    'safety_score': round(final_score / 100, 2),  # Normalize to [0.1, 1.0]
                    'total_distance_km': self.calculate_distance(coords),
                    'nearby_crimes': nearby_crimes,
                    'route_coords': coords,
                    'time_category': time_category
                })
                raw_scores.append(raw_safety_score)
            except Exception as e:
                logging.warning(f"Error evaluating route {route_name}: {e}")
                continue

        logging.info(f"Raw safety scores: {[round(s, 2) for s in raw_scores]}")
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
crime_file = '2021-2024_DELHI_DATA.csv'
model.load_crime_data(crime_file)

@app.route('/evaluate_routes', methods=['POST'])
def evaluate_routes():
    try:
        data = request.json
        source = data.get('source')
        destination = data.get('destination')
        time_category = data.get('time_category')

        if not source or not destination:
            logging.error("Missing source or destination")
            return jsonify({'error': 'Source and destination required'}), 400

        logging.info(f"Received request: source={source}, destination={destination}, time_category={time_category}")
        routes = model.get_routes(source, destination)
        if not routes:
            logging.error("No routes fetched from OSRM")
            return jsonify({'error': 'Could not fetch routes'}), 500

        ranked_routes = model.evaluate_routes(routes, time_category)
        if not ranked_routes:
            logging.error("No routes evaluated successfully")
            return jsonify({'error': 'No valid routes evaluated'}), 500

        logging.info(f"Returning {len(ranked_routes)} ranked routes")
        return jsonify(model.serialize(ranked_routes)), 200
    except Exception as e:
        logging.error(f"Error in evaluate_routes: {e}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@app.route('/load_crime_data', methods=['POST'])
def load_crime_data():
    try:
        file_path = request.json.get('file_path', crime_file)
        model.load_crime_data(file_path)
        logging.info("Crime data loaded successfully")
        return jsonify({'message': 'Crime data loaded successfully'}), 200
    except Exception as e:
        logging.error(f"Error loading crime data: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    model = SafeRouteMLModel()
    model.load_crime_data('2021-2024_DELHI_DATA.csv')
    port = int(os.environ.get('PORT', 5000))  # Use Render's PORT or default to 5000
    app.run(host='0.0.0.0', port=port, debug=False)  # Disable debug for production