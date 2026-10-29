/* Shared profile: the server confirms every write. Browser storage is only a cache/draft. */
(function () {
  'use strict';
  const el = id => document.getElementById(id);
  const CACHE = 'mdd_chairman_profile';
  const PENDING = 'mdd_chairman_pending_v1';
  const STATE = 'mdd_chairman_shared_v1';
  const read = key => {try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}};
  const store = (key,value) => {try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}};
  let legacy = read(CACHE) || {};
  let state = read(STATE) || {revision:0,profile:null};
  let pending = read(PENDING);
  let ready = false, loading = null, busy = false, editRevision = null, editPhoto = '';
  const form = el('chairmanForm'), dialog = el('chairmanEditor');
  const submit = form.querySelector('button[type="submit"]');
  const password = el('chairmanPassword');
  const canEdit = () => ['Direktur MDD','Super Admin MDD'].includes(activeRole()?.name);
  function status(message) {el('profileSyncStatus').textContent=message;el('profileSyncHeader').textContent=message;}
  function display() {
    const profile = pending?.data || state.profile || legacy;
    el('chairmanName').textContent=profile?.name||'Nama belum diisi';
    el('chairmanPhoto').src=profile?.photo||'apps/web/public/chairman-placeholder.svg';
  }
  function jsonp(action,params={}) {
    return new Promise((resolve,reject)=>{
      const cb='mddProfile_'+Date.now()+'_'+Math.random().toString(36).slice(2);
      const script=document.createElement('script');
      const url=new URL(googleWorkspace.appsScriptUrl);
      Object.entries({action,callback:cb,_:Date.now(),...params}).forEach(([k,v])=>url.searchParams.set(k,String(v)));
      let timer;
      function clean(){clearTimeout(timer);script.remove();delete window[cb];}
      window[cb]=value=>{clean();resolve(value)};
      script.onerror=()=>{clean();reject(Error('Server belum dapat dihubungi. Periksa koneksi internet.'))};
      timer=setTimeout(()=>{clean();reject(Error('Server belum menjawab. Data belum dikonfirmasi tersimpan.'))},15000);
      script.src=url.toString(); document.body.appendChild(script);
    });
  }
  async function refresh() {
    if (loading) return loading;
    loading=(async()=>{
      try {
        const result=await jsonp('foundationProfile');
        if (!result.ok || result.service!=='foundation-profile-v1' || !Number.isInteger(result.state?.revision)) throw Error(result.error||'Penyimpanan profil bersama belum aktif.');
        const remote=result.state;
        // Never roll back to an older server response.
        if (remote.revision>=state.revision) {state=remote;store(STATE,state);}
        ready=true;
        if (pending && remote.requestId===pending.requestId) {
          localStorage.removeItem(PENDING);pending=null;legacy=state.profile||{};store(CACHE,legacy);
        }
        display();
        status(pending?'Belum tersinkron — buka profil untuk mencoba lagi':state.profile?'Tersinkron':legacy.name?'Profil lama belum tersinkron — klik untuk menyimpan':'Profil bersama belum diisi');
        return remote;
      } catch(err) {status(navigator.onLine?'Belum terhubung ke server':'Offline — menampilkan data perangkat');throw err;}
      finally {loading=null;}
    })();
    return loading;
  }
  async function preparePhoto(file) {
    if(!file && !editPhoto) return '';
    if(file && (!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>2*1024*1024)) throw Error('Pilih foto JPG, PNG, atau WebP maksimal 2 MB.');
    const source=file ? await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(Error('Foto gagal dibaca.'));r.readAsDataURL(file)}) : editPhoto;
    const image=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('Foto tidak dapat dibuka.'));img.src=source});
    const canvas=document.createElement('canvas'); const scale=Math.min(1,480/Math.max(image.width,image.height));
    canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));
    const context=canvas.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);
    const photo=canvas.toDataURL('image/jpeg',.78);
    if(photo.length>280000) throw Error('Foto terlalu kompleks. Pilih foto lain yang lebih kecil.');
    return photo;
  }
  async function confirmWrite(id) {
    const deadline=Date.now()+45000;
    while(Date.now()<deadline){
      const receipt=await jsonp('foundationProfileStatus',{requestId:id});
      if(!receipt.ok) {const err=Error(receipt.error||'Server menolak perubahan.');err.code=receipt.code;throw err;}
      if(!receipt.pending) return receipt;
      await new Promise(resolve=>setTimeout(resolve,1500));
    }
    throw Error('Konfirmasi belum diterima. Draft disimpan; buka profil untuk memeriksa dan mencoba lagi.');
  }
  el('chairmanButton').onclick=async()=>{
    if(!canEdit()){showToast('Profil hanya dapat diubah oleh Direktur atau Super Admin.');return;}
    password.value='';el('profileError').textContent='';submit.disabled=true;el('chairmanUpload').value='';
    const initial=pending?.data||state.profile||legacy;
    el('chairmanInput').value=initial.name||'';editPhoto=initial.photo||'';
    dialog.showModal();
    try{await refresh();editRevision=state.revision;
      if(!pending){const current=state.profile||legacy;el('chairmanInput').value=current.name||'';editPhoto=current.photo||'';}
    }catch(err){editRevision=null;el('profileError').textContent=err.message;}
    finally{submit.disabled=false;}
  };
  el('closeProfile').onclick=()=>{if(!busy)dialog.close()};
  dialog.addEventListener('close',()=>{password.value='';});
  form.onsubmit=async event=>{
    event.preventDefault();if(busy||!canEdit())return;
    busy=true;submit.disabled=true;el('closeProfile').disabled=true;el('profileError').textContent='';
    const credential=password.value; password.value='';
    try{
      const name=el('chairmanInput').value.trim();if(!name)throw Error('Nama wajib diisi.');
      const photo=await preparePhoto(el('chairmanUpload').files[0]);
      const requestId=crypto.randomUUID().replace(/-/g,'');
      pending={requestId,baseRevision:editRevision,data:{name,photo}};
      if(!store(PENDING,pending))throw Error('Penyimpanan perangkat penuh. Draft belum dapat diamankan.');
      display();status('Belum tersinkron');
      if(!navigator.onLine)throw Error('Sedang offline. Draft aman; buka profil dan simpan kembali setelah online.');
      if(editRevision===null){await refresh();editRevision=state.revision;pending.baseRevision=editRevision;store(PENDING,pending);}
      if(!credential)throw Error('Masukkan kata sandi akun Anda untuk menyimpan ke server.');
      status('Menyinkronkan…');
      await fetch(googleWorkspace.appsScriptUrl,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({type:'foundation.profile.update',requestId,baseRevision:pending.baseRevision,data:pending.data,auth:{role:activeRole().name,password:credential}})});
      await confirmWrite(requestId);
      await refresh();
      // A later valid edit on another device is also safe: the original write was acknowledged.
      if(pending?.requestId===requestId){pending=null;localStorage.removeItem(PENDING);display();status('Tersinkron');}
      dialog.close();showToast('Profil tersimpan di server dan dapat dibaca perangkat lain.');
    }catch(err){
      status('Belum tersinkron');el('profileError').textContent=err.message;
      if(err.code==='CONFLICT'){await refresh().catch(()=>{});editRevision=state.revision;el('profileError').textContent+=' Draft Anda tetap tersedia. Tutup dan buka profil untuk meninjau sebelum mencoba kembali.';}
    }finally{busy=false;submit.disabled=false;el('closeProfile').disabled=false;password.value='';}
  };
  el('useServerProfile').onclick=()=>{
    if(!ready||!state.profile){el('profileError').textContent='Belum ada profil server yang dapat dipakai.';return;}
    pending=null;localStorage.removeItem(PENDING);legacy=state.profile;store(CACHE,legacy);
    el('chairmanInput').value=state.profile.name;editPhoto=state.profile.photo||'';editRevision=state.revision;el('chairmanUpload').value='';display();status('Tersinkron');el('profileError').textContent='Profil terbaru dari server dimuat.';
  };
  function quietlyRefresh(){if(!busy&&activeRole())refresh().catch(()=>{});}
  window.addEventListener('focus',quietlyRefresh);window.addEventListener('online',quietlyRefresh);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)quietlyRefresh()});
  window.addEventListener('storage',event=>{if([STATE,PENDING].includes(event.key)){state=read(STATE)||state;pending=read(PENDING);display()}});
  setInterval(()=>{if(!document.hidden)quietlyRefresh()},30000);
  display();refresh().catch(()=>{});
})();
