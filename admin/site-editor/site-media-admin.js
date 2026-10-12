(()=>{
  const API='/supabase'; const BUCKET='bouquets';
  const db=window.supabase?.createClient?window.supabase.createClient('/supabase','') : null;
  if(!db)return;
})();
