# Instruktørmanual

Denne manual forklarer, hvordan systemet virker i praksis, og hvilke trin du skal følge for at afvikle en ny prøve let, hurtigt og sikkert.

Manualen er skrevet til instruktører og admins, ikke til udviklere.

## 1. Hvad systemet gør

Systemet bruges til at afvikle en fast teoriprøve for deltagere på indoor cycling-uddannelsen.

Det betyder:

- Alle deltagere tager den samme prøve.
- Spørgsmålene vises i samme rækkefølge for alle.
- Prøven har en fast tidsgrænse.
- Deltagerne får et personligt link til prøven.
- Svar gemmes løbende undervejs.
- Resultatet vises med det samme efter aflevering.
- Admin kan følge status og hente rapporter bagefter.

## 2. Roller i systemet

Der er to typer admin-brugere:

### Admin

En almindelig admin kan:

- logge ind via magic link
- uploade deltagerliste fra Excel
- sende invitationer
- oprette enkeltinvitationer manuelt
- følge status under prøven
- se rapporter og resultater

### Superadmin

En superadmin kan det samme som en admin, men kan derudover også:

- oprette og deaktivere andre admins
- ændre spørgsmål
- ændre rækkefølge på spørgsmål
- styre den overordnede opsætning

Hvis du kun skal afvikle prøver, er du normalt almindelig admin.

## 3. Sådan virker login

Admin-login bruger ikke kodeord.

I stedet gør du sådan:

1. Gå til `/admin/login`
2. Skriv din admin-e-mail
3. Systemet sender et magic link til din mail
4. Klik på linket i mailen
5. Du bliver logget direkte ind

Hvis du ikke modtager mailen:

- tjek spammappe
- tjek at din e-mail faktisk er oprettet som admin
- kontakt en superadmin, hvis problemet fortsætter

## 4. Hvad du skal have klar før en ny prøve

Før du afvikler en ny prøve, skal følgende være på plads:

- Der skal være en aktiv prøve i systemet
- Deltagerlisten skal være klar i Excel
- Excel-filen skal mindst have:
  - `Fulde navn`
  - `E-mailadresse`
- Du skal have adgang som admin
- Mailudsendelse skal fungere

Hvis der ikke findes en aktiv prøve, kan deltagerne ikke inviteres.

## 5. Den normale arbejdsgang

Den normale arbejdsgang er meget enkel:

1. Log ind som admin
2. Gå til admin-overblikket
3. Upload Excel-filen med deltagere
4. Systemet opretter invitationer og sender links
5. Åbn statussiden og følg prøven live
6. Brug rapportsiden bagefter

Det er den arbejdsgang, systemet er designet til.

## 6. Trin for trin: afvikling af en ny prøve

### Trin 1: Log ind

Gå til admin-login og brug dit magic link.

Når du er logget ind, lander du i adminområdet.

### Trin 2: Kontroller den aktive prøve

På admin-overblikket kan du se:

- om der er en aktiv prøve
- hvor mange spørgsmål prøven har
- tidsrammen
- beståelseskravet

Kontroller altid dette først, før du sender invitationer ud.

Hvis noget er forkert her, skal det rettes før afviklingen starter.

### Trin 3: Upload deltagerlisten

På admin-overblikket eller invitationssiden kan du uploade en Excel-fil.

Systemet læser deltagerne ind og opretter invitationer.

Efter upload får du besked om:

- hvor mange invitationer der blev oprettet
- hvor mange der fejlede
- hvor mange rækker der blev ignoreret

Typiske årsager til ignorerede rækker:

- tom række
- manglende e-mail
- ugyldig e-mail
- dublet

### Trin 4: Brug manuel oprettelse ved behov

Hvis en enkelt deltager mangler efter Excel-upload, kan du oprette en enkelt invitation manuelt.

Det er kun tænkt som fallback, ikke som hovedmetode.

### Trin 5: Følg status live

Gå til den konkrete afholdelse fra `/admin`, eller åbn den direkte på `/admin/sessions/[sessionId]`.

Her kan du løbende se:

- hvor mange invitationer der er sendt
- hvor mange der har åbnet linket
- hvor mange der er færdige
- seneste resultater
- seneste admin-aktivitet

