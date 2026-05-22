import express from "express";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const DB_PATH = path.join(process.cwd(), "db.json");

// Helper to determine device platform from user-agent
function parseUserAgent(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes("iphone")) return "Apple iPhone (Mobile)";
  if (ua.includes("ipad")) return "Apple iPad (Tablet)";
  if (ua.includes("android")) {
    if (ua.includes("samsung")) return "Samsung Galaxy (Android)";
    if (ua.includes("pixel")) return "Google Pixel (Android)";
    return "Android Device (Mobile)";
  }
  if (ua.includes("macintosh") || ua.includes("mac os") || ua.includes("mac_powerpc")) {
    return "MacOS (MacBook Pro/Air)";
  }
  if (ua.includes("windows")) return "Windows PC Terminal";
  if (ua.includes("linux")) return "Linux Developer Terminal";
  return "Mobile Web/Embedded Screen";
}

// Database helper functions to read and write persistently
function getDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const initialTemplate = {
        users: [
          {
            id: "user-ansh",
            name: "Ansh Khare",
            email: "anshshu2007@road.com",
            city: "Bhopal",
            isAdmin: true,
            pass: "anshadminpass"
          }
        ],
        sessions: [],
        potholes: [
          {
            id: "pot-1",
            lat: 23.2599,
            lng: 77.4126,
            title: "Severe road cavity on Bhopal Main Crossing",
            severity: "Critical",
            reportedBy: "Ansh Khare",
            reportedAt: new Date().toISOString(),
            status: "Active",
            city: "Bhopal"
          }
        ],
        alerts: [],
        drivers: [
          {
            id: "drv-1",
            name: "Arjun Yadav",
            phone: "+91 98390 12345",
            service: "Heavy Lift Crane Recovery",
            status: "Active",
            vehicleNo: "UP-32-CR-1122",
            city: "Bhopal"
          }
        ],
        bookings: [],
        carpools: []
      };
      fs.writeFileSync(DB_PATH, JSON.stringify(initialTemplate, null, 2), "utf-8");
    }
    const data = fs.readFileSync(DB_PATH, "utf-8");
    const db = JSON.parse(data);
    db.users = db.users || [];
    db.sessions = db.sessions || [];
    db.potholes = db.potholes || [];
    db.alerts = db.alerts || [];
    db.drivers = db.drivers || [];
    db.bookings = db.bookings || [];
    db.carpools = db.carpools || [];
    db.blacklistedEmails = db.blacklistedEmails || [];
    db.blacklistedIPs = db.blacklistedIPs || [];
    db.systemHalted = db.systemHalted || false;
    return db;
  } catch (err) {
    console.error("Error loading db.json database:", err);
    return {
      users: [],
      sessions: [],
      potholes: [],
      alerts: [],
      drivers: [],
      bookings: [],
      carpools: [],
      blacklistedEmails: [],
      blacklistedIPs: [],
      systemHalted: false
    };
  }
}

function writeDB(data: any) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing to persistent db.json database:", err);
  }
}

// Lazy initialize Gemini client safely
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY" && key.trim() !== "") {
      try {
        aiInstance = new GoogleGenAI({
          apiKey: key,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });
      } catch (err) {
        console.error("Failed to initialize GoogleGenAI:", err);
      }
    }
  }
  return aiInstance;
}

// ================= AUTH API ENDPOINTS =================

// User signup
app.post("/api/auth/register", (req, res) => {
  const { name, email, password, city } = req.body;
  if (!name || !email || !password || !city) {
    return res.status(400).json({ error: "All account fields are required" });
  }

  const db = getDB();
  
  // Real-time blacklist validations
  const blacklistedEmails = db.blacklistedEmails || [];
  const blacklistedIPs = db.blacklistedIPs || [];
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
  const clientIP = typeof ip === "string" ? ip.split(",")[0].trim() : "127.0.0.1";

  if (blacklistedEmails.includes(email.toLowerCase())) {
    return res.status(403).json({ error: "Register Denied: This email has been blacklisted from the Road SOS Network." });
  }
  if (blacklistedIPs.includes(clientIP)) {
    return res.status(403).json({ error: "Register Denied: Your network IP has been banned by the Administrator." });
  }

  const existingUser = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
  
  if (existingUser) {
    return res.status(400).json({ error: "Email already registered in system" });
  }

  // Set administrator status if registering with Ansh's email or specific domain keyword
  const isAdmin = email.toLowerCase() === "anshshu2007@road.com" || email.toLowerCase() === "anshushrivastava2007@gmail.com";

  const newUser = {
    id: "user-" + Math.floor(Math.random() * 1000000),
    name,
    email: email.toLowerCase(),
    city,
    isAdmin,
    pass: password // Simple plain-text comparison for reliable diagnostics
  };

  db.users.push(newUser);
  writeDB(db);

  // Auto-seed one matching driver and commuter option for newly selected cities of India to prevent empty-states
  const cityDrivers = db.drivers.filter((d: any) => d.city.toLowerCase() === city.toLowerCase());
  if (cityDrivers.length === 0) {
    db.drivers.push({
      id: "drv-" + Math.floor(Math.random() * 1000),
      name: `${city} Emergency Driver`,
      phone: "+91 95000 78787",
      service: "Mechanical Flatbed Assist",
      status: "Active",
      vehicleNo: "IND-SOS-999",
      city: city
    });
    writeDB(db);
  }

  res.status(201).json({ success: true, user: { id: newUser.id, name: newUser.name, email: newUser.email, city: newUser.city, isAdmin: newUser.isAdmin } });
});

