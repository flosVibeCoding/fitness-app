# Fitness Coach App – Deploy auf FlosPi

## 0. Dateien auf den Pi bringen
Vom Geekom aus (Git Bash), das ganze `fitness-app`-Verzeichnis übertragen:

```bash
scp -r fitness-app flospi:~/fitness-app
```

(Oder: erst `git init` + eigenes GitHub-Repo `flosVibeCoding/fitness-app` anlegen und pushen, dann auf dem Pi `git clone`. Läuft dann analog zu deinem Kickbase-Tool-Workflow mit main/dev-Branches.)

## 1. Postgres-DB anlegen
Du nutzt vermutlich schon den Postgres-Container vom Kickbase-Tool. Neue DB + User dafür anlegen:

```bash
ssh flospi
docker exec -it <dein-postgres-container-name> psql -U postgres -c "CREATE USER fitness WITH PASSWORD 'DEIN_PASSWORT';"
docker exec -it <dein-postgres-container-name> psql -U postgres -c "CREATE DATABASE fitness OWNER fitness;"
```

## 2. API einrichten

```bash
cd ~/fitness-app/api
cp .env.example .env
nano .env   # PGPASSWORD auf dein gewähltes Passwort setzen, ggf. PGHOST/PORT prüfen
npm install
npm run migrate   # legt Tabellen an + seedet die 15 Übungen
```

Kurzer Test:
```bash
node server.js
# in zweitem Terminal:
curl http://localhost:3002/api/health
# sollte {"ok":true} zeigen -> Ctrl+C zum Beenden
```

## 3. Systemd-Service für die API

```bash
sudo cp ~/fitness-app/deploy/fitness-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now fitness-api
sudo systemctl status fitness-api
```

## 4. Frontend bauen

```bash
cd ~/fitness-app/web
npm install
npm run build
```

Das erzeugt `~/fitness-app/web/dist` – genau der Ordner, auf den nginx zeigt.

## 5. Nginx

```bash
sudo cp ~/fitness-app/deploy/nginx-fitness.conf /etc/nginx/sites-available/fitness
sudo ln -s /etc/nginx/sites-available/fitness /etc/nginx/sites-enabled/fitness
sudo nginx -t && sudo systemctl reload nginx
```

Port-Reservierung (analog Challenge/Kickbase): **8093 = fitness prod**, **8094 = fitness dev** (dev-Setup optional, gleiche Schritte in `~/fitness-app-dev`).

## 6. Cloudflare Tunnel

In `/etc/cloudflared/config.yml` (Tunnel-ID `f22ccb55-fe60-43e4-8e1f-85b497b50506`) ergänzen:

```yaml
  - hostname: fitness.seliflo-orga.de
    service: http://localhost:8093
  - hostname: fitness-dev.seliflo-orga.de
    service: http://localhost:8094
```

Dann:
```bash
sudo systemctl restart cloudflared
```
Und im Cloudflare DNS-Dashboard je einen CNAME-Eintrag für `fitness` und `fitness-dev` auf den Tunnel anlegen (genau wie bei challenge/kickbase).

## 7. Test
- `https://fitness.seliflo-orga.de` öffnen
- Als PWA installierbar (Homescreen), Service Worker cached die App
- "Heute" → Push/Pull/Leg Day auswählen, Sätze eintragen, speichern
- "Verlauf" zeigt gespeicherte Sessions
- "Gewicht" → manuelle Eingabe + Chart

## Troubleshooting
- `curl http://localhost:3002/api/health` liefert nichts → API-Service prüfen: `journalctl -u fitness-api -f`
- Frontend lädt, aber keine Daten → Browser-DevTools Network-Tab, `/api/...`-Calls sollten 200 liefern, nicht 502 (dann läuft nginx-Proxy oder API nicht)
- `npm run migrate` schlägt fehl → Postgres-User/Passwort in `.env` gegen Schritt 1 prüfen
