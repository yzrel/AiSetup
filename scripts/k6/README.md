# API stress harness (k6)

Local load test for the Spring backend at `http://localhost:8080/api`. Not wired
into CI — run it by hand against a backend you are willing to write to.

## Install k6 once

```powershell
winget install GrafanaLabs.k6
```

macOS: `brew install k6`. Other platforms: <https://grafana.com/docs/k6/latest/set-up/install-k6/>

## Run

```powershell
npm run backend            # terminal 1: starts the API on :8080
npm run stress:api:smoke   # terminal 2: 1 VU / 30s sanity check
npm run stress:api         # then the default load profile
```

| Script | Profile | Shape |
|--------|---------|-------|
| `npm run stress:api:smoke` | smoke | 1 VU, 30s |
| `npm run stress:api` | load | ramp to 20 VU over 1m, hold 3m, ramp down |
| `npm run stress:api:stress` | stress | ramp to 50 VU, hold 3m |
| `npm run stress:api:spike` | spike | 5 VU baseline, spike to 80 VU for 30s |

Environment overrides:

| Variable | Default |
|----------|---------|
| `BASE_URL` | `http://localhost:8080/api` |
| `STAFF_EMAIL` | `agent@dost.gov.ph` |
| `STAFF_PASSWORD` | `admin123` |
| `APPLICANT_ID` | `f6a1c0de-0000-4000-8000-a15e70000001` (the harness case) |

```powershell
$env:BASE_URL = "http://localhost:8080/api"; npm run stress:api:stress
```

Extra k6 flags pass through: `node scripts/k6/run.mjs load --vus 5 --duration 20s`.

## What it touches

`setup()` checks `/health`, logs in once as staff, then creates (or overwrites)
**one throwaway applicant** — `k6 Stress Harness (delete me)`, fixed id, so
repeat runs reuse it instead of piling up rows in the staff client list — and
seeds a ~1 KB upload. Every write in the run targets that record: `PUT
/applicants/{id}/header`, `PUT /applicants/{id}/modules/caseMeta` (no
`published` flag), and rare tiny uploads.
Reads hit the real list (`GET /applicants`), notifications, LandBank branches,
`/auth/me`, file list/download, plus `POST /financial-projection/generate`
(local CPU engine, no LLM).

Never called: `/ai/**`, `/loi|/tna1|/tna2|/project-proposal/generate`,
`/auth/register`, OTP, forgot/reset password, `/mail/send`, admin mutations, and
LandBank create/deactivate. Those cost money, send messages, or create accounts.

Runs leave behind the harness applicant record, its uploads under
`aisetup.upload-dir` (a long run adds a few hundred ~1 KB files), and one
`audit_events` row per write. Clean up by deleting
`backend/data/uploads/f6a1c0de-0000-4000-8000-a15e70000001` and the harness
case, or point the run at a scratch database.

## Reading the output

Thresholds fail the run (non-zero exit) when crossed:

- `http_req_failed` &lt; 1%
- `checks` &gt; 99% (every request asserts 2xx)
- `http_req_duration` p95 &lt; 800ms on **load**, &lt; 2s on **stress**/**spike**

Requests are tagged per endpoint, so the end-of-run summary breaks latency down
by route. A full JSON summary lands in `scripts/k6/results/` (gitignored, with
the login token stripped out by the runner).

Default H2 file DB is fine for finding the first cliff; run the backend with
`SPRING_PROFILES_ACTIVE=mysql` for numbers closer to production. Note that
`GET /applicants` is an unpaginated `findAll()`, and the default Hikari pool is
10 connections — expect those to bind before CPU does.
