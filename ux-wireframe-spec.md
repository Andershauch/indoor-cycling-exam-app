# UX Wireframe Spec

## Status

Dette er den sidste planlægningsspec før implementering.

Efter denne fil er næste skridt at bygge den nye deltageroplevelse i kode.

## Implementeringsrækkefølge

### Første kodefase

1. nyt separat deltager-layout
2. ny invitation landing på mobil
3. ny startskærm til prøve
4. ny mobil prøveside
5. ny afleveringsoplevelse
6. ny mobil resultatside

### Anden kodefase

1. nyt admin-dashboard
2. ny struktur for hold eller udsendelser
3. batch-oprettelse af deltagere
4. bedre invitationsoverblik

## Routes der ændres først

### Deltager

- `/invite/[token]`
- `/exam`
- `/exam/[attemptId]`
- `/result/[attemptId]`

### Layout

- nyt dedikeret deltager-layout
- admin-layout bevares midlertidigt
- nuværende public-layout reduceres i deltagerflowet

## Layoutstruktur vi bygger først

### Nyt deltager-layout

Formål:
- ren mobiloplevelse
- ingen adminnavigation
- fokus på én opgave ad gangen

Struktur:
- topområde med logo
- centerkolonne med stærk vertikal rytme
- mobilvenlige safe paddings
- mulighed for sticky top og sticky bottom på prøvesiden

## Wireframe 1: Invitation landing

### Formål

Skal føles som en varm og tydelig velkomst til prøven.

### Indhold i rækkefølge

1. diskret logo
2. lille label: `Indoor Cycling`
3. stor overskrift:
   - `Klar til prøven?`
4. kort forklaring:
   - du har modtaget en invitation
   - prøven tager 30 minutter
   - svar gemmes løbende
5. infoboks med:
   - antal spørgsmål
   - tidsgrænse
   - mulighed for at gå tilbage og ændre svar
6. primær knap:
   - `Start prøve`
7. sekundær mikrotekst:
   - åbnes bedst på din telefon

### Mobilprincipper

- én tydelig CTA
- meget luft
- ingen ekstra links

## Wireframe 2: Startskærm for prøve

### Formål

Skal være et roligt startpunkt før første spørgsmål.

### Indhold i rækkefølge

1. overskrift:
   - `Prøven starter nu`
2. kort tekst:
   - når du starter, begynder tiden
3. tre tydelige punkter:
   - 30 minutter
   - du kan gå frem og tilbage
   - dine svar gemmes automatisk
4. primær knap:
   - `Start nu`

### UX-note

Denne skærm skal føles mere ceremoniel end teknisk.

## Wireframe 3: Aktiv prøveside mobil

### Formål

Skal være den stærkeste skærm i hele appen.

### Topområde

1. lille logo eller brandmark
2. kompakt timerbadge
3. kompakt progress:
   - `Spørgsmål 4 af 40`

### Midterområde

1. kategorilabel hvis relevant
2. stor spørgsmålstekst
3. svargruppe med store trykflader

### Bundområde

Sticky bundnavigation:
- `Tilbage`
- `Næste`

Over navigationen:
- kort gem-status

### Adfærd

- kun ét spørgsmål synligt ad gangen
- tydelig valgt state
- ingen små klikområder

## Wireframe 4: Mobil navigation for spørgsmål

### Formål

Brugeren skal føle kontrol uden at blive overvældet.

### Løsning

Primær løsning:
- forrige/næste i sticky footer

Sekundær løsning:
- `Se oversigt` åbner sheet eller drawer med spørgsmålsnumre

Drawer-indhold:
- nummerchips
- aktivt spørgsmål
- besvaret/ubesvaret state

### UX-note

Vi skal undgå at vise 40 små elementer permanent på mobilskærmen.

## Wireframe 5: Afleveringsskærm

### Formål

Skal gøre aflevering tryg og tydelig.

### Indhold

