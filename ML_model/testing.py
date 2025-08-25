import pandas as pd

def filter_coordinates(csv_file, min_lat, max_lat, min_lon, max_lon, lat_col='latitude', lon_col='longitude', output_file=None):
    """
    Filter CSV data to include only rows within specified latitude and longitude range.
    
    Parameters:
    csv_file (str): Path to the CSV file
    min_lat (float): Minimum latitude (must be <= max_lat)
    max_lat (float): Maximum latitude (must be >= min_lat)
    min_lon (float): Minimum longitude (must be <= max_lon)
    max_lon (float): Maximum longitude (must be >= min_lon)
    lat_col (str): Name of the latitude column in the CSV (default: 'latitude')
    lon_col (str): Name of the longitude column in the CSV (default: 'longitude')
    output_file (str, optional): Path to save filtered data. If None, won't save.
    
    Returns:
    DataFrame: Filtered data within the coordinate boundaries, or None if error occurs
    
    Raises:
    ValueError: If coordinates are invalid or required columns are missing
    """
    try:
        # Validate coordinate ranges
        if min_lat > max_lat:
            raise ValueError("min_lat must be less than or equal to max_lat")
        if min_lon > max_lon:
            raise ValueError("min_lon must be less than or equal to max_lon")
        
        # Validate latitude values
        if not (-90 <= min_lat <= 90) or not (-90 <= max_lat <= 90):
            raise ValueError("Latitude must be between -90 and 90 degrees")
        
        # Validate longitude values
        if not (-180 <= min_lon <= 180) or not (-180 <= max_lon <= 180):
            raise ValueError("Longitude must be between -180 and 180 degrees")
        
        # Read CSV file
        df = pd.read_csv(csv_file)
        
        # Check for required columns
        required_columns = {lat_col.lower(), lon_col.lower()}
        available_columns = {col.lower() for col in df.columns}
        
        if not required_columns.issubset(available_columns):
            missing = required_columns - available_columns
            raise ValueError(f"Missing required columns: {missing}. Check column names in CSV (case-insensitive).")

        # Rename columns to standard 'latitude' and 'longitude' for internal processing
        lat_actual = next(col for col in df.columns if col.lower() == lat_col.lower())
        lon_actual = next(col for col in df.columns if col.lower() == lon_col.lower())
        df = df.rename(columns={lat_actual: 'latitude', lon_actual: 'longitude'})

        # Convert to numeric (in case they're read as strings)
        df['latitude'] = pd.to_numeric(df['latitude'], errors='coerce')
        df['longitude'] = pd.to_numeric(df['longitude'], errors='coerce')
        
        # Drop rows with invalid coordinates
        df = df.dropna(subset=['latitude', 'longitude'])
        
        # Filter data based on coordinate boundaries
        filtered_df = df[
            (df['latitude'].between(min_lat, max_lat)) & 
            (df['longitude'].between(min_lon, max_lon))
        ].copy()
        
        # Reset index if needed
        filtered_df.reset_index(drop=True, inplace=True)
        
        # Save to file if requested
        if output_file and not filtered_df.empty:
            filtered_df.to_csv(output_file, index=False)
        
        return filtered_df
    
    except FileNotFoundError as e:
        print(f"Error: File not found - {e.filename}")
        return None
    except pd.errors.EmptyDataError:
        print("Error: The CSV file is empty")
        return None
    except Exception as e:
        print(f"Error: {str(e)}")
        return None

def main():
    """Example usage of the coordinate filtering function"""
    # Example coordinates for a small area in Delhi
    CSV_FILE = "2021-2024_DELHI_DATA.csv"  # Replace with your actual file path
    OUTPUT_FILE = "filtered_data.csv"
    
    # Coordinate boundaries (example for a small area in Delhi)
    COORDINATES = {
        'min_lat': 28.60,
        'max_lat': 28.65,
        'min_lon': 77.20,
        'max_lon': 77.25
    }
    
    # Specify the actual column names in your CSV
    LAT_COLUMN = 'Latitude'  # Replace with the actual latitude column name in your CSV
    LON_COLUMN = 'Longitude'  # Replace with the actual longitude column name in your CSV
    
    print(f"Filtering data for coordinates: {COORDINATES}")
    filtered_data = filter_coordinates(
        csv_file=CSV_FILE,
        lat_col=LAT_COLUMN,
        lon_col=LON_COLUMN,
        output_file=OUTPUT_FILE,
        **COORDINATES
    )
    
    if filtered_data is not None:
        if not filtered_data.empty:
            print("\nFiltered data preview:")
            print(filtered_data.head())
            print(f"\nFound {len(filtered_data)} records within the specified area")
            print(f"Filtered data saved to '{OUTPUT_FILE}'")
        else:
            print("No data found within the specified coordinates")

if __name__ == "__main__":
    main()