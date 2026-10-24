# Kortform Website

Statische Website für die App **Kortform** unter <https://kortform.at> (Landingpage, Impressum, Datenschutz).
Kein Build-Schritt, keine Frameworks, keine externen Abhängigkeiten: Schriften und Bilder liegen im Repo.

## Struktur

```
site/                     wird 1:1 veröffentlicht
  index.html              Startseite
  impressum/index.html    /impressum/
  datenschutz/index.html  /datenschutz/
  styles.css              gemeinsames Stylesheet (hell + dunkel)
  fonts/                  Barlow Condensed, IBM Plex Sans/Mono (WOFF, aus dem App-Repo, SIL OFL)
  favicon.ico/.svg, apple-touch-icon.png, og-image.png
  CNAME                   kortform.at (bei Actions-Deployment wirkungslos; die Domain steht in Settings → Pages, siehe DNS-SETUP.md)
  404.html, .nojekyll, robots.txt, sitemap.xml
.github/workflows/deploy.yml   Deployment nach GitHub Pages
DNS-SETUP.md                   Anleitung: Repo, Pages, DNS bei World4You
```

Hinweise:

- Pfade sind root-absolut (`/styles.css`), weil die Seite auf der eigenen Domain liegt. Lokale Vorschau daher über
  den Befehl unten, nicht per Doppelklick auf die Datei.
- Impressum und Datenschutz sind von Kortscore abgeleitet und an die tatsächliche Datenverarbeitung der App angepasst;
  bei App-Änderungen (neue SDKs, neue Datenflüsse) die Datenschutzerklärung nachziehen.
- Kein „ITN“ im Produktnamen, Titel oder Claim (geschützte Marke).

## Lokale Vorschau

```bash
python3 -m http.server -d site 8000
```

Dann <http://localhost:8000/> öffnen.

## Deployment

Jeder Push auf `main` startet `.github/workflows/deploy.yml` und veröffentlicht `site/`. Manuell über
**Actions → Deploy to GitHub Pages → Run workflow**. Einmalige Einrichtung (Repo, Pages-Quelle, Domain, DNS): `DNS-SETUP.md`.
