const fs = require("fs/promises");
const path = require("path");

const STATUSPAGE_SERVICES = new Set(["openai", "canva", "cloudflare"]);
const DEFAULT_TIMEOUT_MS = 10_000;
const META_STATUS_ENDPOINTS = [
  "https://metastatus.com/api/status",
  "https://metastatus.com/api/statuses",
];
const META_STATUS_PAGE_URL = "https://metastatus.com/";
const META_APPS = new Map([
  ["facebook", "facebook"],
  ["instagram", "instagram"],
  ["whatsapp", "whatsapp"],
]);
const META_STATUS_CACHE_TTL_MS = 60_000;
const META_SLUGS = [...new Set(META_APPS.values())];

let metaStatusCache = { expiresAt: 0, map: null };

const getWebhookUrls = () => {
  const value = process.env.WEBHOOK_URLS || "";
  return value
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);
};

const fetchWithTimeout = async (url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(id);
  }
};

const checkUrl = async (url) => {
  try {
    const response = await fetchWithTimeout(url, {
      headers: { "User-Agent": "HealthCheckMonitor/1.0" },
    });
    return response.status;
  } catch {
    return 0;
  }
};

const checkVpsHealthEndpoint = async (url) => {
  try {
    const response = await fetchWithTimeout(url);
    if (response.status !== 200) {
      return `🔴 Caído (Endpoint status: ${response.status})`;
    }
    const data = await response.json();
    const alive = data?.checks?.vps_ping?.alive;
    if (alive) {
      return "🟢 OK (VPS Reachable)";
    }
    return "🔴 Caído (VPS reporta 'alive': false)";
  } catch (error) {
    return `🔴 Error Conexión (${error.message})`;
  }
};

const checkFormbricksHealth = async (url) => {
  try {
    const response = await fetchWithTimeout(url, {}, 8_000);
    if (response.status !== 200) {
      return `🔴 Caído (Código: ${response.status})`;
    }
    const data = await response.json().catch(() => null);
    if (data?.status === "ok") {
      return "🟢 OK (API Health: ok)";
    }
    if (data?.status) {
      return `🟡 Advertencia (${data.status})`;
    }
    return "🟡 Advertencia (No JSON)";
  } catch {
    return "🔴 Caído (Error red)";
  }
};

const getNestedValue = (obj, path) => {
  if (!obj || typeof obj !== "object") return undefined;
  return path.split(".").reduce((acc, key) => {
    if (acc === undefined || acc === null) return undefined;
    return acc[key];
  }, obj);
};

const pickFirstString = (source, paths) => {
  for (const path of paths) {
    const value = path ? getNestedValue(source, path) : source;
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (Array.isArray(value)) {
      for (const entry of value) {
        if (typeof entry === "string" && entry.trim()) {
          return entry.trim();
        }
        if (entry && typeof entry === "object") {
          for (const candidate of Object.values(entry)) {
            if (typeof candidate === "string" && candidate.trim()) {
              return candidate.trim();
            }
          }
        }
      }
    }
    if (value && typeof value === "object") {
      for (const candidate of Object.values(value)) {
        if (typeof candidate === "string" && candidate.trim()) {
          return candidate.trim();
        }
      }
    }
  }
  return "";
};

const detectMetaSlug = (value) => {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  return META_SLUGS.find((slug) => normalized.includes(slug)) || null;
};

const determineMetaSeverity = (text = "") => {
  const normalized = text.toLowerCase();
  if (/(major|outage|down|unavailable|disruption|incident|critical|severe)/.test(normalized)) {
    return "down";
  }
  if (
    /(minor|partial|degrad|latenc|slow|investigating|issue|maintenance|notice|degraded)/.test(
      normalized
    )
  ) {
    return "warn";
  }
  if (
    normalized &&
    /(healthy|operational|available|up|restored|resolved|normal|no issues|stable)/.test(normalized)
  ) {
    return "ok";
  }
  return normalized ? "warn" : "warn";
};

const composeMetaStatusMessage = (severity, statusText, detailText) => {
  const descriptorParts = [];
  if (statusText) descriptorParts.push(statusText);
  if (detailText && detailText !== statusText) descriptorParts.push(detailText);
  const descriptor = descriptorParts.join(" - ") || "Sin detalles oficiales";
  if (severity === "ok") return `🟢 OK (MetaStatus: ${descriptor})`;
  if (severity === "down") return `🔴 Caído (MetaStatus: ${descriptor})`;
  return `🟡 Advertencia (MetaStatus: ${descriptor})`;
};

