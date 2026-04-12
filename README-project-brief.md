# Project Brief

Kort projektbrief for indoor cycling exam app.
# Projektbrief

## Formål
Byg en web app til en fast indoor cycling teoriprøve.

## Brugergrupper
1. Deltagere/elever
2. Admin/underviser

## Deltagerflow
- Deltager modtager et link via mail eller sms
- Deltager åbner prøven på mobil, tablet eller desktop
- Deltager starter prøven
- Prøven varer 30 minutter
- Deltager kan gå frem og tilbage mellem spørgsmål
- Deltager kan ændre svar undervejs
- Svar gemmes løbende
- Prøven afleveres manuelt eller automatisk når tiden udløber
- Resultat vises med det samme

## Adminflow
- Admin logger ind
- Admin kan oprette, redigere og slette spørgsmål
- Admin kan styre rækkefølgen på spørgsmål
- Admin kan sende prøve-link via mail eller sms
- Admin kan se alle forsøg
- Admin kan se rapporter og eksportere data

## Eksamenregler
- Alle får samme prøve
- Alle får samme rækkefølge
- Ét korrekt svar per spørgsmål
- Tid: 30 minutter
- Brugeren må ændre svar indtil aflevering
- Resultat beregnes straks ved aflevering

## Tekniske mål
- Hosting på Vercel
- Database i Neon Postgres
- Prisma som ORM
- Next.js App Router
- Tailwind til styling
- Mobile first
- Produktionsklar struktur

## Senere integrationer
- Mail-udsendelse
- SMS-udsendelse
- Rapportering og eksport