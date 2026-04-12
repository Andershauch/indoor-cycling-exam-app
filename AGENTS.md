# AGENTS

Projektfiler og noter til indoor cycling exam app.
# AGENTS.md

## Projekt
Byg en mobile-first web app til en fast teoriprøve i indoor cycling.

## Tech stack
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Prisma
- Neon Postgres
- Vercel

## Overordnede krav
- Samme prøve til alle deltagere
- Samme spørgsmål i samme rækkefølge
- Tidsgrænse på 30 minutter
- Brugeren må gå tilbage mellem spørgsmål
- Brugeren må ændre svar indtil aflevering eller tiden udløber
- Svar skal gemmes løbende
- Resultat skal vises med det samme efter aflevering
- Admin skal kunne tilføje og fjerne spørgsmål
- Admin skal kunne styre spørgsmålsrækkefølge
- Admin skal kunne sende prøve-link via mail og sms
- Admin skal kunne se rapporter bagefter
- Appen skal fungere på mobil, tablet og desktop

## Designkrav
- Designet skal ligge tæt op ad den vedlagte PowerPoint-stil
- Mobile first
- Høj læsbarhed
- Tydelig visuel hierarki
- Roligt, professionelt og moderne udtryk
- Ingen tilfældige standardkomponenter der bryder stilen
- God accessibility
- Ensartede spacing-, farve- og typografiregler

## Kodeprincipper
- Hold løsningen enkel, robust og produktionsnær
- Arbejd i små trin
- Undgå unødvendige dependencies
- Brug tydelige typer
- Brug genbrugelige komponenter
- Brug server-side sikre writes hvor det giver mening
- Sørg for at data ikke går tabt ved refresh
- Lav klare helperfunktioner til scoring, timer og rapportering

## Outputkrav
- Opret README med lokale setup-trin
- Opret .env.example
- Opret en enkel, vedligeholdelsesvenlig struktur
- Kør relevante checks når det er muligt
- Forklar kort hvad du ændrer efter hver større fase

## Funktionelle områder
1. Public landing page
2. Exam flow for deltagere
3. Resultatside
4. Adminområde
5. Invitationer via mail og sms
6. Rapportering
7. Import/seed af spørgsmål

## Vigtige forretningsregler
- Der er kun ét korrekt svar pr. spørgsmål
- Alle deltagere tager den samme prøve
- Spørgsmål vises i fast rækkefølge
- Brugere må navigere frit frem og tilbage i prøven
- Besvarelsen afsluttes automatisk når tiden udløber
- Resultatet skal kunne beregnes straks efter aflevering
- Admin skal kunne eksportere rapportdata

## Prioritering
Først:
1. Projektstruktur
2. Database og datamodel
3. Import/seed af spørgsmål
4. Designsystem
5. Deltagerflow
6. Admin
7. Invitationer
8. Rapportering
9. Review og polish
