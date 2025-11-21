import os
import fastf1
import fastf1.plotting
import numpy as np
import json

# Enable local cache (adjust path if you prefer)
fastf1.Cache.enable_cache('.fastf1-cache')

FPS = 25
DT = 1 / FPS

loading_status = "Loading..."
loading_percent = 0.0

def load_race_session(year, round_number):
    session = fastf1.get_session(year, round_number, 'R')
    session.load(telemetry=True)
    return session


def get_driver_colors(session):
    color_mapping = fastf1.plotting.get_driver_color_mapping(session)
    
    # Convert hex colors to RGB tuples
    rgb_colors = {}
    for driver, hex_color in color_mapping.items():
        hex_color = hex_color.lstrip('#')
        rgb = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
        rgb_colors[driver] = rgb
    return rgb_colors


def get_race_telemetry(session):

    # Check if this data has already been computed

    try:
        with open(f"computed_data/{session.event['EventName'].replace(' ', '_')}_race_telemetry.json", "r") as f:
            frames = json.load(f)
            print("Loaded precomputed race telemetry data.")
            return frames
    except FileNotFoundError:
        pass  # Need to compute from scratch


    drivers = session.drivers

    driver_codes = {
        num: session.get_driver(num)["Abbreviation"]
        for num in drivers
    }

    driver_data = {}

    global_t_min = None
    global_t_max = None

    # 1. Get all of the drivers telemetry data
    for driver_no in drivers:
        code = driver_codes[driver_no]

        print("Getting telemetry for driver:", code)

        laps_driver = session.laps.pick_drivers(driver_no)
        if laps_driver.empty:
            continue

        t_all = []
        x_all = []
        y_all = []
        race_dist_all = []
        rel_dist_all = []
        speed_all = []
        lap_numbers = []

        total_dist_so_far = 0.0

        # iterate laps in order
        for _, lap in laps_driver.iterlaps():
            # get telemetry for THIS lap only
            lap_tel = lap.get_telemetry()
            lap_number = lap.LapNumber
            if lap_tel.empty:
                continue

            t_lap = lap_tel["SessionTime"].dt.total_seconds().to_numpy()
            x_lap = lap_tel["X"].to_numpy()
            y_lap = lap_tel["Y"].to_numpy()
            d_lap = lap_tel["Distance"].to_numpy()          
            rd_lap = lap_tel["RelativeDistance"].to_numpy()
            speed_lap = lap_tel["Speed"].to_numpy()       

            # normalise lap distance to start at 0
            d_lap = d_lap - d_lap.min()
            lap_length = d_lap.max()  # approx. circuit length for this lap

            # race distance = distance before this lap + distance within this lap
            race_d_lap = total_dist_so_far + d_lap

            total_dist_so_far += lap_length

            t_all.append(t_lap)
            x_all.append(x_lap)
            y_all.append(y_lap)
            race_dist_all.append(race_d_lap)
            rel_dist_all.append(rd_lap)
            speed_all.append(speed_lap)
            lap_numbers.append(np.full_like(t_lap, lap_number))

        if not t_all:
            continue

        t_all = np.concatenate(t_all)
        x_all = np.concatenate(x_all)
        y_all = np.concatenate(y_all)
        race_dist_all = np.concatenate(race_dist_all)
        rel_dist_all = np.concatenate(rel_dist_all)
        speed_all = np.concatenate(speed_all)      
        lap_numbers = np.concatenate(lap_numbers)

        order = np.argsort(t_all)
        t_all = t_all[order]
        x_all = x_all[order]
        y_all = y_all[order]
        race_dist_all = race_dist_all[order]
        rel_dist_all = rel_dist_all[order]
        speed_all = speed_all[order]                 
        lap_numbers = lap_numbers[order]

        driver_data[code] = {
            "t": t_all,
            "x": x_all,
            "y": y_all,
            "dist": race_dist_all,
            "rel_dist": rel_dist_all,
            "speed": speed_all,                      
            "lap": lap_numbers,
        }

        t_min = t_all.min()
        t_max = t_all.max()
        global_t_min = t_min if global_t_min is None else min(global_t_min, t_min)
        global_t_max = t_max if global_t_max is None else max(global_t_max, t_max)

    # 3. Create a timeline (as you already do)
    timeline = np.arange(global_t_min, global_t_max, DT)

    # 4. Resample each driver's telemetry (x, y, gap) onto the common timeline
    resampled_data = {}

    for code, data in driver_data.items():
        t = data["t"]
        x = data["x"]
        y = data["y"]
        dist = data["dist"]     
        rel_dist = data["rel_dist"]
        speed = data["speed"]    

        # ensure sorted by time
        order = np.argsort(t)
        t_sorted = t[order]
        x_sorted = x[order]
        y_sorted = y[order]
        dist_sorted = dist[order]
        rel_dist_sorted = rel_dist[order]
        speed_sorted = speed[order]                 
        lap_sorted = data["lap"][order]

        x_resampled = np.interp(timeline, t_sorted, x_sorted)
        y_resampled = np.interp(timeline, t_sorted, y_sorted)
        dist_resampled = np.interp(timeline, t_sorted, dist_sorted)
        rel_dist_resampled = np.interp(timeline, t_sorted, rel_dist_sorted)
        speed_resampled = np.interp(timeline, t_sorted, speed_sorted)  
        lap_resampled = np.interp(timeline, t_sorted, lap_sorted)

        resampled_data[code] = {
            "t": timeline,
            "x": x_resampled,
            "y": y_resampled,
            "dist": dist_resampled,   # race distance (metres since Lap 1 start)
            "rel_dist": rel_dist_resampled,
            "speed": speed_resampled,
            "lap": lap_resampled,
        }

    # 5. Build the frames + LIVE LEADERBOARD
    frames = []

    for i, t in enumerate(timeline):
        snapshot = []
        for code, d in resampled_data.items():
          snapshot.append({
            "code": code,
            "dist": float(d["dist"][i]),
            "speed": float(d["speed"][i]),
            "x": float(d["x"][i]),
            "y": float(d["y"][i]),
            "lap": int(round(d["lap"][i])),
            "rel_dist": float(d["rel_dist"][i]),
          })

        # If for some reason we have no drivers at this instant
        if not snapshot:
            continue

        # 5b. Sort by race distance to get POSITIONS (1–20)
        # Leader = largest race distance covered
        snapshot.sort(key=lambda r: r["dist"], reverse=True)

        leader = snapshot[0]
        leader_lap = leader["lap"]

        # 5c. Compute gap to car in front in SECONDS
        # Approx: gap_time = distance_gap / speed (using trailing car's speed)
        frame_data = {}

        for idx, car in enumerate(snapshot):
            code = car["code"]
            position = idx + 1

            # Round distance to nearest 0.5 metre
            rounded_dist = round(car["dist"] * 2) / 2

            if idx == 0:
                gap_to_front = 0.0
                gap_to_leader = 0.0
            else:
                front = snapshot[idx - 1]
                dist_gap = front["dist"] - car["dist"]  # metres to car ahead

                v_mps = max(car["speed"] / 3.6, 1.0)
                gap_to_front = dist_gap / v_mps
                leader_dist_gap = leader["dist"] - car["dist"]
                gap_to_leader = leader_dist_gap / v_mps

            frame_data[code] = {
                "x": car["x"],
                "y": car["y"],
                "dist": rounded_dist,     
                "lap": car["lap"],
                "rel_dist": round(car["rel_dist"], 6),
                "speed": car["speed"],
                "position": position,
                "gap_to_front": gap_to_front,
                "gap_to_leader": gap_to_leader,
            }

        frames.append({
            "t": float(t),
            "lap": leader_lap,   # leader’s lap at this time
            "drivers": frame_data,
        })

    # If computed_data/ directory doesn't exist, create it
    if not os.path.exists("computed_data"):
        os.makedirs("computed_data")

    # Save to file
    with open(f"computed_data/{session.event['EventName'].replace(' ', '_')}_race_telemetry.json", "w") as f:
        json.dump(frames, f, indent=2)

    return frames
