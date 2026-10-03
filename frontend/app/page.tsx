"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Compass,
  MapPin,
  Video,
  LogOut,
  User as UserIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// --- Types ---
export type SpotCategory =
  | "All"
  | "City"
  | "Hike"
  | "Summit"
  | "Viewpoint"
  | "Beach"
  | "Food"
  | "Culture"
  | "Camp"
  | "Other";

export interface BaseSpot {
  id?: string;
  name: string;
  category: SpotCategory;
  commentary?: string | null;
  source_link?: string | null;
  country?: string | null;
  region?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  created_at?: string | null;
  [key: string]: any;
}
const API_BASE = "https://travel-discovery-agent-513892807779.europe-west1.run.app";
// const API_BASE = "http://localhost:8000";

// --- Map Styling by Category ---
const CATEGORY_STYLES: Record<string, { bg: string; border: string; svg: string }> = {
  Hike: {
    bg: "#10b981", // emerald
    border: "#059669",
    svg: `<path d="m8 3 4 8 5-5 5 15H2L8 3z" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round"/>`,
  },
  Summit: {
    bg: "#0ea5e9", // sky
    border: "#0284c7",
    svg: `<path d="m12 3-9 16h18L12 3z" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round"/><circle cx="12" cy="11" r="1.5" fill="currentColor"/>`,
  },
  Beach: {
    bg: "#06b6d4", // cyan
    border: "#0891b2",
    svg: `<circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2" fill="none"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2" stroke="currentColor" stroke-width="2"/>`,
  },
  Food: {
    bg: "#f59e0b", // amber
    border: "#d97706",
    svg: `<path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2M15 2v14M6 2v20M3 2v4a3 3 0 0 0 3 3h0a3 3 0 0 0 3-3V2" stroke="currentColor" stroke-width="2" fill="none"/>`,
  },
  Camp: {
    bg: "#84cc16", // lime
    border: "#65a30d",
    svg: `<path d="M19 20 10 4M5 20l9-16M3 20h18M12 15l-3 5M12 15l3 5" stroke="currentColor" stroke-width="2" fill="none"/>`,
  },
  City: {
    bg: "#8b5cf6", // violet
    border: "#7c3aed",
    svg: `<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18ZM6 12H4a2 2 0 0 0-2 2v8h4M18 9h2a2 2 0 0 1 2 2v11h-4" stroke="currentColor" stroke-width="2" fill="none"/>`,
  },
};

const DEFAULT_STYLE = {
  bg: "#64748b",
  border: "#475569",
  svg: `<circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="2" fill="currentColor"/>`,
};

