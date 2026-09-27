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

// Hardcoded circuit outline for Sepang International Circuit (circuit_key 12) — OpenF1
// labels the relocated 2026 Bahrain GP as "Kuala Lumpur", but multiviewer.app has no
// entry for this circuit_key at all. Traced from the official layout SVG
// (Wikimedia Commons, File:Sepang.svg, CC BY-SA), y pre-flipped to cancel out
// computeTrackPoints Y-up correction.
const SEPANG_TRACE = {
  x: [1315.76, 1292.93, 1270.11, 1247.31, 1224.51, 1201.71, 1178.91, 1156.1, 1133.28, 1116.77, 1100.19, 1083.57, 1066.96, 1050.41, 1033.97, 1017.66, 1001.56, 998.06, 994.6, 991.21, 987.95, 984.85, 981.98, 979.37, 977.08, 975.33, 973.96, 972.93, 972.18, 971.67, 971.34, 971.15, 971.04, 971.15, 971.58, 972.31, 973.3, 974.52, 975.93, 977.5, 979.2, 981.24, 983.35, 985.57, 987.97, 990.6, 993.5, 996.73, 1000.35, 1006.25, 1012.0, 1017.67, 1023.31, 1028.98, 1034.76, 1040.71, 1046.87, 1049.26, 1051.75, 1054.3, 1056.84, 1059.33, 1061.71, 1063.92, 1065.91, 1067.64, 1069.28, 1070.82, 1072.22, 1073.48, 1074.57, 1075.48, 1076.18, 1076.56, 1076.76, 1076.81, 1076.7, 1076.46, 1076.08, 1075.58, 1074.97, 1073.25, 1071.07, 1068.57, 1065.87, 1063.1, 1060.38, 1057.85, 1055.63, 1052.13, 1048.75, 1045.51, 1042.41, 1039.48, 1036.73, 1034.15, 1031.77, 1030.03, 1028.47, 1027.13, 1026.03, 1025.19, 1024.64, 1024.41, 1024.52, 1024.97, 1025.49, 1026.12, 1026.95, 1028.04, 1029.47, 1031.29, 1033.58, 1035.94, 1038.48, 1041.23, 1044.24, 1047.53, 1051.16, 1055.16, 1059.56, 1065.0, 1072.14, 1080.51, 1089.66, 1099.12, 1108.44, 1117.16, 1124.82, 1151.22, 1176.01, 1199.72, 1222.88, 1246.02, 1269.67, 1294.35, 1320.59, 1342.1, 1363.47, 1384.73, 1405.93, 1427.11, 1448.32, 1469.59, 1490.99, 1493.19, 1495.56, 1498.01, 1500.48, 1502.9, 1505.19, 1507.29, 1509.11, 1511.19, 1513.17, 1515.03, 1516.72, 1518.22, 1519.49, 1520.5, 1521.2, 1525.3, 1529.07, 1532.65, 1536.15, 1539.68, 1543.37, 1547.35, 1551.71, 1553.85, 1556.26, 1559.02, 1562.24, 1566.01, 1570.44, 1575.61, 1581.62, 1586.09, 1590.48, 1594.89, 1599.42, 1604.15, 1609.2, 1614.65, 1620.6, 1628.04, 1635.62, 1643.32, 1651.1, 1658.93, 1666.8, 1674.68, 1682.53, 1690.83, 1699.03, 1707.08, 1714.94, 1722.56, 1729.9, 1736.92, 1743.56, 1750.53, 1757.16, 1763.65, 1770.22, 1777.08, 1784.45, 1792.54, 1801.57, 1808.58, 1816.1, 1823.98, 1832.09, 1840.27, 1848.38, 1856.27, 1863.8, 1871.51, 1878.76, 1885.6, 1892.08, 1898.25, 1904.17, 1909.89, 1915.46, 1937.36, 1959.01, 1980.61, 2002.35, 2024.43, 2047.04, 2070.37, 2094.62, 2096.58, 2098.62, 2100.58, 2102.32, 2103.68, 2104.51, 2104.66, 2103.99, 2099.53, 2095.1, 2090.71, 2086.37, 2082.1, 2077.91, 2073.82, 2069.85, 2068.24, 2065.82, 2062.79, 2059.32, 2055.6, 2051.81, 2048.14, 2044.77, 1989.3, 1934.72, 1880.83, 1827.39, 1774.21, 1721.05, 1667.7, 1613.95, 1611.05, 1608.01, 1604.95, 1602.03, 1599.4, 1597.18, 1595.54, 1594.61, 1594.57, 1595.45, 1597.07, 1599.24, 1601.78, 1604.5, 1607.2, 1609.72, 1618.46, 1627.52, 1636.72, 1645.87, 1654.79, 1663.29, 1671.19, 1678.3, 1682.96, 1687.01, 1690.45, 1693.27, 1695.49, 1697.11, 1698.13, 1698.54, 1698.4, 1697.65, 1696.34, 1694.52, 1692.24, 1689.55, 1686.5, 1683.14, 1680.39, 1677.01, 1673.09, 1668.73, 1664.01, 1659.03, 1653.9, 1648.69, 1645.39, 1641.48, 1637.13, 1632.48, 1627.68, 1622.89, 1618.26, 1613.95, 1607.01, 1600.56, 1594.49, 1588.7, 1583.09, 1577.54, 1571.95, 1566.22, 1554.97, 1534.8, 1508.69, 1479.65, 1450.67, 1424.74, 1404.85, 1394.01, 1388.51, 1382.47, 1376.05, 1369.43, 1362.79, 1356.3, 1350.13, 1344.46, 1338.55, 1331.75, 1324.27, 1316.33, 1308.15, 1299.95, 1291.94, 1284.34, 1277.5, 1270.65, 1263.77, 1256.86, 1249.91, 1242.92, 1235.86, 1228.75, 1217.4, 1205.72, 1193.88, 1182.04, 1170.38, 1159.06, 1148.25, 1138.11, 1130.17, 1122.69, 1115.67, 1109.11, 1103.0, 1097.34, 1092.13, 1087.36, 1084.93, 1082.91, 1081.37, 1080.34, 1079.89, 1080.07, 1080.93, 1082.52, 1084.18, 1086.34, 1088.94, 1091.88, 1095.08, 1098.47, 1101.97, 1105.48, 1208.67, 1310.98, 1412.69, 1514.1, 1615.49, 1717.14, 1819.36, 1922.41, 1926.64, 1930.89, 1935.01, 1938.88, 1942.34, 1945.28, 1947.54, 1949.0, 1949.6, 1949.81, 1949.64, 1949.14, 1948.31, 1947.19, 1945.8, 1944.17, 1942.54, 1940.79, 1938.93, 1936.92, 1934.76, 1932.44, 1929.94, 1927.25, 1923.87, 1920.27, 1916.52, 1912.66, 1908.75, 1904.86, 1901.03, 1897.34, 1824.45, 1751.72, 1679.09, 1606.51, 1533.94, 1461.32, 1388.61, 1315.76],
  y: [-636.87, -638.94, -641.15, -643.45, -645.81, -648.19, -650.54, -652.83, -655.0, -656.6, -658.27, -659.9, -661.4, -662.64, -663.52, -663.93, -663.76, -663.35, -662.37, -660.92, -659.07, -656.9, -654.48, -651.91, -649.26, -646.66, -643.85, -640.85, -637.73, -634.51, -631.26, -628.0, -624.79, -622.03, -619.24, -616.44, -613.68, -611.01, -608.47, -606.1, -603.94, -601.7, -599.69, -597.89, -596.33, -595.0, -593.91, -593.07, -592.46, -592.28, -593.08, -594.63, -596.7, -599.08, -601.53, -603.83, -605.76, -606.29, -606.68, -606.89, -606.92, -606.74, -606.35, -605.73, -604.85, -603.78, -602.49, -601.0, -599.36, -597.56, -595.65, -593.64, -591.56, -589.67, -587.42, -584.94, -582.33, -579.73, -577.25, -575.0, -573.13, -569.54, -566.04, -562.59, -559.19, -555.81, -552.44, -549.05, -545.63, -539.79, -534.32, -529.08, -523.93, -518.74, -513.37, -507.68, -501.53, -496.32, -490.99, -485.58, -480.1, -474.58, -469.04, -463.51, -458.02, -449.39, -440.66, -431.89, -423.13, -414.43, -405.83, -397.38, -389.14, -381.83, -374.52, -367.25, -360.07, -353.03, -346.18, -339.57, -333.25, -326.74, -319.35, -311.53, -303.71, -296.33, -289.84, -284.68, -281.28, -272.31, -263.85, -255.67, -247.56, -239.3, -230.68, -221.48, -211.49, -202.92, -193.91, -184.62, -175.18, -165.76, -156.48, -147.51, -138.98, -138.25, -137.67, -137.28, -137.1, -137.16, -137.48, -138.08, -138.98, -140.54, -142.48, -144.73, -147.22, -149.9, -152.68, -155.51, -158.32, -180.56, -202.96, -225.45, -248.01, -270.56, -293.08, -315.5, -337.78, -347.69, -357.67, -367.61, -377.38, -386.86, -395.94, -404.49, -412.4, -417.51, -422.28, -426.69, -430.77, -434.52, -437.94, -441.04, -443.82, -446.77, -449.36, -451.56, -453.33, -454.63, -455.41, -455.65, -455.3, -454.38, -452.98, -451.06, -448.59, -445.52, -441.81, -437.44, -432.34, -425.89, -418.95, -411.76, -404.55, -397.57, -391.06, -385.25, -380.38, -377.55, -375.18, -373.31, -371.98, -371.25, -371.17, -371.78, -373.13, -375.16, -377.54, -380.33, -383.62, -387.49, -392.01, -397.27, -403.34, -429.09, -454.45, -479.64, -504.9, -530.45, -556.53, -583.37, -611.19, -613.72, -616.88, -620.48, -624.31, -628.18, -631.9, -635.26, -638.08, -647.86, -657.78, -667.8, -677.87, -687.96, -698.01, -707.98, -717.84, -720.43, -722.5, -724.1, -725.31, -726.19, -726.81, -727.23, -727.51, -731.79, -736.28, -741.04, -746.13, -751.61, -757.55, -763.99, -771.02, -771.59, -772.56, -773.93, -775.68, -777.81, -780.31, -783.19, -786.42, -790.08, -793.59, -796.9, -799.99, -802.82, -805.35, -807.55, -809.38, -815.03, -820.26, -825.26, -830.24, -835.39, -840.9, -846.97, -853.8, -859.64, -866.22, -873.37, -880.95, -888.8, -896.76, -904.68, -912.41, -923.95, -935.63, -947.39, -959.18, -970.93, -982.6, -994.13, -1005.46, -1013.14, -1020.76, -1028.25, -1035.51, -1042.45, -1048.98, -1055.01, -1060.45, -1063.18, -1065.56, -1067.53, -1069.04, -1070.01, -1070.4, -1070.15, -1069.21, -1066.43, -1062.83, -1058.55, -1053.73, -1048.53, -1043.08, -1037.54, -1032.05, -1022.08, -1004.64, -982.29, -957.61, -933.2, -911.63, -895.48, -887.33, -884.4, -881.98, -880.09, -878.75, -877.97, -877.77, -878.16, -879.17, -881.0, -883.68, -887.04, -890.9, -895.07, -899.36, -903.59, -907.57, -911.1, -914.52, -917.75, -920.68, -923.21, -925.26, -926.73, -927.51, -927.97, -927.98, -927.43, -926.21, -924.21, -921.32, -917.42, -912.41, -907.52, -902.27, -896.64, -890.6, -884.13, -877.21, -869.83, -861.95, -857.23, -852.45, -847.65, -842.88, -838.2, -833.64, -829.26, -825.09, -822.29, -819.53, -816.89, -814.45, -812.29, -810.47, -809.07, -808.18, -789.99, -772.05, -754.19, -736.24, -718.06, -699.47, -680.31, -660.44, -659.0, -656.47, -653.09, -649.11, -644.77, -640.32, -636.0, -632.04, -628.96, -625.69, -622.31, -618.87, -615.45, -612.13, -608.98, -606.06, -603.61, -601.31, -599.17, -597.2, -595.44, -593.9, -592.6, -591.56, -590.67, -590.07, -589.74, -589.61, -589.65, -589.82, -590.07, -590.35, -596.06, -601.72, -607.37, -613.04, -618.79, -624.65, -630.66, -636.87],
  rotation: 0,
};

async function getCircuitTrace(circuitKey, year) {
  if (circuitKey === 153) {
    return MADRING_TRACE;
  }
  if (circuitKey === 12) {
    return SEPANG_TRACE;
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
