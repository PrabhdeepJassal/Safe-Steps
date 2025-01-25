import folium

# Function to get color based on severity
def get_color(severity):
    if severity == 5:
        return 'red'  # Major crime
    elif severity >= 3:
        return 'orange'  # Moderate crime
    else:
        return 'lightred'  # Minor crime

# Create a map centered at an approximate location
map_center = [28.60, 77.20]
crime_map = folium.Map(location=map_center, zoom_start=12)

# Add markers to the map
for _, row in data.iterrows():
    folium.Marker(
        location=[row['Latitude'], row['Longitude']],
        popup=f"Crime: {row['CrimeType']}<br>Date: {row['CrimeDate']}<br>Severity: {row['Severity']}",
        icon=folium.Icon(color=get_color(row['Severity']))
    ).add_to(crime_map)

# Save map to an HTML file
crime_map.save("crime_map.html")
print("Map saved as crime_map.html")
