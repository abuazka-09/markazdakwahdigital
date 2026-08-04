function doGet(e) {
  e = e || { parameter: {} };
  var action = String((e.parameter && e.parameter.action) || '').toLowerCase();

  if (action === 'health') {
    return jsonResponse({
      ok: true,
      service: 'MDD Backend',
      app: 'Markaz Dakwah Digital',
      time: new Date().toISOString()
    });
  }

  if (action === 'attendance') {
    return attendancePage_(e);
  }

  if (action === 'students') {
    return jsonResponse({
      ok: true,
      students: readStudents_()
    });
  }

  if (action === 'attendanceSummary') {
    var summary = readAttendanceSummary_(e.parameter || {});
    var callback = e.parameter && e.parameter.callback;
    if (callback) {
      return javascriptResponse(callback + '(' + JSON.stringify(summary) + ');');
    }
    return jsonResponse(summary);
  }

  return jsonResponse({
    ok: true,
    message: 'Markaz Dakwah Digital backend aktif',
    actions: ['health', 'attendance', 'students', 'attendanceSummary']
  });
}

function doPost(e) {
  try {
    var rawBody = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    var payload = JSON.parse(rawBody);
    var type = payload.type || '';
    var data = payload.data || {};

    if (type === 'student.create') {
      return jsonResponse(createStudent_(data));
    }

    if (type === 'attendance.scan') {
      return jsonResponse(recordAttendance_(data));
    }

    return jsonResponse({
      ok: false,
      error: 'Tipe request tidak dikenal'
    });
  } catch (err) {
    return jsonResponse({
      ok: false,
      error: err && err.message ? err.message : String(err)
    });
  }
}

var SHEETS = {
  SANTRI: 'Santri',
  ORANG_TUA: 'OrangTuaWali',
  DOKUMEN: 'Dokumen',
  ABSENSI: 'Absensi',
  CONFIG: 'Config'
};

var SPREADSHEET_ID = '1ISqIvTpHNGRaITm0fV_44tVECoR7qBhQOUBUvDXtqPs';
var DRIVE_FOLDER_SANTRI_ID = '1Xb8w_VcjeVHSHQuKo1ob23M2wtfEhtdb';

function mddSmokeTest() {
  var response = doGet({ parameter: { action: 'health' } });
  Logger.log(response.getContent());
  return response.getContent();
}

function submitAttendanceFromPage(data) {
  return recordAttendance_(data || {});
}

function createStudent_(data) {
  if (!data.nis || !data.namaLengkap) {
    throw new Error('NIS dan Nama Lengkap wajib diisi.');
  }

  var ss = getSpreadsheet_();
  var now = new Date();

  appendByHeaders_(ss.getSheetByName(SHEETS.SANTRI), {
    'Timestamp': now,
    'Foto URL': data.fotoUrl || data.foto || '',
    'NIS': data.nis,
    'Nama Lengkap': data.namaLengkap,
    'Nama Panggilan': data.namaPanggilan || '',
    'Tempat Lahir': data.tempatLahir || '',
    'Tanggal Lahir': data.tanggalLahir || '',
    'Jenis Kelamin': data.jenisKelamin || '',
    'Alamat': data.alamat || '',
    'Nomor HP Santri': data.hpSantri || '',
    'Email Aktif': data.email || '',
    'Golongan Darah': data.golonganDarah || '',
    'Riwayat Penyakit': data.riwayatPenyakit || '',
    'Alergi': data.alergi || '',
    'Status': data.status || 'Aktif',
    'Tanggal Masuk': data.tanggalMasuk || '',
    'Program Pendidikan': data.programPendidikan || '',
    'Kelas': data.kelas || '',
    'Wali Kelas': data.waliKelas || '',
    'Ustadz Pembimbing': data.ustadzPembimbing || ''
  });

  appendByHeaders_(ss.getSheetByName(SHEETS.ORANG_TUA), {
    'Timestamp': now,
    'NIS': data.nis,
    'Nama Ayah': data.namaAyah || '',
    'Nama Ibu': data.namaIbu || '',
    'Pekerjaan Ayah': data.pekerjaanAyah || '',
    'Tempat Lahir Ayah': data.tempatLahirAyah || '',
    'Tanggal Lahir Ayah': data.tanggalLahirAyah || '',
    'Pekerjaan Ibu': data.pekerjaanIbu || '',
    'Tempat Lahir Ibu': data.tempatLahirIbu || '',
    'Tanggal Lahir Ibu': data.tanggalLahirIbu || '',
    'Jumlah Saudara': data.jumlahSaudara || '',
    'Anak Ke': data.anakKe || '',
    'No HP/WA Ayah': data.hpAyah || '',
    'No HP/WA Ibu': data.hpIbu || '',
    'Alamat Orangtua': data.alamatOrangtua || ''
  });

  appendByHeaders_(ss.getSheetByName(SHEETS.DOKUMEN), {
    'Timestamp': now,
    'NIS': data.nis,
    'Nama Lengkap': data.namaLengkap,
    'File Foto': data.fotoFileName || '',
    'Kartu Keluarga': data.kartuKeluargaFileName || '',
    'Akta Kelahiran': data.aktaKelahiranFileName || '',
    'Folder Drive': DRIVE_FOLDER_SANTRI_ID
  });

  return {
    ok: true,
    message: 'Data santri berhasil disimpan ke Google Workspace.',
    nis: data.nis
  };
}

