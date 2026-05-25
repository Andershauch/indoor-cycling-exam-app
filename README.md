# Indoor Cycling Exam App

Projektet er en mobile-first eksamensapp til en fast indoor cycling teoriprøve.

## Stack

- Next.js med App Router
- TypeScript
- Tailwind CSS
- Prisma
- Neon Postgres
- Vercel

## Lokal opsætning

1. Installer afhængigheder:

```bash
npm install
```

2. Opret lokal miljøfil:

```bash
copy .env.example .env
```

3. Udfyld databaseforbindelsen i `.env` med din Neon-forbindelse:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
```

4. Generér Prisma-klienten:

```bash
npm run prisma:generate
```

5. Kør migrationer:

```bash
npx prisma migrate dev
```

6. Importér den opdaterede prøve:

```bash
node scripts/import-exam-data.mjs data/exam-import.indoor-cycling-opdateret.json
```

7. Opret lokale testdata:

```bash
npm run setup:lokal-testdata
```

8. Start udviklingsserveren:

```bash
npm run dev
```

Appen kører herefter på `http://localhost:3000`.

## Faste arbejds-URL'er

- Instruktør/admin: `http://localhost:3000/admin`
- Konkret prøveafholdelse: `http://localhost:3000/admin/sessions/[sessionId]`
- Superadmin: `http://localhost:3000/superadmin`
- Magic link-login: `http://localhost:3000/admin/login`

Superadmin bliver automatisk sendt til `/superadmin`, hvis de åbner `/admin` uden at være i
instruktør-preview. Den konkrete afholdelse har en fast URL på `/admin/sessions/[sessionId]`, så
instruktør og superadmin kan åbne samme afviklingsrum direkte.

## Lokale testbrugere

Følgende lokale login ligger nu i `.env.example`:

```text
E-mail: lokal-admin@indoor.test
Adgangskode: IndoorTest123!
```

Derudover ligger der tre konkrete testdeltagere i `data/local-test-users.json`:

- Anna Andersen
- Bo Berg
- Clara Clausen

Når du kører `npm run setup:lokal-testdata`, opretter scriptet invitationer til den aktive prøve og udskriver direkte testlinks i terminalen.

## Scripts

- `npm run dev` starter udviklingsserveren
- `npm run build` bygger projektet til produktion
- `npm run start` starter den byggede app
- `npm run lint` kører ESLint
- `npm run prisma:generate` genererer Prisma-klienten
- `npm run prisma:migrate:dev` kører lokale migrationer
- `npm run prisma:studio` åbner Prisma Studio
- `npm run import:validate` validerer importfilen
- `npm run import:exam` importerer den faste prøve
- `npm run setup:lokal-testdata` opretter lokale testinvitationer
- `npm run smoke:security` kører sikkerheds-smokecheck
- `npm run test:e2e:flow` kører det fulde deltagerflow
- `npm run test:system` kører lint, production build, security-smoke og fuldt Playwright-flow

## Systemtest

Den faste lokale gennemtest er:

```bash
npm run test:system
```

Kommandoen kører ESLint, production build med Prisma Client-generering, sikkerheds-smokecheck og
et Playwright-flow med superadmin-bootstrap, prøveafholdelse, invitation, deltagerbesvarelse og
resultat. Hvis `PLAYWRIGHT_E2E_SECRET` ikke er sat i shellen, bruger scriptet en lokal test-secret
kun til denne proces. E2E-helperroutes er slået fra i production.

## Import og testdata

Importen læser JSON-struktur med:

- `examSet` for prøveopsætning
- `questions` i fast rækkefølge
- `externalKey` pr. spørgsmål
- `options` med præcis ét korrekt svar

Den opdaterede prøve fra Excel ligger i:

```text
data/exam-import.indoor-cycling-opdateret.json
```

Excel-konverteringen kan gentages med:

```bash
python scripts/convert-exam-xlsx.py C:\sti\til\indoor_cycling_proeve_opdateret.xlsx data/exam-import.indoor-cycling-opdateret.json
```

## Invitationer og providers

Projektet er forberedt til:

- Resend til e-mail
- Twilio Messaging Services til SMS
- fallback-variabler til generiske mail- og sms-services

Relevante miljøvariabler:

```env
RESEND_FROM_EMAIL="Indoor Cycling <onboarding@din-test-email.dk>"
RESEND_API_KEY="re_..."
TWILIO_ACCOUNT_SID="AC..."
TWILIO_API_KEY_SID="SK..."
TWILIO_API_KEY_SECRET="..."
TWILIO_AUTH_TOKEN="..."
TWILIO_MESSAGING_SERVICE_SID="MG..."
```

Provider-filerne er stadig holdt som service-abstraktioner, så de rigtige API-kald kan kobles på uden at ændre admin- eller invitationsflowet.

## Projektstruktur

- `src/app/(public)` indeholder landing page og offentlige routes
- `src/app/(exam)` indeholder eksamensflowet
- `src/app/(admin)` indeholder beskyttede admin-routes
- `src/components` indeholder fælles UI-komponenter
- `src/lib` indeholder konfiguration, helperfunktioner, adminlogik og Prisma-klient
- `prisma` indeholder schema og migrationer
- `scripts` indeholder import, konvertering og lokale setup-scripts
- `data` indeholder importfiler og lokale fixtures

## Deployment

Projektet er klargjort til Vercel med miljøvariabler via `.env` lokalt og Project Settings i Vercel for preview og production.

## Spotify watcher (MVP)

Dette repo indeholder nu et MVP-grundlag til at overvage Spotify-playlists for utilgaengelige tracks.

Nye endpoints:

- `GET /api/spotify/login` starter Spotify OAuth
- `GET /api/spotify/callback` gemmer bruger + tokens
- `GET /api/internal/spotify/status` viser simpel driftstatus
- `POST /api/internal/spotify/sync-playlists` syncer playlists
- `POST /api/internal/spotify/run-scan` korer scan + evt. digest-mail
- `POST /api/internal/spotify/test-notification` sender testmail (uafhaengigt af fund)

Interne `POST` endpoints kraever header:

```text
x-cron-secret: <CRON_SECRET>
```

MVP-regler:

- Daglig scan via scheduler (opsaettes til kl. 09:00 dansk tid i driftlaget)
- Mail kun ved nye fund
- Kraever 2 scans i traek for incident-notifikation