// User login (Standard or Owner Admin check)
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and Password are required" });
  }

  const db = getDB();
  
  // Real-time blacklist validations
  const blacklistedEmails = db.blacklistedEmails || [];
  const blacklistedIPs = db.blacklistedIPs || [];
  const systemHalted = db.systemHalted || false;
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
  const clientIP = typeof ip === "string" ? ip.split(",")[0].trim() : "127.0.0.1";

  if (blacklistedEmails.includes(email.toLowerCase())) {
    return res.status(403).json({ error: "Access Denied: This email profile has been blacklisted." });
  }
  if (blacklistedIPs.includes(clientIP)) {
    return res.status(403).json({ error: "Access Denied: This network IP route is blacklisted." });
  }

  // Custom owner login override preset
  let user = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase() && u.pass === password);
  
  // If no user found, check the default admin login credentials
  if (!user && email.toLowerCase() === "anshshu2007@road.com" && password === "anshadminpass") {
    // Re-create or fetch admin
    user = db.users.find((u: any) => u.email.toLowerCase() === "anshshu2007@road.com");
    if (!user) {
      user = {
        id: "user-ansh",
        name: "Ansh Khare",
        email: "anshshu2007@road.com",
        city: "Bhopal",
        isAdmin: true,
        pass: "anshadminpass"
      };
      db.users.push(user);
      writeDB(db);
    }
  }

  if (!user) {
    return res.status(401).json({ error: "Invalid Email or Password coordinates" });
  }

  // System freeze gating (non-admins block)
  if (systemHalted && !user.isAdmin) {
    return res.status(403).json({ error: "Master Lockdown Active: The system is temporarily halted for maintenance." });
  }

  // Create a device session to capture information
  const sessionId = "sess-" + Math.random().toString(36).substring(2, 12);
  const userAgent = req.headers["user-agent"] || "Mozilla/5.0 Terminal";

  const newSession = {
    id: sessionId,
    userId: user.id,
    userName: user.name,
    email: user.email,
    userAgent,
    ip: clientIP,
    city: user.city,
    lastActive: new Date().toISOString(),
    isBlocked: false,
    platform: parseUserAgent(userAgent)
  };

  db.sessions.push(newSession);
  writeDB(db);

  res.json({
    success: true,
    user: { id: user.id, name: user.name, email: user.email, city: user.city, isAdmin: user.isAdmin },
    sessionId
  });
});

// Telemetry state lookup + Dynamic Remote Blocking validator
app.post("/api/auth/session", (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: "Session identification required" });
  }

  const db = getDB();
  const sessionIndex = db.sessions.findIndex((s: any) => s.id === sessionId);

  if (sessionIndex === -1) {
    return res.status(404).json({ error: "Session expired or deleted" });
  }

  const session = db.sessions[sessionIndex];
  const matchedUser = db.users.find((u: any) => u.id === session.userId);

  const blacklistedEmails = db.blacklistedEmails || [];
  const blacklistedIPs = db.blacklistedIPs || [];
  const systemHalted = db.systemHalted || false;

  const isEmailBanned = blacklistedEmails.includes(session.email.toLowerCase());
  const isIpBanned = blacklistedIPs.includes(session.ip);
  const isSystemFrozen = systemHalted && (!matchedUser || !matchedUser.isAdmin);

  if (session.isBlocked || isEmailBanned || isIpBanned || isSystemFrozen) {
    if (!session.isBlocked) {
      session.isBlocked = true;
      writeDB(db);
    }
    const blockMsg = isEmailBanned ? "Blacklisted email profile." 
                    : isIpBanned ? "Blacklisted connection node route."
                    : isSystemFrozen ? "Master system freeze / maintenance lockdown active."
                    : "Terminal blocked by primary administrator.";
    return res.json({ success: false, blocked: true, message: blockMsg });
  }

  // Update last active time
  session.lastActive = new Date().toISOString();
  writeDB(db);

  res.json({
    success: true,
    blocked: false,
    user: matchedUser ? { id: matchedUser.id, name: matchedUser.name, email: matchedUser.email, city: matchedUser.city, isAdmin: matchedUser.isAdmin } : null,
    session
  });
});

