export const config = { runtime: 'edge' };

function heuristicRewrite(text){
  let t = String(text||'').trim();
  if(!t) return '';

  const reps = [
    [/\bdedek\b/gi, 'Dede'],
    [/\bdedeknya\b/gi, 'Dede'],
    [/\bdedekku\b/gi, 'Dede'],
    [/\bkmu\b/gi, 'Anda'],
    [/\bkamu\b/gi, 'Anda'],
    [/\baku\b/gi, 'saya'],
    [/\bgak\b/gi, 'tidak'],
    [/\bnggak\b/gi, 'tidak'],
    [/\bga\b/gi, 'tidak'],
    [/\btdk\b/gi, 'tidak'],
    [/\bpls\b/gi, 'mohon'],
    [/\bplis\b/gi, 'mohon'],
    [/\btolo?ng\b/gi, 'mohon'],
    [/\bdr\b/gi, 'dari'],
    [/\bsdh\b/gi, 'sudah'],
    [/\bblm\b/gi, 'belum'],
    [/\bjd\b/gi, 'jadi'],
    [/\bsy\b/gi, 'saya'],
    [/\bmksh\b/gi, 'terima kasih'],
    [/\bmakasih\b/gi, 'terima kasih'],
    [/\bbgt\b/gi, 'sekali'],
    [/\bmas\b/gi, 'Kak'],
    [/\bmbak\b/gi, 'Kak'],
  ];
  for(const [re,rep] of reps){ t = t.replace(re, rep); }

  t = t.replace(/\s+/g,' ').replace(/\s*([.,!?;:])\s*/g,'$1 ').trim();
  t = t.replace(/([^.!?\n])\s*$/g, '$1.');
  t = t.replace(/(^|[.!?]\s+)([a-zà-ÿ])/g, (m,p1,p2)=> p1 + p2.toUpperCase());
  if(!/terima kasih/i.test(t)) t += ' Terima kasih atas perhatian dan kerja samanya.';
  t = t.replace(/\bAnda\b/g, 'Kak');
  return t;
}

export default async function handler(req){
  if(req.method !== 'POST') return new Response(JSON.stringify({ error: 'POST only' }), { status: 405 });
  const { text, mode = 'auto' } = await req.json();
  const apiKey = process.env.OPENAI_API_KEY;

  if(mode === 'local' || !apiKey){
    const output = heuristicRewrite(text);
    return new Response(JSON.stringify({ output, source: 'local' }), { headers: { 'content-type': 'application/json' } });
  }

  try{
    const prompt = `Perbaiki kalimat bahasa Indonesia berikut: rapikan tanda baca, ejaan, dan buat nada sopan profesional (gunakan sapaan "Kak" bila relevan). Jaga makna asli. Teks: """${text}"""`;
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Anda adalah asisten yang merapikan bahasa Indonesia secara sopan dan profesional.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3
      })
    });
    if(!r.ok){
      const txt = await r.text();
      throw new Error(txt);
    }
    const data = await r.json();
    const output = data.choices?.[0]?.message?.content ?? heuristicRewrite(text);
    return new Response(JSON.stringify({ output, source: 'openai' }), { headers: { 'content-type': 'application/json' } });
  }catch(e){
    const output = heuristicRewrite(text);
    return new Response(JSON.stringify({ output, source: 'fallback', error: String(e) }), { headers: { 'content-type': 'application/json' } });
  }
}
