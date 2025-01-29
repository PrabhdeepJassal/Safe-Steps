import osmnx as ox
import numpy as np
import pandas as pd
import folium
import random
from datetime import datetime, timedelta

# Set a fixed random seed for reproducibility
RANDOM_SEED = 42
random.seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)

# Multiple coordinates to cover wider Delhi area
REGION_COORDS = [
    ("North Delhi", 28.7006, 77.2050),
    ("South Delhi", 28.5535, 77.2154),
    ("East Delhi", 28.6355, 77.2850),
    ("West Delhi", 28.6377, 77.1019),
    ("Central Delhi", 28.6328, 77.2190)
]

def generate_detailed_crime_types():
    return {
        'Theft': [
            ('Vehicle Theft', 3), 
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
            ('Kidnapping', 5)
        ],
        'Sexual Crime': [
            ('Sexual Assault', 5), 
            ('Rape', 5), 
            ('Sexual Harassment', 4)
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

def generate_road_data(num_entries, latitude, longitude, specific_year=2021):
    try:
        graph = ox.graph_from_point(
            (latitude, longitude), 
            dist=10000,  
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
            
            crime_date = datetime(year=specific_year, month=random.randint(1, 12), day=random.randint(1, 28))
            crime_datetime = crime_date.replace(
                hour=random.randint(0, 23), 
                minute=random.randint(0, 59), 
                second=random.randint(0, 59)
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

def create_combined_map(data):
    map_center = [data['Latitude'].mean(), data['Longitude'].mean()]
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
    
    crime_map.save("combined_crime_map.html")
    print("Combined map saved as combined_crime_map.html")

def main():
    specific_year = 2021
    all_data = pd.DataFrame()
    
    for region_name, latitude, longitude in REGION_COORDS:
        print(f"Processing region: {region_name}")
        data = generate_road_data(400, latitude, longitude, specific_year=specific_year)
        if not data.empty:
            all_data = pd.concat([all_data, data])
    
    if not all_data.empty:
        create_combined_map(all_data)
        all_data.to_csv("combined_crime_data.csv", index=False)
        print("Combined crime data saved as combined_crime_data.csv")

if __name__ == "__main__":
    main()