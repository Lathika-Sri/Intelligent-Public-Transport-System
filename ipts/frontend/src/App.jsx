import React, { useState, useEffect, useCallback, useRef } from 'react';
import LocationSearch from './components/LocationSearch';
import Dashboard from './components/Dashboard';
import './App.css';

const API = 'https://intelligent-public-transport-system-3.onrender.com';

export default function App() {
  const [journey,     setJourney]     = useState(null);
  const [buses,       setBuses]       = useState([]);
  const [routes,      setRoutes]      = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [etaData,     setEtaData]     = useState(null);
  const [crowdData,   setCrowdData]   = useState(null);
  const [advice,      setAdvice]      = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [offline,     setOffline]     = useState(false);
  const [activeRoute, setActiveRoute] = useState('ALL');
  const pollRef = useRef(null);

  // ── fetch all buses every 3s ─────────────────────────────────────────────
  const fetchBuses = useCallback(async () => {
    try {
      const r = await fetch(`${API}/buses`);
      const d = await r.json();
      setBuses(d.buses || []);
      setOffline(false);
    } catch {
      setOffline(true);
    }
  }, []);

  const fetchRoutes = useCallback(async () => {
    try {
      const r = await fetch(`${API}/routes`);
      const d = await r.json();
      setRoutes(d.routes || []);
    } catch {}
  }, []);

  const selectBus = useCallback(async (busId) => {
    setSelectedBus(busId);
    try {
      const [etaRes, crowdRes] = await Promise.all([
        fetch(`${API}/eta?busId=${busId}`).then(r => r.json()),
        fetch(`${API}/crowd?busId=${busId}`).then(r => r.json()),
      ]);
      setEtaData(etaRes);
      setCrowdData(crowdRes);
    } catch {}
  }, []);

  const fetchAdvice = useCallback(async (from, to) => {
    try {
      const r = await fetch(
        `${API}/smart-advice?fromStop=${encodeURIComponent(from)}&toStop=${encodeURIComponent(to)}`
      );
      setAdvice(await r.json());
    } catch {}
  }, []);

  // ── start polling after journey set ─────────────────────────────────────
  useEffect(() => {
    if (!journey) return;
    setLoading(true);
    Promise.all([fetchBuses(), fetchRoutes()]).then(() => {
      setLoading(false);
      fetchAdvice(journey.fromLabel, journey.toLabel);
    });
    clearInterval(pollRef.current);
    pollRef.current = setInterval(fetchBuses, 3000);
    return () => clearInterval(pollRef.current);
  }, [journey]);

  // ── refresh ETA/crowd for selected bus every 3s ──────────────────────────
  useEffect(() => {
    if (!selectedBus) return;
    const iv = setInterval(() => selectBus(selectedBus), 3000);
    return () => clearInterval(iv);
  }, [selectedBus]);

  const resetJourney = () => {
    clearInterval(pollRef.current);
    setJourney(null); setSelectedBus(null);
    setEtaData(null); setCrowdData(null);
    setAdvice(null);  setBuses([]);
  };

  if (!journey) {
    return <LocationSearch onStart={setJourney} />;
  }

  return (
    <Dashboard
      journey={journey}
      buses={buses}
      routes={routes}
      selectedBus={selectedBus}
      etaData={etaData}
      crowdData={crowdData}
      advice={advice}
      loading={loading}
      offline={offline}
      activeRoute={activeRoute}
      onRouteChange={setActiveRoute}
      onBusSelect={selectBus}
      onAdvice={fetchAdvice}
      onChangeJourney={resetJourney}
    />
  );
}