const normalizeMetaStatusEntry = (entry) => {
  const slugPaths = ["slug", "service.slug", "service", "platform", "product", "name", "title"];
  let slug = null;
  for (const path of slugPaths) {
    const value = getNestedValue(entry, path);
    const detected = detectMetaSlug(typeof value === "string" ? value : "");
    if (detected) {
      slug = detected;
      break;
    }
  }
  if (!slug) return null;

  const statusText =
    pickFirstString(entry, [
      "status.description",
      "status.title",
      "status.state",
      "status.status",
      "status",
      "status_text",
      "statusDescription",
      "status_description",
      "indicator",
      "state",
      "current_status",
      "currentStatus",
    ]) || "Sin información oficial";

  const detailText =
    pickFirstString(entry, [
      "latest_update.title",
      "latest_update.description",
      "latestUpdate.title",
      "latestUpdate.description",
      "last_incident.title",
      "lastIncident.title",
      "incident.title",
      "incident.description",
      "message",
      "subtitle",
      "description",
      "body",
    ]) || "";

  const severity = determineMetaSeverity(`${statusText} ${detailText}`.trim());
  const message = composeMetaStatusMessage(severity, statusText, detailText);

  return { slug, severity, statusText, detailText, message };
};

const collectMetaStatusEntries = (payload) => {
  if (!payload || typeof payload !== "object") return [];
  const collected = [];
  const seen = new Set();

  const visit = (value) => {
    if (!value || typeof value !== "object") return;
    if (seen.has(value)) return;
    seen.add(value);

    const keys = Object.keys(value);
    if (keys.some((key) => /status|incident|indicator|state/i.test(key))) {
      const normalized = normalizeMetaStatusEntry(value);
      if (normalized) {
        collected.push(normalized);
      }
    }

    for (const child of Object.values(value)) {
      if (child && typeof child === "object") {
        visit(child);
      }
    }
  };

  visit(payload);
  return collected;
};

const buildMetaStatusMap = (payload) => {
  const entries = collectMetaStatusEntries(payload);
  if (!entries.length) return null;
  const map = new Map();
  for (const entry of entries) {
    const current = map.get(entry.slug);
    if (!current || entry.detailText.length > (current.detailText || "").length) {
      map.set(entry.slug, entry);
    }
  }
  return map;
};

const extractJsonFromHtml = (html) => {
  if (typeof html !== "string") return null;
  const inlineJsonPatterns = [
    /window\.__APOLLO_STATE__\s*=\s*(\{.*?\});/s,
    /window\.__NEXT_DATA__\s*=\s*(\{.*?\});/s,
    /window\.__NUXT__\s*=\s*(\{.*?\});/s,
  ];

  for (const pattern of inlineJsonPatterns) {
    const match = html.match(pattern);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch {
        // ignorar y probar el siguiente patrón
      }
    }
  }

  const nextDataScript = html.match(/<script[^>]+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (nextDataScript) {
    try {
      return JSON.parse(nextDataScript[1]);
    } catch {
      return null;
    }
  }

  return null;
};

const fetchMetaStatusPayload = async () => {
  const headers = {
    "User-Agent": "HealthCheckMonitor/1.0",
    Accept: "application/json,text/html;q=0.9,*/*;q=0.8",
  };

  for (const endpoint of META_STATUS_ENDPOINTS) {
    try {
      const response = await fetchWithTimeout(endpoint, { headers }, 8_000);
      if (response.status === 200) {
        const text = await response.text();
        try {
          return JSON.parse(text);
        } catch {
          // si el endpoint devuelve HTML accidentalmente, seguimos con el fallback
        }
      }
    } catch {
      // Intentaremos con el siguiente endpoint
    }
  }

  try {
    const response = await fetchWithTimeout(META_STATUS_PAGE_URL, { headers }, 8_000);
    if (response.status === 200) {
      const html = await response.text();
      return extractJsonFromHtml(html);
    }
  } catch {
    // sin conexión al sitio principal de Meta
  }

  return null;
};

const loadMetaStatusMap = async () => {
  if (metaStatusCache.map && metaStatusCache.expiresAt > Date.now()) {
    return metaStatusCache.map;
  }

  const payload = await fetchMetaStatusPayload();
  const map = buildMetaStatusMap(payload);

  if (map && map.size) {
    metaStatusCache = { map, expiresAt: Date.now() + META_STATUS_CACHE_TTL_MS };
    return map;
  }

  metaStatusCache = { map: null, expiresAt: Date.now() + 15_000 };
  return null;
};

const getMetaStatusForApp = async (appKey) => {
  const slug = META_APPS.get(appKey);
  if (!slug) return null;
  try {
    const map = await loadMetaStatusMap();
    if (!map) return null;
    return map.get(slug)?.message || null;
  } catch (error) {
    console.error("MetaStatus: error al obtener estado oficial:", error.message);
    return null;
  }
};

