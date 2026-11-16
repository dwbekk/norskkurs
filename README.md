# Norskkurs

Undervisningsmateriell for norskkurs rettet mot portugisisktalende.
Statisk HTML uten byggesteg — sidene kan åpnes direkte eller legges ut som de er.

| Fil | Innhold |
|---|---|
| `index.html` | Forside med oversikt (portugisisk grensesnitt) |
| `treinar.html` | Øvingsmotor: runder på ti oppgaver i seks former, med lyd og dagsrekke |
| `basico.html` | Tall, farger og klokke med uttale skrevet for portugisisktalende |
| `a1.html` | 104 spørsmål A1 med svar på begge språk og 10 ordstillingsoppgaver |
| `a2.html` | 110 spørsmål A2 med svar på begge språk og 10 ordstillingsoppgaver |
| `ordliste.html` | 500 norske hverdagsord med portugisisk oversettelse |
| `english.html` | Engelsk for brasilianere: 664 ord og 126 spørsmål |

## Lyd

`tts.js` bruker nettleserens egen talesyntese — ingen API-nøkkel, ingen lydfiler,
virker offline. `audio-enhance.js` setter høyttalerknapper på innholdet sidene
bygger med JavaScript, uten å røre render-funksjonene deres. `audio.css` er stilen.

Mangler enheten norsk stemme, sier siden fra med installasjonsanvisning på portugisisk.

## Øvingsmotoren

`treinar.html` henter materialet fra `data.js`. **`data.js` er generert** — endrer du
innhold på en av sidene, kjør:

    python3 build/extract.py

## Publisering

Netlify er koblet til dette repoet. Ingen build command, publish directory er `.`
Alt som sendes til `main` legges ut automatisk på norskkurss.netlify.app
