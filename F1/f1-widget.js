// Variables used by Scriptable.
// icon-color: orange; icon-glyph: flag-checkered;
// F1 weekend widget powered by OpenF1 (https://openf1.org) — no auth needed.
// Add this script as a MEDIUM home screen widget for the intended layout.

const API = "https://api.openf1.org/v1";

const PT_COUNTRY = {
  "Bahrain": "Bahrein",
  "Australia": "Austrália",
  "China": "China",
  "Japan": "Japão",
  "Saudi Arabia": "Arábia Saudita",
  "United States": "Estados Unidos",
  "Canada": "Canadá",
  "Monaco": "Mônaco",
  "Spain": "Espanha",
  "Austria": "Áustria",
  "United Kingdom": "Reino Unido",
  "Belgium": "Bélgica",
  "Hungary": "Hungria",
  "Netherlands": "Holanda",
  "Italy": "Itália",
  "Azerbaijan": "Azerbaijão",
  "Singapore": "Cingapura",
  "Mexico": "México",
  "Brazil": "Brasil",
  "United Arab Emirates": "Emirados Árabes Unidos",
  "Qatar": "Catar",
};

// Base track color per country, evoking each nation's flag/racing colors.
const TRACK_COLOR = {
  "Bahrain": "#CE1126",
  "Australia": "#00843D",
  "China": "#DE2910",
  "Japan": "#BC002D",
  "Saudi Arabia": "#006C35",
  "United States": "#3C3B6E",
  "Canada": "#FF0000",
  "Monaco": "#CE1126",
  "Spain": "#AA151B",
  "Austria": "#ED2939",
  "United Kingdom": "#00247D",
  "Belgium": "#FFD100",
  "Hungary": "#477050",
  "Netherlands": "#FF6A00",
  "Italy": "#008C45",
  "Azerbaijan": "#0092BC",
  "Singapore": "#EF3340",
  "Mexico": "#006341",
  "Brazil": "#009C3B",
  "United Arab Emirates": "#00732F",
  "Qatar": "#8D1B3D",
};
const DEFAULT_TRACK_COLOR = "#ff6a00";

// OpenF1 calls this circuit "Madring" (its official name); display it as "Madrid" instead.
const CIRCUIT_NAME_OVERRIDE = {
  Madring: "Madrid",
};

