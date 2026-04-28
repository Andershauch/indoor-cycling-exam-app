# Brugerrejser og informationsarkitektur

Denne note beskriver den ønskede rolleopdeling for appen. Den skal bruges som retning for UI,
datamodel og navigation, så systemet ikke blander deltager-, instruktør- og superadminopgaver.

## Kernebegreber

- Prøveformat: En skabelon med titel, tidsgrænse, beståelseskrav, spørgsmål og fast rækkefølge.
- Prøveafholdelse: Et konkret kursus/hold, oprettet af en instruktør ud fra et prøveformat.
- Deltager: En person der inviteres til en prøveafholdelse og gennemfører prøven.
- Forsøg: En deltagers faktiske besvarelse og resultat.
- Rapport: Resultater og statistik for en prøveafholdelse eller på tværs af prøveafholdelser.

Den nuværende datamodel bruger primært `ExamSet` som både prøveformat og aktiv prøve. Næste
datamodeltrin bør derfor adskille prøveformat fra prøveafholdelse.

## Rolle 1: Slutbruger

Slutbrugeren skal gennemføre prøven uden at møde administrationsbegreber.

Primær rejse:

1. Modtager invitation via e-mail.
2. Åbner link på telefon eller iPad.
3. Ser kort intro og starter prøven.
4. Besvarer spørgsmål i fast rækkefølge, men kan gå frem og tilbage.
5. Afleverer eller auto-afleveres ved tidsudløb.
6. Ser resultat med det samme.

UI-principper:

- Ingen global navigation.
- Store touch targets.
- Tydelig timer og fremdrift.
- Læsbart spørgsmål først, sekundære handlinger nederst.

## Rolle 2: Admin / Instruktør

Instruktøren afholder et konkret hold. De skal ikke vedligeholde systemets prøveformater.

Primær rejse:

1. Åbner admin via magic link.
2. Ser egne prøveafholdelser.
3. Opretter en ny prøveafholdelse ud fra et eksisterende prøveformat.
4. Tilføjer deltagere via Excel eller manuelt navn/e-mail.
5. Sender deltagerlinks.
6. Følger live status under prøven.
7. Ser resultater efter aflevering.
8. Afslutter prøveafholdelsen, så data låses og indgår i central rapportering.

UI-principper:

- Mobile first, fordi instruktøren ofte står med telefonen under kurset.
- Startside skal være handlingsorienteret: "Opret", "Fortsæt", "Følg status".
- Det nuværende swipe-flow er godt til afvikling, men skal bindes til én konkret prøveafholdelse.
- Excel-upload hører til instruktørens prøveafholdelse, ikke til superadminforsiden.

## Rolle 3: SuperAdmin

SuperAdmin administrerer systemet og ser på tværs af alle prøveafholdelser.

Primær rejse:

1. Opretter og vedligeholder prøveformater.
2. Opretter og vedligeholder admins/instruktører.
3. Ser alle prøveafholdelser oprettet af admins.
4. Åbner en prøveafholdelse for support, kontrol eller rapportering.
5. Eksporterer og analyserer resultater på tværs.

UI-principper:

- Superadmin skal ikke have Excel-upload til deltagere som primær handling.
- Navigation skal være systemorienteret: Overblik, Prøveformater, Admins, Prøveafholdelser,
  Rapporter.
- Superadmin kan have test-/preview-links, men de skal mærkes som test eller support.
- Store kampagneagtige headlines skal dæmpes på arbejdsflader med tabeller og formularer.

## Foreslået navigation

Admin:

- Mine prøveafholdelser
- Aktuel afholdelse (`/admin/sessions/[sessionId]`)
- Resultater

SuperAdmin:

- Overblik
- Prøveformater
- Admins
- Prøveafholdelser
- Rapporter

## Implementeringsrækkefølge

1. Ryd UI og navigation op i de tre rolleflows.
2. Indfør datamodel for prøveafholdelser.
3. Flyt invitationer og forsøg fra prøveformat til prøveafholdelse.
4. Gør adminflowet "mine prøveafholdelser" frem for "aktiv prøve".
5. Udvid superadminrapporter til at dække alle prøveafholdelser.
