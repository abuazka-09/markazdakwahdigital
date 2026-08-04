# Dokumentasi API

Base URL: `/api/v1`

| Method | Endpoint | Role | Keterangan |
| --- | --- | --- | --- |
| POST | `/auth/login` | Public | Login dan menerima JWT access token |
| GET | `/health` | Public | Health check API |
| GET | `/dashboard/kpis` | Authenticated | KPI dashboard utama |
| GET | `/students` | Super Admin, Direktur, Kepala Pendidikan, Guru | Daftar santri |
| GET | `/parents/me/children` | Orang Tua | Data anak untuk parent dashboard |
| POST | `/attendance/scan` | Super Admin, Guru, Ustadz Pembimbing | Catat absensi QR/barcode dan broadcast realtime |
| GET | `/reports/export/:format` | Super Admin, Direktur, Bendahara | Queue export PDF, Excel, CSV, atau print-ready |

## Realtime Events

| Event | Arah | Payload |
| --- | --- | --- |
| `dashboard.connected` | Server ke client | Timestamp koneksi |
| `dashboard.subscribe` | Client ke server | Nama room dashboard |
| `attendance.updated` | Server ke client | Data absensi terbaru |
| `memorization.updated` | Server ke client | Progress hafalan terbaru |
| `payment.updated` | Server ke client | Status invoice atau donasi |
| `announcement.published` | Server ke client | Pengumuman baru |

## Error Format

```json
{
  "error": "Human readable error"
}
```