function recordAttendance_(data) {
  var peran = String(data.peran || 'Santri').trim();
  var tipeAbsen = String(data.tipeAbsen || data.statusAbsensi || 'Masuk').trim();
  var identifier = String(data.nomorInduk || data.nis || data.idPegawai || '').trim();
  var nis = identifier;
  var nama = String(data.namaLengkap || '').trim();

  if (!identifier || !nama) {
    throw new Error('Nomor identitas dan Nama Lengkap wajib diisi.');
  }

  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(SHEETS.ABSENSI);
  ensureHeaders_(sheet, [
    'Timestamp',
    'Hari',
    'Tanggal',
    'Jam',
    'Sesi',
    'Peran',
    'Nomor Induk',
    'NIS',
    'Nama Lengkap',
    'Kelas',
    'Jabatan',
    'Tipe Absen',
    'Status Absensi',
    'Metode',
    'Token QR',
    'QR Token',
    'Perangkat',
    'Catatan'
  ]);

  var now = new Date();
  var timezone = Session.getScriptTimeZone() || 'Asia/Jakarta';
  var dayText = Utilities.formatDate(now, timezone, 'EEEE');
  var dateText = Utilities.formatDate(now, timezone, 'yyyy-MM-dd');
  var timeText = Utilities.formatDate(now, timezone, 'HH:mm:ss');
  var sesi = data.sesi || 'Operasional';

  if (isDuplicateAttendance_(sheet, dateText, sesi, identifier, tipeAbsen)) {
    return {
      ok: true,
      duplicate: true,
      message: 'Absensi ' + tipeAbsen + ' untuk ' + nama + ' sudah tercatat hari ini.'
    };
  }

  appendByHeaders_(sheet, {
    'Timestamp': now,
    'Hari': dayText,
    'Tanggal': dateText,
    'Jam': timeText,
    'Sesi': sesi,
    'Peran': peran,
    'Nomor Induk': identifier,
    'NIS': nis,
    'Nama Lengkap': nama,
    'Kelas': data.kelas || '',
    'Jabatan': data.jabatan || peran,
    'Tipe Absen': tipeAbsen,
    'Status Absensi': data.statusAbsensi || tipeAbsen,
    'Metode': data.metode || 'QR',
    'Token QR': data.qrToken || '',
    'QR Token': data.qrToken || '',
    'Perangkat': data.perangkat || '',
    'Catatan': data.catatan || ''
  });

  return {
    ok: true,
    message: 'Absensi berhasil tercatat.',
    nis: nis,
    peran: peran,
    tipeAbsen: tipeAbsen,
    sesi: sesi,
    hari: dayText,
    tanggal: dateText,
    jam: timeText
  };
}

