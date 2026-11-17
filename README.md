# Kortform Website

Statische Website für die App **Kortform** unter <https://kortform.at> (Landingpage, Impressum, Datenschutz, Nutzungsbedingungen, Support).
Kein Build-Schritt, keine Frameworks, keine externen Abhängigkeiten: Schriften und Bilder liegen im Repo. Einzige Ausnahme
ist die Reichweitenmessung mit GoatCounter (Skript selbst gehostet unter `/count.js`, Zählung an `swordistudios.goatcounter.com`).

## Struktur

```
site/                     wird 1:1 veröffentlicht
  index.html              Startseite
  impressum/index.html    /impressum/
  datenschutz/index.html  /datenschutz/
  support/index.html      /support/ (Hilfe, FAQ, Kontakt)
  app/index.html          /app (Installationsseite: Store-Weiterleitung nach User-Agent, mit app/redirect.js und app/app.css; siehe Hinweise)
  nutzungsbedingungen.html  /nutzungsbedingungen.html (flache Datei, URL so vom Betreiber vorgegeben; vom Plus-Sheet der App verlinkt)
  styles.css              gemeinsames Stylesheet (hell + dunkel)
  fonts/                  Barlow Condensed, IBM Plex Sans/Mono (WOFF, aus dem App-Repo, SIL OFL)
  favicon.svg (App-Icon, Header-Logo), favicon-small.svg (vereinfacht, fett, Tab-Icon), favicon.ico (16/32/48 aus favicon-small.svg), apple-touch-icon.png, og-image.png
  video.js                Klick-zum-Laden für die YouTube-Erklärvideos (Startseite, Support; siehe Hinweise)
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
- Installationsseite `https://kortform.at/app`: der Installationslink im „Einladen“-Text der Verfügbarkeit der
  Mannschaftsführung in der Kortform-App. Wer die App noch nicht hat, kommt von dort in den richtigen Store und öffnet
  danach den Link zur Mannschaft noch einmal. `site/app/redirect.js` (blockierend im `<head>`, `location.replace`):
  User-Agent enthält `iPhone`, `iPad` oder `iPod` → App Store; sonst enthält er `Android` → Google Play; alles andere
  (Desktop, unbekannt, iPadOS-Safari, das sich als Macintosh meldet) bleibt auf der Seite mit beiden Buttons. Ohne
  JavaScript sind beide Buttons sichtbar (einfache Links). Die Store-URLs stehen in `app/index.html` und
  `app/redirect.js`: nur gemeinsam ändern. Die Seite ist `noindex` und steht bewusst nicht in `sitemap.xml`. GitHub Pages
  leitet `/app` auf `/app/` weiter; die lokale Vorschau ebenso.
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
- YouTube-Erklärvideos (`.video-card` in `index.html` und `support/index.html`, Stile in `styles.css`, die Grid-Regeln der Startseite in `home.css`): Zwei-Klick-Lösung, vor dem Klick geht keine Anfrage an YouTube/Google. `video.js` ersetzt den Abspielknopf erst beim Klick durch einen iframe auf `youtube-nocookie.com`; ohne JavaScript bleibt der Link „Auf YouTube ansehen“. Die CSP dieser beiden Seiten hat dafür `frame-src https://www.youtube-nocookie.com`, Datenschutzerklärung Abschnitt 13 beschreibt die Einbettung.

## Lokale Vorschau

```bash
python3 -m http.server -d site 8000
```

Dann <http://localhost:8000/> öffnen.

## Deployment

Jeder Push auf `main` startet `.github/workflows/deploy.yml` und veröffentlicht `site/`. Manuell über
**Actions → Deploy to GitHub Pages → Run workflow**. Einmalige Einrichtung (Repo, Pages-Quelle, Domain, DNS): `DNS-SETUP.md`.