const getStatusPageStatus = async (baseUrl) => {
  const url = `${baseUrl.replace(/\/$/, "")}/api/v2/summary.json`;
  try {
    const response = await fetchWithTimeout(url, {}, 8_000);
    if (response.status !== 200) {
      return `🔴 Caído (${response.status})`;
    }
    const data = await response.json();
    const indicator = data?.status?.indicator;
    const description = data?.status?.description;
    if (indicator === "none") {
      return `🟢 OK (${description})`;
    }
    return `🟡 Advertencia (${description})`;
  } catch {
    return "🔴 Error verificación";
  }
};

const getGeminiStatus = async (displayUrl) => {
  const incidentsUrl = "https://status.cloud.google.com/incidents.json";
  try {
    const response = await fetchWithTimeout(incidentsUrl, {}, 8_000);
    if (response.status === 200) {
      const incidents = await response.json();
      const active = incidents.filter((incident) => {
        if (incident.end) return false;
        const serviceName = (incident.service_name || "").toLowerCase();
        return (
          serviceName.includes("gemini") ||
          serviceName.includes("vertex") ||
          serviceName.includes("generative")
        );
      });
      if (active.length === 0) {
        return "🟢 OK (Sin incidentes en Google AI)";
      }
      return `🟡 Advertencia (${active.length} incidentes activos)`;
    }
    const backupStatus = humanState(await checkUrl(displayUrl));
    return backupStatus;
  } catch {
    return "🔴 Error de conexión";
  }
};

const humanState = (code) => {
  if (code === 200) return `🟢 OK (${code})`;
  if ([301, 302, 307, 308].includes(code)) return `🟢 OK (Redirección ${code})`;
  if ([401, 403, 404].includes(code)) return `🟡 Advertencia (${code})`;
  return `🔴 Caído (${code})`;
};

const buildSection = async (dictionary) => {
  const output = {};

  for (const [name, urlOrIp] of Object.entries(dictionary)) {
    let statusMessage;

    if (name === "vps_soul23") {
      statusMessage = await checkVpsHealthEndpoint(urlOrIp);
      output[`${name}_status`] = statusMessage;
      output[`${name}_state`] = statusMessage;
    } else if (STATUSPAGE_SERVICES.has(name)) {
      statusMessage = await getStatusPageStatus(urlOrIp);
      output[`${name}_status`] = statusMessage;
      output[`${name}_state`] = statusMessage;
    } else if (name === "google_gemini") {
      statusMessage = await getGeminiStatus(urlOrIp);
      output[`${name}_status`] = statusMessage;
      output[`${name}_state`] = statusMessage;
    } else if (name === "formbricks") {
      statusMessage = await checkFormbricksHealth(urlOrIp);
      output[`${name}_status`] = statusMessage;
      output[`${name}_state`] = statusMessage;
    } else if (META_APPS.has(name)) {
      statusMessage = await getMetaStatusForApp(name);
      if (statusMessage) {
        output[`${name}_status`] = statusMessage;
        output[`${name}_state`] = statusMessage;
      } else {
        const fallbackStatus = await checkUrl(urlOrIp);
        output[`${name}_status`] = fallbackStatus;
        output[`${name}_state`] = humanState(fallbackStatus);
      }
    } else {
      const statusCode = await checkUrl(urlOrIp);
      output[`${name}_status`] = statusCode;
      output[`${name}_state`] = humanState(statusCode);
    }

    output[`${name}_url`] = urlOrIp;
  }

  return output;
};

const postWebhooks = async (payload) => {
  const urls = getWebhookUrls();
  if (!urls.length) return;

  await Promise.all(
    urls.map(async (url) => {
      try {
        await fetchWithTimeout(
          url,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
          10_000
        );
      } catch {
        // Silenciar errores individuales de webhook para no romper el resto del proceso
      }
    })
  );
};

const runHealthChecker = async () => {
  const start = Date.now();
  const sitesPath = path.join(__dirname, "..", "data", "sites.json");
  const raw = await fs.readFile(sitesPath, "utf8");
  const sites = JSON.parse(raw);

  const result = {
    timestamp: new Date().toISOString(),
    internos: await buildSection(sites.internos || {}),
    empresa: await buildSection(sites.sitios_empresa || {}),
    externos: await buildSection(sites.externos || {}),
  };

  const duration = (Date.now() - start) / 1000;
  result.execution_time_seconds = Number(duration.toFixed(2));

  await postWebhooks(result);
  return result;
};

module.exports = { runHealthChecker };

if (require.main === module) {
  runHealthChecker()
    .then((data) => {
      console.log(JSON.stringify(data, null, 4));
    })
    .catch((error) => {
      console.error(
        JSON.stringify(
          { error: "Health checker failed", details: error.message },
          null,
          4
        )
      );
      process.exit(1);
    });
}