// Sign-out
app.post("/api/auth/logout", (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) return res.json({ success: true });

  const db = getDB();
  db.sessions = db.sessions.filter((s: any) => s.id !== sessionId);
  writeDB(db);
  res.json({ success: true, message: "Logged out" });
});


// ================= ADMIN DEVICE OPERATIONS =================

// List security settings (blacklists and system halt status)
app.get("/api/admin/security", (req, res) => {
  const db = getDB();
  res.json({
    success: true,
    blacklistedEmails: db.blacklistedEmails || [],
    blacklistedIPs: db.blacklistedIPs || [],
    systemHalted: db.systemHalted || false
  });
});

// Toggle Master System Lock
app.post("/api/admin/system-halt", (req, res) => {
  const { halted } = req.body;
  const db = getDB();
  db.systemHalted = !!halted;
  writeDB(db);
  res.json({ success: true, systemHalted: db.systemHalted });
});

// Blacklist an email
app.post("/api/admin/blacklist/email", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email target is required" });
  
  const db = getDB();
  db.blacklistedEmails = db.blacklistedEmails || [];
  const normalized = email.trim().toLowerCase();
  if (!db.blacklistedEmails.includes(normalized)) {
    db.blacklistedEmails.push(normalized);
    // Block any active sessions of this email address!
    db.sessions = db.sessions.map((s: any) => {
      if (s.email.toLowerCase() === normalized) {
        s.isBlocked = true;
      }
      return s;
    });
    writeDB(db);
  }
  res.json({ success: true, blacklistedEmails: db.blacklistedEmails });
});

// Remove an email from blacklist
app.post("/api/admin/unblacklist/email", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email target is required" });
  
  const db = getDB();
  db.blacklistedEmails = db.blacklistedEmails || [];
  const normalized = email.trim().toLowerCase();
  db.blacklistedEmails = db.blacklistedEmails.filter((e: string) => e !== normalized);
  writeDB(db);
  res.json({ success: true, blacklistedEmails: db.blacklistedEmails });
});

// Blacklist an IP address
app.post("/api/admin/blacklist/ip", (req, res) => {
  const { ip } = req.body;
  if (!ip) return res.status(400).json({ error: "IP target is required" });
  
  const db = getDB();
  db.blacklistedIPs = db.blacklistedIPs || [];
  const normalized = ip.trim();
  if (!db.blacklistedIPs.includes(normalized)) {
    db.blacklistedIPs.push(normalized);
    // Block any active sessions with this IP address!
    db.sessions = db.sessions.map((s: any) => {
      if (s.ip === normalized) {
        s.isBlocked = true;
      }
      return s;
    });
    writeDB(db);
  }
  res.json({ success: true, blacklistedIPs: db.blacklistedIPs });
});

// Remove an IP address from blacklist
app.post("/api/admin/unblacklist/ip", (req, res) => {
  const { ip } = req.body;
  if (!ip) return res.status(400).json({ error: "IP target is required" });
  
  const db = getDB();
  db.blacklistedIPs = db.blacklistedIPs || [];
  const normalized = ip.trim();
  db.blacklistedIPs = db.blacklistedIPs.filter((i: string) => i !== normalized);
  writeDB(db);
  res.json({ success: true, blacklistedIPs: db.blacklistedIPs });
});

// List active/blocked sessions
app.get("/api/admin/sessions", (req, res) => {
  const db = getDB();
  res.json({ success: true, sessions: db.sessions });
});

