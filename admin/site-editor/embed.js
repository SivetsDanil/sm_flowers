/* Safe site-editor embed. Loaded by the existing admin without touching Orders. */
(() => {
  if (window.SMFlowersBlockEditor) return;
  const blocks = [
    ['home','🏠 Главная',true], ['studio','🌿 О студии',false],
    ['collections','🌸 Коллекции',true], ['bouquets','💐 Букеты',true],
    ['life','📸 Жизнь студии',true], ['philosophy','✨ Красота в деталях',false],
    ['contacts','📍 Студия / Контакты',false]
  ];
  const sectionNames = Object.fromEntries(blocks.map(([id,n])=>[id,n.replace(/^\S+\s/,'')]));
  sectionNames.philosophy='Философия';
  function mount(root, supabase) {
    if (!root || root.dataset.mounted) return;
    root.dataset.mounted='1';
    root.innerHTML=`<div class="smbe-head"><div><h2>Редактор сайта</h2><p>Каждый блок открывается отдельно. Раздел «Заказы» здесь не изменяется.</p></div></div><div class="smbe-grid">${blocks.map(([id,n])=>`<button type="button" class="smbe-tab" data-b="${id}">${n}</button>`).join('')}</div><div class="smbe-panel" id="smbe-panel"></div>`;
    const panel=root.querySelector('#smbe-panel');
    async function load(id){
      const section=sectionNames[id];
      panel.innerHTML='<p>Загрузка…</p>';
      const [t,m]=await Promise.all([supabase.from('site_content').select('*').eq('section',section).order('sort_order').order('id'),supabase.from('site_media').select('*').eq('section',section).order('sort_order').order('id')]);
      if(t.error||m.error){panel.innerHTML='<p class="smbe-error">Не удалось загрузить блок.</p>';return;}
      panel.innerHTML=`<h3>${id==='philosophy'?'Красота в деталях':section}</h3><div><h4>Тексты</h4>${(t.data||[]).map(x=>`<div class="smbe-item"><label>${x.label||x.content_key}</label><textarea data-t="${x.id}">${x.content||''}</textarea><div><label class="smbe-check"><input type="checkbox" data-tv="${x.id}" ${x.is_visible!==false?'checked':''}> Показывать</label><button type="button" data-save-t="${x.id}">Сохранить</button><button type="button" class="smbe-danger" data-del-t="${x.id}">Удалить</button></div></div>`).join('')||'<p>Текстов пока нет.</p>'}</div>${(m.data||[]).length?`<div><h4>Фотографии</h4>${m.data.map(x=>`<div class="smbe-item"><strong>${x.label||x.slot_key}</strong><img class="smbe-preview" src="${x.image_url||''}" loading="lazy"><input type="file" accept="image/jpeg,image/png,image/webp" data-file="${x.id}"><input placeholder="Alt-текст" value="${x.alt_text||''}" data-alt="${x.id}"><label class="smbe-check"><input type="checkbox" data-mv="${x.id}" ${x.is_visible!==false?'checked':''}> Показывать</label><button type="button" data-save-m="${x.id}">Сохранить фото</button></div>`).join('')}</div>`:''}`;
      panel.querySelectorAll('[data-save-t]').forEach(b=>b.onclick=async()=>{const id=b.dataset.saveT,c=panel.querySelector(`[data-t="${id}"]`).value,v=panel.querySelector(`[data-tv="${id}"]`).checked;const r=await supabase.from('site_content').update({content:c,is_visible:v,updated_at:new Date().toISOString()}).eq('id',id);if(r.error)alert(r.error.message);else load(id)});
      panel.querySelectorAll('[data-del-t]').forEach(b=>b.onclick=async()=>{if(!confirm('Удалить этот текст?'))return;const r=await supabase.from('site_content').delete().eq('id',b.dataset.delT);if(r.error)alert(r.error.message);else load(id)});
      panel.querySelectorAll('[data-save-m]').forEach(b=>b.onclick=async()=>{const mid=b.dataset.saveM,f=panel.querySelector(`[data-file="${mid}"]`).files[0],alt=panel.querySelector(`[data-alt="${mid}"]`).value,v=panel.querySelector(`[data-mv="${mid}"]`).checked,patch={alt_text:alt,is_visible:v,updated_at:new Date().toISOString()};if(f){const ext=(f.name.split('.').pop()||'jpg').toLowerCase(),path=`site-media/${crypto.randomUUID()}.${ext}`,u=await supabase.storage.from('bouquets').upload(path,f,{upsert:false,contentType:f.type});if(u.error){alert(u.error.message);return}patch.image_url=supabase.storage.from('bouquets').getPublicUrl(path).data.publicUrl}const r=await supabase.from('site_media').update(patch).eq('id',mid);if(r.error)alert(r.error.message);else load(id)});
    }
    root.querySelectorAll('[data-b]').forEach(b=>b.onclick=()=>{root.querySelectorAll('[data-b]').forEach(x=>x.classList.remove('active'));b.classList.add('active');load(b.dataset.b)});
    root.querySelector('[data-b="home"]').click();
  }
  window.SMFlowersBlockEditor={mount,blocks};
})();