import { useEffect, useState, useCallback } from 'react'
import { Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Escola, Funcao, UsuarioAdmin } from '../lib/types'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

// ─── ESTILOS ─────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: 'white', borderRadius: 12,
  boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden'
}
const th: React.CSSProperties = {
  padding: '11px 16px', textAlign: 'left', fontSize: 11,
  fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
  color: '#888', background: '#f8f8f8', borderBottom: '1px solid #eee'
}
const td: React.CSSProperties = {
  padding: '13px 16px', fontSize: 14, color: '#333',
  borderBottom: '1px solid #f0f0f0'
}
const btn = (bg: string, color = 'white'): React.CSSProperties => ({
  background: bg, color, border: 'none', borderRadius: 8,
  padding: '8px 14px', fontSize: 13, fontWeight: 600,
  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
  fontFamily: 'inherit'
})
const inp: React.CSSProperties = {
  border: '1px solid #ddd', borderRadius: 8, padding: '9px 13px',
  fontSize: 14, outline: 'none', fontFamily: 'inherit', width: '100%',
  background: 'white'
}
const badge = (color: string, bg: string): React.CSSProperties => ({
  display: 'inline-block', padding: '3px 10px', borderRadius: 20,
  fontSize: 11, fontWeight: 700, color, background: bg,
  textTransform: 'uppercase', letterSpacing: '0.04em'
})
const CORES = ['#C9A84C', '#CC0000', '#1A1A1A', '#4C9AC9', '#4CC97A', '#C94C4C']

// ─── HOOK DE AUTH ────────────────────────────────────────────

function useSuperAdminAuth() {
  const [usuario, setUsuario] = useState<UsuarioAdmin | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setLoading(false); return }

      const { data } = await supabase
        .from('usuarios_admin')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('perfil', 'desenvolvedor')
        .eq('ativo', true)
        .single()

      setUsuario(data ?? null)
      setLoading(false)
    }
    load()
  }, [])

  return { usuario, loading }
}

// ─── LAYOUT ──────────────────────────────────────────────────

