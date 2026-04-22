# Readify

Je persoonlijke e-bibliotheek. Upload PDF en EPUB boeken en lees ze offline. Alles lokaal opgeslagen in IndexedDB op jouw eigen apparaat.

## Features

- 📚 PDF & EPUB lezen met bladwijzers en voortgang
- 🔒 100% lokaal — geen cloud, geen account
- 📱 Installeerbaar als app op Windows, Mac, Android, iOS
- 🌙 Light / dark mode met oranje accenten

## Lokaal draaien

```bash
npm install
npm run dev
```

## Distributie

### 1. Installeerbare web-app (PWA) — aanbevolen

Werkt op alle platforms vanuit de browser:

- **Windows / Mac / Linux**: Open de gepubliceerde URL in Chrome/Edge/Brave → klik op het install-icoon in de adresbalk of de "Installeer app"-knop op de landingspagina.
- **Android**: Open in Chrome → menu (⋮) → "App installeren".
- **iOS**: Open in Safari → Deel → "Zet op beginscherm".

> ⚠️ De PWA-installatie werkt alleen op de gepubliceerde versie, niet in de Lovable preview.

### 2. Microsoft Store (Windows)

1. Publiceer de app via Lovable → kopieer de live URL.
2. Ga naar [pwabuilder.com](https://www.pwabuilder.com).
3. Voer de URL in en klik **Package for Stores → Windows**.
4. Download het `.msix`-pakket.
5. Maak een Microsoft Partner Center account (€16 eenmalig) en upload het pakket.

### 3. Android APK (directe download)

Lokaal via Capacitor (kan niet vanuit Lovable):

```bash
npm install
npx cap add android
npm run build
npx cap sync
npx cap open android
```

In Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**. Host het bestand op je eigen server.

### 4. iOS App Store

Vereist een Mac met Xcode en een Apple Developer account (€99/jaar):

```bash
npx cap add ios
npm run build
npx cap sync
npx cap open ios
```

Build en upload via Xcode naar App Store Connect.

## Tech stack

- React 18 + Vite + TypeScript
- Tailwind CSS
- IndexedDB (idb-keyval) voor lokale opslag
- pdfjs-dist + epubjs voor reader
- Capacitor voor native iOS/Android
- vite-plugin-pwa voor installeerbare web-app
