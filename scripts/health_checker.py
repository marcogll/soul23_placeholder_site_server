#!/usr/bin/env python3
import requests
import json
from datetime import datetime, timezone
import os
import time

# --- CONFIGURACIÓN DE WEBHOOKS (Desde GitHub Secrets) ---
webhook_urls_str = os.environ.get('WEBHOOK_URLS', '')
WEBHOOK_URLS = [url.strip() for url in webhook_urls_str.split(',') if url.strip()]

# --- Cargar sitios desde JSON ---
sites_file_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'sites.json')
try:
    with open(sites_file_path, 'r') as f:
        sites_data = json.load(f)
    INTERNOS = sites_data.get("internos", {})
    SITIOS_EMPRESA = sites_data.get("sitios_empresa", {})
    EXTERNOS = sites_data.get("externos", {})
except (FileNotFoundError, json.JSONDecodeError) as e:
    print(json.dumps({"error": f"Could not load or parse sites.json: {e}"}))
    exit(1)


# Servicios que usan Atlassian StatusPage
STATUSPAGE_SERVICES = ["openai", "canva", "cloudflare"]

# --- Funciones de Verificación de Estado ---

def check_url(url):
    """Verificación simple: ¿La web carga (Código 200)?"""
    try:
        headers = {'User-Agent': 'HealthCheckMonitor/1.0'}
        r = requests.get(url, headers=headers, timeout=10)
        return r.status_code
    except requests.exceptions.RequestException:
        return 0

def check_vps_health_endpoint(url):
    """
    Verifica el estado del VPS consultando el endpoint JSON personalizado.
    Espera: {"checks": {"vps_ping": {"alive": true, ...}}}
    """
    try:
        r = requests.get(url, timeout=10)
        if r.status_code == 200:
            try:
                data = r.json()
                vps_alive = data.get('checks', {}).get('vps_ping', {}).get('alive', False)
                
                if vps_alive:
                    return "🟢 OK (VPS Reachable)"
                else:
                    return "🔴 Caído (VPS reporta 'alive': false)"
            except json.JSONDecodeError:
                return "🟡 Advertencia (Respuesta no es JSON válido)"
        else:
            return f"🔴 Caído (Endpoint status: {r.status_code})"
    except requests.RequestException as e:
        return f"🔴 Error Conexión ({str(e)})"

def check_formbricks_health(url):
    """
    Verifica el endpoint de salud de Formbricks.
    NOTA: Usa la URL tal cual viene del diccionario (sin agregar /health extra).
    """
    try:
        response = requests.get(url, timeout=8)
        if response.status_code == 200:
            try:
                data = response.json()
                if data.get("status") == "ok":
                    return f"🟢 OK (API Health: ok)"
                else:
                    return f"🟡 Advertencia ({data.get('status', 'unknown')})"
            except json.JSONDecodeError:
                return "🟡 Advertencia (No JSON)"
        else:
            return f"🔴 Caído (Código: {response.status_code})"
    except requests.RequestException:
        return f"🔴 Caído (Error red)"

def get_statuspage_status(base_url):
    """Consulta la API de statuspage.io (OpenAI, Canva)"""
    api_url = f"{base_url.rstrip('/')}/api/v2/summary.json"
    try:
        response = requests.get(api_url, timeout=8)
        if response.status_code == 200:
            data = response.json()
            description = data.get('status', {}).get('description')
            indicator = data.get('status', {}).get('indicator')
            if indicator == 'none':
                return f"🟢 OK ({description})"
            else:
                return f"🟡 Advertencia ({description})"
        return f"🔴 Caído ({response.status_code})"
    except requests.exceptions.RequestException:
        return f"🔴 Error verificación"

def get_gemini_status(display_url):
    """Verifica incidentes en Google Cloud (Vertex AI/Gemini)"""
    feed_url = "https://status.cloud.google.com/incidents.json"
    try:
        response = requests.get(feed_url, timeout=8)
        if response.status_code == 200:
            incidents = response.json()
            active_problems = []
            for i in incidents:
                if not i.get('end'): # Si no ha terminado
                    service_name = i.get('service_name', '').lower()
                    if 'gemini' in service_name or 'vertex' in service_name or 'generative' in service_name:
                        active_problems.append(i.get('external_desc', 'Fallo desconocido'))
            
            if not active_problems:
                return "🟢 OK (Sin incidentes en Google AI)"
            else:
                return f"🟡 Advertencia ({len(active_problems)} incidentes activos)"
        else:
            code = check_url(display_url)
            return human_state(code)
    except requests.exceptions.RequestException:
        return f"🔴 Error de conexión"

def human_state(code):
    if code == 200:
        return f"🟢 OK ({code})"
    if code in (301, 302, 307, 308):
        return f"🟢 OK (Redirección {code})"
    if code in (401, 403, 404):
        return f"🟡 Advertencia ({code})"
    return f"🔴 Caído ({code})"

# --- Lógica Principal ---

def build_section(diccionario):
    salida = {}
    for nombre, url_or_ip in diccionario.items():
        
        # 1. Check VPS
        if nombre == 'vps_soul23':
            status_message = check_vps_health_endpoint(url_or_ip)
            
        # 2. StatusPage
        elif nombre in STATUSPAGE_SERVICES:
            status_message = get_statuspage_status(url_or_ip)
            
        # 3. Google Gemini
        elif nombre == 'google_gemini':
            status_message = get_gemini_status(url_or_ip)
            
        # 4. Formbricks (URL completa)
        elif nombre == 'formbricks':
            status_message = check_formbricks_health(url_or_ip)
            
        # 5. Resto
        else:
            status = check_url(url_or_ip)
            salida[f"{nombre}_url"] = url_or_ip
            salida[f"{nombre}_status"] = status
            salida[f"{nombre}_state"] = human_state(status)
            continue

        salida[f"{nombre}_url"] = url_or_ip
        salida[f"{nombre}_status"] = status_message
        salida[f"{nombre}_state"] = status_message
    return salida

def main():
    start_time = time.time()

    resultado = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "internos": build_section(INTERNOS),
        "empresa": build_section(SITIOS_EMPRESA),
        "externos": build_section(EXTERNOS)
    }
    
    end_time = time.time()
    execution_time = round(end_time - start_time, 2)
    resultado["execution_time_seconds"] = execution_time

    for url in WEBHOOK_URLS:
        try:
            resp = requests.post(url, json=resultado, timeout=10)
        except requests.RequestException:
            pass

    print(json.dumps(resultado, indent=4))

if __name__ == "__main__":
    main()