function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()

  async function sair() {
    await supabase.auth.signOut()
    navigate('/superadmin/login')
  }

  const navItems = [
    { to: '/superadmin/visao-geral', label: 'Visão Geral',    ico: '🏠' },
    { to: '/superadmin/escolas',     label: 'Escolas',        ico: '🎭' },
    { to: '/superadmin/funcoes',     label: 'Funções',        ico: '🎪' },
    { to: '/superadmin/planos',      label: 'Planos',         ico: '💳' },
    { to: '/superadmin/analytics',   label: 'Analytics',      ico: '📊' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui,sans-serif' }}>
      {/* SIDEBAR */}
      <nav style={{ width: 220, background: '#1A1A1A', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ color: '#C9A84C', fontWeight: 800, fontSize: 16, letterSpacing: '-0.01em' }}>CadastroCarnaval</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 3 }}>🔧 Super Admin</div>
        </div>

        <div style={{ flex: 1, padding: '12px 0' }}>
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '11px 16px', textDecoration: 'none',
                color: isActive ? 'white' : 'rgba(255,255,255,0.55)',
                background: isActive ? 'rgba(201,168,76,0.15)' : 'transparent',
                borderLeft: isActive ? '3px solid #C9A84C' : '3px solid transparent',
                fontSize: 14, fontWeight: 500, transition: 'all 0.15s'
              })}>
              {item.ico} {item.label}
            </NavLink>
          ))}
        </div>

        <div style={{ padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={sair} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', color: 'rgba(255,255,255,0.55)', fontSize: 14 }}>
            🚪 Sair
          </button>
        </div>
      </nav>

      {/* CONTEÚDO */}
      <main style={{ flex: 1, background: '#f5f5f5', overflow: 'auto' }}>
        <div style={{ background: 'white', borderBottom: '1px solid #eee', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Plataforma CadastroCarnaval</span>
          <span style={{ fontSize: 12, color: '#aaa' }}>Super Admin</span>
        </div>
        <div style={{ padding: 28 }}>{children}</div>
      </main>
    </div>
  )
}

// ─── VISÃO GERAL ─────────────────────────────────────────────

function VisaoGeral() {
  const [stats, setStats] = useState({
    totalEscolas: 0, emTrial: 0, pagas: 0, pausadas: 0,
    totalCadastros: 0, cadastros24h: 0, totalCpfs: 0
  })
  const [expirando, setExpirando] = useState<Escola[]>([])
  const [aguardando, setAguardando] = useState<Escola[]>([])
  const [ultimasEscolas, setUltimasEscolas] = useState<Escola[]>([])

  useEffect(() => {
    async function load() {
      const [
        { count: total },
        { count: trial },
        { count: pagas },
        { count: pausadas },
        { count: totalCad },
        { count: cad24h },
        { count: totalCpfs },
        { data: exp },
        { data: agu },
        { data: ult },
      ] = await Promise.all([
        supabase.from('escolas').select('*', { count: 'exact', head: true }),
        supabase.from('escolas').select('*', { count: 'exact', head: true }).eq('plano', 'trial').eq('ativo', true),
        supabase.from('escolas').select('*', { count: 'exact', head: true }).neq('plano', 'trial').eq('ativo', true),
        supabase.from('escolas').select('*', { count: 'exact', head: true }).eq('ativo', false),
        supabase.from('cadastros').select('*', { count: 'exact', head: true }),
        supabase.from('cadastros').select('*', { count: 'exact', head: true }).gte('criado_em', new Date(Date.now() - 86400000).toISOString()),
        supabase.from('cpfs_autorizados').select('*', { count: 'exact', head: true }),
        supabase.from('escolas').select('*').eq('plano', 'trial').eq('ativo', true).lt('trial_fim', new Date(Date.now() + 7 * 86400000).toISOString()).order('trial_fim'),
        supabase.from('escolas').select('*').eq('status', 'aguardando').order('criado_em'),
        supabase.from('escolas').select('*').order('criado_em', { ascending: false }).limit(5),
      ])

      setStats({
        totalEscolas: total ?? 0, emTrial: trial ?? 0, pagas: pagas ?? 0, pausadas: pausadas ?? 0,
        totalCadastros: totalCad ?? 0, cadastros24h: cad24h ?? 0, totalCpfs: totalCpfs ?? 0
      })
      setExpirando((exp ?? []) as Escola[])
      setAguardando((agu ?? []) as Escola[])
      setUltimasEscolas((ult ?? []) as Escola[])
    }
    load()
  }, [])

  return (
    <div>
      <h2 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 700 }}>Visão Geral da Plataforma</h2>

      {/* Alertas */}
      {aguardando.length > 0 && (
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '12px 18px', marginBottom: 16, fontSize: 14, color: '#1E40AF' }}>
          📋 <strong>{aguardando.length} escola(s)</strong> aguardando aprovação da estrutura:
          {aguardando.map(e => <span key={e.id} style={{ marginLeft: 8, fontWeight: 600 }}>{e.nome}</span>)}
        </div>
      )}
      {expirando.length > 0 && (
        <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '12px 18px', marginBottom: 20, fontSize: 14, color: '#991B1B' }}>
          ⚠️ <strong>{expirando.length} escola(s)</strong> com trial expirando em 7 dias:
          {expirando.map(e => <span key={e.id} style={{ marginLeft: 8, fontWeight: 600 }}>{e.nome} ({Math.max(0, Math.ceil((new Date(e.trial_fim).getTime() - Date.now()) / 86400000))}d)</span>)}
        </div>
      )}

      {/* Métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total de escolas', value: stats.totalEscolas },
          { label: 'Em trial', value: stats.emTrial },
          { label: 'Planos pagos', value: stats.pagas },
          { label: 'Pausadas', value: stats.pausadas },
          { label: 'Total de cadastros', value: stats.totalCadastros },
          { label: 'Cadastros 24h', value: stats.cadastros24h },
          { label: 'CPFs autorizados', value: stats.totalCpfs },
        ].map(m => (
          <div key={m.label} style={{ ...card, padding: 20 }}>
            <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{m.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#1a1a1a' }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Últimas escolas */}
      <div style={card}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0', fontWeight: 600, fontSize: 15 }}>Escolas recentes</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            <th style={th}>Escola</th><th style={th}>Plano</th><th style={th}>Status</th><th style={th}>Criada em</th>
          </tr></thead>
          <tbody>
            {ultimasEscolas.map(e => (
              <tr key={e.id}>
                <td style={td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: e.cor_primaria, display: 'flex', alignItems: 'center', justifyContent: 'center', color: e.cor_secundaria, fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                      {e.nome.split(' ').filter(w => w.length > 2).slice(0, 2).map(w => w[0]).join('')}
                    </div>
                    <span style={{ fontWeight: 500 }}>{e.nome}</span>
                  </div>
                </td>
                <td style={td}><span style={badge(e.plano === 'trial' ? '#92400E' : e.plano === 'premium' ? '#065F46' : '#1E40AF', e.plano === 'trial' ? '#FEF3C7' : e.plano === 'premium' ? '#D1FAE5' : '#DBEAFE')}>{e.plano}</span></td>
                <td style={td}><span style={badge(e.status === 'ativa' ? '#065F46' : e.status === 'aguardando' ? '#92400E' : '#666', e.status === 'ativa' ? '#D1FAE5' : e.status === 'aguardando' ? '#FEF3C7' : '#f0f0f0')}>{e.status}</span></td>
                <td style={{ ...td, fontSize: 12, color: '#aaa' }}>{new Date(e.criado_em).toLocaleDateString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── GESTÃO DE ESCOLAS ────────────────────────────────────────

function GestaoEscolas() {
  const [escolas, setEscolas] = useState<Escola[]>([])
  const [selecionada, setSelecionada] = useState<Escola | null>(null)
  const [criando, setCriando] = useState(false)
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroPlano, setFiltroPlano] = useState('')
  const [form, setForm] = useState({
    nome: '', slug: '', cor_primaria: '#CC0000', cor_secundaria: '#C9A84C',
    adminNome: '', adminEmail: '', adminSenha: ''
  })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    let q = supabase.from('escolas').select('*').order('criado_em', { ascending: false })
    if (filtroStatus) q = q.eq('status', filtroStatus)
    if (filtroPlano) q = q.eq('plano', filtroPlano)
    const { data } = await q
    setEscolas((data ?? []) as Escola[])
  }, [filtroStatus, filtroPlano])

  useEffect(() => { load() }, [load])

  async function criarEscola() {
    if (!form.nome || !form.slug || !form.adminEmail || !form.adminSenha) return alert('Preencha todos os campos obrigatórios.')
    setSaving(true)
    try {
      // Cria escola
      const { data: escola, error: ee } = await supabase.from('escolas').insert({
        slug: form.slug.toLowerCase().replace(/\s/g, '-'),
        nome: form.nome, cor_primaria: form.cor_primaria, cor_secundaria: form.cor_secundaria,
        plano: 'trial', status: 'configuracao'
      }).select().single()
      if (ee || !escola) throw ee

      // Cria usuário Auth
      const { data: auth, error: ae } = await supabase.auth.admin.createUser({
        email: form.adminEmail, password: form.adminSenha
      })
      if (ae || !auth.user) throw ae

      // Cria admin master
      await supabase.from('usuarios_admin').insert({
        user_id: auth.user.id, escola_id: escola.id,
        nome: form.adminNome, email: form.adminEmail,
        perfil: 'administrador', setor_tipo: 'todos'
      })

      setForm({ nome:'', slug:'', cor_primaria:'#CC0000', cor_secundaria:'#C9A84C', adminNome:'', adminEmail:'', adminSenha:'' })
      setCriando(false)
      load()
    } catch (e: any) {
      alert('Erro ao criar escola: ' + (e?.message ?? e))
    } finally {
      setSaving(false)
    }
  }

  async function ativar(escola: Escola) {
    await supabase.from('escolas').update({ status: 'ativa', ativo: true }).eq('id', escola.id)
    load()
  }

  async function pausar(escola: Escola) {
    if (!confirm(`Pausar "${escola.nome}"? Os admins não conseguirão acessar.`)) return
    await supabase.from('escolas').update({ ativo: false, status: 'pausada' }).eq('id', escola.id)
    load()
  }

  async function reativar(escola: Escola) {
    await supabase.from('escolas').update({ ativo: true, status: 'ativa' }).eq('id', escola.id)
    load()
  }

  async function extenderTrial(escola: Escola) {
    const dias = prompt('Quantos dias adicionais?', '30')
    if (!dias || isNaN(Number(dias))) return
    const novaData = new Date(Math.max(new Date(escola.trial_fim).getTime(), Date.now()) + Number(dias) * 86400000)
    await supabase.from('escolas').update({ trial_fim: novaData.toISOString() }).eq('id', escola.id)
    load()
  }

  async function mudarPlano(escola: Escola) {
    const plano = prompt('Novo plano (trial/basico/premium):', escola.plano)
    if (!plano || !['trial', 'basico', 'premium'].includes(plano)) return
    await supabase.from('escolas').update({ plano }).eq('id', escola.id)
    load()
  }

  async function excluir(escola: Escola) {
    if (!confirm(`Excluir "${escola.nome}" PERMANENTEMENTE?\nTodos os dados serão perdidos.`)) return
    if (!confirm('Tem certeza? Esta ação é IRREVERSÍVEL.')) return
    await supabase.from('escolas').delete().eq('id', escola.id)
    setSelecionada(null)
    load()
  }

  const statusCor = (s: string) => ({
    configuracao: badge('#1E40AF', '#DBEAFE'),
    aguardando:   badge('#92400E', '#FEF3C7'),
    ativa:        badge('#065F46', '#D1FAE5'),
    pausada:      badge('#666',    '#f0f0f0'),
  }[s] ?? badge('#666', '#f0f0f0'))

  const planoCor = (p: string) => ({
    trial:   badge('#92400E', '#FEF3C7'),
    basico:  badge('#1E40AF', '#DBEAFE'),
    premium: badge('#065F46', '#D1FAE5'),
  }[p] ?? badge('#666', '#f0f0f0'))

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Escolas cadastradas</h2>
        <button onClick={() => setCriando(true)} style={btn('#1A1A1A')}>+ Nova escola</button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} style={{ ...inp, width: 'auto' }}>
          <option value="">Todos os status</option>
          <option value="configuracao">Em configuração</option>
          <option value="aguardando">Aguardando</option>
          <option value="ativa">Ativa</option>
          <option value="pausada">Pausada</option>
        </select>
        <select value={filtroPlano} onChange={e => setFiltroPlano(e.target.value)} style={{ ...inp, width: 'auto' }}>
          <option value="">Todos os planos</option>
          <option value="trial">Trial</option>
          <option value="basico">Básico</option>
          <option value="premium">Premium</option>
        </select>
      </div>

      {/* FORM NOVA ESCOLA */}
      {criando && (
        <div style={{ ...card, padding: 28, marginBottom: 24, border: '2px solid #C9A84C' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 17 }}>Nova escola</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div><Label>Nome da escola *</Label><input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="GRES..." style={inp}/></div>
            <div><Label>Slug (URL) *</Label><input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s/g,'-') }))} placeholder="gres-nome" style={{ ...inp, fontFamily: 'monospace' }}/></div>
            <div>
              <Label>Cor primária</Label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="color" value={form.cor_primaria} onChange={e => setForm(f => ({ ...f, cor_primaria: e.target.value }))} style={{ width: 44, height: 38, border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer' }}/>
                <input value={form.cor_primaria} onChange={e => setForm(f => ({ ...f, cor_primaria: e.target.value }))} style={{ ...inp, fontFamily: 'monospace' }}/>
              </div>
            </div>
            <div>
              <Label>Cor secundária</Label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="color" value={form.cor_secundaria} onChange={e => setForm(f => ({ ...f, cor_secundaria: e.target.value }))} style={{ width: 44, height: 38, border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer' }}/>
                <input value={form.cor_secundaria} onChange={e => setForm(f => ({ ...f, cor_secundaria: e.target.value }))} style={{ ...inp, fontFamily: 'monospace' }}/>
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: '#f0f0f0', margin: '8px 0 16px' }}/>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#aaa', marginBottom: 12 }}>Admin master da escola</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 20 }}>
            <div><Label>Nome *</Label><input value={form.adminNome} onChange={e => setForm(f => ({ ...f, adminNome: e.target.value }))} style={inp}/></div>
            <div><Label>E-mail *</Label><input type="email" value={form.adminEmail} onChange={e => setForm(f => ({ ...f, adminEmail: e.target.value }))} style={inp}/></div>
            <div><Label>Senha temporária *</Label><input type="password" value={form.adminSenha} onChange={e => setForm(f => ({ ...f, adminSenha: e.target.value }))} style={inp}/></div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={criarEscola} disabled={saving} style={btn('#1A1A1A')}>
              {saving ? 'Criando...' : '🎭 Criar escola'}
            </button>
            <button onClick={() => setCriando(false)} style={btn('#f0f0f0', '#666')}>Cancelar</button>
          </div>
        </div>
      )}

      {/* TABELA */}
      <div style={card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            <th style={th}>Escola</th>
            <th style={th}>Slug</th>
            <th style={th}>Plano</th>
            <th style={th}>Status</th>
            <th style={th}>Trial até</th>
            <th style={th}>Ações</th>
          </tr></thead>
          <tbody>
            {escolas.length === 0 && (
              <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: '#aaa', padding: 40 }}>Nenhuma escola encontrada.</td></tr>
            )}
            {escolas.map(e => (
              <tr key={e.id}>
                <td style={td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: e.cor_primaria, display: 'flex', alignItems: 'center', justifyContent: 'center', color: e.cor_secundaria, fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
                      {e.nome.split(' ').filter(w => w.length > 2).slice(0, 2).map(w => w[0]).join('')}
                    </div>
                    <span style={{ fontWeight: 500 }}>{e.nome}</span>
                  </div>
                </td>
                <td style={{ ...td, fontFamily: 'monospace', fontSize: 12, color: '#888' }}>{e.slug}</td>
                <td style={td}><span style={planoCor(e.plano)}>{e.plano}</span></td>
                <td style={td}><span style={statusCor(e.status)}>{e.status}</span></td>
                <td style={{ ...td, fontSize: 12, color: e.plano === 'trial' && new Date(e.trial_fim) < new Date(Date.now() + 7*86400000) ? '#e53e3e' : '#aaa' }}>
                  {e.plano === 'trial' ? new Date(e.trial_fim).toLocaleDateString('pt-BR') : '—'}
                </td>
                <td style={td}>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    <button onClick={() => setSelecionada(e)} style={btn('#f0f0f0', '#444')}>🔍</button>
                    {e.status === 'aguardando' && (
                      <button onClick={() => ativar(e)} style={btn('#D1FAE5', '#065F46')}>✅ Ativar</button>
                    )}
                    {e.plano === 'trial' && (
                      <button onClick={() => extenderTrial(e)} style={btn('#FEF3C7', '#92400E')}>+dias</button>
                    )}
                    <button onClick={() => mudarPlano(e)} style={btn('#DBEAFE', '#1E40AF')}>plano</button>
                    {e.ativo
                      ? <button onClick={() => pausar(e)} style={btn('#FEE2E2', '#991B1B')}>⏸️</button>
                      : <button onClick={() => reativar(e)} style={btn('#D1FAE5', '#065F46')}>▶️</button>
                    }
                    <button onClick={() => excluir(e)} style={btn('#1a1a1a')}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL DETALHE ESCOLA */}
      {selecionada && <DetalheEscola escola={selecionada} onClose={() => { setSelecionada(null); load() }}/>}
    </div>
  )
}

// ─── DETALHE DA ESCOLA ───────────────────────────────────────

function DetalheEscola({ escola, onClose }: { escola: Escola; onClose: () => void }) {
  const [admins, setAdmins] = useState<UsuarioAdmin[]>([])
  const [stats, setStats] = useState({ cadastros: 0, cpfs: 0, posicionamentos: 0, links: 0 })

  useEffect(() => {
    async function load() {
      const [{ data: adms }, { count: cad }, { count: cpf }, { count: pos }, { count: lnk }] = await Promise.all([
        supabase.from('usuarios_admin').select('*').eq('escola_id', escola.id),
        supabase.from('cadastros').select('*', { count: 'exact', head: true }).eq('escola_id', escola.id),
        supabase.from('cpfs_autorizados').select('*', { count: 'exact', head: true }).eq('escola_id', escola.id),
        supabase.from('posicionamentos').select('*', { count: 'exact', head: true }).eq('escola_id', escola.id),
        supabase.from('links_cadastro').select('*', { count: 'exact', head: true }).eq('escola_id', escola.id),
      ])
      setAdmins((adms ?? []) as UsuarioAdmin[])
      setStats({ cadastros: cad ?? 0, cpfs: cpf ?? 0, posicionamentos: pos ?? 0, links: lnk ?? 0 })
    }
    load()
  }, [escola.id])

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', zIndex: 200 }}>
      <div style={{ background: 'white', width: 440, height: '100vh', overflow: 'auto', boxShadow: '-4px 0 20px rgba(0,0,0,0.15)' }}>
        <div style={{ background: escola.cor_primaria, padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>{escola.nome}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Cadastros', value: stats.cadastros },
              { label: 'CPFs autorizados', value: stats.cpfs },
              { label: 'Posicionamentos', value: stats.posicionamentos },
              { label: 'Links gerados', value: stats.links },
            ].map(m => (
              <div key={m.label} style={{ background: '#f8f8f8', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{m.label}</div>
                <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* Dados */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#aaa', marginBottom: 10 }}>Dados da escola</div>
            {[
              { label: 'Slug', val: escola.slug },
              { label: 'Plano', val: escola.plano },
              { label: 'Status', val: escola.status },
              { label: 'Trial até', val: new Date(escola.trial_fim).toLocaleDateString('pt-BR') },
              { label: 'Criada em', val: new Date(escola.criado_em).toLocaleDateString('pt-BR') },
            ].map(({ label, val }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5', fontSize: 14 }}>
                <span style={{ color: '#aaa' }}>{label}</span>
                <span style={{ fontWeight: 500 }}>{val}</span>
              </div>
            ))}
          </div>

          {/* Cores */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#aaa', marginBottom: 10 }}>Identidade visual</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: escola.cor_primaria, border: '1px solid #eee' }}/>
                {escola.cor_primaria}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: escola.cor_secundaria, border: '1px solid #eee' }}/>
                {escola.cor_secundaria}
              </div>
            </div>
          </div>

          {/* Admins */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#aaa', marginBottom: 10 }}>Usuários admin ({admins.length})</div>
            {admins.map(a => (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#f8f8f8', borderRadius: 8, marginBottom: 6, fontSize: 13 }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{a.nome}</div>
                  <div style={{ color: '#aaa', fontSize: 12 }}>{a.email}</div>
                </div>
                <span style={badge(a.perfil === 'administrador' ? '#1E40AF' : '#666', a.perfil === 'administrador' ? '#DBEAFE' : '#f0f0f0')}>{a.perfil}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── GESTÃO DE FUNÇÕES ────────────────────────────────────────

function GestaoFuncoes() {
  const [funcoes, setFuncoes] = useState<Funcao[]>([])
  const [criando, setCriando] = useState(false)
  const [form, setForm] = useState({ nome: '', categoria: 'ala' })

  const CATEGORIAS = [
    { val: 'ala', label: '📍 Ala' },
    { val: 'alegoria', label: '🎭 Alegoria' },
    { val: 'bateria', label: '🥁 Bateria' },
    { val: 'carro_som', label: '🎤 Carro de Som' },
    { val: 'comissao', label: '⭐ Comissão de Frente' },
    { val: 'geral', label: '🏫 Geral' },
  ]

  const load = useCallback(async () => {
    const { data } = await supabase.from('funcoes').select('*').order('ordem')
    setFuncoes((data ?? []) as Funcao[])
  }, [])

  useEffect(() => { load() }, [load])

  async function criar() {
    if (!form.nome) return
    const maxOrdem = Math.max(...funcoes.map(f => f.ordem), 0)
    await supabase.from('funcoes').insert({ nome: form.nome, categoria: form.categoria, ordem: maxOrdem + 1 })
    setForm({ nome: '', categoria: 'ala' })
    setCriando(false)
    load()
  }

  async function toggleAtivo(f: Funcao) {
    await supabase.from('funcoes').update({ ativo: !f.ativo }).eq('id', f.id)
    load()
  }

  async function renomear(f: Funcao) {
    const novo = prompt('Novo nome:', f.nome)
    if (!novo || novo === f.nome) return
    await supabase.from('funcoes').update({ nome: novo }).eq('id', f.id)
    load()
  }

  async function remover(f: Funcao) {
    const { count } = await supabase.from('cadastros').select('*', { count: 'exact', head: true }).eq('funcao_id', f.id)
    if ((count ?? 0) > 0) return alert(`Esta função tem ${count} cadastro(s) e não pode ser removida.`)
    if (!confirm(`Remover a função "${f.nome}" permanentemente?`)) return
    await supabase.from('funcoes').delete().eq('id', f.id)
    load()
  }

  const grupos = CATEGORIAS.map(cat => ({
    ...cat,
    funcoes: funcoes.filter(f => f.categoria === cat.val)
  })).filter(g => g.funcoes.length > 0 || true)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Funções do sistema</h2>
        <button onClick={() => setCriando(true)} style={btn('#1A1A1A')}>+ Nova função</button>
      </div>

      <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 10, padding: '12px 18px', marginBottom: 20, fontSize: 13, color: '#92400E' }}>
        ⚠️ Somente o Desenvolvedor pode criar, renomear ou remover funções. Funções com cadastros vinculados não podem ser removidas.
      </div>

      {criando && (
        <div style={{ ...card, padding: 24, marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Nova função</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div><Label>Nome *</Label><input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Passista" style={inp}/></div>
            <div>
              <Label>Categoria</Label>
              <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} style={inp}>
                {CATEGORIAS.map(c => <option key={c.val} value={c.val}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={criar} style={btn('#1A1A1A')}>Criar função</button>
            <button onClick={() => setCriando(false)} style={btn('#f0f0f0', '#666')}>Cancelar</button>
          </div>
        </div>
      )}

      {CATEGORIAS.map(cat => {
        const fns = funcoes.filter(f => f.categoria === cat.val)
        return (
          <div key={cat.val} style={{ ...card, marginBottom: 16 }}>
            <div style={{ background: '#1A1A1A', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>{cat.label.split(' ')[0]}</span>
              <span style={{ color: '#C9A84C', fontWeight: 700, fontSize: 14 }}>{cat.label.split(' ').slice(1).join(' ')}</span>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginLeft: 'auto' }}>{fns.length} funções</span>
            </div>
            {fns.length === 0
              ? <div style={{ padding: '16px 20px', fontSize: 13, color: '#aaa' }}>Nenhuma função nesta categoria.</div>
              : <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {fns.map(f => (
                      <tr key={f.id}>
                        <td style={{ ...td, fontWeight: 500 }}>
                          {f.nome}
                          {!f.ativo && <span style={{ ...badge('#666', '#f0f0f0'), marginLeft: 8 }}>inativo</span>}
                        </td>
                        <td style={{ ...td, width: 200 }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button onClick={() => renomear(f)} style={btn('#f0f0f0', '#444')}>✏️ Renomear</button>
                            <button onClick={() => toggleAtivo(f)} style={btn(f.ativo ? '#FEF3C7' : '#D1FAE5', f.ativo ? '#92400E' : '#065F46')}>
                              {f.ativo ? '⏸️' : '▶️'}
                            </button>
                            <button onClick={() => remover(f)} style={btn('#FEE2E2', '#991B1B')}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            }
          </div>
        )
      })}
    </div>
  )
}

// ─── GESTÃO DE PLANOS ─────────────────────────────────────────

function GestaoPlanos() {
  const [planos, setPlanos] = useState<any[]>([])
  const [editando, setEditando] = useState<string | null>(null)
  const [form, setForm] = useState<any>({})

  const load = useCallback(async () => {
    const { data } = await supabase.from('planos_config').select('*').order('preco_mensal')
    setPlanos(data ?? [])
  }, [])

  useEffect(() => { load() }, [load])

  async function salvar(plano: string) {
    await supabase.from('planos_config').update(form).eq('plano', plano)
    setEditando(null)
    load()
  }

  const PLANO_CORES: Record<string, { color: string; bg: string }> = {
    trial:   { color: '#92400E', bg: '#FEF3C7' },
    basico:  { color: '#1E40AF', bg: '#DBEAFE' },
    premium: { color: '#065F46', bg: '#D1FAE5' },
  }

  return (
    <div style={{ maxWidth: 700 }}>
      <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700 }}>Configuração de planos</h2>
      <p style={{ color: '#888', fontSize: 14, margin: '0 0 24px' }}>Alterações afetam apenas novas escolas ou renovações.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {planos.map(p => {
          const cor = PLANO_CORES[p.plano] ?? { color: '#666', bg: '#f0f0f0' }
          const isEdit = editando === p.plano
          return (
            <div key={p.plano} style={card}>
              <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={badge(cor.color, cor.bg)}>{p.plano}</span>
                  <span style={{ fontWeight: 700, fontSize: 18 }}>
                    {p.preco_mensal === 0 ? 'Grátis' : `R$ ${Number(p.preco_mensal).toFixed(2)}/mês`}
                  </span>
                </div>
                {!isEdit
                  ? <button onClick={() => { setEditando(p.plano); setForm({ ...p }) }} style={btn('#f0f0f0', '#444')}>✏️ Editar</button>
                  : <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => salvar(p.plano)} style={btn('#276749')}>💾 Salvar</button>
                      <button onClick={() => setEditando(null)} style={btn('#f0f0f0', '#666')}>Cancelar</button>
                    </div>
                }
              </div>
              <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                {[
                  { label: 'Máx. alegorias', key: 'max_alegorias' },
                  { label: 'Máx. alas', key: 'max_alas' },
                  { label: 'Máx. componentes', key: 'max_componentes' },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <div style={{ fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
                    {isEdit
                      ? <input type="number" value={form[key]} onChange={e => setForm((f: any) => ({ ...f, [key]: Number(e.target.value) }))} style={{ ...inp, width: '100%' }}/>
                      : <div style={{ fontSize: 20, fontWeight: 700 }}>{p[key] >= 9999 ? '∞' : p[key]}</div>
                    }
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── ANALYTICS ───────────────────────────────────────────────

function Analytics() {
  const [escolas, setEscolas] = useState<Escola[]>([])
  const [cadastrosPorMes, setCadastrosPorMes] = useState<any[]>([])
  const [porPlano, setPorPlano] = useState<any[]>([])
  const [topEscolas, setTopEscolas] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      const { data: esc } = await supabase.from('escolas').select('*').order('criado_em')
      setEscolas((esc ?? []) as Escola[])

      // Crescimento mensal de escolas
      const meses = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(); d.setMonth(d.getMonth() - 5 + i)
        return d
      })
      const crescimento = meses.map(d => {
        const mes = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
        const total = (esc ?? []).filter(e => new Date(e.criado_em) <= d).length
        return { mes, total }
      })
      setCadastrosPorMes(crescimento)

      // Por plano
      const pp = ['trial', 'basico', 'premium'].map(plano => ({
        name: plano.charAt(0).toUpperCase() + plano.slice(1),
        value: (esc ?? []).filter(e => e.plano === plano).length
      })).filter(d => d.value > 0)
      setPorPlano(pp)

      // Top escolas por cadastros
      const { data: tops } = await supabase
        .from('cadastros')
        .select('escola_id, escolas(nome)')
        .order('escola_id')
      if (tops) {
        const map: Record<string, { nome: string; total: number }> = {}
        tops.forEach((c: any) => {
          if (!map[c.escola_id]) map[c.escola_id] = { nome: c.escolas?.nome ?? '—', total: 0 }
          map[c.escola_id].total++
        })
        const sorted = Object.values(map).sort((a, b) => b.total - a.total).slice(0, 5)
        setTopEscolas(sorted)
      }
    }
    load()
  }, [])

  return (
    <div>
      <h2 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 700 }}>Analytics da plataforma</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Crescimento de escolas */}
        <div style={{ ...card, padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>Crescimento de escolas</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={cadastrosPorMes}>
              <XAxis dataKey="mes" tick={{ fontSize: 11 }}/>
              <YAxis tick={{ fontSize: 11 }}/>
              <Tooltip/>
              <Line type="monotone" dataKey="total" stroke="#C9A84C" strokeWidth={2.5} dot={{ fill: '#C9A84C', r: 4 }}/>
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Distribuição por plano */}
        <div style={{ ...card, padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>Distribuição por plano</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={porPlano} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={12}>
                {porPlano.map((_, i) => <Cell key={i} fill={CORES[i]}/>)}
              </Pie>
              <Tooltip/>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top escolas */}
        <div style={{ ...card, padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>Top 5 escolas por cadastros</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topEscolas} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11 }}/>
              <YAxis type="category" dataKey="nome" tick={{ fontSize: 11 }} width={120}/>
              <Tooltip/>
              <Bar dataKey="total" fill="#1A1A1A" radius={[0, 4, 4, 0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Resumo por status */}
        <div style={{ ...card, padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>Escolas por status</h3>
          {['configuracao', 'aguardando', 'ativa', 'pausada'].map(s => {
            const count = escolas.filter(e => e.status === s).length
            const pct = escolas.length ? Math.round(count / escolas.length * 100) : 0
            return (
              <div key={s} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span style={{ textTransform: 'capitalize' }}>{s.replace('_', ' ')}</span>
                  <span style={{ fontWeight: 600 }}>{count}</span>
                </div>
                <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: s === 'ativa' ? '#276749' : s === 'aguardando' ? '#C9A84C' : s === 'pausada' ? '#e53e3e' : '#888', borderRadius: 3 }}/>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── LOGIN SUPER ADMIN ───────────────────────────────────────

export function SuperAdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  async function login(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setErro('')
    const { data: { session }, error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error || !session) { setErro('Credenciais inválidas.'); setLoading(false); return }

    const { data: usuario } = await supabase.from('usuarios_admin').select('*').eq('user_id', session.user.id).eq('perfil', 'desenvolvedor').single()
    if (!usuario) { setErro('Acesso restrito ao desenvolvedor.'); await supabase.auth.signOut(); setLoading(false); return }

    navigate('/superadmin/visao-geral')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ color: '#C9A84C', fontWeight: 800, fontSize: 26, letterSpacing: '-0.02em' }}>CadastroCarnaval</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 }}>Acesso Desenvolvedor</div>
        </div>
        <form onSubmit={login} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 28, border: '1px solid rgba(255,255,255,0.08)' }}>
          {erro && <div style={{ background: 'rgba(239,68,68,0.15)', color: '#FCA5A5', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 14 }}>{erro}</div>}
          <div style={{ marginBottom: 14 }}>
            <Label dark>E-mail</Label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ ...inp, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'white' }}/>
          </div>
          <div style={{ marginBottom: 24 }}>
            <Label dark>Senha</Label>
            <input type="password" value={senha} onChange={e => setSenha(e.target.value)} required style={{ ...inp, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'white' }}/>
          </div>
          <button type="submit" disabled={loading} style={{ ...btn('#C9A84C', '#1A1A1A'), width: '100%', justifyContent: 'center', padding: '13px', fontSize: 16, fontWeight: 800 }}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── HELPERS ─────────────────────────────────────────────────

function Label({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: dark ? 'rgba(255,255,255,0.45)' : '#888', display: 'block', marginBottom: 5 }}>
      {children}
    </label>
  )
}

// ─── SUPER ADMIN (entry point) ────────────────────────────────

export default function SuperAdmin() {
  const navigate = useNavigate()
  const { usuario, loading } = useSuperAdminAuth()

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#1A1A1A' }}>
      <div style={{ width: 36, height: 36, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#C9A84C', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!usuario) return <Navigate to="/superadmin/login" replace/>

  return (
    <SuperAdminLayout>
      <Routes>
        <Route index element={<Navigate to="visao-geral" replace/>}/>
        <Route path="visao-geral" element={<VisaoGeral/>}/>
        <Route path="escolas"     element={<GestaoEscolas/>}/>
        <Route path="funcoes"     element={<GestaoFuncoes/>}/>
        <Route path="planos"      element={<GestaoPlanos/>}/>
        <Route path="analytics"   element={<Analytics/>}/>
      </Routes>
    </SuperAdminLayout>
  )
}
