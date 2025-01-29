import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler
from datetime import datetime
from geopy.distance import geodesic
import warnings
import os
warnings.filterwarnings('ignore')

class RouteSafetyAnalyzer:
    def __init__(self):
        self.label_encoders = {}
        self.scaler = StandardScaler()
        
    def load_and_preprocess_data(self, file_path):
        """
        Load and preprocess the crime data from CSV
        """
        try:
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"The file {file_path} was not found.")
            
            print(f"Loading data from {file_path}")
            df = pd.read_csv(file_path)
            
            # Convert date and time columns to datetime
            df['crime_datetime'] = pd.to_datetime(df['crime_date'] + ' ' + df['crime_time'])
            
            # Split geolocation into latitude and longitude
            df[['latitude', 'longitude']] = df['crime_geolocation'].str.split(',', expand=True).astype(float)
            
            print("Data preprocessing completed successfully")
            return df
            
        except Exception as e:
            print(f"Error in load_and_preprocess_data: {str(e)}")
            raise

    def analyze_route_safety(self, route_coordinates, crime_data, buffer_distance=0.5):
        """
        Analyze safety of a specific route based on nearby crimes
        
        Parameters:
        route_coordinates: list of tuples [(lat1, lon1), (lat2, lon2), ...]
        crime_data: DataFrame containing crime data
        buffer_distance: distance in kilometers to consider crimes near the route
        """
        route_crimes = []
        total_distance = 0
        
        # Analyze each segment of the route
        for i in range(len(route_coordinates) - 1):
            start_point = route_coordinates[i]
            end_point = route_coordinates[i + 1]
            
            # Calculate segment distance
            segment_distance = geodesic(start_point, end_point).kilometers
            total_distance += segment_distance
            
            # Find crimes near this segment
            segment_crimes = []
            for _, crime in crime_data.iterrows():
                crime_point = (crime['latitude'], crime['longitude'])
                
                # Calculate minimum distance from crime to route segment
                distances = [
                    geodesic(crime_point, start_point).kilometers,
                    geodesic(crime_point, end_point).kilometers
                ]
                min_distance = min(distances)
                
                if min_distance <= buffer_distance:
                    segment_crimes.append({
                        'crime_id': crime.get('crime_id', 'N/A'),
                        'crime_type': crime.get('crime_type', 'N/A'),
                        'crime_category': crime.get('crime_category', 'N/A'),
                        'distance_from_route': min_distance,
                        'datetime': crime.get('crime_datetime', 'N/A'),
                        'severity': crime.get('severity', 1)
                    })
            
            route_crimes.append({
                'segment': (start_point, end_point),
                'distance': segment_distance,
                'crimes': segment_crimes,
                'crime_count': len(segment_crimes),
                'avg_severity': np.mean([c['severity'] for c in segment_crimes]) if segment_crimes else 0
            })
        
        # Calculate route statistics
        total_crimes = sum(segment['crime_count'] for segment in route_crimes)
        avg_crimes_per_km = total_crimes / total_distance if total_distance > 0 else 0
        route_severity = np.mean([segment['avg_severity'] for segment in route_crimes if segment['avg_severity'] > 0]) if route_crimes else 0
        
        return {
            'total_distance': total_distance,
            'total_crimes': total_crimes,
            'crimes_per_km': avg_crimes_per_km,
            'average_severity': route_severity,
            'safety_score': 1 / (1 + avg_crimes_per_km * route_severity),  # Higher score means safer route
            'segment_details': route_crimes
        }

    def compare_routes(self, routes_dict, crime_data):
        """
        Compare multiple routes and rank them by safety
        
        Parameters:
        routes_dict: dictionary of route_name: route_coordinates
        crime_data: DataFrame containing crime data
        """
        route_analyses = {}
        
        for route_name, coordinates in routes_dict.items():
            print(f"Analyzing route: {route_name}")
            analysis = self.analyze_route_safety(coordinates, crime_data)
            route_analyses[route_name] = analysis
        
        # Sort routes by safety score (higher is safer)
        ranked_routes = sorted(
            route_analyses.items(),
            key=lambda x: x[1]['safety_score'],
            reverse=True
        )
        
        return ranked_routes