function attendancePage_(e) {
  var parameter = e && e.parameter ? e.parameter : {};
  var sesi = parameter.sesi || 'Operasional';
  var token = parameter.token || '';
  var html = [
    '<!doctype html>',
    '<html>',
    '<head>',
    '<base target="_top">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    '<title>Absensi Civitas Markaz Dakwah Digital</title>',
    '<style>',
    ':root{--navy:#09245a;--gold:#e0b34e;--line:#dbe6f5;--bg:#f5f8fd;--ink:#142033;--muted:#66758b}',
    '*{box-sizing:border-box}body{margin:0;background:var(--bg);font-family:Arial,Helvetica,sans-serif;color:var(--ink)}',
    'main{min-height:100vh;display:grid;place-items:center;padding:18px}',
    'form{width:min(520px,100%);background:white;border:1px solid var(--line);border-radius:10px;box-shadow:0 22px 60px rgba(9,36,90,.12);padding:20px}',
    'h1{margin:0 0 8px;font-size:22px;color:var(--navy)}p{margin:0 0 16px;color:var(--muted);line-height:1.5}',
    'label{display:grid;gap:6px;margin-top:12px;font-weight:700;font-size:13px;color:var(--muted)}',
    'input,select,textarea,button{font:inherit}input,select,textarea{width:100%;border:1px solid var(--line);border-radius:8px;padding:11px 12px}',
    'button{width:100%;margin-top:16px;border:0;border-radius:8px;background:#09245a;color:white;font-weight:800;padding:12px}',
    '.msg{margin-top:12px;font-weight:700}.ok{color:#0f8a61}.bad{color:#c2410c}',
    '</style>',
    '</head>',
    '<body>',
    '<main>',
    '<form id="attendanceForm">',
    '<h1>Absensi Civitas</h1>',
    '<p>Markaz Dakwah Digital - Sesi ' + escapeHtml_(sesi) + '. Hari, tanggal, dan jam dicatat otomatis oleh sistem.</p>',
    '<label>Peran<select name="peran"><option>Santri</option><option>Super Admin</option><option>Direktur</option><option>Kepala Pendidikan</option><option>Guru</option><option>Ustadz Pembimbing</option><option>Tim Kesehatan</option><option>Bendahara</option></select></label>',
    '<label>Jenis Absen<select name="tipeAbsen"><option>Masuk</option><option>Keluar</option></select></label>',
    '<label>NIS / ID / Nomor HP<input name="nomorInduk" required autocomplete="off"></label>',
    '<label>Nama Lengkap<input name="namaLengkap" required></label>',
    '<label>Kelas / Unit<input name="kelas"></label>',
    '<label>Jabatan<input name="jabatan"></label>',
    '<label>Keterangan<select name="statusAbsensi"><option>Hadir</option><option>Dinas</option><option>Izin</option><option>Sakit</option><option>Alpa</option></select></label>',
    '<label>Catatan<textarea name="catatan" rows="3"></textarea></label>',
    '<button type="submit">Kirim Absensi</button>',
    '<div class="msg" id="msg"></div>',
    '</form>',
    '</main>',
    '<script>',
    'var form=document.getElementById("attendanceForm"),msg=document.getElementById("msg");',
    'form.addEventListener("submit",function(evt){',
    'evt.preventDefault();msg.textContent="Mengirim absensi...";msg.className="msg";',
    'var fd=new FormData(form);var data={};fd.forEach(function(value,key){data[key]=value;});',
    'data.sesi=' + JSON.stringify(sesi) + ';data.qrToken=' + JSON.stringify(token) + ';data.metode="QR";data.perangkat=navigator.userAgent;',
    'google.script.run.withSuccessHandler(function(json){msg.textContent=json.message||"Absensi diproses";msg.className="msg "+(json.ok?"ok":"bad");if(json.ok){form.reset();}}).withFailureHandler(function(err){msg.textContent=(err&&err.message)?err.message:"Gagal mengirim absensi. Coba lagi.";msg.className="msg bad";}).submitAttendanceFromPage(data);',
    '});',
    '</script>',
    '</body>',
    '</html>'
  ].join('');

  return HtmlService.createHtmlOutput(html).setTitle('Absensi Civitas Markaz Dakwah Digital');
}

function readStudents_() {
  var sheet = getSpreadsheet_().getSheetByName(SHEETS.SANTRI);
  var values = sheet.getDataRange().getValues();
  if (!values.length) {
    return [];
  }

  var headers = values.shift();
  var students = [];

  for (var r = 0; r < values.length; r += 1) {
    var row = values[r];
    if (!row[2]) {
      continue;
    }

    var item = {};
    for (var c = 0; c < headers.length; c += 1) {
      item[headers[c]] = row[c];
    }
    students.push(item);
  }

  return students;
}

