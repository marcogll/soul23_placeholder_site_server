const express = require("express");
const path = require("path");
const fs = require("fs");

const { exec } = require("child_process");

const app = express();
const port = process.env.PORT || 3001;
const rootDir = path.join(__dirname);

// Serve static assets from the project root
app.use(express.static(rootDir, { index: "index.html" }));

// Health checker should always return the raw script with text/plain
app.get("/healthchecker", (req, res) => {
  const pythonScriptPath = path.join(rootDir, "scripts", "health_checker.py");
  
  exec(`python3 ${pythonScriptPath}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing health_checker.py: ${stderr}`);
      return res.status(500).json({ error: "Failed to execute health checker" });
    }
    try {
      const healthData = JSON.parse(stdout);
      res.status(200).json(healthData);
    } catch (parseErr) {
      console.error(`Error parsing health checker output: ${parseErr}`);
      res.status(500).json({ error: "Failed to parse health checker output" });
    }
  });
});

// Magic link para redirigir a la app de Telegram según plataforma
app.get("/telegram", (req, res) => {
  res.sendFile(path.join(rootDir, "htmls", "telegram.html"));
});

// Standard health check endpoint for monitoring with VPS ping
app.get("/health", (req, res) => {
  const vpsIp = "31.97.41.188";
  // Ping with count 1 and timeout 1 second
  exec(`ping -c 1 -W 1 ${vpsIp}`, (error, stdout, stderr) => {
    const isAlive = !error;
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      checks: {
        vps_ping: {
          target: vpsIp,
          alive: isAlive,
          output: isAlive ? "VPS Reachable" : "VPS Unreachable",
        },
      },
    });
  });
});

// Endpoint to get a random phrase
app.get("/day-quote", (req, res) => {
  fs.readFile(path.join(rootDir, "data", "quotes.json"), "utf8", (err, data) => {
    if (err) {
      console.error("Error reading quotes file:", err);
      return res.status(500).json({ error: "Could not read quotes file" });
    }
    try {
      const quotes = JSON.parse(data);
      const phrases = quotes.phrases;
      if (!phrases || phrases.length === 0) {
        return res.status(500).json({ error: "No phrases found" });
      }
      const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
      res.status(200).json({ phrase: randomPhrase });
    } catch (parseErr) {
      console.error("Error parsing quotes file:", parseErr);
      return res.status(500).json({ error: "Could not parse quotes file" });
    }
  });
});

// Endpoint to get the current time in multiple formats
app.get("/time-server", (req, res) => {
  const now = new Date();
  const timezone = "America/Monterrey";

  res.status(200).json({
    // Full UTC ISO 8601 string for machines
    utc_iso: now.toISOString(),
    // Unix timestamp in seconds for machines
    unixtime: Math.floor(now.getTime() / 1000),
    // Human-readable local time for debugging
    datetime_human: now.toLocaleString("en-US", { timeZone: timezone }),
    // Timezone identifier
    timezone: timezone,
  });
});

// Fallback to index.html for other routes (optional)
app.get("*", (req, res) => {
  res.sendFile(path.join(rootDir, "index.html"));
});

app.listen(port, () => {
  console.log(`Soul:23 server listening on port ${port}`);
});
