import pandas as pd
import networkx as nx
import matplotlib.pyplot as plt

def load_data(file_path):
    """Load dataset containing crime information."""
    return pd.read_csv(file_path)

def generate_crime_graph(df):
    """Generate a crime network graph based on CrimeCategory, CrimeType, and Crime Severity."""
    G = nx.Graph()
    
    for _, row in df.iterrows():
        category = row['CrimeCategory']
        crime_type = row['CrimeType']
        severity = row['Severity']
        
        if not G.has_node(category):
            G.add_node(category, type='Category')
        
        if not G.has_node(crime_type):
            G.add_node(crime_type, type='CrimeType')
        
        if not G.has_node(severity):
            G.add_node(severity, type='Severity')
        
        G.add_edge(category, crime_type)
        G.add_edge(crime_type, severity)
    
    plt.figure(figsize=(12, 8))
    pos = nx.spring_layout(G)
    nx.draw(G, pos, with_labels=True, node_color='lightblue', edge_color='gray', node_size=2000, font_size=10)
    plt.title("Crime Dataset Graph")
    plt.show()

def main():
    file_path = "2021-2024_DELHI_DATA.csv"  # Change this to your dataset file
    df = load_data(file_path)
    
    generate_crime_graph(df)

if __name__ == "__main__":
    main()