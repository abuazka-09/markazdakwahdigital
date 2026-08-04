# ERD dan Relasi Database

```mermaid
erDiagram
  users ||--o| teachers : "login"
  users ||--o| parents : "login"
  programs ||--o{ classes : "has"
  programs ||--o{ subjects : "has"
  classes ||--o{ students : "contains"
  teachers ||--o{ students : "homeroom"
  teachers ||--o{ subjects : "teaches"
  parents ||--o{ student_parents : "linked"
  students ||--o{ student_parents : "linked"
  students ||--o{ attendance_records : "has"
  students ||--o{ memorization_records : "has"
  students ||--o{ academic_grades : "has"
  students ||--o{ health_records : "has"
  students ||--o{ achievements : "has"
  subjects ||--o{ academic_grades : "graded"
  donation_campaigns ||--o{ donations : "receives"
  donors ||--o{ donations : "gives"
  students ||--o{ invoices : "billed"
  users ||--o{ activity_logs : "acts"
```

## Catatan Desain

- `students` dipisah dari `parents` karena satu santri dapat memiliki lebih dari satu wali, dan satu orang tua dapat memiliki lebih dari satu anak.
- `memorization_records` memakai `type` agar Qur'an, hadits, dan kitab bisa memakai alur input yang sama namun tetap terfilter.
- `activity_logs` tidak boleh diubah setelah dibuat agar audit trail valid.
- Untuk pencarian global skala besar, tambahkan materialized search table atau OpenSearch setelah data tumbuh.
