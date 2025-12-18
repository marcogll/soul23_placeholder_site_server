const express = require("express");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");

const app = express();
const port = process.env.PORT || 3001;
const rootDir = path.join(__dirname);

// --- Middleware ---
// Sirve los archivos estáticos (HTML, CSS, JS) desde el directorio raíz del proyecto.
// 'index.html' se sirve como el archivo por defecto.
app.use(express.static(rootDir, { index: "index.html" }));


// --- Rutas de la API ---

/**
 * @route GET /healthchecker
 * @description Ejecuta un script de Python para un chequeo de salud avanzado.
 * Invoca el script `scripts/health_checker.py`, que monitorea múltiples servicios
 * y devuelve un reporte detallado en formato JSON.
 * @returns {object} Un objeto JSON con el estado de los servicios monitoreados.
 * @throws 500 - Si el script de Python falla o su salida no es un JSON válido.
 */
app.get("/healthchecker", (req, res) => {
  const pythonScriptPath = path.join(rootDir, "scripts", "health_checker.py");
  
  exec(`python3 ${pythonScriptPath}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error al ejecutar health_checker.py: ${stderr}`);
      return res.status(500).json({ error: "No se pudo ejecutar el chequeo de salud" });
    }
    try {
      const healthData = JSON.parse(stdout);
      res.status(200).json(healthData);
    } catch (parseErr) {
      console.error(`Error al parsear la salida del chequeo de salud: ${parseErr}`);
      res.status(500).json({ error: "La respuesta del chequeo de salud no es un JSON válido" });
    }
  });
});

/**
 * @route GET /telegram
 * @description Sirve una página HTML para la redirección a Telegram.
 * @returns {file} El archivo `htmls/telegram.html`.
 */
app.get("/telegram", (req, res) => {
  res.sendFile(path.join(rootDir, "htmls", "telegram.html"));
});

/**
 * @route GET /health
 * @description Realiza un chequeo de salud simple haciendo ping a una IP.
 * @returns {object} Un objeto JSON con el estado de la conectividad.
 */
app.get("/health", (req, res) => {
  const vpsIp = "31.97.41.188"; // IP a verificar
  // Ejecuta un ping con un solo paquete y un timeout de 1 segundo.
  exec(`ping -c 1 -W 1 ${vpsIp}`, (error, stdout, stderr) => {
    const isAlive = !error;
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      checks: {
        vps_ping: {
          target: vpsIp,
          alive: isAlive,
          output: isAlive ? "VPS Alcanzable" : "VPS Inalcanzable",
        },
      },
    });
  });
});

/**
 * @route GET /day-quote
 * @description Devuelve una frase aleatoria del archivo de citas.
 * @returns {object} Un objeto JSON con una única clave "phrase".
 * @throws 500 - Si no se puede leer o parsear el archivo `data/quotes.json`.
 */
app.get("/day-quote", (req, res) => {
  fs.readFile(path.join(rootDir, "data", "quotes.json"), "utf8", (err, data) => {
    if (err) {
      console.error("Error al leer el archivo de frases:", err);
      return res.status(500).json({ error: "No se pudo leer el archivo de frases" });
    }
    try {
      const quotes = JSON.parse(data);
      const phrases = quotes.phrases;
      if (!phrases || phrases.length === 0) {
        return res.status(500).json({ error: "No se encontraron frases en el archivo" });
      }
      const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
      res.status(200).json({ phrase: randomPhrase });
    } catch (parseErr) {
      console.error("Error al parsear el archivo de frases:", parseErr);
      return res.status(500).json({ error: "No se pudo parsear el archivo de frases" });
    }
  });
});

/**
 * @route GET /time-server
 * @description Proporciona la hora actual del servidor en diferentes formatos.
 * @returns {object} Un objeto JSON con la hora en formato ISO, Unix y legible.
 */
app.get("/time-server", (req, res) => {
  const now = new Date();
  const timezone = "America/Monterrey";

  res.status(200).json({
    utc_iso: now.toISOString(),
    unixtime: Math.floor(now.getTime() / 1000),
    datetime_human: now.toLocaleString("en-US", { timeZone: timezone }),
    timezone: timezone,
  });
});

/**
 * @route GET *
 * @description Ruta "catch-all" que sirve la página principal.
 * Útil para Single Page Applications (SPAs) donde el enrutamiento se maneja
 * en el lado del cliente.
 * @returns {file} El archivo `index.html`.
 */
app.get("*", (req, res) => {
  res.sendFile(path.join(rootDir, "index.html"));
});


// --- Inicio del Servidor ---
app.listen(port, () => {
  console.log(`Servidor Soul:23 escuchando en el puerto ${port}`);
});
