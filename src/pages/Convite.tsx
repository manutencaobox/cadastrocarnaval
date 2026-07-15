import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type ConviteInfo = {
  escola_nome: string | null
  escola_slug: string | null
  logo_url: string | null
  cor_primaria: string | null
  cor_secundaria: string | null
  expira_em: string | null
  status: 'valido' | 'expirado' | 'usado' | 'nao_encontrado'
}

// Página de convite de admin: /convite/:token
// O convidado cria a própria conta (e-mail + senha) e entra no painel.
export default function Convite() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()

  const [info, setInfo] = useState<ConviteInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ nome: '', email: '', senha: '', confirma: '' })
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [contaCriada, setContaCriada] = useState(false)

  useEffect(() => {
    async function load() {
      if (!token) { setLoading(false); return }
      const { data } = await supabase.rpc('convite_info', { p_token: token })
      setInfo((data?.[0] ?? { status: 'nao_encontrado' }) as ConviteInfo)
      setLoading(false)
    }
    load()
  }, [token])

  // Aplica cores e título da escola assim que o convite carrega
  useEffect(() => {
    if (!info?.escola_nome) return
    if (info.cor_primaria) document.documentElement.style.setProperty('--cor-primaria', info.cor_primaria)
    if (info.cor_secundaria) document.documentElement.style.setProperty('--cor-secundaria', info.cor_secundaria)
    document.title = `Criar conta — ${info.escola_nome}`
  }, [info])

  const cor1 = info?.cor_primaria ?? 'var(--cor-primaria, #1A1A1A)'
  const cor2 = info?.cor_secundaria ?? 'var(--cor-secundaria, #C9A84C)'

  // Leva ao painel no contexto certo da escola:
  // produção → subdomínio (mangueira.cadastrocarnaval.com.br);
  // localhost/vercel.app → query param ?escola=slug
  function irParaPainel(path: '/admin/dashboard' | '/admin/login') {
    const slug = info?.escola_slug
    const hostname = window.location.hostname
    if (!slug || hostname === 'localhost' || hostname.endsWith('vercel.app')) {
      navigate(`${path}${slug ? `?escola=${slug}` : ''}`)
      return
    }
    const parts = hostname.split('.')
    const base = parts.length >= 4 ? parts.slice(1).join('.') : hostname.replace(/^www\./, '')
    window.location.href = `https://${slug}.${base}${path}`
  }

  async function criarConta(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (form.nome.trim().length < 3) { setErro('Informe seu nome completo.'); return }
    if (form.senha.length < 8) { setErro('A senha precisa ter pelo menos 8 caracteres.'); return }
    if (form.senha !== form.confirma) { setErro('As senhas não conferem.'); return }

    setEnviando(true)
    try {
      const { data: auth, error: se } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.senha,
      })
      if (se || !auth.user) {
        setErro(se?.message?.includes('already') ? 'Este e-mail já possui conta. Faça login.' : 'Não foi possível criar a conta. Tente novamente.')
        setEnviando(false)
        return
      }
      // signUp de e-mail já existente retorna usuário sem identidades
      if (auth.user.identities && auth.user.identities.length === 0) {
        setErro('Este e-mail já possui conta. Faça login em /admin/login.')
        setEnviando(false)
        return
      }

      const { error: re } = await supabase.rpc('aceitar_convite', {
        p_token: token,
        p_nome: form.nome.trim(),
        p_user_id: auth.user.id,
        p_email: form.email.trim(),
      })
      if (re) {
        setErro('Conta criada, mas o convite não pôde ser vinculado: ' + (re.message ?? 'erro desconhecido'))
        setEnviando(false)
        return
      }

      if (auth.session) {
        irParaPainel('/admin/dashboard')
      } else {
        // Projeto com confirmação de e-mail ligada: sem sessão imediata
        setContaCriada(true)
      }
    } catch {
      setErro('Erro inesperado. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  if (loading) {
    return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'system-ui,sans-serif', color:'#888' }}>Carregando convite...</div>
  }

  if (!info || info.status !== 'valido') {
    const msgs: Record<string, string> = {
      usado: 'Este convite já foi utilizado. Se foi você, entre pelo login do painel.',
      expirado: 'Este convite expirou. Peça um novo link ao responsável.',
      nao_encontrado: 'Convite não encontrado. Confira o link recebido.',
    }
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:20, fontFamily:'system-ui,sans-serif', textAlign:'center', background:'#f5f5f5' }}>
        <div style={{ background:'white', borderRadius:12, padding:'36px 32px', maxWidth:420, boxShadow:'0 4px 16px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>✉️</div>
          <h1 style={{ fontSize:20, margin:'0 0 10px' }}>Convite indisponível</h1>
          <p style={{ color:'#888', fontSize:14, lineHeight:1.6 }}>{msgs[info?.status ?? 'nao_encontrado']}</p>
          {info?.status === 'usado' && (
            <button onClick={()=>irParaPainel('/admin/login')} style={{ marginTop:16, background:'#1A1A1A', color:'white', border:'none', borderRadius:8, padding:'11px 22px', fontSize:14, fontWeight:600, cursor:'pointer' }}>Ir para o login</button>
          )}
        </div>
      </div>
    )
  }

  if (contaCriada) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:20, fontFamily:'system-ui,sans-serif', textAlign:'center', background:cor1 }}>
        <div style={{ background:'white', borderRadius:12, padding:'36px 32px', maxWidth:440 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
          <h1 style={{ fontSize:20, margin:'0 0 10px' }}>Conta criada!</h1>
          <p style={{ color:'#666', fontSize:14, lineHeight:1.7 }}>
            Enviamos um e-mail de confirmação para <strong>{form.email}</strong>.
            Confirme e depois entre no painel.
          </p>
          <button onClick={()=>irParaPainel('/admin/login')} style={{ marginTop:16, background:cor1, color:'white', border:'none', borderRadius:8, padding:'12px 24px', fontSize:14, fontWeight:600, cursor:'pointer' }}>Ir para o login</button>
        </div>
      </div>
    )
  }

  const inputStyle: React.CSSProperties = { width:'100%', boxSizing:'border-box', borderRadius:8, border:'1px solid #ddd', padding:'12px 13px', fontSize:15 }
  const labelStyle: React.CSSProperties = { fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#888', display:'block', marginBottom:5 }

  return (
    <div style={{ minHeight:'100vh', background:cor1, display:'flex', alignItems:'center', justifyContent:'center', padding:20, fontFamily:'system-ui,sans-serif' }}>
      <div style={{ width:'100%', maxWidth:440 }}>
        <div style={{ textAlign:'center', marginBottom:22 }}>
          {info.logo_url ? (
            <img src={info.logo_url} alt="" style={{ width:80, height:80, borderRadius:'50%', objectFit:'cover', border:`3px solid ${cor2}` }}/>
          ) : (
            <div style={{ width:80, height:80, borderRadius:'50%', background:cor2, color:cor1, fontWeight:800, fontSize:26, display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
              {(info.escola_nome ?? '?').split(' ').filter(p=>p.length>2).map(p=>p[0]).slice(0,2).join('')}
            </div>
          )}
          <div style={{ color:'rgba(255,255,255,0.75)', fontSize:14, marginTop:16 }}>Você foi convidado(a) para gerenciar</div>
          <div style={{ color:cor2, fontWeight:800, fontSize:18, marginTop:4, lineHeight:1.4 }}>{info.escola_nome}</div>
        </div>

        <form onSubmit={criarConta} style={{ background:'white', borderRadius:12, padding:26, display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ fontWeight:700, fontSize:15 }}>Crie seu acesso</div>
          {erro && <div style={{ background:'#FEE2E2', color:'#991B1B', borderRadius:8, padding:'10px 14px', fontSize:13 }}>{erro}</div>}
          <div>
            <label style={labelStyle}>Nome completo</label>
            <input value={form.nome} onChange={e=>setForm(f=>({...f,nome:e.target.value}))} required style={inputStyle}/>
          </div>
          <div>
            <label style={labelStyle}>E-mail</label>
            <input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} required style={inputStyle}/>
          </div>
          <div>
            <label style={labelStyle}>Senha <span style={{ textTransform:'none', fontWeight:400 }}>(mín. 8 caracteres)</span></label>
            <input type="password" value={form.senha} onChange={e=>setForm(f=>({...f,senha:e.target.value}))} required style={inputStyle}/>
          </div>
          <div>
            <label style={labelStyle}>Confirmar senha</label>
            <input type="password" value={form.confirma} onChange={e=>setForm(f=>({...f,confirma:e.target.value}))} required style={inputStyle}/>
          </div>
          <button type="submit" disabled={enviando} style={{ background:cor1, color:'white', border:'none', borderRadius:9, padding:'13px 20px', fontSize:15, fontWeight:700, cursor:'pointer', opacity: enviando ? 0.7 : 1 }}>
            {enviando ? 'Criando conta...' : 'Criar minha conta'}
          </button>
        </form>

        <div style={{ textAlign:'center', color:'rgba(255,255,255,0.55)', fontSize:12, marginTop:14 }}>
          Link válido até {info.expira_em ? new Date(info.expira_em).toLocaleDateString('pt-BR') : '—'}
        </div>
      </div>
    </div>
  )
}