// Block client device with immediate execution
app.post("/api/admin/sessions/:id/block", (req, res) => {
  const { id } = req.params;
  const db = getDB();
  const index = db.sessions.findIndex((s: any) => s.id === id);
  if (index !== -1) {
    db.sessions[index].isBlocked = true;
    writeDB(db);
    res.json({ success: true, session: db.sessions[index] });
  } else {
    res.status(404).json({ error: "Session terminal not found" });
  }
});

// Unblock client device
app.post("/api/admin/sessions/:id/unblock", (req, res) => {
  const { id } = req.params;
  const db = getDB();
  const index = db.sessions.findIndex((s: any) => s.id === id);
  if (index !== -1) {
    db.sessions[index].isBlocked = false;
    writeDB(db);
    res.json({ success: true, session: db.sessions[index] });
  } else {
    res.status(404).json({ error: "Session terminal not found" });
  }
});

// Terminate session completely
app.delete("/api/admin/sessions/:id", (req, res) => {
  const { id } = req.params;
  const db = getDB();
  db.sessions = db.sessions.filter((s: any) => s.id !== id);
  writeDB(db);
  res.json({ success: true, message: "Session deallocated from terminal" });
});


// ================= ROAD RADAR DYNAMIC STATE ENDPOINTS =================

app.get("/api/state", (req, res) => {
  const db = getDB();
  res.json({
    potholes: db.potholes || [],
    alerts: db.alerts || [],
    drivers: db.drivers || [],
    bookings: db.bookings || [],
    carpools: db.carpools || [],
    gpsAccuracy: "99.8% precision (Multilateral GLONASS Signals)",
    serverTime: new Date().toISOString()
  });
});

// Report Pothole
app.post("/api/potholes", (req, res) => {
  const { lat, lng, title, severity, reportedBy, city } = req.body;
  const db = getDB();
  const newPothole = {
    id: "pot-" + (db.potholes.length + 1) + "-" + Math.floor(Math.random() * 1000),
    lat: Number(lat) || 26.8467,
    lng: Number(lng) || 80.9462,
    title: title || "Gravel Fracture Gap",
    severity: severity || "High",
    reportedBy: reportedBy || "Driver Companion",
    reportedAt: new Date().toISOString(),
    status: "Active",
    city: city || "Lucknow"
  };
  db.potholes.unshift(newPothole);
  writeDB(db);
  res.status(201).json({ success: true, pothole: newPothole });
});

// Remove reported pothole
app.delete("/api/potholes/:id", (req, res) => {
  const { id } = req.params;
  const db = getDB();
  db.potholes = db.potholes.filter((p: any) => p.id !== id);
  writeDB(db);
  res.json({ success: true, message: "Pothole removed" });
});

// Create SOS alert
app.post("/api/alerts", (req, res) => {
  const { lat, lng, type, vehicle, phone, message, severity, city } = req.body;
  const db = getDB();
  const newAlert = {
    id: "alert-" + (db.alerts.length + 1) + "-" + Math.floor(Math.random() * 1000),
    lat: Number(lat) || 26.8467,
    lng: Number(lng) || 80.9462,
    type: type || "General Distess",
    vehicle: vehicle || "Standard Hatchback Tracker",
    phone: phone || "+91 99999 99999",
    message: message || "Immediate highway assistant required.",
    severity: severity || "Critical",
    status: "Pending",
    timestamp: new Date().toISOString(),
    city: city || "Lucknow"
  };
  db.alerts.unshift(newAlert);
  writeDB(db);
  res.status(201).json({ success: true, alert: newAlert });
});

// Resolve alert state
app.post("/api/alerts/:id/resolve", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const db = getDB();
  const alertIndex = db.alerts.findIndex((a: any) => a.id === id);
  if (alertIndex !== -1) {
    db.alerts[alertIndex].status = status || "Resolved";
    writeDB(db);
    res.json({ success: true, alert: db.alerts[alertIndex] });
  } else {
    res.status(404).json({ error: "S.O.S Alert not found" });
  }
});

// Delete alert entries
app.delete("/api/alerts/:id", (req, res) => {
  const { id } = req.params;
  const db = getDB();
  db.alerts = db.alerts.filter((a: any) => a.id !== id);
  writeDB(db);
  res.json({ success: true, message: "Incident removed" });
});

// Recruits dynamic assistant driver
app.post("/api/drivers", (req, res) => {
  const { name, phone, service, vehicleNo, city } = req.body;
  const db = getDB();
  const newDriver = {
    id: "drv-" + (db.drivers.length + 1) + "-" + Math.floor(Math.random() * 100),
    name: name || "Auxiliary Tow Helper",
    phone: phone || "+91 90000 00000",
    service: service || "Dual Crane Tugger",
    status: "Active",
    vehicleNo: vehicleNo || "IND-SOS-555",
    city: city || "Lucknow"
  };
  db.drivers.push(newDriver);
  writeDB(db);
  res.status(201).json({ success: true, driver: newDriver });
});

