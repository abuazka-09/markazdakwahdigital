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
backend/Code.gs       Google Apps Script backend untuk Google Sheets
preview.html          Dashboard standalone realtime preview
```

## Google Workspace Backend

Backend tahap awal memakai Google Workspace akun `abuazka1510@gmail.com`.

- Google Sheet database: https://docs.google.com/spreadsheets/d/1ISqIvTpHNGRaITm0fV_44tVECoR7qBhQOUBUvDXtqPs/edit
- Folder dokumen santri: https://drive.google.com/drive/folders/1Xb8w_VcjeVHSHQuKo1ob23M2wtfEhtdb

Langkah deploy:

1. Buka Google Sheet database.
2. Pilih `Extensions > Apps Script`.
3. Tempel isi `backend/Code.gs`.
4. Deploy sebagai `Web app`.
5. Set `Execute as` ke akun pemilik, dan `Who has access` sesuai kebutuhan operasional.
6. Salin URL `/exec` hasil deploy.
7. Buka `preview.html`, klik `Workspace`, lalu tempel URL tersebut.

Setelah URL Web App tersimpan, form `+ Tambah Santri` akan mencoba sinkron ke Google Sheets dan tombol `QR Absensi` akan membuat QR menuju form absensi santri.

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
