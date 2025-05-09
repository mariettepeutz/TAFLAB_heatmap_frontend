import os
import csv
import pandas as pd
import requests
from dotenv import load_dotenv

load_dotenv()
server_ip=os.getenv("TAF_IP") # Securely store the IP of the oracle database in your environment
print("Server TAF IP:", server_ip)

# Connect to Oracle Database
table_name = "boat_data"
url = f"http://{server_ip}/graphql/{table_name}"

query = '''
{
  data {
    timestamp
    accel_z
    accel_x
    accel_y
    boat_id
    latitude
    longitude
  }
}
'''

response = requests.post(url, json={"query": query})
data = response.json()["data"]["data"]

# Convert to DataFrame
df = pd.DataFrame(data)

# Convert timestamp strings to datetime objects
df["timestamp"] = pd.to_datetime(df["timestamp"])

# If you want to see only today's data: filter to today's data
today = pd.Timestamp.today().normalize()
df_today = df[df["timestamp"] >= today]
df_today['accel_z']=df_today['accel_z'].astype(float)
df_today['accel_x']=df_today['accel_x'].astype(float)
df_today['accel_y']=df_today['accel_y'].astype(float)

# Save to public folder of React app
csv_path = "../TAFLAB_heatmap_frontend/taflab-heatmap-frontend/public/waves.csv"  # adjust if needed
df_today.to_csv(csv_path, index=False)

print(f"✅ Saved {len(df_today)} rows from today to {csv_path}")

def estimate_wave_height(df, window_sec=5, sample_rate=10):
    """
    Estimates wave height based on z-axis acceleration (accel_z).
    
    Parameters:
    - df: DataFrame with columns 'timestamp' and 'accel_z'
    - window_sec: number of seconds to analyze
    - sample_rate: number of datapoints per second (Hz)

    Returns:
    - df_wave: DataFrame with wave height per window
    """

    g = 9.81  # gravitational constant
    df = df.copy()

    # Calculate acceleration delta from gravity
    df['accel_z_centered'] = df['accel_z'] - g

    # Convert timestamps to datetime if not already
    df['timestamp'] = pd.to_datetime(df['timestamp'])

    # Rolling window in samples
    window_samples = window_sec * sample_rate

    # Integrate accel_z to get velocity change (simplified)
    df['wave_velocity'] = df['accel_z_centered'].rolling(window=window_samples).sum() / sample_rate

    # Integrate again to estimate displacement (wave height)
    df['wave_height'] = df['wave_velocity'].rolling(window=window_samples).sum() / sample_rate

    return df[['timestamp', 'accel_z', 'latitude', 'longitude', 'wave_height']]

# Save to public folder of React app
csv_path = "../TAFLAB_heatmap_frontend/taflab-heatmap-frontend/public/waves.csv"  # adjust if needed
df_waveheight=estimate_wave_height(df_today)
df_waveheight.to_csv(csv_path, index=False)

print(f"✅ Saved {len(df_today)} rows from today to {csv_path}")

# Making a small dataframe to filter for specific times

df_wz=df_waveheight[['timestamp', 'accel_z', 'wave_height']]



start_time = pd.to_datetime("17:39:16.427042")
end_time = pd.to_datetime("17:50:00")

# Filter
filtered_df = df_wz[(df_wz['timestamp'] >= start_time) & (df_wz['timestamp'] <= end_time)]

print(filtered_df)