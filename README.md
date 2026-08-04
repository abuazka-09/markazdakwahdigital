# MARKAZ DAKWAH DIGITAL

Smart Education Dashboard adalah starter aplikasi PWA untuk mengelola santri, orang tua, guru, akademik, kesehatan, keuangan, ZISWAF, donasi, dan business intelligence dalam satu dashboard realtime.

## Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS, Framer Motion, ECharts
- Backend: Node.js, Express.js, Socket.IO, JWT, PostgreSQL
- Database: PostgreSQL dengan schema ternormalisasi dan index utama
- Deployment: Docker Compose untuk development dan production baseline

## Struktur

```text
apps/web              Next.js PWA dashboard
apps/api              Express REST API + realtime Socket.IO
packages/database     PostgreSQL schema dan seed baseline
docs                  Analisis, arsitektur, ERD, API, dan UX blueprint
```

## Menjalankan Development

```bash
cp .env.example .env
docker compose up -d postgres
npm install
npm run dev
```

Web berjalan di `http://localhost:3000` dan API di `http://localhost:4000`.

## Akun Demo

Gunakan role berikut untuk simulasi UI:

- Super Admin
- Direktur
- Kepala Pendidikan
- Guru
- Ustadz Pembimbing
- Tim Kesehatan
- Bendahara
- Orang Tua

## Dokumentasi

- [Analisis Sistem](docs/analysis.md)
- [Arsitektur](docs/architecture.md)
- [ERD dan Database](docs/database-erd.md)
- [Dokumentasi API](docs/api.md)
- [UI/UX Blueprint](docs/ui-ux.md)
- [Security Checklist](docs/security.md)
