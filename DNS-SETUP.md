# kortform.at auf GitHub Pages einrichten

Ziel: `https://kortform.at` zeigt den Inhalt von `site/` aus dem Repo
`git@github.com:mgursch/kortform-web.git`. Die Domain ist bei World4You registriert.
Die Reihenfolge unten ist so gewählt, dass nichts doppelt gemacht werden muss.

Voraussetzungen: GitHub-Account `mgursch`, installiertes `git` (für die Prüfungen optional `gh`, `dig`, `curl`).
GitHub Pages ist im kostenlosen Tarif nur für **öffentliche** Repos verfügbar, das Repo muss also public sein.

## 1. GitHub-Repo anlegen

Im Browser: <https://github.com/new>, Owner `mgursch`, Name `kortform-web`, **Public**, ohne README, ohne `.gitignore`,
ohne Lizenz (das Repo wird gleich mit vorhandenem Inhalt gepusht).

Oder per CLI:

```bash
gh repo create mgursch/kortform-web --public
```

Der lokale Ordner `/Users/mgursch/Documents/kortform-web` ist bereits ein Git-Repo auf `main` mit
`origin = git@github.com:mgursch/kortform-web.git`. Kontrolle:

```bash
git -C /Users/mgursch/Documents/kortform-web remote -v
```

## 2. Pages-Quelle auf „GitHub Actions" stellen (vor dem ersten Push)

Der Workflow bricht sonst im Schritt `configure-pages` ab, weil Pages für das Repo noch nicht aktiv ist.
Im Repo: **Settings → Pages → Build and deployment → Source: „GitHub Actions"**.

Per CLI:

```bash
gh api -X POST repos/mgursch/kortform-web/pages -f build_type=workflow
```

(Falls Pages schon existiert und nur umgestellt werden soll: `-X PUT` statt `-X POST`.)

Fallback: Liefert der `POST` in einem komplett leeren Repo einen Fehler `422`, zuerst pushen (Abschnitt 4), danach
Pages aktivieren (UI oder derselbe `gh api`-Befehl) und den fehlgeschlagenen Workflow unter **Actions → Re-run all jobs**
neu starten oder per **Run workflow** auslösen. Oder einfach direkt die Oberfläche benutzen.

## 3. Domain-Verifizierung für den Account (empfohlen)

Mit einer verifizierten Domain kann niemand anderes `kortform.at` oder eine Subdomain in einem fremden Repo hinterlegen
(Schutz vor Domain-Takeover, falls das Pages-Repo mal gelöscht wird oder die DNS-Einträge hängen bleiben).