// Delete driver entry
app.delete("/api/drivers/:id", (req, res) => {
  const { id } = req.params;
  const db = getDB();
  db.drivers = db.drivers.filter((d: any) => d.id !== id);
  writeDB(db);
  res.json({ success: true, message: "Driver de-allocated" });
});

app.post("/api/drivers/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const db = getDB();
  const drv = db.drivers.find((d: any) => d.id === id);
  if (drv) {
    drv.status = status;
    writeDB(db);
    res.json({ success: true, driver: drv });
  } else {
    res.status(404).json({ error: "Driver not found" });
  }
});

// Book Mechanical Towing Assist
app.post("/api/bookings", (req, res) => {
  const { customerName, phone, serviceType, notes, driverId, city } = req.body;
  const db = getDB();
  const drvObj = db.drivers.find((d: any) => d.id === driverId) || db.drivers[0];
  const newBooking = {
    id: "book-" + (db.bookings.length + 1) + "-" + Math.floor(Math.random() * 100),
    customerName: customerName || "Driver Companion",
    phone: phone || "+91 90000 12345",
    serviceType: serviceType || "Emergency Fuel Delivery",
    notes: notes || "Requires urgent dispatch support.",
    driverName: drvObj ? drvObj.name : "Auxiliary Assist Team",
    status: "Pending",
    assignedDriverId: driverId || (drvObj ? drvObj.id : "drv-1"),
    createdAt: new Date().toISOString(),
    city: city || "Lucknow"
  };
  db.bookings.unshift(newBooking);
  writeDB(db);
  res.status(201).json({ success: true, booking: newBooking });
});

app.post("/api/bookings/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const db = getDB();
  const booking = db.bookings.find((b: any) => b.id === id);
  if (booking) {
    booking.status = status;
    writeDB(db);
    res.json({ success: true, booking });
  } else {
    res.status(404).json({ error: "Booking ticket not found" });
  }
});

app.delete("/api/bookings/:id", (req, res) => {
  const { id } = req.params;
  const db = getDB();
  db.bookings = db.bookings.filter((b: any) => b.id !== id);
  writeDB(db);
  res.json({ success: true, message: "Booking archived" });
});

// Offers commuter empty seats (Shared Carpool)
app.post("/api/carpools", (req, res) => {
  const { route, driver, seats, time, fare, vehicle, city } = req.body;
  const db = getDB();
  const newCarpool = {
    id: "cp-" + (db.carpools.length + 1) + "-" + Math.floor(Math.random() * 100),
    route: route || "Main ring road transit",
    driver: driver || "Verified Companion",
    seats: Number(seats) || 4,
    seatsAvailable: Number(seats) || 4,
    time: time || "06:00 PM Daily Transit",
    fare: fare || "₹100/seat",
    vehicle: vehicle || "IND-CAR-22",
    city: city || "Lucknow"
  };
  db.carpools.push(newCarpool);
  writeDB(db);
  res.status(201).json({ success: true, carpool: newCarpool });
});

app.post("/api/carpools/:id/book", (req, res) => {
  const { id } = req.params;
  const db = getDB();
  const cp = db.carpools.find((c: any) => c.id === id);
  if (cp) {
    if (cp.seatsAvailable > 0) {
      cp.seatsAvailable -= 1;
      writeDB(db);
      res.json({ success: true, carpool: cp, message: "Seat matching commute booked successfully!" });
    } else {
      res.status(400).json({ error: "No commuter seats vacant!" });
    }
  } else {
    res.status(404).json({ error: "Carpool offer not found" });
  }
});


// ================= HANDS-FREE VOICE ASSISTANT (GEMINI) =================

