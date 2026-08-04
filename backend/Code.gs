const SHEETS = {
  SANTRI: 'Santri',
  ORANG_TUA: 'OrangTuaWali',
  DOKUMEN: 'Dokumen',
  ABSENSI: 'Absensi',
  CONFIG: 'Config',
};
const SPREADSHEET_ID = '1ISqIvTpHNGRaITm0fV_44tVECoR7qBhQOUBUvDXtqPs';
const DRIVE_FOLDER_SANTRI_ID = '1Xb8w_VcjeVHSHQuKo1ob23M2wtfEhtdb';

function doGet(e) {
  const action = (e.parameter.action || '').toLowerCase();
  if (action === 'health') return jsonResponse({ ok: true, service: 'MDD Backend', time: new Date().toISOString() });
  if (action === 'students') return jsonResponse({ ok: true, students: readStudents_() });
  return jsonResponse({ ok: true, message: 'Markaz Dakwah Digital backend aktif' });
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    if (payload.type === 'student.create') return jsonResponse(createStudent_(payload.data || {}));
    if (payload.type === 'attendance.scan') return jsonResponse(recordAttendance_(payload.data || {}));
    return jsonResponse({ ok: false, error: 'Tipe request tidak dikenal' }, 400);
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message }, 500);
  }
}

function createStudent_(data) {
  if (!data.nis || !data.namaLengkap) throw new Error('NIS dan Nama Lengkap wajib diisi.');
  const ss = getSpreadsheet_();
  const now = new Date();

  appendByHeaders_(ss.getSheetByName(SHEETS.SANTRI), {
    'Timestamp': now,
    'Foto URL': data.fotoUrl || data.foto || '',
    'NIS': data.nis,
    'Nama Lengkap': data.namaLengkap,
    'Nama Panggilan': data.namaPanggilan,
    'Tempat Lahir': data.tempatLahir,
    'Tanggal Lahir': data.tanggalLahir,
    'Jenis Kelamin': data.jenisKelamin,
    'Alamat': data.alamat,
    'Nomor HP Santri': data.hpSantri,
    'Email Aktif': data.email,
    'Golongan Darah': data.golonganDarah,
    'Riwayat Penyakit': data.riwayatPenyakit,
    'Alergi': data.alergi,
    'Status': data.status || 'Aktif',
    'Tanggal Masuk': data.tanggalMasuk,
    'Program Pendidikan': data.programPendidikan,
    'Kelas': data.kelas,
    'Wali Kelas': data.waliKelas,
    'Ustadz Pembimbing': data.ustadzPembimbing,
  });

  appendByHeaders_(ss.getSheetByName(SHEETS.ORANG_TUA), {
    'Timestamp': now,
    'NIS': data.nis,
    'Nama Ayah': data.namaAyah,
    'Nama Ibu': data.namaIbu,
    'Pekerjaan Ayah': data.pekerjaanAyah,
    'Tempat Lahir Ayah': data.tempatLahirAyah,
    'Tanggal Lahir Ayah': data.tanggalLahirAyah,
    'Pekerjaan Ibu': data.pekerjaanIbu,
    'Tempat Lahir Ibu': data.tempatLahirIbu,
    'Tanggal Lahir Ibu': data.tanggalLahirIbu,
    'Jumlah Saudara': data.jumlahSaudara,
    'Anak Ke': data.anakKe,
    'No HP/WA Ayah': data.hpAyah,
    'No HP/WA Ibu': data.hpIbu,
    'Alamat Orangtua': data.alamatOrangtua,
  });

  appendByHeaders_(ss.getSheetByName(SHEETS.DOKUMEN), {
    'Timestamp': now,
    'NIS': data.nis,
    'Nama Lengkap': data.namaLengkap,
    'File Foto': data.fotoFileName || '',
    'File Kartu Keluarga': data.kartuKeluarga || '',
    'File Akta Kelahiran': data.aktaKelahiran || '',
    'Folder Drive': data.folderDrive || '',
    'Catatan Verifikasi': '',
  });

  return { ok: true, message: 'Data santri tersimpan', nis: data.nis };
}

function recordAttendance_(data) {
  if (!data.nis) throw new Error('NIS wajib diisi untuk absensi.');
  const ss = getSpreadsheet_();
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const duplicate = isDuplicateAttendance_(ss.getSheetByName(SHEETS.ABSENSI), today, data.sesi || 'Pagi', data.nis);
  if (duplicate) return { ok: false, duplicate: true, message: 'Absensi sudah tercatat untuk sesi ini.' };

  appendByHeaders_(ss.getSheetByName(SHEETS.ABSENSI), {
    'Timestamp': new Date(),
    'Tanggal': today,
    'Sesi': data.sesi || 'Pagi',
    'NIS': data.nis,
    'Nama Lengkap': data.namaLengkap || '',
    'Kelas': data.kelas || '',
    'Status Absensi': data.statusAbsensi || 'Hadir',
    'Metode': data.metode || 'QR',
    'QR Token': data.qrToken || '',
    'Perangkat': data.perangkat || '',
    'Catatan': data.catatan || '',
  });

  return { ok: true, message: 'Absensi tercatat', nis: data.nis };
}

function readStudents_() {
  const sheet = getSpreadsheet_().getSheetByName(SHEETS.SANTRI);
  const values = sheet.getDataRange().getValues();
  const headers = values.shift();
  return values.filter(row => row[2]).map(row => Object.fromEntries(headers.map((h, i) => [h, row[i]])));
}

function appendByHeaders_(sheet, record) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  sheet.appendRow(headers.map(header => record[header] ?? ''));
}

function getSpreadsheet_() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function isDuplicateAttendance_(sheet, dateText, sesi, nis) {
  const rows = sheet.getDataRange().getValues();
  const headers = rows.shift();
  const dateIdx = headers.indexOf('Tanggal');
  const sesiIdx = headers.indexOf('Sesi');
  const nisIdx = headers.indexOf('NIS');
  return rows.some(row => String(row[dateIdx]).slice(0, 10) === dateText && row[sesiIdx] === sesi && row[nisIdx] === nis);
}

function jsonResponse(body, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify(body));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
