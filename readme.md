# aha-ops

> Relocated from `ahapeter/aha-ops` — public so scheduled Actions minutes stay free.
> The patrol image and the `patrol-results` SQLite package still live under the `ahapeter` GHCR namespace.

Patrol cron trigger — calls a GitHub Actions workflow every 5 minutes.

## Architecture

**pg_cron** → **Supabase Edge Function** (`patrol-trigger`) → **GitHub Actions** (`patrol-run.yml`)

The edge function is secured with a custom `x-cron-secret` header. Requests without the correct secret are rejected with 401.

## Deploy

```bash
# Link to your Supabase project
supabase link --project-ref <your-project-ref>

# Set secrets
supabase secrets set GITHUB_TOKEN=ghp_xxx
supabase secrets set CRON_SECRET=$(openssl rand -hex 32)

# Deploy the edge function (--no-verify-jwt since we use custom secret)
supabase functions deploy patrol-trigger --no-verify-jwt
```

## Set up pg_cron (run once in Supabase SQL Editor)

```sql
create extension if not exists pg_net schema extensions;
create extension if not exists pg_cron;

select cron.schedule(
  'patrol-trigger-every-5min',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://<your-project-ref>.supabase.co/functions/v1/patrol-trigger',
    headers := '{"x-cron-secret": "<your-cron-secret>"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

> Replace `<your-project-ref>` and `<your-cron-secret>` with your actual values.
