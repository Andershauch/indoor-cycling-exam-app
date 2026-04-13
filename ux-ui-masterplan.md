# UX/UI Masterplan

## Formål

Dette dokument fastlåser den ønskede brugeroplevelse før fase 8 og videre implementering.

Appen skal fremover opleves som to tydeligt adskilte produkter:

- et adminværktøj til desktop
- en mobil-first deltageroplevelse til prøven

Målet er at gøre oplevelsen mere fokuseret, mere lækker og mere intuitiv for begge målgrupper uden at blande administration ind i deltagerflowet.

## Designmål

### Admin

- skal fungere bedst på desktop og tablet
- skal være hurtigt, overskueligt og driftsorienteret
- skal gøre det let at oprette og styre en gruppe deltagere
- skal samle invitationer, status, rapporter og spørgsmål i en tydelig struktur

### Deltager

- skal fungere bedst på mobil
- skal føles som en dedikeret prøveoplevelse, ikke som en almindelig webapp
- skal være rolig, tydelig og tryg
- skal føre brugeren fra invitation til resultat med mindst mulig friktion

## Grundprincipper

- Admin og deltager må ikke dele samme oplevede navigation.
- Deltagerflowet skal være rent og uden admin-støj.
- Én skærm skal have én tydelig primær handling.
- Mobiloplevelsen skal optimeres til tommelfingerbrug og små skærme.
- Admin skal optimere effektivitet. Deltagerflowet skal optimere fokus og tryghed.

## Ny informationsarkitektur

### Admin desktop

- Dashboard
- Hold og udsendelser
- Deltagere
- Invitationer
- Spørgsmål
- Rapporter
- Indstillinger

### Deltager mobil

- Invitation landing
- Start prøve
- Aktiv prøve
- Aflevering
- Resultat

## Ny brugerrejse: admin

### Rejse A: opret og send til en gruppe

1. Admin logger ind.
2. Admin lander på dashboard med tre primære valg:
   - opret hold
   - inviter deltagere
   - se rapporter
3. Admin opretter en udsendelse eller et hold.
4. Admin tilføjer deltagere:
   - enkeltvis
   - kopiér og indsæt flere
   - senere via CSV
5. Admin vælger kanal:
   - e-mail
   - sms senere
6. Admin sender invitationer samlet.
7. Admin kan se status for hele holdet.

### Rejse B: følg op på gennemførsel

1. Admin åbner et hold.
2. Admin ser samlet status:
   - ikke sendt
   - sendt
   - åbnet
   - i gang
   - gennemført
3. Admin klikker videre til rapport.
4. Admin ser resultater pr. deltager og samlet statistik.

## Ny brugerrejse: deltager

### Rejse A: fra mail til start

1. Deltager modtager e-mail.
2. Deltager trykker på link.
3. Deltager ser en ren mobil landing:
   - logo
   - kort intro
   - tid
   - antal spørgsmål
   - tydelig startknap
4. Deltager starter prøven.

### Rejse B: gennemfør prøven

1. Deltager ser ét spørgsmål ad gangen.
2. Deltager vælger svar.
3. Deltager går frem og tilbage.
4. Deltager ser tydelig timer og progression.
5. Deltager får rolig feedback om at svar gemmes.
6. Deltager afleverer eller auto-submitter ved timeout.

### Rejse C: resultat

1. Deltager ser resultat straks.
2. Deltager ser score og bestået eller ikke bestået.
3. Deltager ser en enkel og afsluttende slutskærm.

## Wireframe-plan

### 1. Admin dashboard

Formål:
- give hurtigt overblik
- lede admin til den vigtigste handling

Indhold:
- velkomst
- aktiv prøve
- antal invitationer sendt
- antal i gang
- antal gennemført
- genvej til opret hold
- genvej til rapporter

### 2. Admin hold og udsendelser

Formål:
- samle gruppehåndtering ét sted

Indhold:
- liste over hold eller udsendelser
- knap til nyt hold
- antal deltagere
- statusfordeling
- seneste aktivitet

### 3. Admin deltagerliste

Formål:
- gøre batch-oprettelse og batch-send nemt

Indhold:
- tabel med navn, e-mail, status og kanal
- tilføj række
- indsæt flere deltagere
- send invitationer til alle
- resend til enkelte

### 4. Mobil invitation landing

Formål:
- skabe ro, tillid og retning før prøven starter

Indhold:
- diskret logo
- overskrift
- kort forklaring
- tid og antal spørgsmål
- tekst om at svar gemmes løbende
- primær CTA: start prøve

