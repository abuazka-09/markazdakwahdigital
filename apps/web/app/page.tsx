"use client";

import React, { useMemo, useState } from "react";
import ReactECharts from "echarts-for-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  Download,
  FileSpreadsheet,
  Menu,
  Moon,
  QrCode,
  RefreshCcw,
  Search,
  ShieldCheck,
  Sun,
  Upload,
  Wifi
} from "lucide-react";
import {
  activities,
  kpis,
  menu,
  programRows,
  roles,
  searchableAreas,
  studentSnapshot
} from "@/lib/dashboard-data";

const chartPalette = ["#1f6f5b", "#c89b3c", "#4c8fbd", "#b25f4a", "#6c7a89"];

function lineOption(title: string) {
  return {
    color: chartPalette,
    tooltip: { trigger: "axis" },
    grid: { left: 36, right: 18, top: 34, bottom: 28 },
    xAxis: { type: "category", data: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun"], boundaryGap: false },
    yAxis: { type: "value" },
    series: [
      {
        name: title,
        type: "line",
        smooth: true,
        areaStyle: { opacity: 0.12 },
        data: [74, 78, 81, 85, 87, 91]
      }
    ]
  };
}

function barOption() {
  return {
    color: chartPalette,
    tooltip: { trigger: "axis" },
    grid: { left: 34, right: 14, top: 20, bottom: 32 },
    xAxis: { type: "category", data: ["SPP", "Zakat", "Infaq", "Wakaf", "Donasi"] },
    yAxis: { type: "value" },
    series: [{ type: "bar", borderRadius: [6, 6, 0, 0], data: [720, 480, 390, 550, 910] }]
  };
}

export default function DashboardPage() {
  const [role, setRole] = useState<(typeof roles)[number]>("Super Admin");
  const [dark, setDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const parentMode = role === "Orang Tua";
  const filteredKpis = parentMode ? kpis.slice(0, 4) : kpis;
  const shellClass = dark ? "dark min-h-screen" : "min-h-screen";

  const presenceOption = useMemo(() => lineOption("Kehadiran"), []);
  const financeOption = useMemo(() => barOption(), []);

  return (
    <main className={shellClass}>
      <div className="flex min-h-screen bg-[#f7faf7] text-ink dark:bg-[#0e1512] dark:text-[#edf7f1]">
        <AnimatePresence>
          {(sidebarOpen || true) && (
            <aside className="hidden w-72 shrink-0 border-r border-[var(--line)] bg-[var(--surface)] px-5 py-6 lg:block">
              <Brand />
              <nav className="mt-8 space-y-1">
                {menu.map((item) => (
                  <button
                    className="focus-ring flex h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm text-[var(--subtle)] transition hover:bg-[var(--muted)] hover:text-[var(--text)]"
                    key={item.label}
                    title={item.label}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </aside>
          )}
        </AnimatePresence>

        {sidebarOpen && (
          <button
            aria-label="Tutup menu"
            className="fixed inset-0 z-20 bg-black/30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <motion.aside
          animate={{ x: sidebarOpen ? 0 : -320 }}
          className="fixed inset-y-0 left-0 z-30 w-72 border-r border-[var(--line)] bg-[var(--surface)] px-5 py-6 lg:hidden"
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
        >
          <Brand />
          <nav className="mt-8 space-y-1">
            {menu.map((item) => (
              <button
                className="focus-ring flex h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm text-[var(--subtle)]"
                key={item.label}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </motion.aside>

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 border-b border-[var(--line)] bg-[var(--surface)]/92 px-4 py-3 backdrop-blur md:px-6">
            <div className="flex flex-wrap items-center gap-3">
              <button
                aria-label="Buka menu"
                className="focus-ring grid h-10 w-10 place-items-center rounded-md border border-[var(--line)] lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="flex min-w-[240px] flex-1 items-center gap-3">
                <img src="/logo-mdd.png" alt="Logo Markaz Dakwah Digital" className="h-12 w-12 rounded-md object-contain" />
                <div>
                  <h1 className="text-xl font-semibold leading-tight md:text-2xl">MARKAZ DAKWAH DIGITAL</h1>
                  <p className="text-sm text-[var(--subtle)]">Smart Education Dashboard realtime</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="relative">
                  <span className="sr-only">Pilih role</span>
                  <select
                    className="focus-ring h-10 appearance-none rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 pr-9 text-sm"
                    value={role}
                    onChange={(event) => setRole(event.target.value as (typeof roles)[number])}
                  >
                    {roles.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-[var(--subtle)]" />
                </label>
                <IconButton title="Global search">
                  <Search className="h-4 w-4" />
                </IconButton>
                <IconButton title="Notifikasi">
                  <Bell className="h-4 w-4" />
                </IconButton>
                <button
                  aria-label="Ganti tema"
                  className="focus-ring grid h-10 w-10 place-items-center rounded-md border border-[var(--line)] bg-[var(--surface)]"
                  onClick={() => setDark((value) => !value)}
                  title="Ganti tema"
                >
                  {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </header>

          <div className="px-4 py-5 md:px-6">
            <section className="grid gap-4 lg:grid-cols-[1.5fr_0.8fr]">
              <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4 shadow-soft">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-palm dark:text-mint">Live command center</p>
                    <h2 className="mt-1 text-2xl font-semibold">Ringkasan lembaga hari ini</h2>
                  </div>
                  <div className="flex items-center gap-2 rounded-md bg-[var(--muted)] px-3 py-2 text-sm text-[var(--subtle)]">
                    <Wifi className="h-4 w-4 text-palm" />
                    Realtime aktif
                  </div>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {filteredKpis.map((item) => (
                    <motion.article
                      className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={item.label}
                    >
                      <p className="text-sm text-[var(--subtle)]">{item.label}</p>
                      <div className="mt-3 flex items-end justify-between gap-2">
                        <strong className="text-2xl">{item.value}</strong>
                        <span className={`rounded px-2 py-1 text-xs font-semibold ${item.tone}`}>{item.delta}</span>
                      </div>
                    </motion.article>
                  ))}
                </div>
              </div>

              <ParentCard visible={parentMode} />
            </section>

            <section className="mt-4 grid gap-4 xl:grid-cols-[1fr_1fr_0.8fr]">
              <Panel title="Grafik Kehadiran & Hafalan" action={<RefreshCcw className="h-4 w-4" />}>
                <ReactECharts option={presenceOption} style={{ height: 265 }} />
              </Panel>
              <Panel title="Keuangan, ZISWAF, Donasi" action={<Download className="h-4 w-4" />}>
                <ReactECharts option={financeOption} style={{ height: 265 }} />
              </Panel>
              <Panel title="Activity Feed" action={<CheckCircle2 className="h-4 w-4" />}>
                <div className="space-y-3">
                  {activities.map((item) => (
                    <div className="rounded-md border border-[var(--line)] p-3" key={item.title}>
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="mt-1 text-xs leading-5 text-[var(--subtle)]">{item.meta}</p>
                    </div>
                  ))}
                </div>
              </Panel>
            </section>

            <section className="mt-4 grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
              <Panel title="Business Intelligence Filters" action={<FileSpreadsheet className="h-4 w-4" />}>
                <div className="grid gap-3 sm:grid-cols-2">
                  {["Tanggal", "Program", "Guru", "Kelas", "Angkatan", "Jenis Kelamin"].map((filter) => (
                    <label className="text-sm" key={filter}>
                      <span className="text-[var(--subtle)]">{filter}</span>
                      <select className="focus-ring mt-1 h-10 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3">
                        <option>Semua {filter}</option>
                      </select>
                    </label>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <CommandButton icon={<Upload className="h-4 w-4" />} label="Import" />
                  <CommandButton icon={<Download className="h-4 w-4" />} label="Export" />
                  <CommandButton icon={<QrCode className="h-4 w-4" />} label="QR Absensi" />
                </div>
              </Panel>

              <Panel title="Program Pendidikan" action={<ShieldCheck className="h-4 w-4" />}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead className="text-[var(--subtle)]">
                      <tr>
                        <th className="py-2 font-medium">Program</th>
                        <th className="py-2 font-medium">Progress</th>
                        <th className="py-2 font-medium">Peserta</th>
                        <th className="py-2 font-medium">Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {programRows.map(([program, progress, students, trend]) => (
                        <tr className="border-t border-[var(--line)]" key={program}>
                          <td className="py-3 font-semibold">{program}</td>
                          <td className="py-3">
                            <div className="h-2 rounded-full bg-[var(--muted)]">
                              <div className="h-2 rounded-full bg-palm" style={{ width: progress }} />
                            </div>
                          </td>
                          <td className="py-3 text-[var(--subtle)]">{students}</td>
                          <td className="py-3">{trend}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </section>

            <section className="mt-4 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
              <div className="flex flex-wrap items-center gap-3">
                <Search className="h-5 w-5 text-palm" />
                <input
                  className="focus-ring min-w-[220px] flex-1 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2"
                  placeholder="Cari santri, orang tua, guru, donatur, tagihan, atau program"
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {searchableAreas.map((area) => (
                  <span className="rounded bg-[var(--muted)] px-2 py-1 text-xs text-[var(--subtle)]" key={area}>
                    {area}
                  </span>
                ))}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <img src="/logo-mdd.png" alt="Logo Markaz Dakwah Digital" className="h-14 w-14 rounded-lg object-contain" />
      <div>
        <p className="text-sm font-bold leading-tight">MARKAZ DAKWAH</p>
        <p className="text-xs text-[var(--subtle)]">DIGITAL</p>
      </div>
    </div>
  );
}

function IconButton({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <button
      aria-label={title}
      className="focus-ring grid h-10 w-10 place-items-center rounded-md border border-[var(--line)] bg-[var(--surface)]"
      title={title}
    >
      {children}
    </button>
  );
}

function CommandButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="focus-ring inline-flex h-10 items-center gap-2 rounded-md bg-palm px-3 text-sm font-semibold text-white">
      {icon}
      {label}
    </button>
  );
}

function Panel({ title, action, children }: { title: string; action: React.ReactNode; children: React.ReactNode }) {
  return (
    <article className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold">{title}</h3>
        <button className="focus-ring grid h-9 w-9 place-items-center rounded-md border border-[var(--line)]" title={title}>
          {action}
        </button>
      </div>
      {children}
    </article>
  );
}

function ParentCard({ visible }: { visible: boolean }) {
  const base = visible ? "block" : "hidden lg:block";
  return (
    <article className={`${base} rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4 shadow-soft`}>
      <p className="text-sm font-medium text-palm dark:text-mint">Dashboard Orang Tua</p>
      <div className="mt-4 flex items-center gap-3">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-mint text-xl font-bold text-palm">AZ</div>
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold">{studentSnapshot.name}</h2>
          <p className="text-sm text-[var(--subtle)]">{studentSnapshot.className}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        {[
          ["Absensi", studentSnapshot.attendance],
          ["Hafalan", studentSnapshot.memorization],
          ["Rata-rata", studentSnapshot.academicAverage],
          ["Kesehatan", studentSnapshot.health],
          ["Tagihan", studentSnapshot.bill],
          ["Jadwal", "7 kegiatan"]
        ].map(([label, value]) => (
          <div className="rounded-md bg-[var(--muted)] p-3" key={label}>
            <p className="text-xs text-[var(--subtle)]">{label}</p>
            <p className="mt-1 font-semibold">{value}</p>
          </div>
        ))}
      </div>
    </article>
  );
}
