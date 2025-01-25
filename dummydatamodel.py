import osmnx as ox
import numpy as np
import pandas as pd
import folium
import random
from datetime import datetime, timedelta

def generate_detailed_crime_types():
    return {
        'Theft': [
            ('Vehicle Theft', 4), 
            ('Bike Theft', 2), 
            ('Stealing from Vehicle', 3), 
            ('Pickpocketing', 2)
        ],
        'Assault': [
            ('Road Rage Incident', 4), 
            ('Verbal Altercation', 2), 
            ('Pedestrian Attack', 5), 
            ('Carjacking', 5)
        ],
        'Hit-and-Run': [
            ('Accident Fleeing', 4),
            ('Injury Escape', 5)
        ],
        'Traffic Violation': [
            ('Reckless Driving', 3), 
            ('Drunk Driving', 4), 
            ('Speeding', 2)
        ],
        'Robbery': [
            ('Mugging', 4), 
            ('Armed Robbery', 5), 
            ('Parking Lot Robbery', 4)
        ],
        'Vandalism': [
            ('Road Sign Graffiti', 1), 
            ('Vehicle Damage', 2), 
            ('Public Property Destruction', 3)
        ],
        'Kidnapping': [
            ('Vehicle Abduction', 5), 
            ('Highway Kidnapping', 5)
        ],
        'Fraud': [
            ('Insurance Scam', 3), 
            ('Toll Booth Fraud', 2)
        ],
        'Sexual Crime': [
            ('Sexual Assault', 5), 
            ('Rape', 5), 
            ('Sexual Harassment', 3)
        ],
        'Drug Trafficking': [
            ('Public Intoxication', 1), 
            ('Human Trafficking', 5)
        ],
        'Loitering and Harassment': [
            ('Aggressive Panhandling', 2), 
            ('Street Harassment', 3), 
            ('Stalking', 4)
        ],
        'Illegal Street Racing': [
            ('Drag Racing', 3), 
            ('Dangerous Driving', 4)
        ],
        'Hate Crimes': [
            ('Targeted Assault', 5), 
            ('Verbal Abuse', 3)
        ],
        'Obstruction': [
            ('Blocking Pedestrian Path', 1), 
            ('Illegal Vending', 1)
        ]
    }

def generate_simplified_id(crime_type, date):
    crime_prefix = crime_type[:3].upper()
    date_part = date.strftime('%y%m%d')
    random_suffix = f"{random.randint(0, 999):03d}"
    return f"{crime_prefix}-{date_part}-{random_suffix}"

def generate_road_data(num_entries):
    latitude, longitude = 28.6139, 77.2090
    
    try:
        graph = ox.graph_from_point(
            (latitude, longitude), 
            dist=5000,  
            network_type='drive'
        )
        
        edges = ox.graph_to_gdfs(graph, nodes=False)
        
        crime_types_dict = generate_detailed_crime_types()
        
        crime_data = []
        for _ in range(num_entries):
            crime_category = random.choice(list(crime_types_dict.keys()))
            specific_crime, severity = random.choice(crime_types_dict[crime_category])
            
            road = edges.iloc[random.randint(0, len(edges)-1)]
            road_line = road.geometry
            
            point_along_road = road_line.interpolate(random.random(), normalized=True)
            
            crime_date = datetime.now() - timedelta(days=random.randint(1, 1000))
            
            random_hour = random.randint(0, 23)
            random_minute = random.randint(0, 59)
            random_second = random.randint(0, 59)
            
            crime_datetime = crime_date.replace(
                hour=random_hour, 
                minute=random_minute, 
                second=random_second
            )
            
            crime_data.append({
                'CrimeID': generate_simplified_id(specific_crime, crime_datetime),
                'CrimeCategory': crime_category,
                'CrimeType': specific_crime,
                'Latitude': point_along_road.y,
                'Longitude': point_along_road.x,
                'CrimeDate': crime_datetime.strftime('%Y-%m-%d'),
                'CrimeTime': crime_datetime.strftime('%H:%M:%S'),
                'Severity': severity
            })
        
        return pd.DataFrame(crime_data)
    
    except Exception as e:
        print(f"Error generating road-specific data: {e}")
        return pd.DataFrame()

def get_color(severity):
    colors = {1: 'green', 2: 'lightgreen', 3: 'orange', 4: 'red', 5: 'darkred'}
    return colors.get(severity, 'blue')

def create_crime_map(data):
    map_center = [28.6139, 77.2090]
    crime_map = folium.Map(location=map_center, zoom_start=11)
    
    for _, row in data.iterrows():
        folium.Marker(
            location=[row['Latitude'], row['Longitude']],
            popup=f"""
            ID: {row['CrimeID']}<br>
            Category: {row['CrimeCategory']}<br>
            Type: {row['CrimeType']}<br>
            Date: {row['CrimeDate']}<br>
            Time: {row['CrimeTime']}<br>
            Severity: {row['Severity']}
            """,
            icon=folium.Icon(color=get_color(row['Severity']))
        ).add_to(crime_map)
    
    crime_map.save("road_crime_map.html")
    print("Map saved as road_crime_map.html")

def main():
    data = generate_road_data(100)
    if not data.empty:
        create_crime_map(data)
        data.to_csv("crime_data.csv", index=False)
        print("Crime data also saved to crime_data.csv")

if __name__ == "__main__":
    main()