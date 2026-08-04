import { Router } from "express";
import { randomUUID } from "node:crypto";
import { authenticate, authorize, login } from "./auth.js";

export const router = Router();

router.post("/auth/login", login);

router.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "markaz-api" });
});

router.get("/dashboard/kpis", authenticate, (_req, res) => {
  res.json({
    students: 1248,
    teachers: 86,
    ustadz: 42,
    alumni: 3912,
    classes: 54,
    programs: 21,
    donors: 7430,
    totalDonation: 1820000000,
    attendancePercentage: 96,
    memorizationTargetPercentage: 78
  });
});

router.get("/students", authenticate, authorize("SUPER_ADMIN", "DIREKTUR", "KEPALA_PENDIDIKAN", "GURU"), (_req, res) => {
  res.json({
    data: [
      {
        nis: "MD-2026-0001",
        name: "Ahmad Zaidan Al-Faruqi",
        className: "VIII Tahfidz A",
        program: "Tahfidz",
        status: "Aktif"
      }
    ]
  });
});

router.get("/parents/me/children", authenticate, authorize("ORANG_TUA"), (_req, res) => {
  res.json({
    data: [
      {
        name: "Ahmad Zaidan Al-Faruqi",
        attendance: 96,
        memorization: "18 Juz",
        healthStatus: "Stabil",
        billAmount: 750000
      }
    ]
  });
});

router.post("/attendance/scan", authenticate, authorize("SUPER_ADMIN", "GURU", "USTADZ_PEMBIMBING"), (req, res) => {
  req.app.get("io")?.emit("attendance.updated", {
    scannedAt: new Date().toISOString(),
    payload: req.body
  });
  res.status(201).json({ status: "recorded" });
});

router.get("/reports/export/:format", authenticate, authorize("SUPER_ADMIN", "DIREKTUR", "BENDAHARA"), (req, res) => {
  res.json({ status: "queued", format: req.params.format, jobId: randomUUID() });
});
