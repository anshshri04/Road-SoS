export interface User {
  id: string;
  name: string;
  email: string;
  city: string;
  isAdmin: boolean;
}

export interface DeviceSession {
  id: string;
  userId: string;
  userName: string;
  email: string;
  userAgent: string;
  ip: string;
  city: string;
  lastActive: string;
  isBlocked: boolean;
  platform: string; // e.g., Android, Apple iPhone, Windows PC, Mac
}

export interface Pothole {
  id: string;
  lat: number;
  lng: number;
  title: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  reportedBy: string;
  reportedAt: string;
  status: "Active" | "Resolved";
  city: string; // Dynamic city context
}

export interface SOSAlert {
  id: string;
  lat: number;
  lng: number;
  type: string;
  vehicle: string;
  phone: string;
  message: string;
  severity: "High" | "Critical";
  status: "Pending" | "Dispatched" | "Resolved";
  timestamp: string;
  city: string; // Dynamic city context
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  service: string;
  status: "Active" | "Busy" | "Offline";
  vehicleNo: string;
  city: string;
}

export interface Booking {
  id: string;
  customerName: string;
  phone: string;
  serviceType: string;
  notes: string;
  driverName: string;
  status: "Pending" | "In Progress" | "Completed" | "Cancelled";
  assignedDriverId: string;
  createdAt: string;
  city: string;
}

export interface Carpool {
  id: string;
  route: string;
  driver: string;
  seats: number;
  seatsAvailable: number;
  time: string;
  fare: string;
  vehicle: string;
  city: string; // Commuting City (e.g., Delhi, Mumbai, Bengaluru, Lucknow)
}

export interface VoiceCommandResponse {
  action: "TRIGGER_SOS" | "SEARCH" | "REPORT_POTHOLE" | "BOOK_TOW" | "CARPOOL" | "UNKNOWN";
  target?: "Hospital" | "Petrol Pump" | "Service Station" | "";
  message: string;
  potholeSeverity?: "Low" | "Medium" | "High" | "Critical";
  commandReceived: string;
}

export interface TrafficAlert {
  id: string;
  route: string;
  type: "Congestion" | "Crash Accent" | "Water Logging" | "Slow Movement";
  delayText: string;
  distance: string;
  city: string;
}
