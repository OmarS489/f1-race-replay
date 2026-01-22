import { useState, useEffect, useCallback } from 'react';
import type { F1Event } from '../types';

const API_BASE = '/api';

export function useYears() {
  const [years, setYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/years`)
      .then((res) => res.json())
      .then((data) => {
        setYears(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { years, loading, error };
}

export function useEvents(year: number | null) {
  const [events, setEvents] = useState<F1Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!year) {
      setEvents([]);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/years/${year}/events`)
      .then((res) => res.json())
      .then((data) => {
        setEvents(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [year]);

  return { events, loading, error };
}

export function useSessions(year: number | null, roundNumber: number | null) {
  const [sessions, setSessions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!year || !roundNumber) {
      setSessions([]);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/years/${year}/rounds/${roundNumber}/sessions`)
      .then((res) => res.json())
      .then((data) => {
        setSessions(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [year, roundNumber]);

  return { sessions, loading, error };
}

export function useSessionMetadata(year: number, round: number, session: string) {
  const [metadata, setMetadata] = useState<import('../types').SessionMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/years/${year}/rounds/${round}/sessions/${session}/metadata`)
      .then((res) => res.json())
      .then((data) => {
        setMetadata(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [year, round, session]);

  return { metadata, loading, error };
}

export function useTrackData(year: number, round: number, session: string) {
  const [trackData, setTrackData] = useState<import('../types').TrackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/years/${year}/rounds/${round}/sessions/${session}/track`)
      .then((res) => res.json())
      .then((data) => {
        setTrackData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [year, round, session]);

  return { trackData, loading, error };
}

export function useRaceFrames(year: number, round: number, session: string) {
  const [raceData, setRaceData] = useState<import('../types').RaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/years/${year}/rounds/${round}/sessions/${session}/frames`)
      .then((res) => res.json())
      .then((data) => {
        setRaceData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [year, round, session]);

  return { raceData, loading, error };
}

export function useQualifyingResults(year: number, round: number, session: string) {
  const [results, setResults] = useState<import('../types').QualifyingResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/years/${year}/rounds/${round}/sessions/${session}/qualifying/results`)
      .then((res) => res.json())
      .then((data) => {
        setResults(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [year, round, session]);

  return { results, loading, error };
}

export function useQualifyingTelemetry() {
  const [telemetry, setTelemetry] = useState<import('../types').QualifyingTelemetry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTelemetry = useCallback(async (
    year: number,
    round: number,
    session: string,
    driver: string,
    segment: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${API_BASE}/years/${year}/rounds/${round}/sessions/${session}/qualifying/${driver}/${segment}`
      );
      const data = await res.json();
      setTelemetry(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  return { telemetry, loading, error, fetchTelemetry };
}
