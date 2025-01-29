from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import pandas as pd
from geopy.distance import geodesic
from scipy.spatial import KDTree
import numpy as np

app = Flask(__name__)
CORS(app)

OSRM_BASE_URL = "http://router.project-osrm.org/route/v1/driving/"

class CrimeRouteModel:
    def __init__(self):
        self.crime_data = None
        self.kd_tree = None
        self.crime_points = None
        
    def load_crime_data(self, file_path):
        try:
            df = pd.read_csv(file_path)
        
            # Check if 'Latitude' and 'Longitude' exist in the dataset
            if 'Latitude' not in df.columns or 'Longitude' not in df.columns:
                raise ValueError("Columns 'Latitude' or 'Longitude' are missing in the dataset.")
        
            # Use Latitude and Longitude columns
            df['latitude'] = df['Latitude'].astype(float)
            df['longitude'] = df['Longitude'].astype(float)
        
            # Build KDTree for efficient lookup
            self.crime_data = df
            self.crime_points = df[['latitude', 'longitude']].values
            self.kd_tree = KDTree(self.crime_points)
        
        except Exception as e:
            print(f"Error loading crime data: {e}")
            raise


    def get_routes_from_osrm(self, source, destination):
        url = f"{OSRM_BASE_URL}{source[1]},{source[0]};{destination[1]},{destination[0]}?alternatives=true&steps=true&annotations=true&geometries=geojson"
        response = requests.get(url)
        if response.status_code != 200:
            return None
        data = response.json()
        routes = {}
        for i, route in enumerate(data['routes']):
            route_coords = [(step[1], step[0]) for step in route['geometry']['coordinates']]
            routes[f'Route {i+1}'] = route_coords
        return routes
    
    def calculate_crime_near_route(self, route_coords, radius=0.5):
        total_crimes = 0
        total_severity = 0
        nearby_crimes = []

        for route_point in route_coords:
            indices = self.kd_tree.query_ball_point(route_point, radius / 111)  # Convert km to lat/lon degrees
            for i in indices:
                crime = self.crime_data.iloc[i]
                total_crimes += 1
                total_severity += crime['Severity']
                nearby_crimes.append({
                    'crime_id': crime['CrimeID'],
                    'category': crime['CrimeCategory'],
                    'location': (crime['Latitude'], crime['Longitude']),
                    'severity': crime['Severity']
                })
        
        # Improved safety score calculation
        max_severity = self.crime_data['Severity'].max() or 1
        safety_score = max(0, 1 - (total_severity / (len(route_coords) * max_severity)))
        return total_crimes, safety_score, nearby_crimes
    
    def calculate_route_distance(self, route_coords):
        return sum(geodesic(route_coords[i], route_coords[i+1]).km for i in range(len(route_coords) - 1))
    
    @staticmethod
    def convert_int64_to_int(data):
        if isinstance(data, np.int64):  # For individual int64 values
            return int(data)
        elif isinstance(data, np.float64):  # For individual float64 values
            return float(data)
        elif isinstance(data, dict):  # For dictionaries
            return {key: CrimeRouteModel.convert_int64_to_int(value) for key, value in data.items()}
        elif isinstance(data, list):  # For lists
            return [CrimeRouteModel.convert_int64_to_int(item) for item in data]
        else:
            return data  # Return the data as is if it's not a list, dict, or int64

    def evaluate_routes(self, routes):
        results = []
    
        for route_name, route_coords in routes.items():
            total_crimes, safety_score, nearby_crimes = self.calculate_crime_near_route(route_coords)
            total_distance = self.calculate_route_distance(route_coords)
            
            # Ensure all numeric types are convertible to JSON serializable types
            result = {
                'route_name': route_name,
                'total_crimes': CrimeRouteModel.convert_int64_to_int(total_crimes),
                'safety_score': round(CrimeRouteModel.convert_int64_to_int(safety_score), 2),
                'total_distance_km': round(CrimeRouteModel.convert_int64_to_int(total_distance), 2),
                'nearby_crimes': nearby_crimes,
                'route_coords': route_coords
            }
            
            results.append(result)
    
        # Ensure the final list is also JSON serializable
        results = CrimeRouteModel.convert_int64_to_int(results)
    
        # Sort by safety_score
        return sorted(results, key=lambda x: x['safety_score'], reverse=True)


# Initialize model and load crime data
model = CrimeRouteModel()
crime_file = 'combined_crime_data.csv'
model.load_crime_data(crime_file)

@app.route('/evaluate_routes', methods=['POST'])
def evaluate_routes_endpoint():
    data = request.json
    source = data.get('source')
    destination = data.get('destination')
    
    if not source or not destination:
        return jsonify({'error': 'Source and destination required'}), 400
    
    routes = model.get_routes_from_osrm(source, destination)
    if not routes:
        return jsonify({'error': 'Could not fetch routes'}), 500
    
    ranked_routes = model.evaluate_routes(routes)
    return jsonify(ranked_routes)

@app.route('/load_crime_data', methods=['POST'])
def reload_crime_data():
    global model
    file_path = request.json.get('file_path', crime_file)
    try:
        model.load_crime_data(file_path)
        return jsonify({'message': 'Crime data reloaded successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
