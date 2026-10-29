// Shared chairman profile; stored in a dedicated sheet, without changing existing records.
function foundationProfileRead_() {
  var sheet = getSpreadsheet_().getSheetByName('ProfilYayasan');
  if (!sheet || !sheet.getLastRow()) return {revision:0, profile:null, requestId:''};
  var raw = sheet.getRange(1, 1, sheet.getLastRow(), 1).getValues().map(function(row){return String(row[0] || '');}).join('');
  if (!raw) return {revision:0, profile:null, requestId:''};
  var state = JSON.parse(raw);
  if (!Number.isInteger(state.revision) || !state.profile) throw Error('Data profil server tidak valid.');
  return state;
}
function foundationProfileGet_(params) {
  var result;
  try {
    if (String(params.action).toLowerCase() === 'foundationprofilestatus') {
      var id = String(params.requestId || '');
      if (!/^[a-zA-Z0-9_-]{16,80}$/.test(id)) throw Error('Nomor permintaan tidak valid.');
      var receipt = CacheService.getScriptCache().get('profile:' + id);
      if (receipt) result = JSON.parse(receipt);
      else {
        var state = foundationProfileRead_();
        result = state.requestId === id ? {ok:true, requestId:id, revision:state.revision} : {ok:true, pending:true, requestId:id};
      }
    } else {
      result = {ok:true, service:'foundation-profile-v1', state:foundationProfileRead_()};
    }
  } catch (err) { result = {ok:false, error:String(err.message || err)}; }
  var cb = String(params.callback || '');
  if (cb && /^[a-zA-Z_$][a-zA-Z0-9_$]{0,100}$/.test(cb)) return javascriptResponse(cb + '(' + JSON.stringify(result) + ');');
  return jsonResponse(result);
}
function saveFoundationProfile_(payload) {
  var id = String(payload.requestId || '');
  if (!/^[a-zA-Z0-9_-]{16,80}$/.test(id)) return {ok:false, error:'Nomor permintaan tidak valid.'};
  var cache = CacheService.getScriptCache();
  var lock = LockService.getScriptLock();
  var held = false;
  var result;
  try {
    // Same two existing administrator roles; credentials are verified on the server.
    var allowed = {'Direktur MDD':'0000','Super Admin MDD':'1111'};
    var auth = payload.auth || {};
    if (!Object.prototype.hasOwnProperty.call(allowed, auth.role) || String(auth.password) !== allowed[auth.role]) throw Error('Kata sandi Direktur/Super Admin tidak sesuai.');
    lock.waitLock(15000); held = true;
    var previousReceipt = cache.get('profile:' + id);
    if (previousReceipt) return JSON.parse(previousReceipt);
    var state = foundationProfileRead_();
    if (state.requestId === id) return {ok:true, requestId:id, revision:state.revision};
    if (!Number.isInteger(payload.baseRevision) || payload.baseRevision !== state.revision) {
      result = {ok:false, code:'CONFLICT', requestId:id, error:'Profil sudah berubah di perangkat lain. Muat profil terbaru sebelum menyimpan kembali.'};
    } else {
      var data = payload.data || {};
      var name = String(data.name || '').trim();
      var photo = String(data.photo || '');
      if (!name || name.length > 80) throw Error('Nama Ketua Yayasan wajib diisi, maksimal 80 karakter.');
      if (photo.length > 280000 || (photo && !/^data:image\/(jpeg|png|webp);base64,[a-zA-Z0-9+/=]+$/.test(photo))) throw Error('Foto profil tidak valid atau terlalu besar.');
      var next = {revision:state.revision + 1, requestId:id, updatedAt:new Date().toISOString(), profile:{name:name,photo:photo}};
      var text = JSON.stringify(next);
      var rows = [];
      for (var offset=0; offset<text.length; offset+=40000) rows.push([text.slice(offset,offset+40000)]);
      var ss = getSpreadsheet_();
      var sheet = ss.getSheetByName('ProfilYayasan') || ss.insertSheet('ProfilYayasan');
      var size = Math.max(rows.length, sheet.getLastRow());
      while (rows.length<size) rows.push(['']);
      sheet.getRange(1,1,rows.length,1).setValues(rows);
      SpreadsheetApp.flush();
      result = {ok:true, requestId:id, revision:next.revision};
    }
  } catch(err) {result={ok:false, requestId:id, error:String(err.message || err)};}
  finally {if (held) lock.releaseLock();}
  cache.put('profile:' + id, JSON.stringify(result), 600);
  return result;
}
