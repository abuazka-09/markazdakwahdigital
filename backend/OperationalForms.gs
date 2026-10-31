/* Authenticated, append-only operational records. No public GET returns student/financial data. */
function operationPermissions_() {
  return {
    'Direktur MDD':{password:'0000',read:['akademik','hafalan','keuangan','donasi'],write:[]},
    'Super Admin MDD':{password:'1111',read:['akademik','hafalan','keuangan','donasi'],write:['akademik','hafalan','keuangan','donasi']},
    'Kepala Pendidikan MDD':{password:'2222',read:['akademik','hafalan','keuangan','donasi'],write:['akademik','hafalan']},
    'Guru MDD':{password:'3333',read:['akademik'],write:['akademik']},
    'Ustadz Pembimbing MDD':{password:'4444',read:['hafalan'],write:['hafalan']},
    'Bendahara MDD':{password:'6666',read:['keuangan','donasi'],write:['keuangan','donasi']}
  };
}
function operationReplyKey_(id,key) {
  if (!/^[a-zA-Z0-9_-]{16,80}$/.test(String(id||'')) || !/^[a-zA-Z0-9_-]{24,80}$/.test(String(key||''))) throw Error('Identitas permintaan tidak valid.');
  return 'mddop:' + id + ':' + key;
}
function operationResult_(params) {
  var answer;
  try {
    var key=operationReplyKey_(params.requestId,params.resultKey);
    var cache=CacheService.getScriptCache(),meta=cache.get(key+':meta');
    if(!meta) answer={ok:true,pending:true};
    else {
      var count=Number(meta),text='';
      for(var i=0;i<count;i++){var chunk=cache.get(key+':'+i);if(chunk===null)throw Error('Jawaban kedaluwarsa. Silakan muat ulang catatan.');text+=chunk;}
      answer=JSON.parse(text);
    }
  }catch(err){answer={ok:false,error:String(err.message||err)};}
  var cb=String(params.callback||'');
  if(cb&&/^[a-zA-Z_$][a-zA-Z0-9_$]{0,100}$/.test(cb))return javascriptResponse(cb+'('+JSON.stringify(answer)+');');
  return jsonResponse(answer);
}
function operationStoreReply_(key,result) {
  var text=JSON.stringify(result),cache=CacheService.getScriptCache(),count=0;
  // ASCII JSON prevents UTF-8 byte sizes from exceeding the cache item limit.
  text=text.replace(/[\u007f-\uffff]/g,function(ch){return '\\u'+('0000'+ch.charCodeAt(0).toString(16)).slice(-4);});
  for(var start=0;start<text.length;start+=80000){cache.put(key+':'+count,text.slice(start,start+80000),300);count++;}
  cache.put(key+':meta',String(count),300);
}
function operationStudents_(){
  return readStudents_().map(function(s){return {code:String(s['Kode Santri MDD']||s.NIS||''),name:String(s['Nama Lengkap']||''),kelas:String(s.Kelas||'')};}).filter(function(s){return s.code&&s.name;});
}
function operationValidate_(module,input,roster) {
  var d=input||{},out={};
  function text(k,label,required,max){var v=String(d[k]||'').trim();if((required&&!v)||v.length>(max||250))throw Error(label+' wajib sesuai batas isian.');return v;}
  function choice(k,label,options){var v=text(k,label,true);if(options.indexOf(v)<0)throw Error(label+' tidak valid.');return v;}
  function number(k,label,min,max,integer){var v=Number(d[k]);if(d[k]===null||d[k]===undefined||String(d[k]).trim()===''||!Number.isFinite(v)||v<min||v>max||(integer&&!Number.isInteger(v)))throw Error(label+' tidak valid.');return v;}
  out.date=text('date','Tanggal',true,10);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(out.date)||isNaN(Date.parse(out.date+'T00:00:00Z'))||new Date(out.date+'T00:00:00Z').toISOString().slice(0,10)!==out.date)throw Error('Tanggal tidak valid.');
  out.note=text('note','Catatan',false,1000);
  if(module==='akademik'||module==='hafalan'||(module==='keuangan'&&d.kind==='Pembayaran SPP')){
    out.studentCode=text('studentCode','Santri',true,80);
    var student=roster.find(function(s){return s.code===out.studentCode;});if(!student)throw Error('Pilih santri yang terdaftar di server.');
    out.studentName=student.name;out.kelas=student.kelas;
  }
  if(module==='akademik'){
    out.subject=text('subject','Mata pelajaran',true,100);out.assessment=choice('assessment','Jenis penilaian',['Tugas','Harian','UTS','UAS','Praktik']);
    out.schoolYear=text('schoolYear','Tahun ajaran',true,9);if(!/^\d{4}\/\d{4}$/.test(out.schoolYear)||Number(out.schoolYear.slice(5))!==Number(out.schoolYear.slice(0,4))+1)throw Error('Tahun ajaran harus berurutan, misalnya 2026/2027.');
    out.semester=choice('semester','Semester',['Ganjil','Genap']);out.score=number('score','Nilai',0,100,false);out.kkm=number('kkm','KKM',0,100,false);
  }else if(module==='hafalan'){
    out.activity=choice('activity','Kegiatan',['Setoran','Murajaah']);out.surah=text('surah','Surah',true,100);out.juz=number('juz','Juz',1,30,true);
    out.ayatFrom=number('ayatFrom','Ayat awal',1,286,true);out.ayatTo=number('ayatTo','Ayat akhir',out.ayatFrom,286,true);
    out.pages=number('pages','Jumlah halaman',0.1,50,false);out.fluency=choice('fluency','Kelancaran',['Lancar','Cukup lancar','Perlu bimbingan']);out.followUp=text('followUp','Tindak lanjut',false,500);
  }else if(module==='keuangan'){
    out.kind=choice('kind','Jenis transaksi',['Pembayaran SPP','Penerimaan lain','Pengeluaran']);out.category=text('category','Kategori',true,100);out.description=text('description','Uraian',true,250);
    out.amount=number('amount','Nominal rupiah',1,1000000000000,true);out.method=choice('method','Metode',['Tunai','Transfer','QRIS','E-Wallet']);out.reference=text('reference','Referensi',false,100);
    if(out.kind==='Pembayaran SPP'){out.period=text('period','Periode SPP',true,7);if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(out.period))throw Error('Periode SPP tidak valid.');}
  }else if(module==='donasi'){
    out.kind=choice('kind','Jenis ZISWAF',['Zakat','Infaq','Sedekah','Wakaf']);out.donor=text('donor','Nama donatur',false,100)||'Hamba Allah';out.program=text('program','Program peruntukan',true,150);
    out.amount=number('amount','Nominal rupiah',1,1000000000000,true);out.method=choice('method','Metode',['Tunai','Transfer','QRIS','E-Wallet']);out.status=choice('status','Status',['Diterima','Janji donasi']);out.reference=text('reference','Referensi',false,100);
  }else throw Error('Menu pencatatan tidak dikenal.');
  return out;
}
function operationRows_(){
  var sheet=getSpreadsheet_().getSheetByName('CatatanOperasional');
  if(!sheet||sheet.getLastRow()<2)return [];
  return sheet.getRange(2,1,sheet.getLastRow()-1,5).getValues().map(function(r){return {id:String(r[0]),module:String(r[1]),createdAt:String(r[2]),author:String(r[3]),data:JSON.parse(String(r[4]))};});
}
function operationRun_(payload){
  var key;
  try{key=operationReplyKey_(payload.requestId,payload.resultKey);}catch(err){return {ok:false,error:err.message};}
  var lock=LockService.getScriptLock(),held=false,result;
  try{
    var auth=payload.auth||{},permission=operationPermissions_()[auth.role],module=String(payload.module||'');
    if(!permission||String(auth.password)!==permission.password)throw Error('Kata sandi atau peran akun tidak sesuai.');
    var write=payload.type==='operation.create';
    if((write?permission.write:permission.read).indexOf(module)<0)throw Error('Akun ini tidak diizinkan untuk '+(write?'mencatat':'membaca')+' menu tersebut.');
    if(payload.type!=='operation.create'&&payload.type!=='operation.list')throw Error('Jenis permintaan tidak dikenal.');
    var roster=operationStudents_();
    if(write){
      lock.waitLock(20000);held=true;
      var existing=operationRows_().find(function(r){return r.id===payload.requestId;});
      if(existing){if(existing.module!==module||existing.author!==auth.role)throw Error('Nomor permintaan sudah digunakan.');result={ok:true,record:existing};}
      else{
        var data=operationValidate_(module,payload.data,roster),ss=getSpreadsheet_(),sheet=ss.getSheetByName('CatatanOperasional')||ss.insertSheet('CatatanOperasional');
        if(!sheet.getLastRow())sheet.getRange(1,1,1,5).setValues([['ID','Menu','Waktu Server','Petugas','Data JSON']]);
        var record={id:payload.requestId,module:module,createdAt:new Date().toISOString(),author:String(auth.role),data:data};
        sheet.appendRow([record.id,module,record.createdAt,record.author,JSON.stringify(data)]);SpreadsheetApp.flush();result={ok:true,record:record};
      }
    }else{
      var all=operationRows_(),records=all.filter(function(r){return r.module===module;}),received=all.filter(function(r){return r.module==='donasi'&&r.data.status==='Diterima';});
      // Report totals use all records, not only the most recent page.
      var summary={count:records.length,income:0,expense:0,donations:0,average:null,pages:0};
      if(module==='keuangan'){
        records.forEach(function(r){if(r.data.kind==='Pengeluaran')summary.expense+=r.data.amount;else summary.income+=r.data.amount;});
        received.forEach(function(r){summary.donations+=r.data.amount;});
      }
      if(module==='donasi')records.forEach(function(r){if(r.data.status==='Diterima')summary.income+=r.data.amount;});
      if(module==='akademik'&&records.length)summary.average=records.reduce(function(n,r){return n+r.data.score;},0)/records.length;
      if(module==='hafalan')summary.pages=records.reduce(function(n,r){return n+r.data.pages;},0);
      result={ok:true,module:module,records:records.slice(-100).reverse(),summary:summary,students:roster,canWrite:permission.write.indexOf(module)>=0,serverTime:new Date().toISOString()};
    }
  }catch(err){result={ok:false,error:String(err.message||err)};}
  finally{if(held)lock.releaseLock();}
  operationStoreReply_(key,result);return {ok:true,queued:true};
}