### 5. Mobil aktiv prøve

Formål:
- maksimalt fokus på besvarelsen

Indhold:
- timer
- progress
- spørgsmålsnummer
- spørgsmålstekst
- svarmuligheder
- fast bundnavigation
- tydelig gem-status

### 6. Mobil afleveringsskærm

Formål:
- gøre aflevering tryg og tydelig

Indhold:
- opsummering
- antal ubesvarede spørgsmål
- tydelig konsekvens
- aflever nu
- gå tilbage

### 7. Mobil resultatside

Formål:
- give en rolig og tydelig afslutning

Indhold:
- score
- bestået eller ikke bestået
- kort hjælpetekst
- evt. kontakt eller næste skridt senere

### 8. Rapportoversigt desktop

Formål:
- give admin hurtigt beslutningsgrundlag

Indhold:
- beståelsesprocent
- gennemsnitlig score
- deltagerliste
- filtrering
- ofte fejlbesvarede spørgsmål
- eksport

## Komponentliste

### Deltagerflow

- MobileHero
- InvitationIntroCard
- ExamStartCard
- StickyExamHeader
- ExamProgressCompact
- QuestionCardMobile
- AnswerChoiceMobile
- StickyExamFooterNav
- SaveStatusNotice
- SubmitSummaryCard
- ResultScoreCard
- ResultStatusBanner

### Adminflow

- AdminDesktopShell
- AdminSidebarNav
- AdminTopBar
- StatCard
- BatchInviteComposer
- ParticipantTable
- StatusBadge
- BulkActionBar
- ReportFilterBar
- WrongAnswerInsights

## Layoutprincipper

### Deltager mobil

- maks fokus på centerkolonne
- fast bundnavigation
- få elementer pr. viewport
- generøs spacing
- store trykflader
- høj kontrast
- ingen sekundære adminlinks

### Admin desktop

- to eller tre kolonner hvor det giver mening
- kompakte lister og tabeller
- tydelig gruppering af information
- batch-handlinger tæt på data

## Visuel retning

### Deltager

- mere varm og præsentationsagtig
- store typografiske statements
- tydelig gul identitet
- mere luft
- færre UI-linjer og mindre “dashboard-følelse”

### Admin

- samme brandfarver
- mere neutral og struktureret brug af layout
- stærk typografi i overskrifter
- mere kompakt informationsvisning

## Tydelige ændringer fra nuværende løsning

- deltager må ikke se den nuværende generelle appnavigation
- invitationsflowet skal starte på en mere ceremoniel startskærm
- admin skal arbejde med hold eller udsendelser i stedet for kun enkeltinvitationer
- rapporter skal føles som et værktøj, ikke bare en side med tabeller
- prøvesiden skal føles mere som en fokuseret mobiloplevelse end en generisk webformular

## Implementeringsfaser

### Fase A: UX-fundament

- opdel admin-layout og deltager-layout helt
- fjern deltagernavigation der ikke hører til prøven
- opret ny mobil invitation landing
- opret ny mobil startskærm for prøve

### Fase B: mobil prøveoplevelse

- redesign prøveskærm til mobil-first
- fast bundnavigation
- forbedret timer og progression
- forbedret afleveringsoplevelse
- forbedret resultatside

### Fase C: admin gruppeflow

- introducér hold eller udsendelser i UI
- byg batch-oprettelse af deltagere
- forbedr invitationsoversigten
- gør det let at sende invitationer til flere på én gang

### Fase D: rapport og drift

- forbedr rapportdashboard
- tydelig statusopfølgning pr. hold
- bedre eksportflade
- klargør production hardening

## Anbefalet prioritering

1. nyt deltager-layout
2. ny mobil invitation landing
3. ny mobil prøveside
4. ny mobil resultatside
5. admin hold og batch-flow
6. rapportforbedringer
7. fase 8 hardening

## Beslutninger vi bør fastlåse før implementering

- Skal admin arbejde med “hold”, “udsendelser” eller “forløb” som primært begreb?
- Skal deltagerens resultat kun vise score eller også korrekt antal og evt. feedback?
- Skal invitationen altid gå direkte til prøven, eller skal den altid lande på en intro/startskærm først?
- Skal admin kunne resend til hele grupper i én handling?

## Min anbefaling

Før næste store kodefase bygger vi efter denne rækkefølge:

1. redesign deltagerens mobiloplevelse
2. redesign admin omkring gruppeopsætning
3. derefter production hardening i fase 8

Det giver den største oplevede kvalitetsforbedring med mindst risiko for at låse os fast i en dårlig informationsarkitektur.
