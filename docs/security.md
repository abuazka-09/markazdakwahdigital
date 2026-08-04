# Security Checklist

- Hash password dengan Argon2id dan pepper dari secret manager.
- JWT access token pendek, refresh token httpOnly, rotation, dan revoke list.
- Role permission di API dan UI guard.
- Rate limiting per IP dan per user.
- Helmet security headers, CORS allowlist, HTTPS only di production.
- Validasi input dengan schema parser seperti Zod.
- Query database parametrik untuk mencegah SQL injection.
- Output encoding dan CSP untuk mengurangi XSS.
- CSRF protection untuk endpoint berbasis cookie.
- Audit trail append-only untuk aksi penting.
- Backup otomatis, recovery drill, dan enkripsi storage.
- Upload file dibatasi tipe, ukuran, scan malware, dan disimpan di object storage private.
