
## App distribueren: Microsoft Store of directe download

Je hebt nu een Capacitor-app die geconfigureerd is voor **iOS en Android**. Om de app op **Windows / Microsoft Store** of als **directe download** aan te bieden zijn er extra stappen nodig. Hier is een overzicht van je opties en wat ik kan toevoegen aan het project.

### Je opties

**Optie A — Microsoft Store (Windows app)**
Capacitor ondersteunt geen Windows direct. Je hebt twee routes:
1. **PWABuilder** (makkelijkst): zet je web-app om in een MSIX-pakket dat in de Microsoft Store kan. Vereist dat de app als PWA werkt.
2. **Electron**: bouw een desktop-app met `.exe` installer. Kan ook in de Store via MSIX, maar is meer werk.

**Optie B — Directe download vanaf internet**
- **Android**: bouw een `.apk` lokaal en host die op je site (gebruikers moeten "onbekende bronnen" toestaan).
- **Windows**: een `.exe`/`.msi` via Electron of een `.msix` via PWABuilder, hosten op je eigen site.
- **iOS**: kan **niet** zonder App Store (Apple verbiedt dit voor consumenten).

**Optie C — Installeerbare web-app (PWA)** ⭐ aanbevolen voor jouw use case
- Eén keer instellen, werkt op **Windows, Mac, Android én iOS**.
- Gebruikers klikken "Installeren" in hun browser → app verschijnt als gewone app.
- Kan daarna via PWABuilder ook in de **Microsoft Store** geplaatst worden.
- Geen app store reviews, geen developer accounts (€99/jaar Apple, €25 Google) nodig voor basisversie.

### Wat ik aanraad

Ga voor **PWA + landing-pagina met install-instructies**. Dit geeft je:
- Direct downloadbaar vanaf je eigen site (geen store nodig)
- Werkt op alle platforms
- Pad naar Microsoft Store via PWABuilder als je dat later wilt
- Capacitor-config blijft staan voor toekomstige native iOS/Android builds

### Wat ik ga implementeren

**1. PWA-ondersteuning toevoegen**
- `vite-plugin-pwa` installeren met productie-only configuratie (geen interferentie met Lovable preview).
- `public/manifest.json` met app-naam, iconen, kleuren, `display: standalone`.
- PWA-iconen in `public/` (192x192, 512x512, gegenereerd uit het Readify-logo).
- Service worker guard in `src/main.tsx` zodat hij nooit in de Lovable preview-iframe registreert.

**2. Install-knop op de landingspagina**
- `src/pages/Landing.tsx` uitbreiden met een **"Installeer app"**-knop die de browser-install-prompt triggert (`beforeinstallprompt` event).
- Fallback met instructies per platform (iOS: "Deel → Zet op beginscherm", Android: "Menu → Installeren", Desktop: install-icoon in adresbalk).
- Detectie of de app al geïnstalleerd is → knop verbergen.

**3. Download-sectie toevoegen**
- Nieuwe sectie op de landing met drie kaarten:
  - **Web / PWA**: directe install-knop
  - **Android**: instructies + uitleg dat APK lokaal gebouwd moet worden (link naar README-stappen)
  - **iOS**: "Voeg toe aan beginscherm" via Safari
  - **Windows (Microsoft Store)**: placeholder met "Binnenkort" of link naar PWABuilder uitleg

**4. README + instructies bijwerken**
- Stappen voor: PWA testen, APK bouwen via Android Studio, MSIX maken via PWABuilder voor Microsoft Store.

### Technische details

```text
Bestanden gewijzigd/aangemaakt:
├── vite.config.ts            (VitePWA plugin)
├── public/manifest.json      (web app manifest)
├── public/icon-192.png       (app icoon)
├── public/icon-512.png       (app icoon)
├── public/apple-touch-icon.png
├── index.html                (manifest link + theme-color meta)
├── src/main.tsx              (iframe/preview guard)
├── src/hooks/usePWAInstall.ts (nieuw — beforeinstallprompt logic)
├── src/pages/Landing.tsx     (install-knop + download-sectie)
└── README.md                 (Microsoft Store / APK instructies)

Nieuwe dependency: vite-plugin-pwa
```

**Belangrijk om te weten:**
- PWA werkt **alleen in de gepubliceerde versie**, niet in de Lovable editor-preview (dat is by design — anders breekt de preview).
- Voor de **Microsoft Store** moet je daarna 1× naar [pwabuilder.com](https://pwabuilder.com), je gepubliceerde URL invoeren, en het MSIX-pakket downloaden + uploaden naar Partner Center (€16 eenmalig voor developer-account).
- Voor **Android APK download** moet je lokaal `npx cap add android && npx cap build android` draaien — dat kan ik niet vanuit Lovable.
- Voor **iOS** is App Store de enige route (Apple-restrictie).
