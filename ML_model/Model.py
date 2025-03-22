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
        
            if 'Latitude' not in df.columns or 'Longitude' not in df.columns:
                raise ValueError("Columns 'Latitude' or 'Longitude' are missing in the dataset.")
        
            df['latitude'] = df['Latitude'].astype(float)
            df['longitude'] = df['Longitude'].astype(float)
        
            self.crime_data = df
            self.crime_points = df[['latitude', 'longitude']].values
            self.kd_tree = KDTree(self.crime_points)
        
            print(f"Crime data loaded: {self.crime_data.head()}")  # Print the first few rows of data
        
        except Exception as e:
            print(f"Error loading crime data: {e}")
            raise

    def get_all_possible_routes(self, source, destination):
        # Get initial routes
        initial_routes = self.get_routes_from_osrm(source, destination)
        if not initial_routes:
            return None

        # Create a set to track unique route coordinates
        unique_routes = {}
    
        for route_name, route_coords in initial_routes.items():
            route_key = tuple(tuple(coord) for coord in route_coords)
            unique_routes[route_name] = route_coords

        # Generate additional routes by using different waypoints
        route_coords = list(initial_routes.values())[0]  # Get coordinates from first route
    
        # Generate intermediate points along the route
        num_points = min(len(route_coords) - 1, 3)  # Limit to 3 intermediate points
        step = len(route_coords) // (num_points + 1)
    
        for i in range(1, num_points + 1):
            waypoint = route_coords[i * step]
            # Get route through this waypoint
            route1 = self.get_routes_from_osrm(source, waypoint)
            route2 = self.get_routes_from_osrm(waypoint, destination)
        
            if route1 and route2:
                # Combine the routes
                for r1_key, r1_coords in route1.items():
                    for r2_key, r2_coords in route2.items():
                        # Combine coordinates, removing duplicate waypoint
                        combined_coords = r1_coords[:-1] + r2_coords
                    
                        # Check for uniqueness
                        route_key = tuple(tuple(coord) for coord in combined_coords)
                        if route_key not in [tuple(tuple(coord) for coord in existing_route) for existing_route in unique_routes.values()]:
                            new_route_key = f'Route {len(unique_routes) + 1}'
                            unique_routes[new_route_key] = combined_coords

        return unique_routes

    def get_routes_from_osrm(self, source, destination):
        # Request multiple alternatives from OSRM
        url = f"{OSRM_BASE_URL}{source[1]},{source[0]};{destination[1]},{destination[0]}?alternatives=true&steps=true&annotations=true&geometries=geojson&overview=full&alternatives=3"
        try:
            response = requests.get(url)
            print("OSRM Response Status Code:", response.status_code)  # Log status code
            if response.status_code != 200:
                print("OSRM Error:", response.text)  # Log error message
                return None
            data = response.json()
            routes = {}
            for i, route in enumerate(data['routes']):
                route_coords = [(step[1], step[0]) for step in route['geometry']['coordinates']]
                routes[f'Route {i+1}'] = route_coords
            return routes
        except Exception as e:
            print(f"Error fetching routes: {e}")
            return None

    def calculate_crime_near_route(self, route_coords, radius=0.1):
        total_crimes = 0
        total_severity = 0
        nearby_crimes = []
        seen_crimes = set()  

        for route_point in route_coords:
            indices = self.kd_tree.query_ball_point(route_point, radius / 111)  
            for i in indices:
                crime = self.crime_data.iloc[i]
                crime_id = crime['CrimeID']
                if crime_id not in seen_crimes:
                    seen_crimes.add(crime_id)
                    total_crimes += 1
                    total_severity += crime['Severity']
                    nearby_crimes.append({
                        'crime_id': crime_id,
                        'category': crime['CrimeCategory'],
                        'location': (crime['Latitude'], crime['Longitude']),
                        'severity': crime['Severity']
                    })

        # Normalize severity and introduce a base safety factor
        max_severity = self.crime_data['Severity'].max() or 1  
        route_length = max(len(route_coords), 1)  # Prevent division by zero
        base_safety_factor = 0.3  # Minimum safety score (adjustable)

        # Compute adjusted safety score
        normalized_severity = total_severity / (total_crimes * max_severity + 1)  # Prevent division by extreme values
        safety_score = max(base_safety_factor, 1 - normalized_severity)

        return total_crimes, round(safety_score, 2), nearby_crimes

    
    def calculate_route_distance(self, route_coords):
        return sum(geodesic(route_coords[i], route_coords[i+1]).km for i in range(len(route_coords) - 1))
    
    @staticmethod
    def convert_int64_to_int(data):
        if isinstance(data, (np.int64, np.int32)):
            return int(data)
        elif isinstance(data, (np.float64, np.float32)):
            return float(data)
        elif isinstance(data, dict):
            return {key: CrimeRouteModel.convert_int64_to_int(value) for key, value in data.items()}
        elif isinstance(data, list):
            return [CrimeRouteModel.convert_int64_to_int(item) for item in data]
        return data

    def evaluate_routes(self, routes, time_category=None):
        # Time severity multipliers
        time_severity_multiplier = {
            'Night': 1.5,     # Higher risk at night
            'Morning': 1.0,   # Baseline risk
            'Afternoon': 1.0, # Baseline risk
            'Evening': 1.2    # Slightly elevated risk
        }
    
        results = []
        for route_name, route_coords in routes.items():
            total_crimes, base_safety_score, nearby_crimes = self.calculate_crime_near_route(route_coords)
        
            # Apply time-based severity multiplier
            time_multiplier = time_severity_multiplier.get(time_category, 1.0)
            adjusted_safety_score = max(0, base_safety_score / time_multiplier)
        
            result = {
                'route_name': route_name,
                'total_crimes': total_crimes,
                'safety_score': round(adjusted_safety_score, 2),
                'total_distance_km': self.calculate_route_distance(route_coords),
                'nearby_crimes': nearby_crimes,
                'route_coords': route_coords,
                'time_category': time_category
            }
            results.append(result)
    
        # Sort routes by safety score, considering time of day
        return sorted(results, key=lambda x: x['safety_score'], reverse=True)

# Initialize model and load crime data
model = CrimeRouteModel()
crime_file = '2021-2024_DELHI_DATA.csv'
model.load_crime_data(crime_file)

@app.route('/evaluate_routes', methods=['POST'])
def evaluate_routes_endpoint():
    data = request.json
    print(f"Received data: {data}")  # Log the incoming data
    source = data.get('source')
    destination = data.get('destination')
    current_time = data.get('current_time')
    time_category = data.get('time_category')
    
    if not source or not destination:
        return jsonify({'error': 'Source and destination required'}), 400
    
    routes = model.get_all_possible_routes(source, destination)
    if not routes:
        return jsonify({'error': 'Could not fetch routes'}), 500
    
    # Pass time category to evaluation
    ranked_routes = model.evaluate_routes(routes, time_category)
    return jsonify(CrimeRouteModel.convert_int64_to_int(ranked_routes))

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