function readAttendanceSummary_(parameter) {
  var timezone = Session.getScriptTimeZone() || 'Asia/Jakarta';
  var targetDate = parameter.date || Utilities.formatDate(new Date(), timezone, 'yyyy-MM-dd');
  var sheet = getSpreadsheet_().getSheetByName(SHEETS.ABSENSI);
  ensureHeaders_(sheet, [
    'Timestamp',
    'Hari',
    'Tanggal',
    'Jam',
    'Sesi',
    'Peran',
    'Nomor Induk',
    'NIS',
    'Nama Lengkap',
    'Kelas',
    'Jabatan',
    'Tipe Absen',
    'Status Absensi',
    'Metode',
    'Token QR',
    'QR Token',
    'Perangkat',
    'Catatan'
  ]);

  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return emptyAttendanceSummary_(targetDate);
  }

  var headers = values.shift();
  var dateIdx = headers.indexOf('Tanggal');
  var timeIdx = headers.indexOf('Jam');
  var roleIdx = headers.indexOf('Peran');
  var typeIdx = headers.indexOf('Tipe Absen');
  var statusIdx = headers.indexOf('Status Absensi');
  var nameIdx = headers.indexOf('Nama Lengkap');
  var idIdx = headers.indexOf('Nomor Induk');
  var nisIdx = headers.indexOf('NIS');
  var unitIdx = headers.indexOf('Kelas');
  var jabatanIdx = headers.indexOf('Jabatan');

  var summary = emptyAttendanceSummary_(targetDate);

  for (var i = 0; i < values.length; i += 1) {
    var row = values[i];
    var rowDate = normalizeDateText_(row[dateIdx], timezone);
    if (rowDate !== targetDate) {
      continue;
    }

    var role = String(roleIdx >= 0 && row[roleIdx] ? row[roleIdx] : 'Santri');
    var bucket = role === 'Santri' ? summary.santri : summary.civitas;
    var type = String(typeIdx >= 0 && row[typeIdx] ? row[typeIdx] : row[statusIdx] || 'Masuk');
    var isOut = type.toLowerCase() === 'keluar';
    var item = {
      waktu: formatTimeText_(row[timeIdx], timezone),
      nama: String(row[nameIdx] || '-'),
      identitas: String((idIdx >= 0 && row[idIdx]) || row[nisIdx] || '-'),
      peran: role,
      unit: String(row[unitIdx] || ''),
      jabatan: String(jabatanIdx >= 0 ? row[jabatanIdx] || '' : ''),
      tipe: type,
      status: String(row[statusIdx] || type)
    };

    bucket.total += 1;
    if (isOut) {
      bucket.keluar += 1;
    } else {
      bucket.masuk += 1;
    }

    if (bucket.terbaru.length < 6) {
      bucket.terbaru.push(item);
    }
  }

  summary.updatedAt = Utilities.formatDate(new Date(), timezone, 'yyyy-MM-dd HH:mm:ss');
  return summary;
}

function emptyAttendanceSummary_(dateText) {
  return {
    ok: true,
    date: dateText,
    updatedAt: '',
    santri: { total: 0, masuk: 0, keluar: 0, terbaru: [] },
    civitas: { total: 0, masuk: 0, keluar: 0, terbaru: [] }
  };
}

function normalizeDateText_(value, timezone) {
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return Utilities.formatDate(value, timezone, 'yyyy-MM-dd');
  }
  return String(value || '').slice(0, 10);
}

function formatTimeText_(value, timezone) {
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return Utilities.formatDate(value, timezone, 'HH:mm:ss');
  }
  return String(value || '-');
}

function appendByHeaders_(sheet, record) {
  if (!sheet) {
    throw new Error('Sheet tujuan tidak ditemukan.');
  }

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var row = [];

  for (var i = 0; i < headers.length; i += 1) {
    var header = headers[i];
    row.push(Object.prototype.hasOwnProperty.call(record, header) ? record[header] : '');
  }

  sheet.appendRow(row);
}

function ensureHeaders_(sheet, requiredHeaders) {
  if (!sheet) {
    throw new Error('Sheet tujuan tidak ditemukan.');
  }

  var lastColumn = Math.max(sheet.getLastColumn(), 1);
  var headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  var changed = false;

  for (var i = 0; i < requiredHeaders.length; i += 1) {
    if (headers.indexOf(requiredHeaders[i]) === -1) {
      headers.push(requiredHeaders[i]);
      changed = true;
    }
  }

  if (changed) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

function getSpreadsheet_() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function isDuplicateAttendance_(sheet, dateText, sesi, nis, tipeAbsen) {
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) {
    return false;
  }

  var headers = rows.shift();
  var dateIdx = headers.indexOf('Tanggal');
  var sesiIdx = headers.indexOf('Sesi');
  var nisIdx = headers.indexOf('NIS');
  var nomorIdx = headers.indexOf('Nomor Induk');
  var tipeIdx = headers.indexOf('Tipe Absen');

  for (var i = 0; i < rows.length; i += 1) {
    var row = rows[i];
    var rowIdentity = nomorIdx >= 0 && row[nomorIdx] ? row[nomorIdx] : row[nisIdx];
    var rowType = tipeIdx >= 0 && row[tipeIdx] ? row[tipeIdx] : row[headers.indexOf('Status Absensi')];
    if (String(row[dateIdx]).slice(0, 10) === dateText && row[sesiIdx] === sesi && String(rowIdentity) === nis && String(rowType) === tipeAbsen) {
      return true;
    }
  }

  return false;
}

function jsonResponse(body) {
  var output = ContentService.createTextOutput(JSON.stringify(body));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function javascriptResponse(source) {
  var output = ContentService.createTextOutput(source);
  output.setMimeType(ContentService.MimeType.JAVASCRIPT);
  return output;
}

function escapeHtml_(value) {
  return String(value || '').replace(/[&<>"']/g, function(ch) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[ch];
  });
}