1. overskrift:
   - `Klar til at aflevere?`
2. opsummering:
   - antal besvarede
   - antal ubesvarede
3. tydelig tekst:
   - du kan ikke ændre svar bagefter
4. knapper:
   - `Gå tilbage`
   - `Aflever prøve`

## Wireframe 6: Resultatside mobil

### Formål

Skal give en værdig og rolig afslutning.

### Indhold

1. stor status:
   - `Bestået`
   - eller `Ikke bestået`
2. scorekort:
   - procent
   - antal rigtige
3. kort afslutningstekst
4. ingen adminveje

### UX-note

Resultatsiden skal føles afsluttet, ikke som en mellemstation.

## Wireframe 7: Admin dashboard desktop

### Formål

Skal hjælpe admin i gang med de vigtigste handlinger.

### Struktur

Top:
- sidetitel
- aktiv prøve
- hurtig handling

Midte:
- fire statkort
  - sendt
  - åbnet
  - i gang
  - gennemført

Nederst:
- seneste invitationer
- genveje til rapport og deltagere

## Wireframe 8: Admin hold eller udsendelse

### Formål

Skal samle gruppeflowet ét sted.

### Struktur

Venstre:
- navn på hold
- prøve
- oprettelsesdato

Højre:
- handlinger:
  - tilføj deltagere
  - send invitationer
  - eksportér

Under:
- deltagerliste i tabel
- statusbadges
- batch handlinger

## Wireframe 9: Admin deltageroprettelse

### Formål

Skal gøre masseoprettelse hurtig.

### Struktur

Tabs eller segment:
- enkeltvis
- indsæt flere
- csv senere

Felter:
- navn
- e-mail
- telefon
- kanal

Knap:
- `Tilføj deltager`

## Wireframe 10: Rapportside desktop

### Formål

Skal være let at aflæse og let at handle på.

### Struktur

Top:
- filtre
- eksport

Midte:
- beståelsesprocent
- gennemsnitlig score
- gennemførte forsøg

Bund:
- tabel med deltagere
- sidepanel med ofte forkerte spørgsmål

## Komponenter der skal bygges eller ændres først

### Nye deltagerkomponenter

- ParticipantShell
- InvitationHero
- ExamStartPanel
- MobileExamHeader
- MobileQuestionCard
- MobileAnswerList
- MobileExamFooter
- QuestionOverviewSheet
- SubmitReviewCard
- MobileResultHero

### Komponenter der skal refaktoreres

- PageHeader
- ProgressBar
- TimerBadge
- AnswerChoice
- QuestionNavigation

### Nye adminkomponenter til næste fase

- AdminDashboardHero
- AdminStatsGrid
- CohortCard
- ParticipantImportPanel
- ParticipantBatchTable
- InvitationBatchActions

## Kodemæssig build-plan

### Trin 1

Opret nyt deltager-layout og routestruktur, så deltagerflowet visuelt adskilles helt fra admin.

### Trin 2

Byg ny invitation landing og startskærm for prøve.

### Trin 3

Byg ny mobil prøveside med sticky header og sticky footer.

### Trin 4

Byg nyt afleveringsflow og ny resultatside.

### Trin 5

Når deltagerflowet er stærkt, bygger vi admin gruppeflow.

## Definition af succes

### Deltageroplevelse er god nok når

- en bruger kan åbne mail på mobil og forstå næste skridt uden tvivl
- prøvesiden føles som en mobil-first oplevelse
- der ikke er adminstøj i deltagerflowet
- aflevering og resultat føles enkle og trygge

### Adminoplevelse er god nok når

- admin kan oprette en gruppe hurtigt
- admin kan sende invitationer til mange uden friktion
- admin kan aflæse status uden at lede

## Næste skridt

Efter denne spec går vi direkte i kode med:

1. nyt deltager-layout
2. ny invitation landing
3. ny mobil prøveside
4. ny resultatside