function shadeColor(hex, percent) {
  hex = hex.replace("#", "");
  const num = parseInt(hex, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  const adjust = c => Math.min(255, Math.max(0, Math.round(c + (percent < 0 ? c : 255 - c) * percent)));
  r = adjust(r);
  g = adjust(g);
  b = adjust(b);
  return "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("");
}

async function fetchJSON(url) {
  try {
    const req = new Request(url);
    return await req.loadJSON();
  } catch (e) {
    return null;
  }
}


// F1-mark.png: white F1 logo mark on transparent background, saved next to this script.
async function getF1Logo() {
  try {
    const fm = FileManager.iCloud();
    const path = fm.joinPath(fm.documentsDirectory(), "F1-mark.png");
    if (!fm.fileExists(path)) return null;
    if (!(await fm.isFileDownloaded(path))) {
      await fm.downloadFileFromiCloud(path);
    }
    return fm.readImage(path);
  } catch (e) {
    return null;
  }
}

// Local cache of the last successfully fetched meeting+sessions, used as a fallback
// when OpenF1 blocks free access (it does this globally while any session is live).
function getCacheFilePath() {
  const fm = FileManager.iCloud();
  return fm.joinPath(fm.documentsDirectory(), "F1-Widget-cache.json");
}

function saveScheduleCache(meeting, allSessions) {
  try {
    const fm = FileManager.iCloud();
    fm.writeString(getCacheFilePath(), JSON.stringify({ meeting, allSessions }));
  } catch (e) {
    // ignore cache write failures
  }
}

async function loadScheduleCache() {
  try {
    const fm = FileManager.iCloud();
    const path = getCacheFilePath();
    if (!fm.fileExists(path)) return null;
    if (!(await fm.isFileDownloaded(path))) {
      await fm.downloadFileFromiCloud(path);
    }
    const parsed = JSON.parse(fm.readString(path));
    if (!parsed || !parsed.meeting || !Array.isArray(parsed.allSessions)) return null;
    return parsed;
  } catch (e) {
    return null;
  }
}

// Hardcoded circuit outline for Madrid ("Madring", circuit_key 153) — brand-new for 2026,
// not yet available from multiviewer.app. Traced from the official layout SVG
// (Wikimedia Commons, Ficheiro:Madring_(2026).svg, CC BY-SA 4.0), y pre-flipped
// to cancel out computeTrackPoints' Y-up correction.
const MADRING_TRACE = {
  x: [29.19, 20.14, 19.96, 19.61, 19.14, 18.38, 17.31, 16.54, 15.99, 15.47, 14.95, 14.59, 14.35, 14.23, 13.99, 13.64, 13.49, 13.57, 13.78, 14.16, 14.59, 15.06, 15.57, 16.24, 16.95, 17.69, 18.59, 19.5, 20.84, 50.23, 51.46, 52.71, 54.31, 55.59, 57.13, 58.53, 59.93, 61.35, 62.97, 64.78, 66.64, 68.25, 69.85, 71.49, 73.36, 75.41, 77.57, 79.32, 81.02, 82.36, 83.71, 85.22, 87.1, 88.51, 90.23, 91.66, 92.95, 94.02, 94.73, 95.1, 95.89, 96.39, 96.94, 97.48, 97.97, 98.57, 99.16, 99.78, 100.3, 100.79, 101.25, 101.72, 102.56, 103.47, 105.55, 107.29, 108.52, 109.3, 109.98, 110.68, 111.39, 112.19, 113.01, 113.83, 114.82, 115.95, 117.01, 117.97, 119.23, 120.15, 121.09, 122.22, 123.09, 124.08, 124.98, 125.72, 126.47, 127.15, 127.71, 128.26, 128.77, 129.27, 129.69, 130.29, 130.6, 130.95, 131.41, 131.81, 132.27, 132.87, 133.32, 133.96, 134.46, 135.05, 135.48, 135.97, 136.54, 137.03, 137.57, 138.26, 139.05, 139.97, 140.85, 141.66, 142.3, 142.93, 143.66, 144.26, 145.33, 146.54, 147.65, 157.34, 158.05, 158.67, 159.2, 159.57, 160.15, 160.63, 161.29, 161.89, 163.13, 163.56, 164.02, 164.54, 165.06, 165.63, 166.12, 166.83, 167.41, 168.17, 168.96, 169.86, 170.58, 171.26, 171.99, 172.67, 173.52, 174.98, 176.33, 177.29, 178.21, 179.23, 180.68, 181.92, 183.0, 184.06, 184.88, 186.15, 187.28, 188.21, 189.09, 189.82, 190.31, 190.89, 191.34, 191.88, 192.41, 193.07, 193.58, 193.99, 194.39, 194.6, 194.71, 194.83, 194.84, 194.77, 194.48, 194.24, 193.93, 193.54, 192.97, 192.36, 191.69, 190.88, 190.11, 189.19, 188.27, 186.93, 185.34, 184.03, 182.7, 181.5, 180.19, 178.94, 177.53, 175.85, 174.21, 172.45, 170.72, 169.33, 168.01, 166.93, 165.35, 163.41, 161.6, 159.91, 158.37, 156.71, 155.18, 153.7, 152.38, 151.11, 149.88, 148.87, 148.26, 147.81, 147.8, 147.77, 147.73, 147.68, 147.63, 147.57, 147.53, 147.49, 147.46, 147.41, 147.35, 147.29, 147.24, 147.19, 147.16, 147.14, 146.66, 145.81, 144.45, 143.15, 141.44, 140.2, 139.56, 138.84, 138.37, 137.83, 137.28, 136.78, 136.22, 135.75, 134.87, 133.98, 133.08, 132.22, 129.44, 122.89, 121.16, 120.14, 119.01, 117.92, 117.25, 116.45, 115.71, 115.02, 114.32, 113.76, 113.19, 112.88, 112.44, 112.07, 111.79, 111.53, 111.2, 110.87, 110.69, 110.58, 110.5, 110.54, 110.61, 110.72, 110.85, 111.06, 111.46, 112.24, 112.65, 113.06, 113.2, 113.27, 113.29, 113.29, 113.13, 112.87, 112.35, 110.48, 107.78, 104.58, 100.56, 98.6, 96.9, 95.65, 94.92, 94.33, 94.01, 93.87, 93.65, 93.62, 93.6, 93.6, 93.79, 94.01, 94.18, 94.27, 94.36, 94.4, 94.38, 94.36, 94.08, 93.8, 93.48, 93.13, 92.54, 92.15, 91.61, 90.94, 90.2, 89.38, 88.41, 87.23, 86.01, 84.3, 83.03, 81.54, 79.83, 78.13, 76.0, 74.17, 71.3, 69.16, 66.55, 63.46, 61.8, 60.32, 59.51, 59.13, 58.94, 58.84, 58.74, 58.81, 58.92, 59.1, 59.29, 59.48, 59.96, 60.25, 60.54, 60.7, 60.85, 60.93, 61.52, 61.76, 61.76, 61.78, 61.74, 61.7, 61.56, 61.36, 61.03, 60.61, 60.15, 56.89, 54.99, 53.52, 51.46, 48.57, 45.02, 42.27, 39.21, 35.99, 34.78, 33.91, 33.07, 32.43, 31.64, 31.01, 30.52, 30.03, 29.63, 29.32],
  y: [-123.84, -69.11, -68.58, -68.32, -68.18, -68.13, -68.12, -68.08, -67.97, -67.77, -67.31, -66.77, -66.0, -65.15, -63.59, -61.26, -59.64, -58.23, -56.85, -55.76, -54.73, -53.82, -53.01, -52.05, -51.21, -50.53, -49.83, -49.13, -48.23, -29.99, -29.26, -28.59, -27.74, -27.07, -26.36, -25.79, -25.19, -24.68, -24.07, -23.48, -22.92, -22.49, -22.18, -21.94, -21.72, -21.6, -21.6, -21.6, -21.65, -21.9, -22.21, -22.59, -23.13, -23.59, -24.2, -24.83, -25.54, -26.27, -26.76, -27.06, -26.21, -25.74, -25.45, -25.29, -25.28, -25.4, -25.63, -26.13, -26.52, -26.6, -26.66, -26.63, -26.45, -26.17, -25.57, -25.01, -24.64, -24.34, -24.04, -23.63, -23.17, -22.57, -21.96, -21.48, -21.09, -20.66, -20.31, -20.03, -19.67, -19.49, -19.29, -19.1, -18.97, -18.74, -18.47, -18.16, -17.73, -17.26, -16.92, -16.64, -16.46, -16.38, -16.36, -16.48, -16.71, -17.08, -17.62, -18.25, -18.83, -19.52, -19.89, -20.15, -20.2, -20.26, -20.26, -20.22, -20.12, -19.92, -19.66, -19.27, -18.78, -18.23, -17.77, -17.37, -17.09, -16.87, -16.63, -16.56, -16.45, -16.43, -16.41, -16.3, -16.31, -16.45, -16.63, -16.84, -17.16, -17.54, -18.12, -18.65, -20.13, -20.76, -21.4, -22.13, -22.68, -23.27, -23.69, -24.19, -24.5, -24.82, -24.85, -24.85, -24.79, -24.76, -24.62, -24.3, -23.93, -23.28, -22.68, -22.28, -21.9, -21.48, -21.0, -20.73, -20.56, -20.4, -20.38, -20.58, -20.76, -21.11, -21.57, -22.06, -22.41, -22.88, -23.33, -23.87, -24.5, -25.47, -26.26, -26.98, -27.83, -28.65, -29.42, -30.3, -31.79, -33.83, -34.9, -35.57, -36.27, -37.0, -38.1, -38.95, -39.59, -40.36, -41.04, -41.68, -42.28, -42.94, -43.55, -43.93, -44.04, -44.06, -43.94, -43.75, -43.34, -42.63, -41.87, -41.01, -40.0, -39.09, -38.15, -37.33, -36.09, -34.56, -33.06, -31.72, -30.55, -29.32, -28.1, -27.05, -26.17, -25.39, -24.62, -24.11, -23.9, -23.8, -23.8, -23.8, -23.81, -23.82, -23.82, -23.83, -23.84, -23.84, -23.85, -23.87, -23.9, -23.93, -23.96, -23.99, -24.0, -24.01, -24.43, -25.39, -27.06, -28.82, -31.22, -32.98, -33.9, -34.6, -35.1, -35.6, -36.01, -36.41, -36.84, -37.19, -37.61, -37.88, -38.13, -38.29, -38.31, -38.17, -38.15, -38.31, -38.56, -39.03, -39.44, -39.98, -40.47, -41.0, -41.53, -42.07, -42.66, -43.11, -43.72, -44.35, -44.8, -45.33, -46.01, -46.94, -47.78, -48.69, -49.36, -59.07, -59.93, -60.61, -61.16, -61.7, -62.64, -64.27, -65.01, -65.76, -66.08, -66.39, -66.59, -66.96, -67.25, -67.55, -68.01, -69.45, -71.27, -73.24, -75.56, -76.66, -77.52, -78.15, -78.79, -79.55, -80.12, -80.66, -81.53, -82.17, -83.38, -84.4, -86.02, -87.43, -88.21, -89.14, -90.09, -91.01, -92.06, -93.33, -94.54, -95.67, -96.66, -97.47, -98.34, -98.95, -99.61, -100.29, -100.9, -101.46, -101.95, -102.33, -102.6, -102.87, -103.05, -103.25, -103.48, -103.82, -104.2, -104.49, -104.95, -105.34, -105.86, -106.39, -106.59, -106.78, -106.89, -107.08, -107.29, -107.47, -107.71, -108.06, -108.27, -108.52, -108.73, -109.01, -109.78, -110.31, -110.81, -111.13, -111.84, -112.76, -116.76, -118.21, -119.22, -120.17, -121.19, -121.65, -122.04, -122.22, -122.53, -122.79, -122.97, -124.02, -124.59, -124.98, -125.46, -125.97, -126.6, -127.13, -127.62, -128.22, -128.51, -128.55, -128.51, -128.44, -128.13, -127.69, -127.18, -126.52, -125.73, -124.76],
  rotation: 0,
};

async function getCircuitTrace(circuitKey, year) {
  if (circuitKey === 153) {
    return MADRING_TRACE;
  }
  try {
    const data = await fetchJSON(`https://api.multiviewer.app/api/v1/circuits/${circuitKey}/${year}`);
    if (!data || !data.x || !data.y || data.x.length < 2) return null;
    return { x: data.x, y: data.y, rotation: data.rotation || 0 };
  } catch (e) {
    return null;
  }
}

function computeTrackPoints(trace, canvasW, canvasH, pad) {
  const rad = (trace.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  // Subsample for smooth-enough shape without excessive draw calls.
  const step = Math.max(1, Math.floor(trace.x.length / 220));
  const raw = [];
  for (let i = 0; i < trace.x.length; i += step) {
    raw.push({ x: trace.x[i], y: trace.y[i] });
  }

  const cx = (Math.min(...raw.map(p => p.x)) + Math.max(...raw.map(p => p.x))) / 2;
  const cy = (Math.min(...raw.map(p => p.y)) + Math.max(...raw.map(p => p.y))) / 2;

  const rotated = raw.map(p => {
    const dx = p.x - cx;
    // Source data is Y-up (Cartesian); the canvas is Y-down, so flip here to avoid a mirrored track.
    const dy = -(p.y - cy);
    return { x: dx * cos - dy * sin, y: dx * sin + dy * cos };
  });

  const minX = Math.min(...rotated.map(p => p.x));
  const maxX = Math.max(...rotated.map(p => p.x));
  const minY = Math.min(...rotated.map(p => p.y));
  const maxY = Math.max(...rotated.map(p => p.y));

  const scale = Math.min((canvasW - pad * 2) / (maxX - minX), (canvasH - pad * 2) / (maxY - minY));
  const offX = pad + (canvasW - pad * 2 - (maxX - minX) * scale) / 2;
  const offY = pad + (canvasH - pad * 2 - (maxY - minY) * scale) / 2;

  return rotated.map(p => new Point(offX + (p.x - minX) * scale, offY + (p.y - minY) * scale));
}

// Simple single-color outline — small icon for the lock screen widget.
function drawTrackIcon(trace, color = Color.white(), canvasW = 100, canvasH = 100) {
  const pts = computeTrackPoints(trace, canvasW, canvasH, 6);

  const ctx = new DrawContext();
  ctx.size = new Size(canvasW, canvasH);
  ctx.opaque = false;
  ctx.respectScreenScale = true;

  const path = new Path();
  path.move(pts[0]);
  for (let i = 1; i < pts.length; i++) {
    path.addLine(pts[i]);
  }
  path.closeSubpath();
  ctx.addPath(path);
  ctx.setStrokeColor(color);
  ctx.setLineWidth(9);
  ctx.strokePath();

  ctx.setFillColor(color);
  const r = 4.5;
  for (const p of pts) {
    ctx.fillEllipse(new Rect(p.x - r, p.y - r, 9, 9));
  }

  return ctx.getImage();
}

function drawTrackImage(trace, baseColorHex, canvasW = 300, canvasH = 200) {
  const pts = computeTrackPoints(trace, canvasW, canvasH, 16);

  const ctx = new DrawContext();
  ctx.size = new Size(canvasW, canvasH);
  ctx.opaque = false;
  ctx.respectScreenScale = true;

  function layer(color, width, dx, dy) {
    const path = new Path();
    path.move(new Point(pts[0].x + dx, pts[0].y + dy));
    for (let i = 1; i < pts.length; i++) {
      path.addLine(new Point(pts[i].x + dx, pts[i].y + dy));
    }
    path.closeSubpath();
    ctx.addPath(path);
    ctx.setStrokeColor(color);
    ctx.setLineWidth(width);
    ctx.strokePath();

    ctx.setFillColor(color);
    const r = width / 2;
    for (const p of pts) {
      ctx.fillEllipse(new Rect(p.x + dx - r, p.y + dy - r, width, width));
    }
  }

  // Soft ambient shadow beneath the track (concentric fading ellipses fake a blur).
  const boundsMinX = Math.min(...pts.map(p => p.x));
  const boundsMaxX = Math.max(...pts.map(p => p.x));
  const boundsMaxY = Math.max(...pts.map(p => p.y));
  const shadowCx = (boundsMinX + boundsMaxX) / 2 + 4;
  const shadowCy = boundsMaxY + 5;
  const shadowBaseW = (boundsMaxX - boundsMinX) * 0.55;
  for (let i = 5; i >= 1; i--) {
    const rw = shadowBaseW * (0.55 + i * 0.13);
    const rh = rw * 0.26;
    ctx.setFillColor(new Color("#000000", 0.045 * i));
    ctx.fillEllipse(new Rect(shadowCx - rw / 2, shadowCy - rh / 2, rw, rh));
  }

  // Pseudo-3D: dark shadow -> mid tone -> base country color
  const midColor = shadeColor(baseColorHex, -0.35);
  layer(new Color("#000000", 0.35), 17, 3, 3.6);
  layer(new Color(midColor), 14.5, 1.6, 2.0);
  layer(new Color(baseColorHex), 13, 0, 0);

  return ctx.getImage();
}

async function getCurrentOrNextMeeting() {
  const year = new Date().getFullYear();
  const meetings = await fetchJSON(`${API}/meetings?year=${year}`);
  if (!Array.isArray(meetings)) return null;
  const now = new Date();
  const upcoming = meetings
    .filter(m => !m.is_cancelled && new Date(m.date_end) >= now)
    .sort((a, b) => new Date(a.date_start) - new Date(b.date_start));
  return upcoming[0] || null;
}

async function getMeetingRound(meeting) {
  const meetings = await fetchJSON(`${API}/meetings?year=${meeting.year}`);
  if (!Array.isArray(meetings)) return null;
  const races = meetings
    .filter(m => !m.is_cancelled && m.meeting_name !== "Pre-Season Testing")
    .sort((a, b) => new Date(a.date_start) - new Date(b.date_start));
  const idx = races.findIndex(m => m.meeting_key === meeting.meeting_key);
  return idx >= 0 ? idx + 1 : null;
}

async function getSessions(meetingKey) {
  const sessions = await fetchJSON(`${API}/sessions?meeting_key=${meetingKey}`);
  if (!Array.isArray(sessions)) return [];
  return sessions.sort((a, b) => new Date(a.date_start) - new Date(b.date_start));
}

function fmtWeekday(date) {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(date).toUpperCase();
}

function fmtMonthShort(date) {
  return new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(date).replace(".", "").toUpperCase();
}

function fmtDay(date) {
  return String(date.getDate()).padStart(2, "0");
}

function fmtTime(date) {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).format(date);
}

function fmtDateLine(date) {
  const month = new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(date);
  return `${month} ${fmtDay(date)}, ${fmtTime(date)}`;
}

function fmtCountdown(target, now) {
  const diffMs = target - now;
  if (diffMs <= 0) return "Agora";
  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${String(days).padStart(2, "0")}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

const NOTIFY_MINUTES_BEFORE = 10;

async function scheduleSessionNotifications(meeting, sessions) {
  const now = new Date();
  const country = PT_COUNTRY[meeting.country_name] || meeting.country_name;
  const circuitName = CIRCUIT_NAME_OVERRIDE[meeting.circuit_short_name] || meeting.circuit_short_name;
  const place = `${country} · ${circuitName}`;

  for (const s of sessions) {
    const start = new Date(s.date_start);
    if (start <= now) continue;

    const reminderTime = new Date(start.getTime() - NOTIFY_MINUTES_BEFORE * 60000);
    if (reminderTime > now) {
      const reminder = new Notification();
      reminder.identifier = `f1-remind-${s.session_key}`;
      reminder.title = `🏎️ ${s.session_name} em ${NOTIFY_MINUTES_BEFORE} min`;
      reminder.body = `${place} — começa às ${fmtTime(start)}`;
      reminder.sound = "default";
      reminder.setTriggerDate(reminderTime);
      await reminder.schedule();
    }

    const startNotif = new Notification();
    startNotif.identifier = `f1-start-${s.session_key}`;
    startNotif.title = `🔴 ${s.session_name} começou!`;
    startNotif.body = place;
    startNotif.sound = "default";
    startNotif.setTriggerDate(start);
    await startNotif.schedule();
  }
}

function buildLockScreenWidget(meeting, sessionsToShow, trace, f1Logo) {
  const widget = new ListWidget();
  const country = PT_COUNTRY[meeting.country_name] || meeting.country_name;

  const row = widget.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();

  const textCol = row.addStack();
  textCol.layoutVertically();

  const next = sessionsToShow.find(s => s.session_name === "Race") || sessionsToShow[0];
  if (!next) {
    const line = textCol.addText("Sem sessão agendada");
    line.font = Font.systemFont(10);
    line.textColor = Color.white();
  } else {
    const nextDate = new Date(next.date_start);
    const countdown = fmtCountdown(nextDate, new Date());

    const titleRow = textCol.addStack();
    titleRow.layoutHorizontally();
    titleRow.centerAlignContent();

    if (f1Logo) {
      const logoEl = titleRow.addImage(f1Logo);
      logoEl.imageSize = new Size(30, 8.9);
      titleRow.addSpacer(4);
    }

    const title = titleRow.addText(countdown);
    title.font = Font.boldSystemFont(17);
    title.textColor = Color.white();
    title.lineLimit = 1;
    title.minimumScaleFactor = 0.7;

    const dateLine = textCol.addText(fmtDateLine(nextDate));
    dateLine.font = Font.systemFont(11);
    dateLine.textColor = Color.white();
    dateLine.lineLimit = 1;
    dateLine.minimumScaleFactor = 0.7;

    textCol.addSpacer(3);

    const gpLine = textCol.addText(`GP da ${country}`);
    gpLine.font = Font.boldSystemFont(13);
    gpLine.textColor = Color.white();
    gpLine.lineLimit = 1;
    gpLine.minimumScaleFactor = 0.6;
  }

  if (trace) {
    row.addSpacer();
    const icon = drawTrackIcon(trace);
    const imgEl = row.addImage(icon);
    imgEl.imageSize = new Size(52, 52);
  }

  return widget;
}

async function createWidget() {
  const widget = new ListWidget();

  let meeting = null;
  let allSessions = [];

  try {
    meeting = await getCurrentOrNextMeeting();
  } catch (e) {
    meeting = null;
  }

  if (meeting) {
    allSessions = await getSessions(meeting.meeting_key);
    if (allSessions.length > 0) {
      saveScheduleCache(meeting, allSessions);
    } else {
      meeting = null;
    }
  }

  if (!meeting) {
    // OpenF1 blocks free access to everything (even /meetings) while any session
    // is live anywhere. Fall back to the last known-good schedule instead of
    // showing a misleading "no race scheduled" message.
    const cached = await loadScheduleCache();
    if (cached) {
      meeting = cached.meeting;
      allSessions = cached.allSessions;
    }
  }

  if (!meeting) {
    const t = widget.addText("Nenhuma corrida agendada");
    t.textColor = Color.white();
    return widget;
  }

  await scheduleSessionNotifications(meeting, allSessions);

  const now = new Date();
  const sessionsToShow = allSessions.slice(0, 5);

  const trace = await getCircuitTrace(meeting.circuit_key, meeting.year);
  const trackColor = TRACK_COLOR[meeting.country_name] || DEFAULT_TRACK_COLOR;
  const f1Logo = await getF1Logo();

  if (config.runsInAccessoryWidget) {
    return buildLockScreenWidget(meeting, sessionsToShow, trace, f1Logo);
  }

  // No fallback to meeting.circuit_image here: for brand-new circuits (e.g. Madrid's
  // debut in 2026) that flat icon can silently point to the wrong/old track shape.
  const trackImg = trace ? drawTrackImage(trace, trackColor) : null;
  const round = await getMeetingRound(meeting);

  const bgGradient = new LinearGradient();
  bgGradient.locations = [0, 1];
  bgGradient.colors = [new Color("#1c1c1c"), new Color("#0a0a0a")];
  widget.backgroundGradient = bgGradient;
  widget.setPadding(12, 8, 12, 14);

  const card = widget.addStack();
  card.size = new Size(300, 0);
  card.layoutHorizontally();
  card.centerAlignContent();

  // ---- LEFT column: country/circuit/date + track + Corrida summary ----
  const left = card.addStack();
  left.layoutVertically();
  left.size = new Size(130, 0);

  const logoRow = left.addStack();
  logoRow.layoutHorizontally();
  logoRow.centerAlignContent();

  if (f1Logo) {
    const logoEl = logoRow.addImage(f1Logo);
    logoEl.imageSize = new Size(26, 7.7);
    logoRow.addSpacer(5);
  }

  const countryName = (PT_COUNTRY[meeting.country_name] || meeting.country_name).toUpperCase();
  const countryText = logoRow.addText(countryName);
  countryText.font = Font.boldSystemFont(16);
  countryText.textColor = Color.white();
  countryText.minimumScaleFactor = 0.7;
  countryText.lineLimit = 1;

  left.addSpacer(5);

  const headerRow = left.addStack();
  headerRow.layoutHorizontally();
  headerRow.centerAlignContent();

  if (round != null) {
    const roundText = headerRow.addText(`${round}º`);
    roundText.font = Font.boldSystemFont(32);
    roundText.textColor = new Color("#6a6a6a");
    headerRow.addSpacer(5);
  }

  const headerInfo = headerRow.addStack();
  headerInfo.layoutVertically();

  const circuitText = headerInfo.addText(CIRCUIT_NAME_OVERRIDE[meeting.circuit_short_name] || meeting.circuit_short_name);
  circuitText.font = Font.boldSystemFont(12);
  circuitText.textColor = new Color(trackColor);

  headerInfo.addSpacer(4);

  const start = new Date(meeting.date_start);
  const end = new Date(meeting.date_end);
  const dateRangeText = headerInfo.addText(`${fmtDay(start)} - ${fmtDay(end)} ${fmtMonthShort(end)}.`);
  dateRangeText.font = Font.regularSystemFont(10);
  dateRangeText.textColor = Color.white();
  dateRangeText.lineLimit = 1;
  dateRangeText.minimumScaleFactor = 0.75;

  left.addSpacer();

  if (trackImg) {
    const imgEl = left.addImage(trackImg);
    imgEl.imageSize = new Size(100, 66);
    imgEl.centerAlignImage();
  }

  left.addSpacer();

  card.addSpacer(40);

  // ---- RIGHT column: remaining sessions ----
  const right = card.addStack();
  right.layoutVertically();
  right.size = new Size(130, 0);
  right.spacing = 7;

  for (const s of sessionsToShow) {
    const sDate = new Date(s.date_start);
    const sEnd = new Date(s.date_end);
    const isPast = sEnd < now;
    const isActive = sDate <= now && now <= sEnd;

    const dim = isPast ? 0.35 : 1;
    const activeColor = "#ff3b30";
    const colorDayNum = isActive ? new Color(activeColor) : isPast ? new Color("#c8c8c8", dim) : new Color("#c8c8c8");
    const colorDayWeekday = isActive
      ? new Color(activeColor)
      : isPast
      ? new Color("#8a8a8a", dim)
      : new Color("#8a8a8a");
    const colorName = isActive ? new Color(activeColor) : isPast ? new Color("#ffffff", dim) : Color.white();
    const colorTime = isActive ? new Color(activeColor) : isPast ? new Color("#9a9a9a", dim) : new Color("#9a9a9a");

    const row = right.addStack();
    row.layoutHorizontally();
    row.centerAlignContent();

    const dayCol = row.addStack();
    dayCol.layoutVertically();
    dayCol.size = new Size(27, 0);
    const dayNum = dayCol.addText(fmtDay(sDate));
    dayNum.font = Font.boldSystemFont(13);
    dayNum.textColor = colorDayNum;

    const dayWeekday = dayCol.addText(fmtWeekday(sDate));
    dayWeekday.font = Font.regularSystemFont(11);
    dayWeekday.textColor = colorDayWeekday;
    dayWeekday.lineLimit = 1;
    dayWeekday.minimumScaleFactor = 0.7;

    row.addSpacer(0);

    const infoCol = row.addStack();
    infoCol.layoutVertically();

    const nameText = infoCol.addText(s.session_name);
    nameText.font = Font.boldSystemFont(12);
    nameText.textColor = colorName;
    nameText.lineLimit = 1;
    nameText.minimumScaleFactor = 0.75;

    const timeText = infoCol.addText(`${fmtTime(sDate)} - ${fmtTime(sEnd)}`);
    timeText.font = Font.regularSystemFont(9);
    timeText.textColor = colorTime;
    timeText.lineLimit = 1;
    timeText.minimumScaleFactor = 0.75;
  }

  return widget;
}

const widget = await createWidget();

if (config.runsInWidget) {
  Script.setWidget(widget);
} else if (config.runsInAccessoryWidget) {
  await widget.presentAccessoryRectangular();
} else {
  await widget.presentMedium();
}
Script.complete();
