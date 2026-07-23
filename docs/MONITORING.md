# Monitoring

## Cold starts das Functions na Vercel

### Onde monitorar

1. Acesse o Vercel Dashboard.
2. Abra o projeto `pocketcoach-eu`.
3. Vá em `Functions`.
4. Abra `Logs`.
5. Filtre por rota crítica:
   - `/api/webhooks/lemonsqueezy`
   - `/api/cron/daily-reset`
   - `/api/cron/purge-soft-deleted`
   - `/api/account/delete`
   - `/api/admin/reconcile`

### Métrica esperada

- Cold start esperado: aproximadamente `150ms`.
- Threshold de alerta: `>500ms` de cold start sustentado.

### Como interpretar

- Picos isolados podem ocorrer após períodos longos sem tráfego.
- Cold start sustentado acima de `500ms` indica necessidade de investigação.
- Avaliar junto com erros 5xx, timeout e chamadas externas lentas.

### Ações recomendadas se passar de 500ms

1. Verificar logs da Vercel em `Functions` → `Logs`.
2. Confirmar se houve aumento de bundle size.
3. Procurar importações pesadas em rotas críticas.
4. Verificar chamadas externas síncronas no caminho quente.
5. Confirmar se `SUPABASE_SERVICE_ROLE_KEY`, `DISCORD_WEBHOOK_URL` e variáveis de webhook estão configuradas corretamente.
6. Se a rota de webhook estiver lenta, revisar o payload recebido e a latência do Supabase.

## Alertas Discord

A aplicação usa `DISCORD_WEBHOOK_URL` para alertar falhas operacionais.

Integrações atuais:

- Falhas de webhook Lemon Squeezy.
- Falhas do cron `/api/cron/daily-reset`.
- Falhas do cron `/api/cron/purge-soft-deleted`.

Se `DISCORD_WEBHOOK_URL` não estiver configurado, os alertas viram no-op em produção.