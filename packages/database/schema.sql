CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM (
  'SUPER_ADMIN',
  'DIREKTUR',
  'KEPALA_PENDIDIKAN',
  'GURU',
  'USTADZ_PEMBIMBING',
  'TIM_KESEHATAN',
  'BENDAHARA',
  'ORANG_TUA'
);

CREATE TYPE gender AS ENUM ('LAKI_LAKI', 'PEREMPUAN');
CREATE TYPE student_status AS ENUM ('AKTIF', 'ALUMNI', 'CUTI', 'KELUAR');
CREATE TYPE attendance_status AS ENUM ('HADIR', 'TERLAMBAT', 'IZIN', 'SAKIT', 'ALFA');
CREATE TYPE payment_status AS ENUM ('DRAFT', 'TERBIT', 'LUNAS', 'JATUH_TEMPO', 'DIBATALKAN');

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email varchar(255) NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role user_role NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE programs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar(120) NOT NULL UNIQUE,
  description text,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE classes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id uuid REFERENCES programs(id),
  name varchar(120) NOT NULL,
  academic_year varchar(20) NOT NULL,
  UNIQUE (name, academic_year)
);

CREATE TABLE teachers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id),
  photo_url text,
  name varchar(180) NOT NULL,
  education varchar(160),
  field varchar(160),
  phone varchar(40),
  email varchar(255),
  status varchar(80) NOT NULL DEFAULT 'Aktif',
  teaching_history text
);

CREATE TABLE parents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id),
  father_name varchar(180),
  mother_name varchar(180),
  guardian_name varchar(180),
  address text,
  phone varchar(40),
  email varchar(255),
  occupation varchar(160),
  income_range varchar(80),
  emergency_contact varchar(180)
);

CREATE TABLE students (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nis varchar(60) NOT NULL UNIQUE,
  photo_url text,
  name varchar(180) NOT NULL,
  birth_place varchar(120),
  birth_date date,
  gender gender NOT NULL,
  address text,
  phone varchar(40),
  email varchar(255),
  blood_type varchar(5),
  medical_history text,
  allergy text,
  status student_status NOT NULL DEFAULT 'AKTIF',
  enrolled_at date NOT NULL,
  program_id uuid REFERENCES programs(id),
  class_id uuid REFERENCES classes(id),
  homeroom_teacher_id uuid REFERENCES teachers(id),
  mentor_id uuid REFERENCES teachers(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE student_parents (
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  parent_id uuid NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  relationship varchar(60) NOT NULL,
  PRIMARY KEY (student_id, parent_id)
);

CREATE TABLE subjects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar(140) NOT NULL,
  program_id uuid REFERENCES programs(id),
  teacher_id uuid REFERENCES teachers(id),
  syllabus_url text,
  UNIQUE (name, program_id)
);

CREATE TABLE schedules (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id uuid NOT NULL REFERENCES classes(id),
  subject_id uuid REFERENCES subjects(id),
  teacher_id uuid REFERENCES teachers(id),
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  starts_at time NOT NULL,
  ends_at time NOT NULL
);

CREATE TABLE attendance_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id uuid NOT NULL REFERENCES students(id),
  class_id uuid REFERENCES classes(id),
  status attendance_status NOT NULL,
  check_in_at timestamptz,
  check_out_at timestamptz,
  note text,
  recorded_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE memorization_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id uuid NOT NULL REFERENCES students(id),
  type varchar(40) NOT NULL CHECK (type IN ('QURAN', 'HADITS', 'KITAB')),
  reference_name varchar(160),
  juz_count numeric(5,2),
  page_count integer,
  ayah_count integer,
  chapter_name varchar(160),
  target varchar(160),
  progress_percentage numeric(5,2) NOT NULL DEFAULT 0,
  tajwid_score numeric(5,2),
  makhraj_score numeric(5,2),
  score numeric(5,2),
  recorded_by uuid REFERENCES users(id),
  recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE academic_grades (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id uuid NOT NULL REFERENCES students(id),
  subject_id uuid NOT NULL REFERENCES subjects(id),
  assessment_type varchar(40) NOT NULL,
  score numeric(5,2) NOT NULL CHECK (score BETWEEN 0 AND 100),
  semester varchar(20) NOT NULL,
  recorded_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE health_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id uuid NOT NULL REFERENCES students(id),
  weight_kg numeric(6,2),
  height_cm numeric(6,2),
  bmi numeric(5,2),
  blood_pressure varchar(20),
  blood_sugar numeric(6,2),
  cholesterol numeric(6,2),
  uric_acid numeric(6,2),
  diagnosis text,
  medicine text,
  doctor_note text,
  recorded_by uuid REFERENCES users(id),
  recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE achievements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id uuid NOT NULL REFERENCES students(id),
  category varchar(80) NOT NULL,
  title varchar(180) NOT NULL,
  certificate_url text,
  documentation_url text,
  achieved_at date
);

CREATE TABLE donation_campaigns (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar(180) NOT NULL,
  type varchar(40) NOT NULL CHECK (type IN ('ZAKAT', 'INFAQ', 'SEDEKAH', 'WAKAF', 'DONASI')),
  target_amount numeric(16,2) NOT NULL DEFAULT 0,
  starts_at date,
  ends_at date,
  qris_url text,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE donors (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar(180) NOT NULL,
  phone varchar(40),
  email varchar(255)
);

CREATE TABLE donations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id uuid REFERENCES donation_campaigns(id),
  donor_id uuid REFERENCES donors(id),
  amount numeric(16,2) NOT NULL CHECK (amount > 0),
  payment_method varchar(60) NOT NULL,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id uuid NOT NULL REFERENCES students(id),
  invoice_number varchar(80) NOT NULL UNIQUE,
  description text NOT NULL,
  amount numeric(16,2) NOT NULL,
  status payment_status NOT NULL DEFAULT 'DRAFT',
  due_date date,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE announcements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title varchar(180) NOT NULL,
  content text NOT NULL,
  target_role user_role,
  published_at timestamptz
);

CREATE TABLE activity_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id uuid REFERENCES users(id),
  action varchar(120) NOT NULL,
  entity_type varchar(80) NOT NULL,
  entity_id uuid,
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_students_class ON students(class_id);
CREATE INDEX idx_students_program ON students(program_id);
CREATE INDEX idx_attendance_student_created ON attendance_records(student_id, created_at DESC);
CREATE INDEX idx_memorization_student_recorded ON memorization_records(student_id, recorded_at DESC);
CREATE INDEX idx_grades_student_subject ON academic_grades(student_id, subject_id);
CREATE INDEX idx_health_student_recorded ON health_records(student_id, recorded_at DESC);
CREATE INDEX idx_donations_campaign_paid ON donations(campaign_id, paid_at DESC);
CREATE INDEX idx_invoices_student_status ON invoices(student_id, status);
CREATE INDEX idx_activity_logs_actor_created ON activity_logs(actor_id, created_at DESC);
