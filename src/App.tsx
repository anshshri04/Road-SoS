import React, { useState, useEffect, useCallback } from "react";
import { 
  ShieldAlert, ShieldCheck, Phone, AlertTriangle, MapPin, Navigation, 
  Flame, BatteryWarning, Star, Server, CheckCircle2, XCircle, UserCheck, 
  Mic, User, PlusCircle, RefreshCw, HelpCircle, TrafficCone, Gauge, 
  Check, Play, Bell, Radio, Plus, Layers, Car, Heart, ChevronRight, CornerDownRight, 
  ThumbsUp, LogOut, Key, Monitor, Smartphone, Layout, Trash2, ShieldAlert as AlertIcon, Eye, Map, Wifi, Lock
} from "lucide-react";

import InteractiveMap from "./components/InteractiveMap";
import { Pothole, SOSAlert, Driver, Booking, Carpool, TrafficAlert, User as UserType, DeviceSession } from "./types";

function getCityCoords(city: string): { lat: number; lng: number } {
  const c = city.toLowerCase();
  if (c.includes("bhopal")) return { lat: 23.2599, lng: 77.4126 };
  if (c.includes("lucknow")) return { lat: 26.8467, lng: 80.9462 };
  if (c.includes("delhi") || c.includes("noida") || c.includes("ncr") || c.includes("gurgaon")) return { lat: 28.5355, lng: 77.3910 };
  if (c.includes("mumbai") || c.includes("bombay")) return { lat: 19.0760, lng: 72.8777 };
  if (c.includes("bengaluru") || c.includes("bangalore")) return { lat: 12.9716, lng: 77.5946 };
  if (c.includes("pune")) return { lat: 18.5204, lng: 73.8567 };
  if (c.includes("jaipur")) return { lat: 26.9124, lng: 75.7873 };
  if (c.includes("hyderabad")) return { lat: 17.3850, lng: 78.4867 };
  if (c.includes("chennai")) return { lat: 13.0827, lng: 80.2707 };
  return { lat: 23.2599, lng: 77.4126 }; // Default Bhopal center
}