Det er den side, du bør have åben under selve prøveafviklingen.

### Trin 6: Se rapporter bagefter

Når deltagerne er færdige, går du til `/reports`.

Her kan du:

- se alle forsøg
- filtrere på status
- filtrere på bestået / ikke bestået
- søge på navn, e-mail eller telefon
- eksportere CSV
- se hvilke spørgsmål der oftest besvares forkert

## 7. Sådan fungerer deltagernes link

Hver deltager får et personligt link.

Når deltageren klikker på linket:

1. Systemet åbner prøven direkte
2. Deltageren skal ikke logge ind med kodeord
3. Deltageren arbejder videre på samme enhed

Vigtigt:

- Kun én aktiv deltager-session er tilladt ad gangen
- Deltageren skal derfor gennemføre på den enhed, hvor linket først blev åbnet
- Hvis deltageren åbner linket på en anden enhed samtidig, bliver adgangen afvist

Det er med vilje og er en del af eksamenssikkerheden.

## 8. Hvad deltageren oplever

Deltageren oplever normalt dette flow:

1. Modtager mail med personligt prøvelink
2. Klikker på linket
3. Starter prøven med det samme
4. Besvarer spørgsmål
5. Kan gå frem og tilbage undervejs
6. Svar gemmes løbende
7. Afleverer eller bliver auto-afleveret ved tidens udløb
8. Ser resultat med det samme

Efter aflevering kan deltageren åbne linket igen og se resultatet.

## 9. Vigtige regler under afviklingen

Følg disse regler i drift:

- Kontroller altid den aktive prøve før upload
- Brug Excel-upload som hovedflow
- Brug manuel invitation kun ved enkeltfejl
- Hold statussiden åben under afviklingen
- Undgå at ændre spørgsmål, hvis prøven allerede er i brug

Hvis en prøve allerede har deltagerforsøg, er spørgsmålene låst for at beskytte data og resultater.

## 10. Typiske problemer og hvad du gør

### Problem: Deltager har ikke fået mailen

Gør dette:

1. Tjek at e-mailadressen i invitationen er korrekt
2. Bed deltageren tjekke spammappe
3. Tjek invitationssiden for fejl på udsendelsen
4. Opret eventuelt en ny invitation manuelt, hvis nødvendigt

### Problem: Deltager kan ikke åbne linket

Gør dette:

1. Tjek om linket er åbnet på en anden enhed
2. Bed deltageren bruge den oprindelige enhed
3. Tjek om invitationen er udløbet
4. Opret en ny invitation, hvis situationen kræver det

### Problem: Excel-upload fejler

Gør dette:

1. Kontroller at filen er en gyldig Excel-fil
2. Kontroller at kolonnerne hedder `Fulde navn` og `E-mailadresse`
3. Fjern tomme eller ugyldige rækker
4. Prøv igen

### Problem: En admin kan ikke logge ind

Gør dette:

1. Tjek at personen er oprettet som admin
2. Tjek at magic link blev sendt
3. Tjek spammappe
4. Få en superadmin til at kontrollere brugerens rolle og status

## 11. Den korte version

Hvis du bare vil huske den hurtige arbejdsgang, så er den:

1. Log ind med magic link
2. Tjek aktiv prøve
3. Upload Excel
4. Åbn status
5. Følg prøven live
6. Se rapporter bagefter

## 12. Anbefalet praksis

For at afvikle prøven så fejlfrit som muligt anbefales det:

- at bruge en lille testfil først, hvis du er usikker på Excel-formatet
- at logge ind i god tid før deltagerne starter
- at holde statussiden åben under afviklingen
- at bruge rapporterne direkte efter endt prøve
- at lade en superadmin håndtere spørgsmål og opsætning, mens instruktører fokuserer på selve afviklingen

## 13. Kontakt og ansvar

Hvis noget i afviklingen ikke giver mening, er hovedreglen:

- Admin håndterer upload, invitationer, status og rapporter
- Superadmin håndterer opsætning, spørgsmål og admin-adgange

Det gør den daglige drift enklere og reducerer risikoen for fejl under afviklingen.
