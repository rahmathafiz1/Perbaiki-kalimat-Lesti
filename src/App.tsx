import React, { useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type AiMode = 'auto' | 'openai' | 'local'
type Msg = { id: string, role: 'user'|'ai', text: string }

function cx(...c: (string|false|undefined)[]) { return c.filter(Boolean).join(' ') }
const gid = () => Math.random().toString(36).slice(2)

export default function App(){
  const [mode, setMode] = useState<AiMode>('auto')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([
    { id: gid(), role: 'ai', text: 'Halo! Kirimkan kalimat Anda, saya akan merapikan ejaan, tanda baca, dan menyusunnya agar lebih sopan. 😊' }
  ])
  const [longer, setLonger] = useState<string | null>(null)
  const canSend = useMemo(()=> input.trim().length>0 && !loading, [input, loading])
  const tailRef = useRef<HTMLDivElement>(null)

  async function askAI(text: string){
    setLoading(true); setLonger(null)
    const userMsg: Msg = { id: gid(), role: 'user', text }
    setMessages(m=>[...m, userMsg])
    setInput('')

    try{
      const res = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, mode })
      })
      if(!res.ok) throw new Error('Gagal menghubungkan AI')
      const data = await res.json()
      const aiMsg: Msg = { id: gid(), role: 'ai', text: data.output || '' }
      setMessages(m=>[...m, aiMsg])
      setTimeout(()=> tailRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }catch(e:any){
      const aiMsg: Msg = { id: gid(), role: 'ai', text: 'Maaf, terjadi kendala jaringan. Coba lagi ya.' }
      setMessages(m=>[...m, aiMsg])
    }finally{
      setLoading(false)
    }
  }

  function makeLonger(base: string){
    const addons = [
      ' Apabila ada hal yang kurang jelas, silakan sampaikan agar dapat Dede bantu jelaskan.',
      ' Proses ini mengikuti ketentuan yang berlaku demi kenyamanan dan keamanan bersama.',
      ' Mohon tidak ragu untuk bertanya bila membutuhkan pendampingan lebih lanjut.',
      ' Data akan kami jaga kerahasiaannya sesuai kebijakan privasi yang berlaku.'
    ]
    let out = base.trim()
    for(const a of addons){ if((out + a).length <= 500) out += a }
    setLonger(out.slice(0,500))
  }

  return (
    <div className="min-h-screen px-4 py-8 md:py-12">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl shadow-soft border border-white/10 bg-white/10 backdrop-blur-md p-6 text-white"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">AI Editor Kalimat</h1>
              <p className="text-white/80 text-sm md:text-base">Rapi, sopan, dan enak dibaca—langsung dari ponsel Anda.</p>
            </div>
            <select
              value={mode} onChange={e=>setMode(e.target.value as any)}
              className="bg-white/90 text-slate-900 rounded-2xl px-3 py-2 text-sm"
            >
              <option value="auto">Auto</option>
              <option value="openai">OpenAI</option>
              <option value="local">Lokal</option>
            </select>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
            <textarea
              value={input} onChange={e=>setInput(e.target.value)}
              placeholder="Tulis kalimat di sini…"
              className="min-h-[110px] rounded-2xl border border-white/10 bg-white/20 text-white placeholder:text-white/60 p-4 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
            <button
              onClick={()=>askAI(input)} disabled={!canSend}
              className={cx('rounded-2xl px-5 py-3 font-semibold shadow-soft transition',
                canSend ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-900' : 'bg-white/30 text-white/60 cursor-not-allowed')}
            >
              {loading ? 'Memproses…' : 'Kirim ke AI ✨'}
            </button>
          </div>

          <div className="mt-6 h-[46vh] md:h-[50vh] overflow-y-auto pr-1 space-y-3" id="chat">
            <AnimatePresence initial={false}>
              {messages.map(m => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className={cx('max-w-[92%] md:max-w-[80%] rounded-2xl px-4 py-3',
                    m.role==='user'
                      ? 'ml-auto bg-cyan-400/90 text-slate-900'
                      : 'bg-white/80 text-slate-900 border border-white/60'
                  )}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>

                  {m.role==='ai' && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={()=>navigator.clipboard.writeText(m.text)}
                        className="text-xs px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-black"
                      >
                        Salin
                      </button>
                      <button
                        onClick={()=>makeLonger(m.text)}
                        className="text-xs px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-black"
                      >
                        Panjangkan (≤500)
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {loading && (
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <span className="inline-block w-2 h-2 rounded-full bg-white/70 animate-pulse"></span>
                AI sedang menulis…
              </div>
            )}
            <div ref={React.useRef<HTMLDivElement>(null)} />
          </div>

          <p className="mt-5 text-xs text-white/70">Tips: Tambahkan variabel lingkungan <b>OPENAI_API_KEY</b> di Vercel agar mode <b>Auto/OpenAI</b> aktif. Tanpa itu, aplikasi tetap berjalan dengan mode <b>Lokal</b>.</p>
        </motion.div>
      </div>
    </div>
  )
}