export default function App() {
  // Main Authentication state
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(localStorage.getItem("road_sos_session"));
  const [isBlocked, setIsBlocked] = useState<boolean>(false);

  // Authentication Forms State
  const [isLoginTab, setIsLoginTab] = useState<boolean>(true);
  const [authEmail, setAuthEmail] = useState<string>("");
  const [authPassword, setAuthPassword] = useState<string>("");
  const [authName, setAuthName] = useState<string>("");
  const [authCity, setAuthCity] = useState<string>("Bhopal");
  const [customCity, setCustomCity] = useState<string>("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Global State parsed from DB
  const [potholes, setPotholes] = useState<Pothole[]>([]);
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [carpools, setCarpools] = useState<Carpool[]>([]);
  const [deviceSessions, setDeviceSessions] = useState<DeviceSession[]>([]);
  const [blacklistedEmails, setBlacklistedEmails] = useState<string[]>([]);
  const [blacklistedIPs, setBlacklistedIPs] = useState<string[]>([]);
  const [systemHalted, setSystemHalted] = useState<boolean>(false);
  const [newBannedEmail, setNewBannedEmail] = useState<string>("");
  const [newBannedIP, setNewBannedIP] = useState<string>("");
  const [gpsAccuracy, setGpsAccuracy] = useState<string>("99.8% GLONASS System Lock");
  const [loading, setLoading] = useState<boolean>(true);

  // Geography Display State
  const [userLat, setUserLat] = useState<number>(23.2599);
  const [userLng, setUserLng] = useState<number>(77.4126);
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>("Local"); // "Local" | "All India"

  // Client Navigation / Simulation Helper State
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [activeSearchType, setActiveSearchType] = useState<"Hospital" | "Petrol Pump" | "Service Station" | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<string[]>([
    "Welcome to Road SOS Companion Terminal.",
    "Dual-Band satellite sensors calibrated for safety."
  ]);

  // SOS Creation panel state
  const [sosType, setSosType] = useState<string>("Towing Breakdown Assist");
  const [sosVehicleInput, setSosVehicleInput] = useState<string>("Honda Hatchback (UP-32-AA-9999)");
  const [sosPhoneInput, setSosPhoneInput] = useState<string>("+91 98390 11223");
  const [sosMessageInput, setSosMessageInput] = useState<string>("Engine failure on bypass road. Need towing immediately.");
  const [sosSeverityInput, setSosSeverityInput] = useState<"High" | "Critical">("Critical");

  // Fuel & Reminders emulator
  const [fuelLevel, setFuelLevel] = useState<number>(78);
  const [maintenanceReminder, setMaintenanceReminder] = useState<string>("Scheduled Suspension Check due in 450 km.");

  // Manual Pothole Plotting details
  const [potholeLat, setPotholeLat] = useState<number | null>(null);
  const [potholeLng, setPotholeLng] = useState<number | null>(null);
  const [potholeTitle, setPotholeTitle] = useState<string>("Severe Road Crack & Crater");
  const [potholeSeverity, setPotholeSeverity] = useState<"Low" | "Medium" | "High" | "Critical">("High");

  // AI Voice Control state
  const [voiceQuery, setVoiceQuery] = useState<string>("");
  const [voiceTranscript, setVoiceTranscript] = useState<string>("");
  const [voiceStatus, setVoiceStatus] = useState<"idle" | "listening" | "processing">("idle");
  const [voiceAssistantFeedback, setVoiceAssistantFeedback] = useState<string>('Press Mic or type an emergency command like "Need immediate police help" or "Find nearby hospital" below.');

  // Tow Driver recruit form states
  const [recruitName, setRecruitName] = useState<string>("");
  const [recruitPhone, setRecruitPhone] = useState<string>("");
  const [recruitService, setRecruitService] = useState<string>("Heavy Crane Recovery & Lift");
  const [recruitVehicle, setRecruitVehicle] = useState<string>("");

  // Offer Carpool states
  const [offerRoute, setOfferRoute] = useState<string>("");
  const [offerSeats, setOfferSeats] = useState<number>(3);
  const [offerTime, setOfferTime] = useState<string>("");
  const [offerFare, setOfferFare] = useState<string>("₹120/seat");
  const [offerVehicle, setOfferVehicle] = useState<string>("");

  // Feedback rating states
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackText, setFeedbackText] = useState<string>("");
  const [ratedBookings, setRatedBookings] = useState<Record<string, { rating: number, text: string }>>({});

  // Push console messages helper
  const addNotification = useCallback((text: string) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setNotifications(prev => [`[${timeStr}] ${text}`, ...prev.slice(0, 10)]);
  }, []);

  // Fetch state and validate session security clearance
  const refreshState = async () => {
    try {
      // 1. Verify session with dynamic lock/blocking status
      if (sessionId) {
        const checkRes = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId })
        });
        const checkData = await checkRes.json();
        
        if (checkData.blocked) {
          setIsBlocked(true);
          return;
        } else if (!checkData.success) {
          // Session expired or invalid
          handleLogout();
          return;
        } else {
          setIsBlocked(false);
          setCurrentUser(checkData.user);
        }
      }

      // 2. Load latest real-time databases
      const response = await fetch("/api/state");
      const data = await response.json();
      setPotholes(data.potholes || []);
      setAlerts(data.alerts || []);
      setDrivers(data.drivers || []);
      setBookings(data.bookings || []);
      setCarpools(data.carpools || []);
      setGpsAccuracy(data.gpsAccuracy || "99.8%");

      // 3. For Admins, load device session logs, system lock, and blacklists
      if (currentUser?.isAdmin) {
        const sesRes = await fetch("/api/admin/sessions");
        const sesData = await sesRes.json();
        if (sesData.success) {
          setDeviceSessions(sesData.sessions || []);
        }

        const secRes = await fetch("/api/admin/security");
        const secData = await secRes.json();
        if (secData.success) {
          setBlacklistedEmails(secData.blacklistedEmails || []);
          setBlacklistedIPs(secData.blacklistedIPs || []);
          setSystemHalted(secData.systemHalted || false);
        }
      }

    } catch (e) {
      console.error("Error syncing with Road SOS Server:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshState();
    
    // Quick real-time polling to verify security blocks and coordinate changes
    const interval = setInterval(() => {
      refreshState();
    }, 4500);
    return () => clearInterval(interval);
  }, [sessionId, currentUser?.id]);

  // Setup user home coordinates once logged in
  useEffect(() => {
    if (currentUser) {
      const coords = getCityCoords(currentUser.city);
      setUserLat(coords.lat);
      setUserLng(coords.lng);
      addNotification(`Dashboard centered on your registered city: ${currentUser.city}.`);
    }
  }, [currentUser]);

  // Authentication login handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    if (!authEmail || !authPassword) {
      setAuthError("Email and Password are required credentials");
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem("road_sos_session", data.sessionId);
        setSessionId(data.sessionId);
        setCurrentUser(data.user);
        setAuthSuccess("Secured Access Authorization level granted!");
        // Clear inputs
        setAuthEmail("");
        setAuthPassword("");
      } else {
        setAuthError(data.error || "Access Denied. Check credentials.");
      }
    } catch (err) {
      setAuthError("Failed to communicate with authorization server.");
    }
  };

  // User signing up
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    const finalCity = authCity === "Custom" ? customCity : authCity;

    if (!authName || !authEmail || !authPassword || !finalCity) {
      setAuthError("All registration fields are required");
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: authName,
          email: authEmail,
          password: authPassword,
          city: finalCity
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAuthSuccess("Account registered! Proceeding to log in with your credentials.");
        // Auto sign him in
        const loginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: authEmail, password: authPassword })
        });
        const loginData = await loginRes.json();
        if (loginRes.ok && loginData.success) {
          localStorage.setItem("road_sos_session", loginData.sessionId);
          setSessionId(loginData.sessionId);
          setCurrentUser(loginData.user);
        }
      } else {
        setAuthError(data.error || "Failed to catalog user account.");
      }
    } catch (err) {
      setAuthError("Could not transmit sign-up payload.");
    }
  };

  const handleLogout = async () => {
    if (sessionId) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId })
        });
      } catch (err) {
        console.error("Logout error", err);
      }
    }
    localStorage.removeItem("road_sos_session");
    setSessionId(null);
    setCurrentUser(null);
    setIsBlocked(false);
  };

  // Remote blockage controllers for Admins
  const handleBlockSession = async (sessId: string) => {
    try {
      const res = await fetch(`/api/admin/sessions/${sessId}/block`, { method: "POST" });
      if (res.ok) {
        addNotification(`ADMIN OPERATION: Client terminal session ${sessId.substring(0, 7)} has been blacklisted / terminated.`);
        refreshState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnblockSession = async (sessId: string) => {
    try {
      const res = await fetch(`/api/admin/sessions/${sessId}/unblock`, { method: "POST" });
      if (res.ok) {
        addNotification(`ADMIN OPERATION: Restored terminal operational access for session ${sessId.substring(0, 7)}.`);
        refreshState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeallocateSession = async (sessId: string) => {
    try {
      const res = await fetch(`/api/admin/sessions/${sessId}`, { method: "DELETE" });
      if (res.ok) {
        addNotification(`Terminated session reference.`);
        refreshState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Secure client policy and blocklist handlers
  const handleToggleSystemHalt = async (halt: boolean) => {
    try {
      const res = await fetch("/api/admin/system-halt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ halted: halt })
      });
      const resData = await res.json();
      if (resData.success) {
        setSystemHalted(halt);
        addNotification(`ADMIN SECURITY: Master System Lock is now ${halt ? "ACTIVE (SYSTEM HALTED)" : "DEACTIVE (NORMAL)"}.`);
        refreshState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBlacklistEmail = async (email: string) => {
    if (!email) return;
    try {
      const res = await fetch("/api/admin/blacklist/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const resData = await res.json();
      if (resData.success) {
        setBlacklistedEmails(resData.blacklistedEmails || []);
        setNewBannedEmail("");
        addNotification(`ADMIN SECURITY: Banned email address "${email}" and terminated matching sessions.`);
        refreshState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnblacklistEmail = async (email: string) => {
    try {
      const res = await fetch("/api/admin/unblacklist/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const resData = await res.json();
      if (resData.success) {
        setBlacklistedEmails(resData.blacklistedEmails || []);
        addNotification(`ADMIN SECURITY: Unbanned email address "${email}".`);
        refreshState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBlacklistIP = async (ip: string) => {
    if (!ip) return;
    try {
      const res = await fetch("/api/admin/blacklist/ip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip })
      });
      const resData = await res.json();
      if (resData.success) {
        setBlacklistedIPs(resData.blacklistedIPs || []);
        setNewBannedIP("");
        addNotification(`ADMIN SECURITY: Blocked client device network node IP address "${ip}".`);
        refreshState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnblacklistIP = async (ip: string) => {
    try {
      const res = await fetch("/api/admin/unblacklist/ip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip })
      });
      const resData = await res.json();
      if (resData.success) {
        setBlacklistedIPs(resData.blacklistedIPs || []);
        addNotification(`ADMIN SECURITY: Unblocked communication IP node "${ip}".`);
        refreshState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Interactive Map point logging coordinate recorder
  const handleMapClickReport = (lat: number, lng: number) => {
    setPotholeLat(lat);
    setPotholeLng(lng);
    addNotification(`Map coordinates targeted: [Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}]. Define details under Hazard logging section.`);
  };

  // Submit pothole alert
  const submitPotholeReport = async () => {
    if (!potholeLat || !potholeLng) {
      addNotification("Click on the Live Map viewport to mark a specific pothole coordinate.");
      return;
    }

    try {
      const res = await fetch("/api/potholes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: potholeLat,
          lng: potholeLng,
          title: potholeTitle,
          severity: potholeSeverity,
          reportedBy: currentUser?.name || "Active Driver",
          city: currentUser?.city || "Lucknow"
        })
      });

      if (res.ok) {
        addNotification(`🛡️ Road obstacle recorded: [${potholeTitle}] posted in ${currentUser?.city}!`);
        setPotholeLat(null);
        setPotholeLng(null);
        refreshState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Quick emergency distress creator
  const handleQuickPresetSOS = async (type: string, message: string) => {
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: userLat,
          lng: userLng,
          type,
          vehicle: "Driver Hatchback Companion",
          phone: sosPhoneInput || "+91 99999 55555",
          message,
          severity: "Critical",
          city: currentUser?.city || "Lucknow"
        })
      });

      if (res.ok) {
        addNotification(`🚨 DISTRESS PRESET BROADCASTED: [${type}] in ${currentUser?.city}! Direct police routing active.`);
        refreshState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Detailed SOS alert manual launcher
  const handleTriggerSOS = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: userLat,
          lng: userLng,
          type: sosType,
          vehicle: sosVehicleInput,
          phone: sosPhoneInput,
          message: sosMessageInput,
          severity: sosSeverityInput,
          city: currentUser?.city || "Lucknow"
        })
      });

      if (res.ok) {
        addNotification(`🚨 EXPLICIT DETAILED SOS LAUNCHED! Family and Highway services in ${currentUser?.city} updated.`);
        setSosMessageInput("Emergency message delivered.");
        refreshState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Tow booking Dispatcher
  const submitTowingBooking = async (serviceType: string, notes: string) => {
    try {
      const cityDrivers = drivers.filter(d => d.city.toLowerCase() === (currentUser?.city || "Lucknow").toLowerCase());
      const activeDriver = cityDrivers.find(d => d.status === "Active") || drivers[0];

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: currentUser?.name || "Driver Companion",
          phone: sosPhoneInput,
          serviceType,
          notes,
          driverId: activeDriver ? activeDriver.id : "drv-1",
          city: currentUser?.city || "Lucknow"
        })
      });

      if (res.ok) {
        addNotification(`🚜 Assist Booked: Mobilized Tow Driver [${activeDriver?.name || "Services Crew"}] inside ${currentUser?.city}.`);
        refreshState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Direct offer of shared ride seats (Carpool)
  const handleOfferCarpool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerRoute.trim() || !offerVehicle.trim()) return;

    try {
      const res = await fetch("/api/carpools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          route: offerRoute,
          driver: currentUser?.name || "Ansh Khare",
          seats: Number(offerSeats),
          time: offerTime || "06:15 PM Shift",
          fare: offerFare,
          vehicle: offerVehicle,
          city: currentUser?.city || "Lucknow"
        })
      });

      if (res.ok) {
        addNotification(`🚗 Carpool route Offered! Shared commutes marked on ${currentUser?.city} catalog.`);
        setOfferRoute("");
        setOfferVehicle("");
        setOfferTime("");
        refreshState();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const bookCarpoolSeat = async (cpId: string) => {
    try {
      const res = await fetch(`/api/carpools/${cpId}/book`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        addNotification(`🚗 Seat Booked! Assigned ride-vehicle model: ${data.carpool.vehicle}.`);
        refreshState();
      } else {
        addNotification(data.error || "Commuting vacancy full.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Driver recruit guild creator matching city
  const submitRecruitDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recruitName.trim()) return;

    try {
      const res = await fetch("/api/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: recruitName,
          phone: recruitPhone || "+91 90000 88888",
          service: recruitService,
          vehicleNo: recruitVehicle || "DL-9C-XX-5555",
          city: currentUser?.city || "Lucknow"
        })
      });

      if (res.ok) {
        addNotification(`Rescue Unit [${recruitName}] enrolled into ${currentUser?.city} emergency network.`);
        setRecruitName("");
        setRecruitPhone("");
        setRecruitVehicle("");
        refreshState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateDriverStatus = async (drvId: string, nextStatus: string) => {
    try {
      await fetch(`/api/drivers/${drvId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      refreshState();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      const res = await fetch(`/api/alerts/${alertId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Resolved" })
      });
      if (res.ok) {
        addNotification("SOS Alert marked settled and resolved.");
        refreshState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const submitFeedbackRating = (bookingId: string) => {
    if (!feedbackText.trim()) return;
    setRatedBookings(prev => ({
      ...prev,
      [bookingId]: { rating: feedbackRating, text: feedbackText }
    }));
    addNotification(`Rated 5-Star assist quality on Ticket ID: ${bookingId}. Thank you!`);
    setFeedbackText("");
  };

  // Decodes hands-free microphone queries
  const handleVoiceCommandSubmit = async (customPrompt?: string) => {
    const speech = customPrompt || voiceQuery;
    if (!speech.trim()) return;

    setVoiceStatus("processing");
    setVoiceTranscript(speech);
    setVoiceAssistantFeedback("Analyzing speech intent via Google Gemini intelligence...");

    try {
      const res = await fetch("/api/voice-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: speech, city: currentUser?.city })
      });
      const data = await res.json();
      setVoiceAssistantFeedback(data.message);
      addNotification(`AI Decoded Action: ${data.action}`);

      if (data.action === "TRIGGER_SOS") {
        await handleQuickPresetSOS("Speech Trigger SOS", `Hands-free voice prompt: "${speech}"`);
      } else if (data.action === "SEARCH" && data.target) {
        setActiveSearchType(data.target);
        addNotification(`Compass targeted nearest dynamic ${data.target} markers.`);
      } else if (data.action === "REPORT_POTHOLE") {
        await fetch("/api/potholes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: userLat + 0.001,
            lng: userLng + 0.001,
            title: `AI Speech: Obstacle detected from driver logs`,
            severity: data.potholeSeverity || "High",
            reportedBy: "AI Companion Microphone",
            city: currentUser?.city
          })
        });
        refreshState();
      } else if (data.action === "BOOK_TOW") {
        await submitTowingBooking("Voice Request Tow Assist", `Speech request: "${speech}"`);
      } else if (data.action === "CARPOOL") {
        addNotification(`Displaying carpools catalog within ${currentUser?.city}.`);
      }

      setVoiceQuery("");
    } catch (err) {
      console.error(err);
      setVoiceAssistantFeedback("Speech system transient glitch. Manually initiate action trigger above.");
    } finally {
      setVoiceStatus("idle");
    }
  };

  const triggerAudioSirenSim = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      try {
        const u = new SpeechSynthesisUtterance("Road SOS caution! Family and Emergency services have been alerted with coordinates.");
        u.volume = 0.5;
        window.speechSynthesis.speak(u);
      } catch (err) {}
    }
    addNotification("Broadcasted Audio Siren Broadcast.");
  };

  const simulateDrivingShift = (direction: "north" | "south" | "east" | "west") => {
    let dy = 0;
    let dx = 0;
    if (direction === "north") dy = 0.003;
    if (direction === "south") dy = -0.003;
    if (direction === "east") dx = 0.003;
    if (direction === "west") dx = -0.003;

    setUserLat(prev => prev + dy);
    setUserLng(prev => prev + dx);
    addNotification(`Manual Shift: Vehicle simulated coordinates updated to [Lat, Lng]`);
  };

  // ================= RENDER BLOCKED LOCKOUT SCREEN =================
  if (isBlocked) {
    return (
      <div className="min-h-screen bg-rose-950 flex items-center justify-center p-4">
        <div className="max-w-xl w-full bg-slate-950 rounded-3xl border border-rose-500/30 p-10 select-none text-center shadow-2xl space-y-6">
          <div className="w-20 h-20 bg-rose-500/10 rounded-full border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto animate-pulse">
            <Lock className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black font-mono tracking-wider text-rose-500">
              ⚠️ ACCESS REMOTELY TERMINATED
            </h1>
            <p className="text-[11px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1 rounded inline-block font-mono font-extrabold uppercase tracking-wider">
              Terminal Locked by Central Engine Operations
            </p>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed font-mono">
            This driver terminal connection has been blacklisted and deactivated by Primary Administrator <strong className="text-white">Ansh Khare</strong>. 
            Vehicular coordinates sync, mechanical tow requests, and carpool booking access has been suspended.
          </p>
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
            <p className="text-xs text-rose-300 font-mono">Device: Client Mobile Node Terminal</p>
            <p className="text-[10px] text-slate-500 font-mono">IP: Checked & Traceable log recorded</p>
          </div>
          <button 
            onClick={refreshState}
            className="w-full bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold py-3.5 rounded-lg transition"
          >
            🔄 RETEST SECURITY LOCKS TELEMETRY
          </button>
        </div>
      </div>
    );
  }

  // ================= RENDER SYSTEM LOGIN / SIGNUP SCREEN =================
  if (!currentUser || !sessionId) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        
        {/* Banner with credits */}
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
          <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-rose-700 rounded-2xl flex items-center justify-center text-white font-extrabold text-lg mx-auto shadow-lg shadow-rose-950/40">
            SOS
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight text-white uppercase font-mono">
              ROAD SOS
            </h2>
            <p className="text-xs text-slate-400 mt-1">Safe Driving Companion & Live Emergency Distress Hub</p>
            <p className="text-xs font-bold bg-slate-900 border border-slate-800 px-3 py-1 rounded-full text-amber-400 inline-block mt-2 font-mono uppercase tracking-wider">
              Made by Ansh Khare
            </p>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md uppercase font-mono text-xs">
          <div className="bg-slate-900 py-8 px-4 shadow-2xl border border-slate-800 sm:rounded-3xl sm:px-10 space-y-6">
            
            {/* Login / Register Tab switches */}
            <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => { setIsLoginTab(true); setAuthError(null); }}
                className={`py-2 text-center rounded-lg transition text-[11px] font-bold ${isLoginTab ? "bg-slate-850 text-white" : "text-slate-500"}`}
              >
                🔐 DRIVER SIGN IN
              </button>
              <button
                type="button"
                onClick={() => { setIsLoginTab(false); setAuthError(null); }}
                className={`py-2 text-center rounded-lg transition text-[11px] font-bold ${!isLoginTab ? "bg-slate-850 text-white" : "text-slate-500"}`}
              >
                📝 NEW MEMBER SIGN UP
              </button>
            </div>

            {authError && (
              <div className="p-3 bg-rose-950/40 border border-rose-500/20 text-rose-450 rounded-xl text-center font-mono text-xs leading-snug">
                ⚠️ {authError}
              </div>
            )}

            {authSuccess && (
              <div className="p-3 bg-teal-950/40 border border-teal-500/20 text-teal-400 rounded-xl text-center font-mono text-xs">
                🟢 {authSuccess}
              </div>
            )}

            {isLoginTab ? (
              // Sign-in Panel
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] text-slate-450 font-bold mb-1">Enter registered email address:</label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="anshshu2007@road.com"
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-450 font-bold mb-1">Enter password:</label>
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>



                <button
                  type="submit"
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black py-3.5 rounded-xl tracking-wider transition uppercase"
                >
                  Authorize Companion Access
                </button>
              </form>
            ) : (
              // Sign-up Panel
              <form onSubmit={handleSignupSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] text-slate-450 font-semibold mb-1">Enter Full Name:</label>
                  <input
                    type="text"
                    required
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="Ansh Khare"
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-450 font-semibold mb-1">Email address:</label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="user@roadsos.com"
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-450 font-semibold mb-1">Set Password:</label>
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-450 font-semibold mb-1">Select India Operating City Context:</label>
                  <select
                    value={authCity}
                    onChange={(e) => setAuthCity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Bhopal">Bhopal, Madhya Pradesh</option>
                    <option value="Lucknow">Lucknow, Uttar Pradesh</option>
                    <option value="Delhi">Delhi / Noida (NCR)</option>
                    <option value="Mumbai">Mumbai, Maharashtra</option>
                    <option value="Bengaluru">Bengaluru, Karnataka</option>
                    <option value="Pune">Pune, Maharashtra</option>
                    <option value="Jaipur">Jaipur, Rajasthan</option>
                    <option value="Hyderabad">Hyderabad, Telangana</option>
                    <option value="Custom">Other Indian City...</option>
                  </select>
                </div>

                {authCity === "Custom" && (
                  <div>
                    <label className="block text-[10px] text-slate-450 font-semibold mb-1">Enter your City:</label>
                    <input
                      type="text"
                      required
                      value={customCity}
                      onChange={(e) => setCustomCity(e.target.value)}
                      placeholder="e.g. Ahmedabad, Kanpur"
                      className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black py-3.5 rounded-xl tracking-wider transition uppercase"
                >
                  Create & Catalog Account
                </button>
              </form>
            )}

          </div>
        </div>
      </div>
    );
  }

  // Filter lists based on the city selection
  const filteredPotholes = selectedCityFilter === "Local" 
    ? potholes.filter(p => p.city.toLowerCase() === currentUser.city.toLowerCase())
    : potholes;

  const filteredAlerts = selectedCityFilter === "Local"
    ? alerts.filter(a => a.city.toLowerCase() === currentUser.city.toLowerCase() && a.status !== "Resolved")
    : alerts.filter(a => a.status !== "Resolved");

  const filteredDrivers = selectedCityFilter === "Local"
    ? drivers.filter(d => d.city.toLowerCase() === currentUser.city.toLowerCase())
    : drivers;

  const filteredBookings = selectedCityFilter === "Local"
    ? bookings.filter(b => b.city.toLowerCase() === currentUser.city.toLowerCase())
    : bookings;

  const filteredCarpools = selectedCityFilter === "Local"
    ? carpools.filter(c => c.city.toLowerCase() === currentUser.city.toLowerCase())
    : carpools;

  // ================= MAIN COMPANION INTERFACE =================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      
      {/* Absolute top designer credit banner */}
      <div className="bg-transparent py-1.5 px-4 text-center text-[10px] font-bold tracking-widest text-slate-400 uppercase font-mono relative z-10 animate-fade-in">
        👑 MADE BY ANSH KHARE 👑
      </div>
      
      {/* Top HUD Banner */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-rose-700 rounded-xl flex items-center justify-center text-white scale-105 font-mono font-extrabold text-lg tracking-tight">
              SOS
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5 uppercase font-mono">
                ROAD SOS COMPANION
                <span className="text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">
                  {currentUser.city} Node
                </span>
              </h1>
              <p className="text-[10px] text-slate-400">Distress Dispatch & Multi-Device Control Center</p>
            </div>
          </div>

          {/* User Account Info */}
          <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 p-2 px-4 rounded-full text-xs font-mono">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-300">Driver: <strong>{currentUser.name}</strong></span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300">City: <span className="text-rose-400 font-bold">{currentUser.city}</span></span>
            {currentUser.isAdmin && (
              <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold ml-1">
                Primary Operator
              </span>
            )}
            <button 
              onClick={handleLogout}
              className="ml-3 hover:text-rose-400 transition"
              title="Log out session"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400 hover:text-rose-500" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className={`p-1 px-3 rounded-lg flex items-center gap-1.5 font-mono bg-teal-950/50 border border-teal-800/40 text-teal-400`}>
              <div className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
              <span>Sensors: Active</span>
            </div>

            <button 
              onClick={() => {
                setIsOffline(!isOffline);
                addNotification(isOffline ? "Syncing online master satellite bounds." : "Entered offline caching mode.");
              }}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 transition rounded-lg text-[10px] font-semibold border border-slate-700 font-mono"
            >
              Mode: {isOffline ? "Offline GPS" : "Live Satellite"}
            </button>

            <button 
              onClick={refreshState} 
              className="p-1 px-2 bg-slate-800 hover:bg-slate-700 transition rounded-lg border border-slate-700 text-slate-300"
              title="State Sync"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </header>

      {/* Main Container Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* Distress Preset Area */}
        <div id="quick-distress-banner" className="bg-rose-950/20 border border-rose-500/20 rounded-2xl p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 uppercase font-mono">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/20 rounded-xl text-rose-500 animate-pulse">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-rose-200">Instant SOS Coordinates Dispatch</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">Click to broadcast satellite distress to local services inside {currentUser.city}.</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <button
              onClick={() => handleQuickPresetSOS("Police Patrol Assist Requested", `Hijack or crash panic coordinate alerted in ${currentUser.city}`)}
              className="flex-1 md:flex-none px-4 py-2 bg-rose-600 hover:bg-rose-700 text-slate-950 font-bold rounded-lg transition text-xs font-black"
            >
              🚨 Dispatch POLICE
            </button>
            <button
              onClick={() => handleQuickPresetSOS("Severe Engine Smoking Accident", `Vehicle broke down on highway flyover in ${currentUser.city}`)}
              className="flex-1 md:flex-none px-4 py-2 bg-amber-600 hover:bg-amber-700 text-slate-950 font-bold rounded-lg transition text-xs font-black"
            >
              🛠️ Mech Assist
            </button>
            <button
              onClick={() => handleQuickPresetSOS("Medical Trauma Emergency", `Cardiac or driving injury coordinate reported in ${currentUser.city}`)}
              className="flex-1 md:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-slate-950 font-bold rounded-lg transition text-xs font-black"
            >
              🚑 AMBULANCE 108
            </button>
            <button
              onClick={triggerAudioSirenSim}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700"
            >
              🔊 TEST SIREN
            </button>
          </div>
        </div>

        {/* City Filter / Selector Tab Row */}
        <div className="flex items-center justify-between mb-5 bg-slate-900 border border-slate-800 p-2.5 rounded-2xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono px-2.5">Operating Area Filter:</span>
            <div className="flex p-0.5 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs">
              <button
                onClick={() => setSelectedCityFilter("Local")}
                className={`px-3 py-1 rounded transition ${selectedCityFilter === "Local" ? "bg-rose-500/20 text-rose-400" : "text-slate-500"}`}
              >
                📍 LOCAL {currentUser.city.toUpperCase()} AREA
              </button>
              <button
                onClick={() => setSelectedCityFilter("All")}
                className={`px-3 py-1 rounded transition ${selectedCityFilter === "All" ? "bg-slate-800 text-slate-300" : "text-slate-500"}`}
              >
                🌍 ALL INDIA SATELLITE
              </button>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 font-mono hidden md:block">
            Showing catalog for: <span className="text-white font-bold">{selectedCityFilter === "Local" ? currentUser.city : "Total India Districts"}</span>
          </p>
        </div>

        {/* Dashboard Panels Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: Map & Handsfree Mic */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Embedded Live Web-Map */}
            <InteractiveMap 
              potholes={potholes}
              alerts={alerts}
              userLat={userLat}
              userLng={userLng}
              userCity={currentUser.city}
              onMapClickReportPothole={handleMapClickReport}
              activeSearchType={activeSearchType}
              setActiveSearchType={setActiveSearchType}
              selectedDestination={selectedDestination}
              setSelectedDestination={setSelectedDestination}
              isOffline={isOffline}
              gpsAccuracyText={gpsAccuracy}
            />

            {/* Simulated Vehicular Cruise controls */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-400">Manual Coordinates Shifter (Driving Simulation)</span>
                <p className="text-[11px] text-slate-400">Simulate vehicle motion through local sectors with 1-click jumps.</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => simulateDrivingShift("north")} className="p-1 px-2.5 bg-slate-850 hover:bg-slate-800 text-[11px] font-bold rounded">NORTH ▲</button>
                <button onClick={() => simulateDrivingShift("south")} className="p-1 px-2.5 bg-slate-850 hover:bg-slate-800 text-[11px] font-bold rounded">SOUTH ▼</button>
                <button onClick={() => simulateDrivingShift("east")} className="p-1 px-2.5 bg-slate-850 hover:bg-slate-800 text-[11px] font-bold rounded">EAST ►</button>
                <button onClick={() => simulateDrivingShift("west")} className="p-1 px-2.5 bg-slate-850 hover:bg-slate-800 text-[11px] font-bold rounded">WEST ◄</button>
              </div>
            </div>

            {/* Gemini Hands-free Voice Engine */}
            <div id="ai-voice-assistant" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Radio className="w-32 h-32 text-cyan-400 animate-pulse" />
              </div>

              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-100 flex items-center gap-2 font-mono uppercase">
                  <span><Mic className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /></span>
                  Hands-Free Gemini AI Voice Command decoder
                </h3>
                <span className="text-[9px] bg-cyan-950 border border-cyan-800 text-cyan-400 px-2 py-0.5 rounded font-mono uppercase">
                  Gemini Flash model
                </span>
              </div>

              <p className="text-xs text-slate-350 leading-relaxed mb-4">
                Keep eyes on the road! In case of sudden danger, express your concern in simple Hindustani/Hinglish language. Gemini interprets the route matching SOS parameters and registers the dispatch automatically!
              </p>

              <div className="flex gap-2">
                <input 
                  type="text"
                  value={voiceQuery}
                  onChange={(e) => setVoiceQuery(e.target.value)}
                  placeholder="Khabar: Gomti Nagar flyover par badha gaddha hai, alert create kardo"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                  onKeyDown={(e) => e.key === "Enter" && handleVoiceCommandSubmit()}
                />
                <button
                  onClick={() => handleVoiceCommandSubmit()}
                  disabled={voiceStatus === "processing"}
                  className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 px-4 text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0"
                >
                  {voiceStatus === "processing" ? "Parsing..." : <Mic className="w-4 h-4 text-slate-950" />}
                </button>
              </div>

              {/* Speech Prompts shortcuts */}
              <div className="mt-3 flex flex-wrap gap-1.5 font-mono text-[10px]">
                <span className="text-slate-500 uppercase flex items-center">Say or click:</span>
                <button onClick={() => { setVoiceQuery("Accident crash trauma on main bypass road, call hospital 108"); handleVoiceCommandSubmit("Accident crash trauma on main bypass road, call hospital 108"); }} className="bg-slate-950 text-slate-300 p-1 px-2.5 rounded hover:bg-slate-800 transition">"Accident hospital emergency"</button>
                <button onClick={() => { setVoiceQuery("gadi ka fuel khatam ho gaya, find petrol pumps"); handleVoiceCommandSubmit("gadi ka fuel khatam ho gaya, find petrol pumps"); }} className="bg-slate-950 text-slate-300 p-1 px-2.5 rounded hover:bg-slate-800 transition">"Find petrol pump"</button>
                <button onClick={() => { setVoiceQuery("Broken road pothole alert in my front"); handleVoiceCommandSubmit("Broken road pothole alert in my front"); }} className="bg-slate-950 text-slate-300 p-1 px-2.5 rounded hover:bg-slate-800 transition">"Report Road Pothole"</button>
              </div>

              {/* Audio feedback simulator console */}
              <div className="mt-4 bg-slate-950 border border-slate-850 p-3.5 rounded-xl font-mono">
                <div className="flex items-center gap-1.5 text-[10px] text-cyan-400 font-bold uppercase">
                  <span>●</span> Voice Companion System Broadcast:
                </div>
                {voiceTranscript && (
                  <p className="text-[11px] text-slate-500 italic mt-1">"Captured driver speech: {voiceTranscript}"</p>
                )}
                <p className="text-xs text-cyan-300 mt-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/50">
                  🔊 {voiceAssistantFeedback}
                </p>
              </div>
            </div>

            {/* All-India Commuter Carpooling Hub */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                <h3 className="text-xs font-bold text-slate-100 flex items-center gap-2 font-mono uppercase">
                  <span className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
                    <Car className="w-4 h-4" />
                  </span>
                  Office Ride-Share & Highway Carpooling Platform
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">Available in {currentUser.city}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Active matching list */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Commuting routes catalog:</h4>
                  
                  {filteredCarpools.length === 0 ? (
                    <div className="text-slate-500 text-xs py-4 text-center font-mono italic bg-slate-950 border border-slate-850/50 rounded-xl">
                      No matching carpools cataloged in {currentUser.city}. Create one!
                    </div>
                  ) : (
                    filteredCarpools.map(cp => (
                      <div key={cp.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-200">{cp.route}</span>
                          <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">{cp.fare}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 border-t border-slate-900 pt-2">
                          <span>Driver: <strong className="text-white">{cp.driver}</strong></span>
                          <span>Vehicle: <strong className="text-white">{cp.vehicle}</strong></span>
                          <span>Time: <strong className="text-white">{cp.time}</strong></span>
                          <span>Seats Left: <strong className="text-slate-100 bg-slate-900 px-1 rounded">{cp.seatsAvailable} / {cp.seats}</strong></span>
                        </div>
                        <button
                          onClick={() => bookCarpoolSeat(cp.id)}
                          disabled={cp.seatsAvailable <= 0}
                          className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-bold py-1.5 rounded transition text-[11px]"
                        >
                          Book Empty Seat
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Offer Commuting Route Form */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <h4 className="text-[10px] font-mono uppercase text-emerald-400 tracking-wider font-bold mb-3 flex items-center gap-1.5">
                    <PlusCircle className="w-3.5 h-3.5" /> Post Commuting Empty Seats:
                  </h4>
                  <form onSubmit={handleOfferCarpool} className="space-y-2 text-xs font-mono">
                    <div>
                      <label className="text-slate-500 text-[10px] block mb-1">Commute Route Description:</label>
                      <input 
                        type="text" required value={offerRoute} onChange={e => setOfferRoute(e.target.value)}
                        placeholder="e.g. Hazratganj Metro to Gomti Nagar Bypass"
                        className="w-full bg-slate-900 border border-slate-800 p-2 rounded text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-slate-500 text-[10px] block mb-1">Car Model & No:</label>
                        <input 
                          type="text" required value={offerVehicle} onChange={e => setOfferVehicle(e.target.value)}
                          placeholder="Maruti Baleno"
                          className="w-full bg-slate-900 border border-slate-800 p-2 rounded text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-slate-500 text-[10px] block mb-1">Vacant Seats count:</label>
                        <select value={offerSeats} onChange={e => setOfferSeats(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 p-2 rounded text-slate-200 focus:outline-none text-xs">
                          <option value="1">1 Seat</option>
                          <option value="2">2 Seats</option>
                          <option value="3">3 Seats</option>
                          <option value="4">4 Seats</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-slate-500 text-[10px] block mb-1">Expected Time:</label>
                        <input type="text" value={offerTime} onChange={e => setOfferTime(e.target.value)} placeholder="06:30 PM" className="w-full bg-slate-900 border border-slate-800 p-2 rounded text-slate-200 focus:outline-none focus:border-emerald-500 text-xs" />
                      </div>
                      <div>
                        <label className="text-slate-500 text-[10px] block mb-1">Fare Price (e.g. ₹100):</label>
                        <input type="text" value={offerFare} onChange={e => setOfferFare(e.target.value)} placeholder="₹100" className="w-full bg-slate-900 border border-slate-800 p-2 rounded text-slate-200 focus:outline-none focus:border-emerald-500 text-xs" />
                      </div>
                    </div>
                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold py-2 rounded transition font-mono mt-2 uppercase tracking-tight text-[11px]">Offer Commuting Ride</button>
                  </form>
                </div>
              </div>
            </div>

            {/* Service ratings and Tow breakdowns tickets feedback */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 font-mono">
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="p-1 bg-yellow-500/10 text-yellow-400 rounded">★</span>
                Emergency Crew Assistance Tickets & Ratings Feedback
              </h3>
              
              {filteredBookings.length === 0 ? (
                <p className="text-slate-500 text-xs text-center py-5 italic bg-slate-950 border border-slate-850/50 rounded-xl">
                  No mechanical dispatch requests cataloged in your city.
                </p>
              ) : (
                <div className="space-y-3 text-xs">
                  {filteredBookings.map(book => {
                    const ratingData = ratedBookings[book.id];
                    return (
                      <div key={book.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-slate-900 px-2 rounded-full font-bold text-[10px] border border-slate-800">TICKET: {book.id.substring(0, 8)}</span>
                            <span className={`text-[10px] px-2 rounded-full font-bold ${book.status === "Completed" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-500 animate-pulse"}`}>● {book.status}</span>
                          </div>
                          <p className="font-bold text-slate-200 mt-1">Service: {book.serviceType}</p>
                          <p className="text-[11px] text-slate-400 italic">Notes: "{book.notes}"</p>
                          <p className="text-[11px] text-slate-500">Assigned crew pilot: <strong className="text-indigo-400">{book.driverName}</strong></p>
                        </div>

                        {/* Interactive stars selection feedback */}
                        <div className="bg-slate-900 p-3 rounded-lg border border-slate-850 flex flex-col gap-2 shrink-0 md:w-[220px]">
                          {ratingData ? (
                            <div className="space-y-1">
                              <span className="text-slate-500 text-[10px]">Your Rating:</span>
                              <div className="flex items-center gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star key={i} className={`w-3.5 h-3.5 ${i < ratingData.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-700"}`} />
                                ))}
                              </div>
                              <p className="text-[11px] text-slate-350 truncate">"{ratingData.text}"</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <span className="text-slate-400 text-[10px] block">Rate assistance performance:</span>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map(starIdx => (
                                  <button key={starIdx} onClick={() => setFeedbackRating(starIdx)} className="focus:outline-none">
                                    <Star className={`w-4 h-4 ${starIdx <= feedbackRating ? "fill-yellow-400 text-yellow-400" : "text-slate-700"}`} />
                                  </button>
                                ))}
                              </div>
                              <input 
                                type="text" value={feedbackText} onChange={e => setFeedbackText(e.target.value)}
                                placeholder="E.g., Very helpful, fast flatbed"
                                className="w-full bg-slate-950 border border-slate-800 p-1.5 rounded text-[11px] text-slate-200 focus:outline-none"
                              />
                              <button onClick={() => submitFeedbackRating(book.id)} className="w-full py-1 bg-yellow-500/10 hover:bg-yellow-500/25 border border-yellow-500/20 text-yellow-400 font-bold text-[10px] rounded uppercase">Submit Performance Reviews</button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: SOS forms & Crew recruits & ADMIN CONSOLE */}
          <div className="lg:col-span-4 flex flex-col gap-6 font-mono text-xs">
            
            {/* Driving telemetry indicators */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative">
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-rose-500" />
                Live Driving Telemetry Sensors
              </h3>
              
              <div className="space-y-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Smart Fuel Indicator:</span>
                    <strong className="text-lg text-slate-100">{fuelLevel}% Cap</strong>
                    <span className="text-[10px] block text-slate-400 mt-0.5">{fuelLevel > 20 ? "Range Status: Stable" : "⚠️ REFILL REQUIRED IMMEDIATELY"}</span>
                  </div>
                  <div className="w-16 h-16 relative">
                    <input 
                      type="range" min="0" max="100" value={fuelLevel} onChange={e => setFuelLevel(Number(e.target.value))}
                      className="w-full accent-rose-500 cursor-pointer text-xs"
                    />
                    <div className="text-[10px] text-center text-slate-500 mt-1 uppercase">Refill Sim</div>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                  <div className="flex items-center gap-2">
                    <BatteryWarning className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="text-[10px] uppercase text-slate-400 font-bold">Maintenance Reminders:</span>
                  </div>
                  <p className="text-xs text-indigo-300 bg-indigo-500/5 p-2 rounded border border-indigo-500/10 leading-relaxed italic">
                    "{maintenanceReminder}"
                  </p>
                  <button 
                    onClick={() => setMaintenanceReminder("Drive safe! Suspension calibrated to optimum highway comfort.")}
                    className="w-full bg-slate-900 py-1 rounded text-[10px] border border-slate-800 hover:bg-slate-850"
                  >
                    Clear reminders
                  </button>
                </div>
              </div>
            </div>

            {/* Urgent Manual SOS Launcher Panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider mb-3 flex items-center gap-2 text-rose-400">
                <ShieldAlert className="w-4 h-4" /> Urgent Distress Dispatcher
              </h3>
              
              <form onSubmit={handleTriggerSOS} className="space-y-3">
                <div>
                  <label className="text-slate-500 text-[10px] block mb-1">Select Distress Category:</label>
                  <select value={sosType} onChange={e => setSosType(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-slate-250 focus:outline-none">
                    <option value="Mechanical Towing Assist">Severe Vehicle breakdown</option>
                    <option value="Accident Collision Ambulance">Highway crash accident</option>
                    <option value="Emergency Fuel Delivery">Fuel Empty / Dried out</option>
                    <option value="Towing flat tire support">Puncture Flat Tyre</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-500 text-[10px] block mb-1">My Vehicular plate / Model No:</label>
                  <input type="text" required value={sosVehicleInput} onChange={e => setSosVehicleInput(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-2 rounded focus:outline-none focus:border-rose-500 text-xs text-slate-200" />
                </div>

                <div>
                  <label className="text-slate-500 text-[10px] block mb-1">Direct Call Contact No:</label>
                  <input type="text" required value={sosPhoneInput} onChange={e => setSosPhoneInput(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-2 rounded focus:outline-none text-xs text-slate-250" />
                </div>

                <div>
                  <label className="text-slate-500 text-[10px] block mb-1">Distress coordinates Notes description:</label>
                  <textarea required value={sosMessageInput} onChange={e => setSosMessageInput(e.target.value)} className="w-full h-16 bg-slate-950 border border-slate-800 p-2 rounded text-xs focus:outline-none focus:border-rose-500 text-slate-250" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1 bg-slate-950 p-2 rounded border border-slate-800">
                    <input type="radio" value="High" checked={sosSeverityInput === "High"} onChange={() => setSosSeverityInput("High")} />
                    <span className="text-[10px] font-bold text-amber-500 uppercase">HIGH SPEED</span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-950 p-2 rounded border border-slate-800">
                    <input type="radio" value="Critical" checked={sosSeverityInput === "Critical"} onChange={() => setSosSeverityInput("Critical")} />
                    <span className="text-[10px] font-bold text-rose-500 uppercase">💥 CRITICAL</span>
                  </div>
                </div>

                <button type="submit" className="w-full bg-rose-600 hover:bg-rose-500 text-slate-950 font-black tracking-widest py-3.5 rounded-lg transition uppercase text-xs">Transmit Distress beacon</button>
              </form>
            </div>

            {/* Pothole coordinate plotter form (requires clicking map) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Mark Road Hazard obstacle
              </h3>
              
              <div className="space-y-3">
                {potholeLat && potholeLng ? (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                    <p className="text-[10px] text-amber-400 font-bold uppercase">Lat/Lng coordinate recorded:</p>
                    <p className="text-[11px] text-slate-300 font-mono">Lat: {potholeLat.toFixed(5)}, Lng: {potholeLng.toFixed(5)}</p>
                    
                    <div>
                      <label className="text-slate-500 text-[10px] block mb-1">Identify Obstacle type:</label>
                      <input type="text" value={potholeTitle} onChange={e => setPotholeTitle(e.target.value)} className="w-full bg-slate-900 border border-slate-850 p-2 rounded text-xs text-white" />
                    </div>

                    <div>
                      <label className="text-slate-500 text-[10px] block mb-1">Hazard Severity:</label>
                      <select value={potholeSeverity} onChange={e => setPotholeSeverity(e.target.value as any)} className="w-full bg-slate-900 border border-slate-850 p-2 rounded text-xs text-white">
                        <option value="Low">Low (Minor Gravel crack)</option>
                        <option value="Medium">Medium (Speed Hump)</option>
                        <option value="High">High (Deep Pothole Crater)</option>
                        <option value="Critical">Critical (Severe Road Damage/Block)</option>
                      </select>
                    </div>

                    <button onClick={submitPotholeReport} className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs rounded transition uppercase">Catalog Alert</button>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-950 border border-slate-850/80 rounded-xl text-slate-500 text-[11px] tracking-tight leading-relaxed italic text-center">
                    Tap/Double-Click on the Live Map tracking graphical layout first to pick hazard coords.
                  </div>
                )}
              </div>
            </div>

            {/* Recruiting form */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-widest mb-3 flex items-center gap-1">
                🚜 Recruit Service Drivers matching {currentUser.city}
              </h3>
              <form onSubmit={submitRecruitDriver} className="space-y-2">
                <div>
                  <label className="text-slate-500 text-[10px] block mb-1">Driver Name:</label>
                  <input type="text" required value={recruitName} onChange={e => setRecruitName(e.target.value)} placeholder="Amit Singh Gomti" className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-xs text-slate-200" />
                </div>
                <div>
                  <label className="text-slate-500 text-[10px] block mb-1">Driver Phone contact:</label>
                  <input type="text" required value={recruitPhone} onChange={e => setRecruitPhone(e.target.value)} placeholder="+91 95550 12121" className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-xs text-slate-200" />
                </div>
                <div>
                  <label className="text-slate-500 text-[10px] block mb-1">Service Type:</label>
                  <select value={recruitService} onChange={e => setRecruitService(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-xs">
                    <option value="Heavy Flatbed Crane recovery">Heavy Flatbed Crane recovery</option>
                    <option value="Mechanical Jumpstart & repairs">Mechanical Jumpstart & repairs</option>
                    <option value="Emergency Fuel Courier">Emergency Fuel Courier</option>
                    <option value="Trauma Cardiac Ambulance Unit">Trauma Cardiac Ambulance Unit</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-450 block text-[10px] mb-1 font-mono">Vehicle Plate No:</label>
                  <input type="text" required value={recruitVehicle} onChange={e => setRecruitVehicle(e.target.value)} placeholder="UP-32-SOS-11" className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-xs text-slate-200" />
                </div>
                <button type="submit" className="w-full py-2 bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold rounded uppercase tracking-wider mt-2 text-[10px]">Enroll Operator</button>
              </form>
            </div>

            {/* Active Driver lists inside sidebar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <span className="text-[10px] uppercase font-bold text-slate-400">Enrolled Service Fleets ({filteredDrivers.length}):</span>
              <div className="space-y-2 max-h-[220px] overflow-y-auto">
                {filteredDrivers.map(drv => (
                  <div key={drv.id} className="bg-slate-950 p-3 rounded-lg border border-slate-850 space-y-1">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-200">
                      <span>{drv.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded ${drv.status === "Active" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-500"}`}>{drv.status}</span>
                    </div>
                    <p className="text-[10px] text-slate-400">{drv.service} | {drv.vehicleNo}</p>
                    <div className="flex gap-1.5 pt-1">
                      <button onClick={() => handleUpdateDriverStatus(drv.id, "Active")} className="text-[9px] bg-slate-900 p-1 rounded text-slate-300">Set Online</button>
                      <button onClick={() => handleUpdateDriverStatus(drv.id, "Busy")} className="text-[9px] bg-slate-900 p-1 rounded text-slate-300">Set Busy</button>
                      <button onClick={() => submitTowingBooking(drv.service, "Direct companion request")} className="text-[9px] bg-indigo-500/20 text-indigo-400 p-1 px-1.5 rounded font-bold">Request help</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Dynamic active distress incidents lists (potholes + SOS alerts) */}
        <section className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 uppercase font-mono text-xs">
          
          {/* Incidents Live feed */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-xs font-bold text-slate-100 tracking-wider mb-4 flex items-center gap-2">
              <span className="p-1 bg-rose-500/10 text-rose-450 rounded font-black">● LIVE</span>
              Emergency Distresses Broadcasts Queue ({filteredAlerts.length})
            </h3>
            
            {filteredAlerts.length === 0 ? (
              <p className="text-slate-500 text-xs italic py-4 bg-slate-950 border border-slate-850/50 rounded-xl text-center">
                All Indian routes cleared of acute distresses. Zero emergency queues!
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[350px] overflow-y-auto">
                {filteredAlerts.map(al => (
                  <div key={al.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded font-extrabold">{al.type}</span>
                        <span className="text-slate-500 font-bold">In: {al.city}</span>
                      </div>
                      <p className="text-slate-300 font-bold text-xs">Notes: "{al.message}"</p>
                      <p className="text-[10px] text-slate-500">Vehicle model info: <span className="text-slate-300 font-extrabold">{al.vehicle}</span> | Contact: {al.phone}</p>
                    </div>
                    {currentUser.isAdmin && (
                      <button
                        onClick={() => handleResolveAlert(al.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-[10px] font-black p-2 rounded transition ml-2 whitespace-nowrap"
                      >
                        ✓ RESOLVE INCIDENT
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reported Hazards List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-xs font-bold text-slate-100 tracking-wider mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              Active Road Potholes Warning Feed ({filteredPotholes.length})
            </h3>

            {filteredPotholes.length === 0 ? (
              <p className="text-slate-500 text-xs italic py-4 bg-slate-950 border border-slate-850/50 rounded-xl text-center">
                No local road potholes categorized yet. Tap of the map to plot first!
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[350px] overflow-y-auto">
                {filteredPotholes.map(pot => (
                  <div key={pot.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold font-mono uppercase ${
                          pot.severity === "Critical" ? "bg-rose-500/10 text-rose-400" :
                          pot.severity === "High" ? "bg-amber-500/10 text-amber-400" : "bg-slate-900 text-slate-400"
                        }`}>
                          {pot.severity}
                        </span>
                        <span className="text-slate-500 font-bold">in {pot.city}</span>
                      </div>
                      <p className="font-bold text-slate-200">{pot.title}</p>
                      <p className="text-[10px] text-slate-500">Reported by companion: <strong className="text-slate-400">{pot.reportedBy}</strong> | Date: {new Date(pot.reportedAt).toLocaleDateString()}</p>
                    </div>
                    {currentUser.isAdmin && (
                      <button
                        onClick={async () => {
                          await fetch(`/api/potholes/${pot.id}`, { method: "DELETE" });
                          refreshState();
                        }}
                        className="text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 p-2 text-[10px] font-bold rounded"
                      >
                        REMOVE HAZARD
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </section>

        {/* ================= PRIMARY OPERATOR COMMAND TERM BOARD ================= */}
        {currentUser.isAdmin && (
          <section className="mt-8 bg-slate-900 border-2 border-amber-500/30 rounded-3xl p-6 relative overflow-hidden uppercase font-mono text-xs">
            
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Server className="w-48 h-48 text-amber-400" />
            </div>

            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                  <Server className="w-5 h-5 animate-pulse" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Primary Operations Control Deck — ANSH KHARE COMMAND PANEL
                  </h3>
                  <p className="text-[10px] text-slate-400">Live remote monitoring companion terminals, API hooks, and terminal terminations</p>
                </div>
              </div>
              
              <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] px-3 py-1 rounded-full font-bold">
                Operator Signature Verified: OK
              </span>
            </div>

            {/* Quick API Key Guide Popover */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
              <div className="space-y-1 max-w-2xl">
                <p className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Key className="w-4 h-4" /> API Configuration Guideline:
                </p>
                <p className="text-slate-350 leading-relaxed text-[11px] font-mono">
                  The Voice AI Assistant routes driving instructions using the <strong className="text-white">Google Gemini API</strong>.
                  This service is 100% free under rate limits. To enable Gemini for yourself, simply set the <strong className="text-white">GEMINI_API_KEY</strong> environment variable inside the settings secrets panel. The server will detect and light up automatically!
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl">
                <div className={`w-2.5 h-2.5 rounded-full ${process.env.GEMINI_API_KEY ? "bg-teal-400 animate-ping" : "bg-amber-400"}`} />
                <span>Gemini Key Status: <strong>{process.env.GEMINI_API_KEY ? "CONFIGURED (LIVE PROMPT)" : "BACKUP REGEX MODE"}</strong></span>
              </div>
            </div>

            {/* Connected Terminals Tracking Panel */}
            <div className="space-y-4">
              <h4 className="font-bold text-slate-300 flex items-center gap-2 text-xs uppercase tracking-wider">
                <Monitor className="w-4 h-4 text-slate-400" />
                Live Logged-In Browser Terminals & Client Platforms ({deviceSessions.length} sessions active):
              </h4>

              {deviceSessions.length === 0 ? (
                <p className="text-slate-500 py-6 bg-slate-950 border border-slate-850 rounded-xl text-center italic">
                  No active driver sessions queried. Run app of other devices to capture terminals log!
                </p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 select-text">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold">
                        <th className="p-3.5 pl-4">Platform Type</th>
                        <th className="p-3.5">Logged Email</th>
                        <th className="p-3.5">Active City</th>
                        <th className="p-3.5">IP Address</th>
                        <th className="p-3.5">Last Active Sync</th>
                        <th className="p-3.5">Telemetry Status</th>
                        <th className="p-3.5 pr-4 text-right">Emergency Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-slate-300 font-mono text-[11px]">
                      {deviceSessions.map(sess => (
                        <tr key={sess.id} className="hover:bg-slate-900 transition">
                          <td className="p-3 pl-4 flex items-center gap-2 font-bold text-slate-200">
                            {sess.platform.includes("iPhone") || sess.platform.includes("Android") ? (
                              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                            ) : (
                              <Monitor className="w-3.5 h-3.5 text-indigo-400" />
                            )}
                            {sess.platform}
                          </td>
                          <td className="p-3 text-slate-150">{sess.email}</td>
                          <td className="p-3 font-semibold text-rose-400">{sess.city}</td>
                          <td className="p-3 text-slate-500">{sess.ip}</td>
                          <td className="p-3 text-slate-400">{new Date(sess.lastActive).toLocaleTimeString()}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${sess.isBlocked ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-400 animate-pulse"}`}>
                              {sess.isBlocked ? "❌ BLACKLISTED BLOCK" : "🟢 PASSING LIVE"}
                            </span>
                          </td>
                          <td className="p-3 pr-4 text-right space-x-1.5">
                            {sess.isBlocked ? (
                              <button
                                onClick={() => handleUnblockSession(sess.id)}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded text-[10px]"
                              >
                                RESTORE OPERATIONALS
                              </button>
                            ) : (
                              <button
                                onClick={() => handleBlockSession(sess.id)}
                                className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-slate-950 font-bold rounded text-[10px]"
                                title="Lockout device screen and terminate terminal access to companion engine."
                              >
                                TERMINATE CLIENT APP
                              </button>
                            )}
                            <button
                              onClick={() => handleDeallocateSession(sess.id)}
                              className="p-1 px-2 text-rose-400 bg-rose-500/5 hover:bg-rose-500/15 rounded text-[10px]"
                              title="Delete session"
                            >
                              De-allocate
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Real-time IP Blacklisting, Email Blacklisting & Master Freeze Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-slate-800">
              
              {/* Card 1: System-wide Access & Master Freeze Switch */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-amber-400 flex items-center gap-1.5 mb-2">
                    <Lock className="w-4 h-4" /> MASTER SYSTEM FREEZE
                  </h4>
                  <p className="text-slate-400 leading-relaxed text-[11px] mb-4 uppercase">
                    Instantly freeze all non-administrator application accesses, bookings, carpools, and map alert updates on active devices.
                  </p>
                </div>
                <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-2.5 rounded-lg mt-2">
                  <span className="font-bold text-[10px] text-slate-300">SYSTEM STATUS:</span>
                  <button
                    onClick={() => handleToggleSystemHalt(!systemHalted)}
                    className={`px-3 py-1.5 rounded-md font-extrabold text-[10px] transition uppercase tracking-wide cursor-pointer ${
                      systemHalted ? "bg-rose-600 text-white animate-pulse" : "bg-emerald-600 text-slate-950"
                    }`}
                  >
                    {systemHalted ? "🔴 HALTED / LOCKED" : "🟢 ACTIVE / LIVE"}
                  </button>
                </div>
              </div>

              {/* Card 2: Email Blacklist Management */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-rose-450 flex items-center gap-1.5 mb-2">
                    <User className="w-4 h-4 text-rose-450" /> BAN PROFILE EMAILS
                  </h4>
                  <p className="text-slate-400 leading-relaxed text-[11px] mb-3 uppercase">
                    Ban accounts permanently. Denies subsequent login, register operations, and closes any open child terminals.
                  </p>
                  
                  {/* Inner dynamic input */}
                  <div className="flex gap-1.5 mb-3">
                    <input
                      type="email"
                      value={newBannedEmail}
                      onChange={(e) => setNewBannedEmail(e.target.value)}
                      placeholder="E.g. spam@alert.com"
                      className="flex-1 bg-slate-900 border border-slate-800 p-1.5 rounded text-[11px] text-white focus:outline-none focus:border-rose-500 uppercase font-mono"
                    />
                    <button
                      onClick={() => handleBlacklistEmail(newBannedEmail)}
                      className="bg-rose-600 hover:bg-rose-500 text-slate-950 font-black px-3 py-1.5 rounded text-[10px] uppercase"
                    >
                      Ban
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-850">
                  <span className="text-[10px] text-slate-500 block mb-1">BLACK-LISTED PROFILES ({blacklistedEmails.length}):</span>
                  {blacklistedEmails.length === 0 ? (
                    <span className="text-[9px] text-slate-600 italic">No emails banned in system.</span>
                  ) : (
                    <div className="max-h-[65px] overflow-y-auto space-y-1">
                      {blacklistedEmails.map(mail => (
                        <div key={mail} className="flex justify-between items-center bg-slate-950 p-1 rounded border border-slate-850 font-mono text-[10px]">
                          <span className="text-slate-350 truncate max-w-[130px]">{mail}</span>
                          <button
                            onClick={() => handleUnblacklistEmail(mail)}
                            className="text-rose-400 hover:text-rose-350 text-[9px] px-1 font-bold underline"
                          >
                            Lift
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Card 3: Network Node IP Blocklist Management */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-cyan-400 flex items-center gap-1.5 mb-2">
                    <Wifi className="w-4 h-4 text-cyan-450" /> BAN DEVICE IP NODES
                  </h4>
                  <p className="text-slate-400 leading-relaxed text-[11px] mb-3 uppercase">
                    Inhibit malicious client devices by connection IP route blocks. Terminate and blacklist the remote terminal socket logs.
                  </p>
                  
                  {/* Inner inputs */}
                  <div className="flex gap-1.5 mb-3">
                    <input
                      type="text"
                      value={newBannedIP}
                      onChange={(e) => setNewBannedIP(e.target.value)}
                      placeholder="E.g. 192.168.1.10"
                      className="flex-1 bg-slate-900 border border-slate-800 p-1.5 rounded text-[11px] text-white focus:outline-none focus:border-cyan-500 uppercase font-mono"
                    />
                    <button
                      onClick={() => handleBlacklistIP(newBannedIP)}
                      className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black px-3 py-1.5 rounded text-[10px] uppercase"
                    >
                      Ban
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-850">
                  <span className="text-[10px] text-slate-500 block mb-1">BANNED NETWORK IPS ({blacklistedIPs.length}):</span>
                  {blacklistedIPs.length === 0 ? (
                    <span className="text-[9px] text-slate-600 italic">No network IPs banned yet.</span>
                  ) : (
                    <div className="max-h-[65px] overflow-y-auto space-y-1">
                      {blacklistedIPs.map(ipAddress => (
                        <div key={ipAddress} className="flex justify-between items-center bg-slate-950 p-1 rounded border border-slate-850 font-mono text-[10px]">
                          <span className="text-slate-350 truncate max-w-[130px]">{ipAddress}</span>
                          <button
                            onClick={() => handleUnblacklistIP(ipAddress)}
                            className="text-cyan-400 hover:text-cyan-300 text-[9px] px-1 font-bold underline"
                          >
                            Lift
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>

          </section>
        )}

      </main>

      {/* FOOTER */}
      <footer className="mt-16 border-t border-slate-900 bg-slate-950 pt-8 pb-12 font-mono text-xs text-slate-550 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="flex flex-wrap gap-4 justify-center items-center">
            <span className="flex items-center gap-1.5 text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              All-India Road SOS National Security Network — Global Mode
            </span>
            <span className="text-slate-700">•</span>
            <span>Accuracy: Dual Band GLONASS Satellite Connected</span>
          </div>
          
          <div className="p-4 bg-slate-900/30 border border-slate-900 inline-block rounded-2xl max-w-xl mx-auto">
            <p className="text-slate-400 leading-relaxed italic">
              Caution for drivers: Regional offline maps tiles cache locally. Emergency satellite override alerts coordinates directly to PCR police. Avoid driving distractions.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div>
              &copy; {new Date().getFullYear()} Road SOS Safe Driving Companion Inc.
            </div>
            
            <div className="text-slate-350 bg-slate-900 font-mono p-2 px-4 rounded-xl border border-slate-800 shadow-inner">
              Primary System developed & perfected:{" "}
              <strong className="bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent uppercase tracking-wider font-extrabold text-[12px]">
                Made by Ansh Khare
              </strong>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
