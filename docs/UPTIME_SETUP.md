# UptimeRobot / BetterStack Setup

## Objetivo

Monitorar disponibilidade pública e cron health sem custo inicial usando UptimeRobot Free.

## UptimeRobot Free — 5 monitores

1. Criar conta em https://uptimerobot.com/.
2. Acessar `Dashboard` → `New Monitor`.
3. Usar tipo `HTTP(s)`.
4. Configurar intervalo mínimo permitido pelo plano free.
5. Configurar alerta via Discord webhook.

## Monitor 1 — Uptime público

- Type: `HTTP(s)`
- Friendly Name: `PocketCoach EU — Web App`
- URL: `https://pocketcoach-eu.vercel.app`
- Method: `GET`
- Expected: HTTP 200

## Monitor 2 — Cron health: daily-reset

- Type: `HTTP(s)`
- Friendly Name: `PocketCoach EU — daily-reset cron`
- URL: `https://pocketcoach-eu.vercel.app/api/cron/daily-reset`
- Method: `GET`
- Expected: HTTP 200

Se `CRON_SECRET` estiver ativo em produção, configure header customizado:

- Header: `Authorization`
- Value: `Bearer <CRON_SECRET>`

## Monitor 3 — Cron health: soft-delete purge

- Type: `HTTP(s)`
- Friendly Name: `PocketCoach EU — purge-soft-deleted cron`
- URL: `https://pocketcoach-eu.vercel.app/api/cron/purge-soft-deleted`
- Method: `GET`
- Expected: HTTP 200

Se `CRON_SECRET` estiver ativo, usar o mesmo header:

- Header: `Authorization`
- Value: `Bearer <CRON_SECRET>`

## Monitor 4 — Auth page

- Type: `HTTP(s)`
- Friendly Name: `PocketCoach EU — Auth`
- URL: `https://pocketcoach-eu.vercel.app/auth`
- Method: `GET`
- Expected: HTTP 200

## Monitor 5 — Marketing landing

- Type: `HTTP(s)`
- Friendly Name: `PocketCoach EU — Landing`
- URL: `https://pocketcoach-eu.vercel.app/landing`
- Method: `GET`
- Expected: HTTP 200

## Discord webhook alert

1. No Discord, abrir o servidor/canal de alertas.
2. `Edit Channel` → `Integrations` → `Webhooks`.
3. Criar webhook chamado `PocketCoach EU Uptime`.
4. Copiar URL do webhook.
5. No UptimeRobot: `My Settings` → `Alert Contacts`.
6. Criar contato do tipo `Webhook`.
7. Colar a URL do Discord webhook.
8. Associar esse contato aos 5 monitores.

## BetterStack alternativa

Se migrar para BetterStack:

- Criar monitor HTTP para os mesmos endpoints.
- Configurar escalation policy.
- Enviar alertas para Discord, e-mail ou telefone.
- Reusar thresholds: uptime 200 OK e cold start investigado quando latência sustentada >500ms.