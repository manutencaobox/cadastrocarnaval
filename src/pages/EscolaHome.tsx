import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEscola } from '../hooks/useEscola'

// Página inicial do subdomínio da escola
// (ex.: mox.cadastrocarnaval.com.br)
export default function EscolaHome() {
  const { escola, loading, error, corPrimaria, corSecundaria } = useEscola()
  const navigate = useNavigate()
  const [mostrarCampo, setMostrarCampo] = useState(false)
  const [linkTexto, setLinkTexto] = useState('')
  const [erroLink, setErroLink] = useState('')

  function abrirCadastro(e: React.FormEvent) {
    e.preventDefault()
    // Aceita o token puro ou o link completo colado
    const texto = linkTexto.trim()
    const match = texto.match(/cadastro\/([A-Za-z0-9-]+)/)
    const token = match ? match[1] : texto
    if (!token || token.length < 8) {
      setErroLink('Cole o link ou código que você recebeu do seu responsável.')
      return
    }
    navigate(`/cadastro/${token}`)
  }

  if (loading) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'system-ui,sans-serif', color:'#888' }}>
        Carregando...
      </div>
    )
  }

  if (error || !escola) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:20, fontFamily:'system-ui,sans-serif', textAlign:'center' }}>
        <div>
          <h1 style={{ fontSize:22 }}>Escola não encontrada</h1>
          <p style={{ color:'#888', marginTop:8 }}>Verifique o endereço ou fale com o responsável da sua escola.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight:'100vh', background:corPrimaria, display:'flex', alignItems:'center', justifyContent:'center', padding:20, fontFamily:'system-ui,sans-serif' }}>
      <div style={{ width:'100%', maxWidth:440, textAlign:'center' }}>

        {escola.logo_url ? (
          <img src={escola.logo_url} alt={escola.nome} style={{ width:96, height:96, borderRadius:'50%', objectFit:'cover', margin:'0 auto 16px', display:'block', border:`3px solid ${corSecundaria}` }}/>
        ) : (
          <div style={{ width:96, height:96, borderRadius:'50%', background:corSecundaria, color:corPrimaria, fontWeight:800, fontSize:32, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
            {escola.nome.split(' ').map(p=>p[0]).slice(0,2).join('')}
          </div>
        )}

        <div style={{ color:corSecundaria, fontWeight:800, fontSize:14, letterSpacing:'0.14em', textTransform:'uppercase' }}>{escola.nome}</div>
        <h1 style={{ color:'white', fontSize:26, margin:'6px 0 28px' }}>Cadastro de Componentes</h1>

        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <button
            onClick={() => navigate('/admin/login')}
            style={{ background:corSecundaria, color:corPrimaria, border:'none', borderRadius:10, padding:'15px 20px', fontSize:16, fontWeight:700, cursor:'pointer' }}
          >
            Acessar painel
          </button>

          {!mostrarCampo ? (
            <button
              onClick={() => setMostrarCampo(true)}
              style={{ background:'rgba(255,255,255,0.08)', color:'white', border:'1px solid rgba(255,255,255,0.25)', borderRadius:10, padding:'15px 20px', fontSize:16, fontWeight:600, cursor:'pointer' }}
            >
              Já tenho um link de cadastro
            </button>
          ) : (
            <form onSubmit={abrirCadastro} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:10, padding:16, textAlign:'left' }}>
              <label style={{ color:'rgba(255,255,255,0.75)', fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6 }}>
                Cole aqui o link ou código recebido
              </label>
              <input
                value={linkTexto}
                onChange={e => { setLinkTexto(e.target.value); setErroLink('') }}
                placeholder="https://... ou código do link"
                autoFocus
                style={{ width:'100%', boxSizing:'border-box', borderRadius:8, border:'1px solid rgba(255,255,255,0.3)', background:'white', padding:'11px 12px', fontSize:14 }}
              />
              {erroLink && <div style={{ color:'#FCA5A5', fontSize:13, marginTop:8 }}>{erroLink}</div>}
              <button type="submit" style={{ marginTop:10, width:'100%', background:corSecundaria, color:corPrimaria, border:'none', borderRadius:8, padding:'12px 16px', fontSize:15, fontWeight:700, cursor:'pointer' }}>
                Abrir formulário
              </button>
            </form>
          )}
        </div>

        <div style={{ marginTop:32, color:'rgba(255,255,255,0.45)', fontSize:12 }}>
          Powered by <a href="https://www.cadastrocarnaval.com.br" style={{ color:'rgba(255,255,255,0.6)' }}>cadastrocarnaval.com.br</a>
        </div>
      </div>
    </div>
  )
}
