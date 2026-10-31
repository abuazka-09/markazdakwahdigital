/* Contextual forms for the original application only. Server data and credentials remain in memory. */
(function(){
'use strict';
const $=id=>document.getElementById(id), esc=value=>escapeHtml(String(value??''));
const money=value=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(value||0);
const definitions={
 akademik:{title:'Catat Nilai & Evaluasi',read:['Direktur MDD','Super Admin MDD','Kepala Pendidikan MDD','Guru MDD'],fields:[['date','Tanggal penilaian','date'],['studentCode','Santri','student'],['subject','Mata pelajaran','text'],['schoolYear','Tahun ajaran (contoh 2026/2027)','text'],['semester','Semester','select:Ganjil|Genap'],['assessment','Jenis penilaian','select:Tugas|Harian|UTS|UAS|Praktik'],['score','Nilai (0–100)','number',0,100],['kkm','KKM (0–100)','number',0,100],['note','Evaluasi & tindak lanjut','textarea',false]]},
 hafalan:{title:'Catat Setoran & Murajaah',read:['Direktur MDD','Super Admin MDD','Kepala Pendidikan MDD','Ustadz Pembimbing MDD'],fields:[['date','Tanggal kegiatan','date'],['studentCode','Santri','student'],['activity','Kegiatan','select:Setoran|Murajaah'],['surah','Nama surah','text'],['juz','Juz (1–30)','number',1,30],['ayatFrom','Ayat awal','number',1,286],['ayatTo','Ayat akhir','number',1,286],['pages','Jumlah halaman pada kegiatan ini','number',0.1,50],['fluency','Kelancaran','select:Lancar|Cukup lancar|Perlu bimbingan'],['followUp','Tindak lanjut pembimbing','textarea',false],['note','Catatan adab / kedisiplinan','textarea',false]]},
 keuangan:{title:'Catat Transaksi Keuangan',read:['Direktur MDD','Super Admin MDD','Kepala Pendidikan MDD','Bendahara MDD'],note:'SPP dan operasional dicatat di sini. ZISWAF dicatat satu kali di menu Donasi; penerimaan terkonfirmasi ikut dihitung dalam ringkasan.',fields:[['date','Tanggal transaksi','date'],['kind','Jenis transaksi','select:Pembayaran SPP|Penerimaan lain|Pengeluaran'],['studentCode','Santri (khusus SPP)','student',false],['period','Periode SPP','month',false],['category','Kategori transaksi','text'],['description','Uraian transaksi','text'],['amount','Nominal (Rp)','number',1,1000000000000],['method','Metode pembayaran','select:Tunai|Transfer|QRIS|E-Wallet'],['reference','Nomor kuitansi / referensi','text',false],['note','Catatan','textarea',false]]},
 donasi:{title:'Catat Penerimaan ZISWAF',read:['Direktur MDD','Super Admin MDD','Kepala Pendidikan MDD','Bendahara MDD'],fields:[['date','Tanggal pencatatan','date'],['kind','Jenis ZISWAF','select:Zakat|Infaq|Sedekah|Wakaf'],['donor','Nama donatur (opsional)','text',false],['program','Program / peruntukan','text'],['amount','Nominal (Rp)','number',1,1000000000000],['method','Metode penerimaan','select:Tunai|Transfer|QRIS|E-Wallet'],['status','Status penerimaan','select:Diterima|Janji donasi'],['reference','Nomor kuitansi / referensi','text',false],['note','Catatan / amanah donatur','textarea',false]]}
};
let credential=null,identity='',roster=[],saving=false;
const loaded={},pendingLoads={};
function today(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function status(module,message){$('op-status-'+module).textContent=message;}
function field(module,f){const [key,label,type,min,max]=f,id='op-'+module+'-'+key,required=min!==false,req=required?'required':'';
 const start='<label class="op-field" for="'+id+'"><span>'+esc(label)+(required?' *':'')+'</span>',end='</label>';
 if(type==='student')return start+'<select id="'+id+'" name="'+key+'" class="select" '+req+'><option value="">Pilih santri dari server</option></select>'+end;
 if(type.startsWith('select:'))return start+'<select id="'+id+'" name="'+key+'" class="select" '+req+'>'+type.slice(7).split('|').map(v=>'<option>'+esc(v)+'</option>').join('')+'</select>'+end;
 if(type==='textarea')return start+'<textarea id="'+id+'" name="'+key+'" class="select" maxlength="1000" '+req+'></textarea>'+end;
 return start+'<input id="'+id+'" name="'+key+'" class="select" type="'+type+'" '+req+' '+(type==='number'?'min="'+min+'" max="'+max+'" step="'+(key==='amount'||['juz','ayatFrom','ayatTo'].includes(key)?'1':'any')+'"':'maxlength="250"')+(type==='date'?' value="'+today()+'"':'')+'>'+end;
}
const style=document.createElement('style');style.textContent='.op-panel[hidden],.op-panel [hidden]{display:none!important}.op-panel{margin:14px 0}.op-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.op-field{display:grid;gap:7px;font-size:13px;font-weight:700}.op-field .select{width:100%;min-width:0}.op-panel fieldset{border:0;padding:0;margin:16px 0}.op-panel textarea{padding:10px;min-height:80px}.op-summary{display:flex;gap:12px;flex-wrap:wrap;margin:14px 0}.op-summary span{padding:12px;background:var(--blue-100);border:1px solid var(--line);border-radius:12px}.op-scroll{overflow:auto;max-height:460px}.op-scroll table{min-width:680px}.op-status{padding:10px 0;line-height:1.5;font-size:13px}.op-connect{display:flex;gap:10px;align-items:end;flex-wrap:wrap;margin:14px 0}.op-connect label{display:grid;gap:6px;font-size:13px}.op-top{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}.op-empty{padding:18px;color:var(--muted)}@media(max-width:760px){.op-grid{grid-template-columns:1fr}.op-connect .select{max-width:100%}.op-connect label{width:100%}.op-scroll table{min-width:560px}}';document.head.appendChild(style);
for(const [module,def] of Object.entries(definitions)){
 const panel=document.createElement('div');panel.className='panel op-panel';panel.id='op-panel-'+module;
 panel.innerHTML='<div class="op-top"><h3>'+def.title+'</h3><button class="ghost" type="button" id="op-refresh-'+module+'">Muat Catatan</button></div>'+(def.note?'<p class="label" style="margin-top:12px">'+def.note+'</p>':'')+'<form class="op-connect" id="op-connect-'+module+'"><label for="op-password-'+module+'">Kata sandi akun untuk membuka catatan bersama<input class="select" id="op-password-'+module+'" type="password" autocomplete="current-password" required></label><button class="primary" type="submit">Hubungkan Catatan</button></form><p class="op-status" id="op-status-'+module+'" role="status" aria-live="polite">Hubungkan untuk memuat data dari server.</p><form id="op-form-'+module+'"><fieldset disabled><div class="op-grid">'+def.fields.map(f=>field(module,f)).join('')+'</div><div class="actions" style="margin-top:16px"><button class="primary" type="submit">Simpan Catatan</button><button class="ghost" id="op-draft-'+module+'" type="button">Pulihkan Draft</button></div></fieldset></form><div class="op-summary" id="op-summary-'+module+'"></div><h4>Catatan Tersimpan</h4><div class="op-scroll" id="op-records-'+module+'"><p class="op-empty">Belum dimuat dari server.</p></div>';
 $(module).prepend(panel);
 panel.querySelector('#op-connect-'+module).onsubmit=async e=>{e.preventDefault();const input=$('op-password-'+module),pass=input.value;input.value='';credential={role:activeRole()?.name,password:pass};await load(module,true);};
 $('op-refresh-'+module).onclick=()=>load(module,true);
 $('op-form-'+module).onsubmit=e=>save(module,e);
 $('op-draft-'+module).onclick=()=>restoreDraft(module);
 const form=$('op-form-'+module);
 if(module==='keuangan'){form.elements.kind.onchange=()=>adjustSpp(form);adjustSpp(form);}
 // The old illustrative charts are replaced by real, confirmed record summaries below.
 const old=panel.nextElementSibling;if(old){old.hidden=true;old.style.display='none';}
}
function adjustSpp(form){const spp=form.elements.kind.value==='Pembayaran SPP';for(const key of ['studentCode','period']){form.elements[key].required=spp;form.elements[key].closest('label').hidden=!spp;}}
function jsonpResult(id,key){return new Promise((resolve,reject)=>{const callback='mddOperation_'+Date.now()+'_'+Math.random().toString(36).slice(2),script=document.createElement('script'),url=new URL(googleWorkspace.appsScriptUrl);let timer;
 const cleanup=()=>{clearTimeout(timer);script.remove();delete window[callback]};window[callback]=value=>{cleanup();resolve(value)};script.onerror=()=>{cleanup();reject(Error('Server tidak dapat dihubungi.'))};timer=setTimeout(()=>{cleanup();reject(Error('Jawaban server belum diterima.'))},12000);
 for(const [k,v] of Object.entries({action:'operationResult',requestId:id,resultKey:key,callback,_:Date.now()}))url.searchParams.set(k,v);script.src=url.toString();document.body.appendChild(script);
});}
async function request(module,type,data,id){if(!credential||credential.role!==activeRole()?.name)throw Error('Hubungkan catatan dengan kata sandi akun Anda terlebih dahulu.');
 const requestId=id||crypto.randomUUID().replace(/-/g,''),resultKey=crypto.randomUUID().replace(/-/g,''),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
 try{await fetch(googleWorkspace.appsScriptUrl,{method:'POST',mode:'no-cors',signal:controller.signal,headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({type,module,requestId,resultKey,auth:credential,data})});}finally{clearTimeout(timer);}
 const until=Date.now()+55000;while(Date.now()<until){const result=await jsonpResult(requestId,resultKey);if(!result.ok)throw Error(result.error||'Permintaan ditolak server.');if(!result.pending)return result;await new Promise(resolve=>setTimeout(resolve,1200));}throw Error('Konfirmasi belum diterima. Draft tetap tersedia; coba simpan lagi dengan nomor permintaan yang sama.');
}
function studentOptions(){for(const module of Object.keys(definitions)){const input=$('op-form-'+module).elements.studentCode;if(input){const value=input.value;input.innerHTML='<option value="">Pilih santri</option>'+roster.map(s=>'<option value="'+esc(s.code)+'">'+esc(s.code+' · '+s.name+' · '+s.kelas)+'</option>').join('');input.value=value;}}}
function syncControls(){for(const [module,def] of Object.entries(definitions)){
 const allowed=def.read.includes(activeRole()?.name),panel=$('op-panel-'+module),connected=credential?.role===activeRole()?.name;
 panel.hidden=!allowed;$('op-connect-'+module).hidden=!!connected;$('op-refresh-'+module).disabled=!connected||saving;
 $('op-form-'+module).querySelector('fieldset').disabled=!connected||!loaded[module]?.canWrite||saving;
 if(connected&&loaded[module]&&!loaded[module].canWrite)$('op-form-'+module).hidden=true;else $('op-form-'+module).hidden=false;
}}
async function load(module,explicit=false){if(pendingLoads[module])return pendingLoads[module];if(!credential){if(explicit)status(module,'Masukkan kata sandi akun pada Hubungkan Catatan.');return;}
 const token=identity;pendingLoads[module]=(async()=>{try{status(module,'Memuat catatan dari server…');const result=await request(module,'operation.list');if(token!==identity)return;loaded[module]=result;roster=result.students||[];studentOptions();render(module,result);status(module,'Tersinkron · '+result.summary.count+' catatan · menampilkan maksimal 100 catatan terbaru.');}
 catch(err){status(module,err.message+' Data belum dikonfirmasi tersinkron.');if(!loaded[module]){credential=null;}}finally{delete pendingLoads[module];syncControls();}})();return pendingLoads[module];}
function render(module,result){const rows=result.records||[],summary=result.summary,head=['Tanggal','Keterangan','Nilai / Nominal','Petugas'];
 const summaryHtml=module==='akademik'?'<span>Rata-rata nilai: <b>'+esc(summary.average===null?'Belum ada nilai':summary.average.toFixed(1))+'</b></span>':module==='hafalan'?'<span>Halaman kegiatan tercatat: <b>'+esc(summary.pages)+'</b></span>':module==='keuangan'?'<span>Penerimaan operasional: <b>'+money(summary.income)+'</b></span><span>ZISWAF diterima: <b>'+money(summary.donations)+'</b></span><span>Pengeluaran: <b>'+money(summary.expense)+'</b></span><span>Saldo pencatatan: <b>'+money(summary.income+summary.donations-summary.expense)+'</b></span>':'<span>ZISWAF diterima: <b>'+money(summary.income)+'</b></span>';
 $('op-summary-'+module).innerHTML=summaryHtml;
 $('op-records-'+module).innerHTML=rows.length?'<table><thead><tr>'+head.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>{const d=r.data;const description=module==='akademik'?[d.studentName,d.kelas,d.subject,d.assessment,d.semester,d.schoolYear].join(' · '):module==='hafalan'?[d.studentName,d.activity,d.surah+' ayat '+d.ayatFrom+'–'+d.ayatTo,'Juz '+d.juz,d.fluency].join(' · '):module==='keuangan'?[d.kind,d.studentName,d.period,d.category,d.description].filter(Boolean).join(' · '):[d.kind,d.donor,d.program,d.status].join(' · ');const value=module==='akademik'?d.score+' / 100 (KKM '+d.kkm+')':module==='hafalan'?d.pages+' halaman':money(d.amount);return '<tr><td>'+esc(d.date)+'</td><td>'+esc(description)+'<br><small>'+esc(d.note||d.followUp||'')+'</small>'+(d.reference?'<br><small>Ref: '+esc(d.reference)+'</small>':'')+'</td><td>'+esc(value)+'</td><td>'+esc(r.author)+'<br><small>'+esc(new Date(r.createdAt).toLocaleString('id-ID'))+'</small></td></tr>';}).join('')+'</tbody></table>':'<div class="op-empty">Belum ada catatan tersimpan pada menu ini.</div>';
}
function draftKey(module){return 'mdd_operation_draft:'+activeRole()?.name+':'+module;}
function draft(module){try{return JSON.parse(localStorage.getItem(draftKey(module))||'null')}catch{return null}}
function restoreDraft(module){const saved=draft(module);if(!saved){status(module,'Tidak ada draft di perangkat ini.');return;}const form=$('op-form-'+module);for(const [key,value] of Object.entries(saved.data))if(form.elements[key])form.elements[key].value=value;if(module==='keuangan')adjustSpp(form);status(module,'Draft dimuat. Periksa isian sebelum menyimpan.');}
async function save(module,event){event.preventDefault();if(saving)return;const form=$('op-form-'+module);if(!form.reportValidity())return;
 if(!loaded[module]?.canWrite){status(module,'Akun ini hanya memiliki akses membaca.');return;}
 const data=Object.fromEntries(new FormData(form));if(module==='hafalan'&&Number(data.ayatTo)<Number(data.ayatFrom)){status(module,'Ayat akhir tidak boleh lebih kecil dari ayat awal.');return;}
 const previous=draft(module),id=previous&&JSON.stringify(previous.data)===JSON.stringify(data)?previous.id:crypto.randomUUID().replace(/-/g,'');
 try{localStorage.setItem(draftKey(module),JSON.stringify({id,data}));}catch{status(module,'Draft belum dapat disimpan pada perangkat. Kosongkan ruang penyimpanan lalu coba lagi.');return;}
 const token=identity;saving=true;syncControls();status(module,'Mengirim dan menunggu konfirmasi penyimpanan server…');
 try{await request(module,'operation.create',data,id);if(token!==identity)return;localStorage.removeItem(draftKey(module));form.reset();form.elements.date.value=today();if(module==='keuangan')adjustSpp(form);showToast('Catatan tersimpan dan dikonfirmasi server.');await load(module,true);}
 catch(err){status(module,'Belum tersimpan terkonfirmasi: '+err.message+' Draft tetap tersedia.');}
 finally{saving=false;syncControls();}
}
function checkIdentity(){const next=activeRole()?.name+'|'+(activeSession?.loginAt||'');if(identity!==next){identity=next;credential=null;roster=[];for(const module of Object.keys(definitions)){delete loaded[module];$('op-records-'+module).innerHTML='<p class="op-empty">Hubungkan untuk memuat catatan.</p>';$('op-summary-'+module).innerHTML='';status(module,'Hubungkan untuk memuat data dari server.');}studentOptions();syncControls();}}
const originalSetPage=setPage;setPage=function(id){originalSetPage(id);checkIdentity();if(definitions[id])load(id);};
window.addEventListener('focus',()=>{checkIdentity();const id=document.querySelector('.section.active')?.id;if(definitions[id]&&!saving)load(id);});
window.addEventListener('online',()=>{const id=document.querySelector('.section.active')?.id;if(definitions[id]&&!saving)load(id);});
setInterval(()=>{checkIdentity();const id=document.querySelector('.section.active')?.id;if(!document.hidden&&!saving&&definitions[id])load(id);},30000);
document.addEventListener('click',e=>{if(e.target.closest('#logoutBtn'))setTimeout(checkIdentity,0);});
checkIdentity();
})();