1. Auf GitHub: Profilbild → **Settings** → in der Seitenleiste **Pages** (Abschnitt „Code, planning, and automation")
   oder direkt <https://github.com/settings/pages>.
2. **Add a domain** → `kortform.at` eingeben → **Add domain**.
3. GitHub zeigt einen TXT-Record an, Name `_github-pages-challenge-mgursch.kortform.at` und einen Wert (Code).
   Beides kopieren.
4. Bei World4You den TXT-Record anlegen (siehe Abschnitt 6.5). Das Host-/Namensfeld bekommt
   `_github-pages-challenge-mgursch`, ohne `.kortform.at`; falls die Oberfläche den vollen Namen verlangt, den
   kompletten Namen eintragen. Der Wert ist der Code von GitHub, ohne Anführungszeichen (die ergänzt World4You bei Bedarf).
5. Prüfen, ob der Eintrag im Netz ist:

   ```bash
   dig +short TXT _github-pages-challenge-mgursch.kortform.at
   ```

6. Zurück auf der GitHub-Seite beim Eintrag **Verify** klicken. Das kann nach dem Anlegen einige Minuten dauern,
   dann einfach später erneut versuchen. Der TXT-Record darf danach **stehen bleiben**; GitHub prüft ihn regelmäßig neu.

## 4. Ersten Push machen

```bash
cd /Users/mgursch/Documents/kortform-web
git add -A
git commit -m "Add Kortform website"
git push -u origin main
```

Der Push startet den Workflow „Deploy to GitHub Pages" (Reiter **Actions**). Nach dem ersten grünen Lauf ist die Seite
unter `https://mgursch.github.io/kortform-web/` bzw. (sobald die Domain gesetzt ist) unter `kortform.at` erreichbar.
Hinweis: Unter der `github.io`-Adresse mit Unterpfad sehen Seiten ohne Stylesheet aus, weil die Pfade root-absolut sind
(`/styles.css`). Das ist erwartet; richtig wird es erst auf der eigenen Domain.

## 5. Custom Domain im Repo eintragen

Im Repo: **Settings → Pages → Custom domain** → `kortform.at` → **Save**. **Dieser Schritt ist Pflicht:** Bei einem
Deployment per GitHub Actions (wie hier) ignoriert GitHub die Datei `site/CNAME`; die Domain kommt ausschließlich aus
dieser Einstellung (bzw. dem API-Feld `cname`). Die Datei liegt trotzdem im Repo (Inhalt exakt `kortform.at`), damit die
Domain im Repo dokumentiert ist und bei einem späteren Wechsel auf Branch-Deployment erhalten bleibt.
Solange das DNS noch nicht passt, zeigt GitHub hier eine Warnung („DNS check unsuccessful"), das ist normal.

Per CLI:

```bash
gh api -X PUT repos/mgursch/kortform-web/pages -f cname=kortform.at
```

## 6. DNS bei World4You einstellen

Im World4You-Kundenbereich (Control Panel) → **Domains** → `kortform.at` → **DNS-Einstellungen**
(je nach Oberfläche „DNS verwalten" oder „Erweiterte Einstellungen"). World4You nennt das Host-Feld je nach Maske
„Name", „Host", „Subdomain" oder „Hostname". Für die Hauptdomain `@` eintragen, bei manchen Masken bleibt das Feld
leer oder es steht `kortform.at`. Das Feld „Ziel"/„Wert"/„Inhalt" ist der Record-Wert.

### 6.1 Bestehende A-/AAAA-Records löschen

Alle **A- und AAAA-Records** auf `@`, `www` und `*` (Wildcard), die nicht auf GitHub zeigen, müssen weg. Dazu zählt der
Eintrag auf die World4You-Parking-Seite (bei Kortscore war es `81.19.154.98`) und ein eventuell vorhandener
Parking-AAAA-Eintrag; ein übrig gebliebener AAAA-Eintrag schickt IPv6-Besucher sonst weiter auf die Parking-Seite.
Alle anderen Einträge (insbesondere **MX**, SPF-/DKIM-TXT) stehen lassen.

### 6.2 Vier A-Records für die Hauptdomain

| Typ | Name | Wert            |
|-----|------|-----------------|
| A   | `@`  | 185.199.108.153 |
| A   | `@`  | 185.199.109.153 |
| A   | `@`  | 185.199.110.153 |
| A   | `@`  | 185.199.111.153 |

Alle vier anlegen, GitHub verteilt den Traffic darüber. Nur einer funktioniert auch, ist aber unnötig fragil.

### 6.3 CNAME für www

| Typ   | Name  | Wert                 |
|-------|-------|----------------------|
| CNAME | `www` | `mgursch.github.io.` |

Wichtig: Ziel ist `mgursch.github.io` (der GitHub-Account-Host), **nicht** `kortform.at` und **nicht**
`mgursch.github.io/kortform-web`. Ein Pfad ist im CNAME nicht erlaubt. Der Punkt am Ende ist bei manchen
Oberflächen nötig, bei anderen wird er automatisch ergänzt.

Falls World4You keinen CNAME auf `www` zulässt (kommt vor, wenn dort ein A-Record existiert): erst den `www`-A-Record
löschen, dann den CNAME anlegen.

### 6.4 AAAA-Records (optional, IPv6)

Nur falls World4You IPv6-Einträge anbietet. Name `@`, vier Einträge:

```
2606:50c0:8000::153
2606:50c0:8001::153
2606:50c0:8002::153
2606:50c0:8003::153
```

### 6.5 TXT-Record für die Domain-Verifizierung

| Typ | Name                             | Wert                         |
|-----|----------------------------------|------------------------------|
| TXT | `_github-pages-challenge-mgursch` | Code aus GitHub (Abschnitt 3) |

Falls dieser Schritt schon in Abschnitt 3 gemacht wurde, nichts mehr zu tun.

### 6.6 E-Mail

Falls für `kortform.at` E-Mail genutzt wird (oder später genutzt werden soll): **MX-Records nicht anfassen.**
Die Änderungen oben betreffen nur Web (A/AAAA/CNAME). Ein gelöschter MX-Record stoppt den Mailempfang.

## 7. Warten und prüfen

DNS-Änderungen brauchen typischerweise 15 Minuten bis wenige Stunden (TTL-abhängig, selten bis 24 h).

```bash
dig +short kortform.at A                  # vier 185.199.* Adressen
dig +short kortform.at AAAA               # nur falls AAAA gesetzt: vier 2606:50c0:* Adressen
dig +short www.kortform.at CNAME          # mgursch.github.io.
dig +short TXT _github-pages-challenge-mgursch.kortform.at
dig +short CAA kortform.at                # leer, oder ein Eintrag, der letsencrypt.org erlaubt
```

Gibt es CAA-Einträge, die `letsencrypt.org` nicht erlauben, kann GitHub kein Zertifikat ausstellen: den Eintrag ergänzen
(`0 issue "letsencrypt.org"`) oder löschen.

Sobald die A-Records stimmen, prüft GitHub die Domain automatisch (Settings → Pages → „DNS check successful") und
holt ein Let's-Encrypt-Zertifikat. Das dauert nochmal einige Minuten bis etwa eine Stunde. Solange das Zertifikat fehlt,
ist die Checkbox „Enforce HTTPS" ausgegraut. Hängt es länger als eine Stunde: Custom Domain in den Pages-Settings
entfernen, speichern, wieder eintragen, speichern (stößt die Prüfung neu an).

## 8. Enforce HTTPS aktivieren

Im Repo: **Settings → Pages** → Haken **„Enforce HTTPS"** setzen, sobald er auswählbar ist.

Per CLI prüfen:

```bash
gh api repos/mgursch/kortform-web/pages --jq '{cname,https_enforced,build_type,status}'
```

Aktivieren, sobald das Zertifikat da ist:

```bash
gh api -X PUT repos/mgursch/kortform-web/pages -F 'https_enforced=true'
```

## 9. Kontrolle

```bash
curl -sI https://kortform.at | grep -iE '^(HTTP|location)'                  # HTTP/2 200
curl -sI http://kortform.at | grep -iE '^(HTTP|location)'                   # 301, location: https://kortform.at/
curl -sI https://www.kortform.at | grep -iE '^(HTTP|location)'              # 301, location: https://kortform.at/
curl -sI https://kortform.at/datenschutz/ | grep -iE '^(HTTP|location)'     # 200
curl -sI https://kortform.at/impressum/ | grep -iE '^(HTTP|location)'       # 200
curl -sI https://kortform.at/datenschutz | grep -iE '^(HTTP|location)'      # 301 auf /datenschutz/ (die App verlinkt ohne Slash)
```

## Was schon im Repo erledigt ist

- `site/CNAME` mit Inhalt `kortform.at` (wirkt bei Actions-Deployment nicht, die Domain muss in den Pages-Settings stehen, Abschnitt 5).
- `site/.nojekyll`, damit GitHub keinen Jekyll-Build über die Dateien laufen lässt.
- `og:image`, `og:url` und `canonical` zeigen auf `https://kortform.at/`.
- Alle Asset-Pfade sind root-absolut und funktionieren auf der eigenen Domain.
- Deployment per GitHub Actions bei jedem Push auf `main` (`.github/workflows/deploy.yml`).

## Später relevant

- **AdMob `app-ads.txt`:** Die App-Doku (`docs/ads.md`) verlangt vor dem Release eine `app-ads.txt` auf `kortform.at`.
  Sie gehört nach `site/app-ads.txt` (Inhalt: Zeile aus der AdMob-Konsole, `google.com, pub-…, DIRECT, f08c47fec0942fa0`).
- **Store-Links:** Sobald die App veröffentlicht ist, im Abschnitt „Bald im App Store und bei Google Play" in
  `site/index.html` die echten Links einsetzen.
