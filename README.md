# Kortform Website

Statische Website für die App **Kortform** unter <https://kortform.at> (Landingpage, Impressum, Datenschutz, Support).
Kein Build-Schritt, keine Frameworks, keine externen Abhängigkeiten: Schriften und Bilder liegen im Repo. Einzige Ausnahme
ist die Reichweitenmessung mit GoatCounter (Skript selbst gehostet unter `/count.js`, Zählung an `swordistudios.goatcounter.com`).

## Struktur

```
site/                     wird 1:1 veröffentlicht
  index.html              Startseite
  impressum/index.html    /impressum/
  datenschutz/index.html  /datenschutz/
  support/index.html      /support/ (Hilfe, FAQ, Kontakt)
  styles.css              gemeinsames Stylesheet (hell + dunkel)
  fonts/                  Barlow Condensed, IBM Plex Sans/Mono (WOFF, aus dem App-Repo, SIL OFL)
  favicon.ico/.svg, apple-touch-icon.png, og-image.png
  count.js                GoatCounter-Zählskript (selbst gehostet, leicht angepasst, siehe Hinweise)
  CNAME                   kortform.at (bei Actions-Deployment wirkungslos; die Domain steht in Settings → Pages, siehe DNS-SETUP.md)
  404.html, .nojekyll, robots.txt, sitemap.xml
  app-ads.txt             AdMob-Entwicklerangabe, wird unter /app-ads.txt ausgeliefert
.github/workflows/deploy.yml   Deployment nach GitHub Pages
DNS-SETUP.md                   Anleitung: Repo, Pages, DNS bei World4You
```

Hinweise:

- Pfade sind root-absolut (`/styles.css`), weil die Seite auf der eigenen Domain liegt. Lokale Vorschau daher über
  den Befehl unten, nicht per Doppelklick auf die Datei.
- Impressum und Datenschutz sind von Kortscore abgeleitet und an die tatsächliche Datenverarbeitung der App angepasst;
  bei App-Änderungen (neue SDKs, neue Datenflüsse) die Datenschutzerklärung nachziehen.
- GoatCounter: `site/count.js` ist eine selbst gehostete Kopie von `public/count.js` aus
  <https://github.com/arp242/goatcounter> (Stand: Commit `478f026`, Release v2.7.0, identisch mit `gc.zgo.at/count.js`),
  ISC-Lizenzkopf bleibt erhalten. Einzige Änderung gegenüber dem Original: Die Bildschirmbreite (`s: window.screen.width`)
  wird nicht gelesen und nicht gesendet (Kommentar in `get_data()`). Zum Aktualisieren die Datei von
  <https://raw.githubusercontent.com/arp242/goatcounter/master/public/count.js> holen, den Kommentarkopf (Commit, Datum)
  und die Auslassung von `s` erneut anbringen (Anleitung: <https://www.goatcounter.com/help/countjs-host>); eine
  selbst gehostete Kopie bekommt keine Updates automatisch.
  Eingebunden ist es in jeder HTML-Seite vor `</head>` mit `<script data-goatcounter="https://swordistudios.goatcounter.com/count" async src="/count.js"></script>`;
  die CSP braucht dafür `script-src 'self'` und `connect-src https://swordistudios.goatcounter.com/count`, neue Seiten
  brauchen beides. Lokal zählt `count.js` nicht, solange die Vorschau über `localhost` oder `127.0.0.1` geöffnet wird. Die
  404-Seite zählt unter dem aufgerufenen, nicht vorhandenen Pfad mit dem Titel „404 · Seite nicht gefunden“ (in GoatCounter
  nach „404“ filtern). Dashboard-Einstellungen im Konto: einzelne Seitenaufrufe aus, Sprache aus, Aufbewahrung 365 Tage.
  Bei Änderungen die Datenschutzerklärung (Abschnitte 13 und 15) nachziehen.

## Lokale Vorschau

```bash
python3 -m http.server -d site 8000
```

Dann <http://localhost:8000/> öffnen.

## Deployment

Jeder Push auf `main` startet `.github/workflows/deploy.yml` und veröffentlicht `site/`. Manuell über
**Actions → Deploy to GitHub Pages → Run workflow**. Einmalige Einrichtung (Repo, Pages-Quelle, Domain, DNS): `DNS-SETUP.md`.
