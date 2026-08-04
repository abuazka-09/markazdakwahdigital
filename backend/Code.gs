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
  if (action === 'attendance') return attendancePage_(e);
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

function attendancePage_(e) {
  const sesi = e.parameter.sesi || 'Pagi';
  const token = e.parameter.token || '';
  const html = `
    <!doctype html>
    <html lang="id">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>Absensi Markaz Dakwah Digital</title>
        <style>
          :root{--navy:#09245a;--gold:#e0b34e;--line:#dbe6f5;--bg:#f5f8fd;--ink:#142033;--muted:#66758b}
          *{box-sizing:border-box}body{margin:0;background:var(--bg);font-family:Arial,Helvetica,sans-serif;color:var(--ink)}
          main{min-height:100vh;display:grid;place-items:center;padding:18px}
          form{width:min(520px,100%);background:white;border:1px solid var(--line);border-radius:10px;box-shadow:0 22px 60px rgba(9,36,90,.12);padding:20px}
          h1{margin:0 0 8px;font-size:22px;color:var(--navy)}p{margin:0 0 16px;color:var(--muted);line-height:1.5}
          label{display:grid;gap:6px;margin-top:12px;font-weight:700;font-size:13px;color:var(--muted)}
          input,select,textarea,button{font:inherit}input,select,textarea{width:100%;border:1px solid var(--line);border-radius:8px;padding:11px 12px}
          button{width:100%;margin-top:16px;border:0;border-radius:8px;background:linear-gradient(135deg,#1454b8,#09245a);color:white;font-weight:800;padding:12px}
          .msg{margin-top:12px;font-weight:700}.ok{color:#0f8a61}.bad{color:#c2410c}
        </style>
      </head>
      <body>
        <main>
          <form id="attendanceForm">
            <h1>Absensi Santri</h1>
            <p>Markaz Dakwah Digital · Sesi ${escapeHtml_(sesi)}</p>
            <label>NIS<input name="nis" required autocomplete="off"></label>
            <label>Nama Lengkap<input name="namaLengkap" required></label>
            <label>Kelas<input name="kelas"></label>
            <label>Status<select name="statusAbsensi"><option>Hadir</option><option>Izin</option><option>Sakit</option><option>Alpa</option></select></label>
            <label>Catatan<textarea name="catatan" rows="3"></textarea></label>
            <button type="submit">Kirim Absensi</button>
            <div class="msg" id="msg"></div>
          </form>
        </main>
        <script>
          const form=document.getElementById('attendanceForm'),msg=document.getElementById('msg');
          form.addEventListener('submit',async e=>{
            e.preventDefault(); msg.textContent='Mengirim absensi...'; msg.className='msg';
            const data=Object.fromEntries(new FormData(form).entries());
            data.sesi=${JSON.stringify(sesi)}; data.qrToken=${JSON.stringify(token)}; data.metode='QR'; data.perangkat=navigator.userAgent;
            try{
              const res=await fetch(location.href.split('?')[0],{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({type:'attendance.scan',data})});
              const json=await res.json(); msg.textContent=json.message||'Absensi diproses'; msg.className='msg '+(json.ok?'ok':'bad'); if(json.ok)form.reset();
            }catch(err){msg.textContent='Gagal mengirim absensi. Coba lagi.'; msg.className='msg bad'}
          });
        </script>
      </body>
    </html>`;
  return HtmlService.createHtmlOutput(html).setTitle('Absensi Markaz Dakwah Digital');
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

function escapeHtml_(value) {
  return String(value || '').replace(/[&<>"']/g, function(ch) {
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch];
  });
}
