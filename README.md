# Muno eTrainer — Einstellungstest & Auswahlverfahren Plattform

Eine moderne, lokal ausführbare Trainings- und Prüfungssimulationsplattform für den deutschen **Einstellungstest & das Auswahlverfahren** (Öffentlicher Dienst, IT/FISI, Verwaltung & Ausbildung), entwickelt mit **Next.js (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS**, **Zod** und **Zustand**.

---

## Überblick & Highlights

- **Vollständige, validierte Fragendatenbank (`data/questions.json`)**:
  - **683 Aufgaben** in **6 Hauptkategorien** und **32 Unterkategorien**:
    1. *Mathematik & Rechnen* (14 Unterkategorien – Grundrechenarten, Kopfrechnen, Rechenoperationen einsetzen, Klammerrechnung, Bruchrechnung, Schätzen, Maße & Einheiten, Gleichungen, Geometrie, Prozent-, Zins- und Dreisatzrechnung, Zahlenverständnis)
    2. *Logik & Konzentration* (5 Unterkategorien – Zahlenreihen, Syllogismen, Psychotechnische Tests, Textaufgaben, Merkfähigkeit)
    3. *Deutsch & Sprachverständnis* (5 Unterkategorien – Deutsche Grammatik, Kommasetzung, Sprachanalogien, Tatsache oder Meinung, Textverständnis & Rechtschreibung)
    4. *IT & Elektrotechnik* (2 Unterkategorien – Elektrotechnik & IT-Grundlagen, IT-Systeme, Netzwerke & Administration FISI)
    5. *Politik, Recht & Wirtschaft* (5 Unterkategorien – Allgemeinwissen & Geschichte, Politik & Gesellschaft, Recht, Wirtschaft, Hessen & Öffentlicher Dienst)
    6. *Geografie* (1 Unterkategorie – Geografie)
- **Unterstützung aller 4 realen Fragetypen**:
  - `multiple-choice`: Klassische Einfachauswahl (`A`, `B`, `C`, `D`)
  - `multi-select`: Mehrfachauswahl mit strikter Mengen-Auswertung (z. B. Syllogismen)
  - `boolean-choice`: Zweifachauswahl (z. B. *Tatsache* vs. *Meinung*)
  - `text-input`: Intelligente Freitext- und Mathematikeingabe inklusive:
    - Interaktiver Operatoren-Auswahl (`+`, `-`, `×`, `÷`) für Modul `1.3 Rechenoperationen einsetzen`
    - Strukturierter Mehrfeld-Eingabe für Modul `1.9 Geometrie` (*Seite a/b, Flächeninhalt, Umfang, Oberfläche, Volumen, Radius, Durchmesser*)
    - Toleranter Normalisierung deutscher Dezimalkommas (`30397,19`), Brüche (`17/10`) und Einheiten (`€`, `%`, `Tage`, `Monate`)
- **Prüfungssimulator (Exam Simulator)**:
  - Fokussierte Prüfungsumgebung ohne vorzeitige Lösungsanzeige
  - Kreisförmiger SVG-Countdown-Timer mit sicherer automatischer Abgabe bei Zeitablauf
  - Nummerierter Fragen-Navigator mit Statusanzeige (*Aktuell*, *Beantwortet*, *Zur Überprüfung markiert*, *Offen*) sowie Schnellfiltern (*View Bookmarked*, *View Un Answered*, *Save for Revision*)
  - Natives Bestätigungs-Dialogfenster (`<dialog>`) vor manueller Abgabe
- **Freier Übungsmodus (Practice Mode)**:
  - Gezielte Auswahl nach Kategorie, Unterkategorie, Fragenanzahl, Schwierigkeitsgrad und optionalem Timer
  - Sofortiges Feedback („Antwort prüfen“), zweisprachige Erklärungen (`DE` / `AR`) und direktes Wiederholen falsch beantworteter Aufgaben
- **Lokale Persistenz ohne Backend oder API-Keys**:
  - Speichert Lernfortschritt, Lesezeichen, Fehlerliste, Prüfungshistorie und Einstellungen zuverlässig in `localStorage`.

---

## Technologie-Stack

| Bereich | Technologie |
| :--- | :--- |
| **Framework** | Next.js 15 (`src/app` App Router, Server & Client Components) |
| **Sprache** | TypeScript 5 |
| **Styling & UI** | Tailwind CSS v4, CSS Custom Properties (`light-dark()`), shadcn/ui Primitives, Lucide React Icons |
| **Validierung** | Zod (`src/lib/schema.ts`) |
| **State & Persistenz** | Zustand + `persist` Middleware (`localStorage`) |
| **Testing** | Vitest (`src/lib/__tests__/`) |

---

## Projektstruktur

```text
muno-etrainer/
├── .agents/skills/               # Projekt-Skills (Frontend Design, Next.js, Question Integrity, Testing)
├── data/
│   └── questions.json            # Kanonische Fragendatenbank (683 Fragen, 6 Kategorien, 32 Module)
├── design/references/            # Visuelle Design-Referenzen (Dashboard & Exam Interface)
├── scripts/
│   └── validate-questions.ts     # CLI-Validierungsskript für die Fragendatenbank
└── src/
    ├── app/                      # Next.js App Router Seiten & Layouts
    │   ├── bookmarks/            # Gespeicherte Lesezeichen
    │   ├── categories/           # Kategorien-Übersicht & Detailseiten ([slug])
    │   ├── exam/                 # Prüfungssimulator & Modelltests
    │   ├── history/              # Abgeschlossene Prüfungen & Einzelauswertung
    │   ├── practice/             # Interaktiver Übungsmodus mit Sofort-Feedback
    │   ├── revision/             # Revision Center (Offene Fehler & Save for Revision)
    │   ├── settings/             # Einstellungen (Theme, Sprache, Fortschritt zurücksetzen)
    │   ├── statistics/           # Fortschritts- & Schwächenanalyse
    │   ├── globals.css           # Design-Tokens & Barrierefreiheits-Regeln
    │   ├── layout.tsx            # Root-Layout mit Theme-Initialisierung
    │   └── page.tsx              # Editorial Dashboard
    ├── components/
    │   ├── dashboard/            # Dashboard-Komposition
    │   ├── exam/                 # ExamRunner, CircularTimer, QuestionInputRenderer, SessionResultsView
    │   ├── layout/               # AppShell (Sidebar, Mobile Drawer, globale Suche)
    │   └── ui/                   # Wiederverwendbare UI-Bausteine (Button, Badge, Progress, ModalDialog)
    ├── lib/
    │   ├── __tests__/            # Vitest Unit- & Integrationstests
    │   ├── questions.ts          # Datenbank-Loader, Evaluator & Session-Generator
    │   ├── schema.ts             # Zod-Schemata
    │   └── utils.ts              # Formatierungs- und Hilfsfunktionen
    └── store/
        └── useTrainerStore.ts    # Persistenter Client-Store & Echtzeit-Analytik
```

---

## Lokale Ausführung & Befehle

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. Fragendatenbank validieren (683 Fragen)
npm run validate:questions

# 3. Unit- & Integrationstests ausführen
npm test

# 4. Entwicklungsserver starten (http://localhost:3000)
npm run dev

# 5. Produktions-Build erstellen
npm run build
npm start
```