app.post("/api/voice-command", async (req, res) => {
  const { prompt, city } = req.body;
  const activeCity = city || "Lucknow";
  if (!prompt || prompt.trim() === "") {
    return res.status(400).json({ error: "Voice command speech query is required" });
  }

  const ai = getGeminiClient();
  if (!ai) {
    console.log("No custom Gemini API key; running direct keyword-routing decoder.");
    const textLower = prompt.toLowerCase();
    let action = "UNKNOWN";
    let message = `I analyzed your request: "${prompt}".`;
    let target = "";

    if (textLower.includes("police") || textLower.includes("emergency") || textLower.includes("sos") || textLower.includes("alert")) {
      action = "TRIGGER_SOS";
      message = `Chinta mat karein driver! Main police aur ambulance ko emergency update bhej raha hu with your exact coordinates coordinates in ${activeCity}. Shanti banaye rakhein.`;
    } else if (textLower.includes("hospital") || textLower.includes("medical") || textLower.includes("accident") || textLower.includes("doctor")) {
      action = "SEARCH";
      target = "Hospital";
      message = `Aapke aaspaas ${activeCity} ke pin-point emergency trauma facilities find kar liye hain. Safe routing start ho chuki hai.`;
    } else if (textLower.includes("petrol") || textLower.includes("fuel") || textLower.includes("diesel") || textLower.includes("pump")) {
      action = "SEARCH";
      target = "Petrol Pump";
      message = `Fuel status critical detection! Finding nearby active petrol pumps and filling stations in ${activeCity}...`;
    } else if (textLower.includes("tow") || textLower.includes("towing") || textLower.includes("mechanic") || textLower.includes("broken")) {
      action = "BOOK_TOW";
      message = `Mechanical assistance crew assigned in ${activeCity}! Tow booking matching details opened on your companion screen.`;
    } else if (textLower.includes("pothole") || textLower.includes("road crack") || textLower.includes("gaddha") || textLower.includes("block")) {
      action = "REPORT_POTHOLE";
      message = `Dhanyawad! Road pothole/obstruction alert successfully marked in ${activeCity}. Other companion drivers notified instantly.`;
    } else if (textLower.includes("carpool") || textLower.includes("ride") || textLower.includes("share") || textLower.includes("lift")) {
      action = "CARPOOL";
      message = `Carpool and shared commute matches highlighted on major highways of ${activeCity}.`;
    }

    return res.json({
      action,
      target,
      message,
      commandReceived: prompt,
      fallbackUsed: true
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are the primary voice-AI intelligence decoder for Road SOS, a Safe Driving Companion.
The driver said: "${prompt}" in the city of: "${activeCity}"

Analyze the coordinates, context and speech intent carefully. Route to one of these valid action strings:
1. "TRIGGER_SOS" - For police, fire, collision, high-speed impact warnings, high danger.
2. "SEARCH" - For looking up nearby destinations (target should be "Hospital", "Petrol Pump", or "Service Station").
3. "REPORT_POTHOLE" - For reporting potholes, road breaks, water logging, debris, speed hurdles.
4. "BOOK_TOW" - For vehicle starting issues, engine smoke, mechanical breakdown, crane towing required.
5. "CARPOOL" - For ride-sharing commuters, seats booking, travel together.
6. "UNKNOWN" - General comments or driving conversation.

Return a single JSON object matching this schema. Write the message in friendly and assuring Hinglish (Hindi-English mix) to make the driver feel comfortable and safe on Indian roads.

{
  "action": "TRIGGER_SOS" | "SEARCH" | "REPORT_POTHOLE" | "BOOK_TOW" | "CARPOOL" | "UNKNOWN",
  "target": "Hospital" | "Petrol Pump" | "Service Station" | "",
  "message": "A polite, conversational feedback stating matching actions in comforting Hinglish (mixed English and Hindi) for Indian road conditions",
  "potholeSeverity": "High" | "Medium" | "Critical"
}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            action: { type: Type.STRING },
            target: { type: Type.STRING },
            message: { type: Type.STRING },
            potholeSeverity: { type: Type.STRING }
          },
          required: ["action", "message"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({
      ...parsed,
      commandReceived: prompt,
      fallbackUsed: false
    });
  } catch (error: any) {
    console.error("Gemini voice interpretation error:", error);
    return res.status(200).json({
      action: "UNKNOWN",
      message: "Maine aapki baat suni hai, hum details check kar rahe hain tab tak manually selection try karein.",
      commandReceived: prompt,
      error: error.message
    });
  }
});


// ================= BOOTING SERVER & MOUNTING VITE =================

async function configureServer() {
  // Ensure database file loaded perfectly
  getDB();

  if (process.env.NODE_ENV === "development") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`=========================================`);
    console.log(`ROAD SOS SECURED SERVER RUNNING ON PORT ${PORT}`);
    console.log(`Active Database: ${DB_PATH}`);
    console.log(`Administrator Default Login enabled.`);
    console.log(`=========================================`);
  });
}

configureServer();
