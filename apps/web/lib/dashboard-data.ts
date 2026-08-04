import {
  Activity,
  BadgeDollarSign,
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  GraduationCap,
  HeartPulse,
  Home,
  Landmark,
  Megaphone,
  MessageCircle,
  School,
  Search,
  ShieldCheck,
  UsersRound
} from "lucide-react";

export const roles = [
  "Super Admin",
  "Direktur",
  "Kepala Pendidikan",
  "Guru",
  "Ustadz Pembimbing",
  "Tim Kesehatan",
  "Bendahara",
  "Orang Tua"
] as const;

export const menu = [
  { label: "Dashboard Utama", icon: Home },
  { label: "Santri", icon: UsersRound },
  { label: "Akademik", icon: GraduationCap },
  { label: "Hafalan", icon: BookOpenCheck },
  { label: "Kesehatan", icon: HeartPulse },
  { label: "ZISWAF", icon: Landmark },
  { label: "Donasi", icon: BadgeDollarSign },
  { label: "BI Dashboard", icon: BarChart3 },
  { label: "Kalender", icon: CalendarDays },
  { label: "Pesan", icon: MessageCircle },
  { label: "Pengumuman", icon: Megaphone },
  { label: "Audit Trail", icon: ShieldCheck }
];

export const kpis = [
  { label: "Jumlah Santri", value: "1.248", delta: "+8,4%", tone: "bg-mint text-palm" },
  { label: "Jumlah Guru", value: "86", delta: "+4", tone: "bg-skysoft text-blue-700" },
  { label: "Jumlah Ustadz", value: "42", delta: "+3", tone: "bg-amber-100 text-amber-700" },
  { label: "Jumlah Alumni", value: "3.912", delta: "+221", tone: "bg-rose-100 text-rose-700" },
  { label: "Jumlah Kelas", value: "54", delta: "aktif", tone: "bg-emerald-100 text-emerald-700" },
  { label: "Jumlah Program", value: "21", delta: "lintas unit", tone: "bg-indigo-100 text-indigo-700" },
  { label: "Jumlah Donatur", value: "7.430", delta: "+17%", tone: "bg-teal-100 text-teal-700" },
  { label: "Total Donasi", value: "Rp 1,82 M", delta: "83% target", tone: "bg-yellow-100 text-yellow-700" }
];

export const activities = [
  { title: "Absensi pagi tersinkron", meta: "1.126 santri hadir, 34 izin, 8 sakit" },
  { title: "Setoran hafalan baru", meta: "312 halaman Al-Qur'an dan 46 hadits tercatat" },
  { title: "Tagihan SPP diperbarui", meta: "Bendahara menerbitkan 214 invoice" },
  { title: "Pemeriksaan kesehatan", meta: "BMI dan tekanan darah kelas IX-B selesai" }
];

export const studentSnapshot = {
  name: "Ahmad Zaidan Al-Faruqi",
  className: "VIII Tahfidz A",
  attendance: "96%",
  memorization: "18 Juz",
  academicAverage: "88,4",
  health: "Stabil",
  bill: "Rp 750.000"
};

export const programRows = [
  ["Tahfidz", "92%", "1.148 santri", "Naik 6%"],
  ["Bahasa Arab", "81%", "834 santri", "Stabil"],
  ["Digital Dakwah", "74%", "326 santri", "Naik 13%"],
  ["AI & Coding", "68%", "212 santri", "Pilot"]
];

export const searchableAreas = [
  "NIS, nama santri, kelas, program",
  "Orang tua, kontak darurat, tagihan",
  "Guru, jadwal, silabus, nilai",
  "Donatur, campaign, ZISWAF, QRIS"
];

export { Activity, Search, School };
