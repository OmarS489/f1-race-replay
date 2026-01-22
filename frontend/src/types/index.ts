// F1 Event/Race types
export interface F1Event {
  round_number: number;
  event_name: string;
  date: string;
  country: string;
  type: string;
}

export interface SessionMetadata {
  event_name: string;
  circuit_name: string;
  country: string;
  date: string;
  drivers: string[];
  driver_colors: Record<string, string>;
  circuit_rotation: number;
  total_laps: number | null;
}

export interface TrackBounds {
  x_min: number;
  x_max: number;
  y_min: number;
  y_max: number;
}

export interface TrackData {
  inner_points: [number, number][];
  outer_points: [number, number][];
  drs_zones: { start_index: number; end_index: number }[];
  bounds: TrackBounds;
}

// Frame data for race playback
export interface DriverFrameData {
  x: number;
  y: number;
  dist: number;
  lap: number;
  rel_dist: number;
  tyre: number;
  position: number;
  speed: number;
  gear: number;
  drs: number;
  throttle: number;
  brake: number;
  // New fields for timing tower
  tyre_age: number;
  in_pit: boolean;
  gap_to_leader: number | null;
  gap_to_leader_dist: number | null;
  interval: number | null;
  interval_dist: number | null;
  laps_behind: number | null;
}

export interface WeatherData {
  track_temp: number | null;
  air_temp: number | null;
  humidity: number | null;
  wind_speed: number | null;
  wind_direction: number | null;
  rain_state: string;
}

export interface RaceFrame {
  t: number;
  lap: number;
  drivers: Record<string, DriverFrameData>;
  weather?: WeatherData;
}

export interface TrackStatus {
  status: string;
  start_time: number;
  end_time: number | null;
}

// Pit stop data
export interface PitStop {
  driver: string;
  lap: number;
  duration: number;
  compound_from: number;
  compound_to: number;
  pit_in_time: number;
}

// Tyre stint data
export interface TyreStint {
  compound: number;
  compound_name: string;
  start_lap: number;
  end_lap: number;
}

// Sector times per lap
export interface SectorTimes {
  s1: number | null;
  s2: number | null;
  s3: number | null;
}

export interface RaceData {
  frames: RaceFrame[];
  driver_colors: Record<string, string>;
  track_statuses: TrackStatus[];
  total_laps: number;
  total_frames: number;
  // New metadata
  pit_stops: PitStop[];
  lap_times: Record<string, Record<number, number>>;
  sector_times: Record<string, Record<number, SectorTimes>>;
  tyre_stints: Record<string, TyreStint[]>;
}

// Qualifying types
export interface QualifyingResult {
  code: string;
  full_name: string;
  position: number;
  color: string;
  Q1: string | null;
  Q2: string | null;
  Q3: string | null;
}

export interface TelemetryFrame {
  t: number;
  telemetry: {
    x: number;
    y: number;
    dist: number;
    rel_dist: number;
    speed: number;
    gear: number;
    throttle: number;
    brake: number;
    drs: number;
  };
  weather?: WeatherData;
}

export interface QualifyingTelemetry {
  frames: TelemetryFrame[];
  drs_zones: { zone_start: number; zone_end: number }[];
  max_speed: number;
  min_speed: number;
  sector_times: {
    sector1: number | null;
    sector2: number | null;
    sector3: number | null;
  };
  compound: number;
}