export default function TravelDashboard() {
  const [token, setToken] = useState<string | null>(null);
  const [spots, setSpots] = useState<BaseSpot[]>([]);
  const [loadingSpots, setLoadingSpots] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SpotCategory>("All");
  const [hoveredSpotId, setHoveredSpotId] = useState<string | null>(null);

  // Auth Dialog
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  // Video Extraction / SSE
  const [videoUrl, setVideoUrl] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [streamLogs, setStreamLogs] = useState<string[]>([]);
  const [showStreamPanel, setShowStreamPanel] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem("access_token");
    if (savedToken) setToken(savedToken);
  }, []);

  useEffect(() => {
    if (token) fetchSpots();
  }, [token]);

  const fetchSpots = async () => {
    if (!token) return;
    setLoadingSpots(true);
    try {
      const res = await fetch(`${API_BASE}/spots?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSpots(data);
      }
    } catch (err) {
      console.error("Failed to fetch spots:", err);
    } finally {
      setLoadingSpots(false);
    }
  };

  // Instant Client-Side Category Filtering
  const filteredSpots = spots.filter((spot) => {
    if (selectedCategory === "All") return true;
    return spot.category?.toLowerCase() === selectedCategory.toLowerCase();
  });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    try {
      if (authMode === "login") {
        const formData = new URLSearchParams();
        formData.append("username", authUsername);
        formData.append("password", authPassword);

        const res = await fetch(`${API_BASE}/token`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: formData.toString(),
        });

        if (!res.ok) throw new Error("Invalid username or password");
        const data = await res.json();
        setToken(data.access_token);
        localStorage.setItem("access_token", data.access_token);
        setIsAuthOpen(false);
      } else {
        const res = await fetch(`${API_BASE}/sign-up`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: authUsername, password: authPassword }),
        });

        if (!res.ok) throw new Error("Username already taken");
        setAuthMode("login");
        setAuthError("Account created! Please sign in.");
      }
    } catch (err: any) {
      setAuthError(err.message || "Authentication error occurred");
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem("access_token");
    setSpots([]);
  };

  const handleExtractVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl) return;

    if (!token) {
      setIsAuthOpen(true);
      setAuthError("Please sign in before extracting spots.");
      return;
    }

    setIsExtracting(true);
    setShowStreamPanel(true);
    setStreamLogs(["Connecting to extraction agent..."]);

    try {
      const response = await fetch(`${API_BASE}/save-video`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: videoUrl }),
      });

      if (!response.body) throw new Error("Empty response stream");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const message = line.replace("data: ", "").trim();
            if (message) setStreamLogs((prev) => [...prev, message]);
          }
        }
      }
      fetchSpots();
      setVideoUrl("");
    } catch (err: any) {
      setStreamLogs((prev) => [...prev, `Error: ${err.message}`]);
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        crossOrigin=""
      />

      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-40 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Compass className="h-6 w-6 text-emerald-400" />
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
              TravelAgent
            </span>
          </div>

          {/* URL Input Form */}
          <form onSubmit={handleExtractVideo} className="flex-1 max-w-xl w-full flex gap-2">
            <div className="relative flex-1">
              <Video className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="url"
                placeholder="Paste YouTube or Instagram URL..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                disabled={isExtracting}
                className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={isExtracting || !videoUrl}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 font-medium text-sm rounded-lg flex items-center gap-2 transition cursor-pointer"
            >
              {isExtracting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Extract"}
            </button>
          </form>

          {/* User Sign In / Out */}
          <div className="flex items-center gap-3">
            {token ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-slate-300 transition cursor-pointer"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="flex items-center gap-2 text-sm bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg font-medium text-white transition cursor-pointer"
              >
                <UserIcon className="h-4 w-4" /> Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* SSE Progress Notification */}
      {showStreamPanel && (
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-3 transition">
          <div className="max-w-7xl mx-auto flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                {isExtracting ? (
                  <Loader2 className="h-4 w-4 text-emerald-400 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                )}
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {isExtracting ? "Real-time Agent Processing" : "Extraction Completed"}
                </span>
              </div>
              <div className="max-h-24 overflow-y-auto space-y-1 text-xs font-mono text-slate-300">
                {streamLogs.map((log, idx) => (
                  <div key={idx} className="flex gap-2">
                    <span className="text-slate-600">›</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            </div>
            {!isExtracting && (
              <button
                onClick={() => setShowStreamPanel(false)}
                className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      )}

      {/* Category Filters */}
      <div className="border-b border-slate-800/80 bg-slate-900/30 px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar">
          {(["All", "Hike", "Summit", "Beach", "Food", "City", "Camp"] as SpotCategory[]).map(
            (cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-emerald-500 text-slate-950 font-semibold shadow-sm"
                    : "bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                {cat}
              </button>
            )
          )}
        </div>
      </div>

      {/* Layout Columns */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Spot Cards */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {!token ? (
            <div className="border border-dashed border-slate-800 rounded-xl p-12 text-center text-slate-500">
              <UserIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Sign in to view and save extracted travel spots.</p>
            </div>
          ) : loadingSpots ? (
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-44 rounded-xl bg-slate-900 animate-pulse border border-slate-800"
                />
              ))}
            </div>
          ) : filteredSpots.length === 0 ? (
            <div className="border border-dashed border-slate-800 rounded-xl p-12 text-center text-slate-500">
              <Compass className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No spots found in this category. Submit a video URL to discover spots!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredSpots.map((spot, index) => (
                <SpotCard
                  key={spot.id || index}
                  spot={spot}
                  isHovered={hoveredSpotId === (spot.id || spot.name)}
                  onMouseEnter={() => setHoveredSpotId(spot.id || spot.name)}
                  onMouseLeave={() => setHoveredSpotId(null)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Leaflet Map */}
        <div className="lg:col-span-5 relative">
          <div className="sticky top-24 h-[calc(100vh-8rem)] rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden flex flex-col">
            <div className="p-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-emerald-400" /> OpenStreetMap View
              </span>
              <span>
                {filteredSpots.filter((s) => s.latitude && s.longitude).length} mapped locations
              </span>
            </div>

            <LeafletMap spots={filteredSpots} hoveredSpotId={hoveredSpotId} />
          </div>
        </div>
      </main>

      {/* Auth Modal */}
      {isAuthOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold mb-1 text-slate-100">
              {authMode === "login" ? "Account Sign In" : "Create New Account"}
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Enter your credentials to access saved locations.
            </p>

            {authError && (
              <div className="mb-4 p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 font-medium text-sm rounded-lg text-white transition mt-2 cursor-pointer"
              >
                {authMode === "login" ? "Sign In" : "Sign Up"}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
              {authMode === "login" ? (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    onClick={() => {
                      setAuthMode("register");
                      setAuthError(null);
                    }}
                    className="text-emerald-400 hover:underline cursor-pointer"
                  >
                    Register
                  </button>
                </>
              ) : (
                <>
                  Already registered?{" "}
                  <button
                    onClick={() => {
                      setAuthMode("login");
                      setAuthError(null);
                    }}
                    className="text-emerald-400 hover:underline cursor-pointer"
                  >
                    Sign In
                  </button>
                </>
              )}
              <div className="mt-2">
                <button
                  onClick={() => setIsAuthOpen(false)}
                  className="text-slate-500 hover:text-slate-400 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Dynamic Leaflet Map with Category Pins ---
function LeafletMap({
  spots,
  hoveredSpotId,
}: {
  spots: BaseSpot[];
  hoveredSpotId: string | null;
}) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainer.current || mapInstance.current) return;
      const L = (await import("leaflet")).default;

      if (!isMounted) return;

      const map = L.map(mapContainer.current, {
        zoomControl: true,
      }).setView([46.5, 10.5], 8);

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
          maxZoom: 19,
        }
      ).addTo(map);

      mapInstance.current = map;
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current) return;

    import("leaflet").then((LModule) => {
      const L = LModule.default;
      const map = mapInstance.current;

      Object.values(markersRef.current).forEach((m) => m.remove());
      markersRef.current = {};

      const validSpots = spots.filter((s) => s.latitude && s.longitude);
      if (validSpots.length === 0) return;

      const bounds = L.latLngBounds([]);

      validSpots.forEach((spot) => {
        const spotId = spot.id || spot.name;
        const isHovered = hoveredSpotId === spotId;
        const cfg = CATEGORY_STYLES[spot.category] || DEFAULT_STYLE;

        const size = isHovered ? 36 : 30;
        const boxShadow = isHovered
          ? "0 4px 10px rgba(0, 0, 0, 0.6)"
          : "0 4px 10px rgba(0, 0, 0, 0.3)";

        const icon = L.divIcon({
          className: "category-leaflet-pin",
          html: `
            <div style="
              width: ${size}px;
              height: ${size}px;
              background-color: ${cfg.bg};
              border: 2px solid ${isHovered ? "#ffffff" : cfg.border};
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              box-shadow: ${boxShadow};
              transform: ${isHovered ? "scale(1.15)" : "scale(1)"};
              transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            ">
              <svg width="${size * 0.55}" height="${size * 0.55}" viewBox="0 0 24 24">
                ${cfg.svg}
              </svg>
            </div>
          `,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });

        const popupContent = `
          <div style="color: #0f172a; font-family: sans-serif; min-width: 140px;">
            <div style="font-weight: 700; font-size: 13px; margin-bottom: 2px;">${spot.name}</div>
            <div style="display: inline-block; font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; background: ${cfg.bg}; color: #fff;">
              ${spot.category}
            </div>
          </div>
        `;

        const marker = L.marker([spot.latitude!, spot.longitude!], { icon })
          .addTo(map)
          .bindPopup(popupContent);

        bounds.extend([spot.latitude!, spot.longitude!]);
        markersRef.current[spotId] = marker;
      });

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
      }
    });
  }, [spots, hoveredSpotId]);

  return <div ref={mapContainer} className="flex-1 w-full h-full" />;
}

// --- Polymorphic Spot Card Component ---
function SpotCard({
  spot,
  isHovered,
  onMouseEnter,
  onMouseLeave,
}: {
  spot: BaseSpot;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const [showCheckpoints, setShowCheckpoints] = useState(false);

  const getBadgeStyle = (category: string) => {
    switch (category) {
      case "Hike":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "Summit":
        return "bg-sky-500/10 text-sky-400 border-sky-500/20";
      case "Beach":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "Food":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "Camp":
        return "bg-lime-500/10 text-lime-400 border-lime-500/20";
      case "City":
        return "bg-violet-500/10 text-violet-400 border-violet-500/20";
      default:
        return "bg-slate-700/30 text-slate-400 border-slate-700/50";
    }
  };

  const copyCoords = () => {
    if (spot.latitude && spot.longitude) {
      navigator.clipboard.writeText(`${spot.latitude}, ${spot.longitude}`);
    }
  };

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`border rounded-xl p-4 bg-slate-900/40 transition duration-200 flex flex-col gap-3 ${
        isHovered
          ? "border-emerald-500/50 bg-slate-800/40 shadow-lg shadow-emerald-950/20"
          : "border-slate-800/80 hover:border-slate-700"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getBadgeStyle(
                spot.category
              )}`}
            >
              {spot.category}
            </span>
            {(spot.region || spot.country) && (
              <span className="text-xs text-slate-400">
                {[spot.region, spot.country].filter(Boolean).join(", ")}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-slate-100 text-base">{spot.name}</h3>
        </div>

        {spot.latitude && spot.longitude && (
          <button
            onClick={copyCoords}
            title="Copy coordinates"
            className="text-slate-500 hover:text-slate-300 p-1.5 rounded hover:bg-slate-800 transition cursor-pointer"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {spot.commentary && (
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{spot.commentary}</p>
      )}

      {/* Dynamic Category Metrics */}
      <div className="pt-2 border-t border-slate-800/60 flex flex-wrap gap-2 text-[11px]">
        {spot.category === "Hike" && (
          <>
            {spot.total_elevation_meters && (
              <span className="px-2 py-1 bg-slate-800 rounded text-emerald-400 font-mono">
                ↗ {spot.total_elevation_meters} m
              </span>
            )}
            {spot.length_km && (
              <span className="px-2 py-1 bg-slate-800 rounded text-slate-300 font-mono">
                {spot.length_km} km
              </span>
            )}
            {spot.difficulty && (
              <span className="px-2 py-1 bg-slate-800 rounded text-slate-300 font-medium">
                {spot.difficulty}
              </span>
            )}
          </>
        )}

        {spot.category === "Summit" && spot.altitude_meters && (
          <span className="px-2 py-1 bg-slate-800 rounded text-sky-400 font-mono">
            ▲ {spot.altitude_meters} m ASL
          </span>
        )}

        {spot.category === "Beach" && (
          <>
            {spot.surface && (
              <span className="px-2 py-1 bg-slate-800 rounded text-cyan-300">{spot.surface}</span>
            )}
            {spot.length_meters && (
              <span className="px-2 py-1 bg-slate-800 rounded text-slate-300 font-mono">
                {spot.length_meters} m
              </span>
            )}
          </>
        )}

        {spot.category === "Food" && (
          <>
            {spot.food_type && (
              <span className="px-2 py-1 bg-slate-800 rounded text-amber-300">{spot.food_type}</span>
            )}
            {spot.speciality && Array.isArray(spot.speciality) && (
              <span className="px-2 py-1 bg-amber-500/10 text-amber-300 rounded">
                {spot.speciality.join(", ")}
              </span>
            )}
          </>
        )}
      </div>

      {/* Waypoints for Hike */}
      {spot.checkpoints && Array.isArray(spot.checkpoints) && spot.checkpoints.length > 0 && (
        <div className="text-[11px] pt-1">
          <button
            onClick={() => setShowCheckpoints(!showCheckpoints)}
            className="text-slate-500 hover:text-slate-300 flex items-center gap-1 cursor-pointer"
          >
            {showCheckpoints ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            Waypoints ({spot.checkpoints.length})
          </button>
          {showCheckpoints && (
            <div className="mt-1 pl-2 border-l border-slate-800 flex flex-wrap gap-1.5">
              {spot.checkpoints.map((cp: string, i: number) => (
                <span key={i} className="text-slate-400 bg-slate-800/50 px-1.5 py-0.5 rounded">
                  {cp}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}