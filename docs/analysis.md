# Analisis Kebutuhan Sistem

## Tujuan Produk

MARKAZ DAKWAH DIGITAL adalah PWA dashboard realtime untuk lembaga pendidikan Islam modern. Sistem menggabungkan data akademik, santri, orang tua, guru, pembimbing, kesehatan, keuangan, ZISWAF, donasi, dan business intelligence.

## Aktor dan Use Case

| Role | Use case utama |
| --- | --- |
| Super Admin | Mengelola user, role permission, konfigurasi lembaga, audit, backup |
| Direktur | Melihat KPI lintas unit, laporan BI, ekspor laporan |
| Kepala Pendidikan | Mengatur program, kelas, mapel, silabus, jadwal, evaluasi |
| Guru | Input absensi, nilai, catatan, perkembangan akademik |
| Ustadz Pembimbing | Input hafalan, adab, akhlak, ibadah, evaluasi harian |
| Tim Kesehatan | Input kesehatan harian dan riwayat medis santri |
| Bendahara | Mengelola invoice, SPP, pembayaran, ZISWAF, donasi |
| Orang Tua | Melihat data anak sendiri: absensi, nilai, hafalan, kesehatan, tagihan |

## Modul Prioritas

1. Auth dan role permission.
2. Master data santri, orang tua, guru, program, kelas, mapel.
3. Absensi realtime dengan QR/barcode.
4. Hafalan Al-Qur'an, hadits, kitab.
5. Nilai akademik dan evaluasi.
6. Kesehatan santri.
7. Keuangan, SPP, ZISWAF, donasi.
8. Parent dashboard.
9. BI dashboard, export/import, notification.
10. Audit trail, backup, monitoring, deployment.

## Non-Functional Requirements

- Mobile-first PWA, offline cache untuk shell UI dan antrean input penting.
- Latensi dashboard realtime target di bawah 2 detik pada jaringan stabil.
- PostgreSQL normalized schema dengan index pada foreign key dan time-series record.
- Target horizontal scaling: API stateless, Socket.IO adapter Redis, read replica untuk analytics.
- WCAG: keyboard navigation, visible focus, contrast aman, label form eksplisit.
