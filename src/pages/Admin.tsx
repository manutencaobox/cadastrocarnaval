import { useEffect, useState, useCallback } from 'react'
import { Routes, Route, Navigate, NavLink, useNavigate, useParams } from 'react-router-dom'
import { supabase, limparCPF, validarCPF, horasRestantes, linkExpirado } from '../lib/supabase'
import type { Escola, Cadastro, Posicionamento, Funcao, LinkCadastro, CpfAutorizado, UsuarioAdmin } from '../lib/types'
import { FUNCOES_BLOQUEADAS_USUARIO } from '../lib/types'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

// ─── TIPOS LOCAIS ────────────────────────────────────────────

type AdminContext = {
  usuario: UsuarioAdmin
  escola: Escola
  perfil: 'desenvolvedor' | 'administrador' | 'usuario'
}

// ─── HOOK DE AUTENTICAÇÃO ────────────────────────────────────

function useAdminAuth() {
  const [ctx, setCtx] = useState<AdminContext | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setLoading(false); return }

      const { data: usuario } = await supabase
        .from('usuarios_admin')
        .select('*, escola:escolas(*)')
        .eq('user_id', session.user.id)
        .eq('ativo', true)
        .single()

      if (usuario) {
        const escola = (usuario as any).escola as Escola
        document.documentElement.style.setProperty('--cor-primaria', escola.cor_primaria)
        document.documentElement.style.setProperty('--cor-secundaria', escola.cor_secundaria)
        setCtx({ usuario, escola, perfil: usuario.perfil })
      }
      setLoading(false)
    }
    load()
  }, [])

  return { ctx, loading }
}

// ─── CSS INLINE HELPERS ──────────────────────────────────────

const card = {
  background: 'white', borderRadius: 12,
  boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden' as const
}
const tableWrap = { ...card }
const th: React.CSSProperties = {
  padding: '11px 16px', textAlign: 'left', fontSize: 11,
  fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
  color: '#888', background: '#f8f8f8', borderBottom: '1px solid #eee'
}
const td: React.CSSProperties = {
  padding: '13px 16px', fontSize: 14, color: '#333',
  borderBottom: '1px solid #f0f0f0'
}
const badge = (color: string, bg: string): React.CSSProperties => ({
  display: 'inline-block', padding: '3px 10px', borderRadius: 20,
  fontSize: 11, fontWeight: 700, color, background: bg,
  textTransform: 'uppercase', letterSpacing: '0.04em'
})
const btn = (bg: string, color = 'white'): React.CSSProperties => ({
  background: bg, color, border: 'none', borderRadius: 8,
  padding: '8px 16px', fontSize: 13, fontWeight: 600,
  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6
})
const input: React.CSSProperties = {
  border: '1px solid #ddd', borderRadius: 8, padding: '9px 13px',
  fontSize: 14, outline: 'none', fontFamily: 'inherit', width: '100%'
}
const select: React.CSSProperties = { ...input }

// ─── LAYOUT ──────────────────────────────────────────────────

function AdminLayout({ ctx, children }: { ctx: AdminContext; children: React.ReactNode }) {
  const navigate = useNavigate()

  async function sair() {
    await supabase.auth.signOut()
    navigate('/admin/login')
  }

  const navItems = [
    { to: '/admin/dashboard',   label: 'Dashboard',    ico: '🏠' },
    { to: '/admin/componentes', label: 'Componentes',  ico: '👥' },
    { to: '/admin/links',       label: 'Links',        ico: '🔗' },
    { to: '/admin/estrutura',   label: 'Estrutura',    ico: '🎭' },
    ...(ctx.perfil !== 'usuario' ? [
      { to: '/admin/usuarios', label: 'Usuários', ico: '👤' },
      { to: '/admin/config',   label: 'Configurações', ico: '⚙️' },
    ] : []),
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui,sans-serif' }}>
      {/* SIDEBAR */}
      <nav style={{ width: 220, background: 'var(--cor-primaria)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
          {ctx.escola.logo_url
            ? <img src={ctx.escola.logo_url} alt="" style={{ width: 40, height: 40, objectFit: 'contain', marginBottom: 8 }}/>
            : <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--cor-secundaria)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: 'var(--cor-primaria)', marginBottom: 8 }}>
                {ctx.escola.nome.split(' ').filter((w:string)=>w.length>2).slice(0,2).map((w:string)=>w[0]).join('')}
              </div>
          }
          <div style={{ color: 'var(--cor-secundaria)', fontWeight: 700, fontSize: 13 }}>{ctx.escola.nome}</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 }}>
            {ctx.perfil === 'desenvolvedor' ? '🔧 Desenvolvedor' : ctx.perfil === 'administrador' ? '👑 Administrador' : '👤 Usuário'}
          </div>
        </div>

        <div style={{ flex: 1, padding: '12px 0' }}>
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '11px 16px', textDecoration: 'none',
                color: isActive ? 'white' : 'rgba(255,255,255,0.65)',
                background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                fontSize: 14, fontWeight: 500, transition: 'all 0.15s'
              })}>
              {item.ico} {item.label}
            </NavLink>
          ))}
        </div>

        <div style={{ padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
          <button onClick={sair} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', color: 'rgba(255,255,255,0.65)', fontSize: 14 }}>
            🚪 Sair
          </button>
        </div>
      </nav>

      {/* CONTEÚDO */}
      <main style={{ flex: 1, background: '#f5f5f5', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        <div style={{ padding: 28, flex: 1 }}>{children}</div>
      </main>
    </div>
  )
}

// ─── DASHBOARD ───────────────────────────────────────────────

function Dashboard({ ctx }: { ctx: AdminContext }) {
  const [stats, setStats] = useState({ total: 0, cadastrados: 0, bloqueados: 0 })
  const [porPos, setPorPos] = useState<any[]>([])
  const [linksAtivos, setLinksAtivos] = useState<LinkCadastro[]>([])
  const [ultimos, setUltimos] = useState<Cadastro[]>([])

  useEffect(() => {
    async function load() {
      const escolaId = ctx.escola.id

      const [{ count: total }, { count: bloq }, posData, linksData, ultimosData] = await Promise.all([
        supabase.from('cpfs_autorizados').select('*', { count: 'exact', head: true }).eq('escola_id', escolaId),
        supabase.from('cpfs_autorizados').select('*', { count: 'exact', head: true }).eq('escola_id', escolaId).gt('tentativas', 0),
        supabase.from('cadastros').select('posicionamento:posicionamentos(nome)', { count: 'exact' }).eq('escola_id', escolaId),
        supabase.from('links_cadastro').select('*, posicionamento:posicionamentos(nome), funcao:funcoes(nome)').eq('escola_id', escolaId).eq('ativo', true).gt('expira_em', new Date().toISOString()).order('expira_em'),
        supabase.from('cadastros').select('*, posicionamento:posicionamentos(nome), funcao:funcoes(nome)').eq('escola_id', escolaId).order('criado_em', { ascending: false }).limit(5),
      ])

      const { count: cad } = await supabase.from('cpfs_autorizados').select('*', { count: 'exact', head: true }).eq('escola_id', escolaId).eq('cadastrado', true)
      setStats({ total: total ?? 0, cadastrados: cad ?? 0, bloqueados: bloq ?? 0 })

      // Agrupa por posicionamento
      const map: Record<string, number> = {}
      posData.data?.forEach((c: any) => {
        const nome = c.posicionamento?.nome ?? 'Sem posicionamento'
        map[nome] = (map[nome] ?? 0) + 1
      })
      setPorPos(Object.entries(map).map(([name, value]) => ({ name, value })))
      setLinksAtivos((linksData.data ?? []) as any)
      setUltimos((ultimosData.data ?? []) as any)
    }
    load()
  }, [ctx.escola.id])

  const diasTrial = ctx.escola.plano === 'trial'
    ? Math.max(0, Math.ceil((new Date(ctx.escola.trial_fim).getTime() - Date.now()) / 86400000))
    : null

  return (
    <div>
      <h2 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 700 }}>Dashboard</h2>

      {/* Alerta trial */}
      {diasTrial !== null && (
        <div style={{ background: diasTrial <= 7 ? '#FEE2E2' : '#FFFBEB', border: `1px solid ${diasTrial <= 7 ? '#FCA5A5' : '#FDE68A'}`, borderRadius: 10, padding: '12px 18px', marginBottom: 20, fontSize: 14, color: diasTrial <= 7 ? '#991B1B' : '#92400E' }}>
          {diasTrial <= 7 ? '⚠️' : 'ℹ️'} Período de teste: <strong>{diasTrial} dias restantes</strong>
          {diasTrial <= 7 && ' — Entre em contato para continuar usando a plataforma.'}
        </div>
      )}

      {/* Alerta escola em configuração */}
      {ctx.escola.status === 'configuracao' && (
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '12px 18px', marginBottom: 20, fontSize: 14, color: '#1E40AF' }}>
          🔧 Sua escola está em configuração. Monte a estrutura do desfile e envie ao desenvolvedor para ativação.
        </div>
      )}
      {ctx.escola.status === 'aguardando' && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '12px 18px', marginBottom: 20, fontSize: 14, color: '#92400E' }}>
          ⏳ Estrutura enviada. Aguardando aprovação do desenvolvedor.
        </div>
      )}

      {/* Métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'CPFs autorizados', value: stats.total, sub: 'total na escola' },
          { label: 'Já cadastrados', value: stats.cadastrados, sub: `${stats.total ? Math.round(stats.cadastrados/stats.total*100) : 0}% do total` },
          { label: 'Pendentes', value: stats.total - stats.cadastrados, sub: 'ainda não cadastraram' },
          { label: 'Tentativas bloq.', value: stats.bloqueados, sub: 'CPFs não autorizados' },
        ].map(m => (
          <div key={m.label} style={{ ...card, padding: 20 }}>
            <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{m.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#1a1a1a' }}>{m.value}</div>
            <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Gráfico por posicionamento */}
        <div style={{ ...card, padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>Por posicionamento</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={porPos}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="value" fill="var(--cor-primaria)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Links ativos */}
        <div style={{ ...card, padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>Links ativos</h3>
          {linksAtivos.length === 0
            ? <p style={{ color: '#aaa', fontSize: 13 }}>Nenhum link ativo no momento.</p>
            : linksAtivos.map((l: any) => (
              <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{l.posicionamento?.nome}</div>
                  <div style={{ color: '#888', fontSize: 12 }}>{l.funcao?.nome}</div>
                </div>
                <div style={{ color: horasRestantes(l.expira_em) <= 6 ? '#e53e3e' : '#888', fontSize: 12, textAlign: 'right' }}>
                  {horasRestantes(l.expira_em)}h restantes
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {/* Últimos cadastros */}
      <div style={card}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0', fontWeight: 600, fontSize: 15 }}>Últimos cadastros</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            <th style={th}>Nome</th><th style={th}>Posicionamento</th><th style={th}>Função</th><th style={th}>Cadastrado em</th>
          </tr></thead>
          <tbody>
            {ultimos.map((c: any) => (
              <tr key={c.id}>
                <td style={td}>{c.nome_social || c.nome_registro}</td>
                <td style={td}>{c.posicionamento?.nome ?? '—'}</td>
                <td style={td}>{c.funcao?.nome ?? '—'}</td>
                <td style={{ ...td, fontSize: 12, color: '#aaa' }}>{new Date(c.criado_em).toLocaleString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── COMPONENTES ─────────────────────────────────────────────

function Componentes({ ctx }: { ctx: AdminContext }) {
  const [cadastros, setCadastros] = useState<Cadastro[]>([])
  const [posicionamentos, setPosicionamentos] = useState<Posicionamento[]>([])
  const [funcoes, setFuncoes] = useState<Funcao[]>([])
  const [busca, setBusca] = useState('')
  const [filtros, setFiltros] = useState<Record<string,string[]>>({})
  const [selecionado, setSelecionado] = useState<Cadastro | null>(null)
  const [editando, setEditando] = useState(false)
  const [pagina, setPagina] = useState(1)
  const [showExport, setShowExport] = useState(false)
  const POR_PAG = 20

  const load = useCallback(async () => {
    const [{ data: cads }, { data: pos }, { data: fns }] = await Promise.all([
      supabase.from('cadastros').select('*, posicionamento:posicionamentos(nome), funcao:funcoes(nome)').eq('escola_id', ctx.escola.id).order('criado_em', { ascending: false }),
      supabase.from('posicionamentos').select('*').eq('escola_id', ctx.escola.id).order('nome'),
      supabase.from('funcoes').select('*').eq('ativo', true).order('ordem'),
    ])
    setCadastros((cads ?? []) as any)
    setPosicionamentos((pos ?? []) as any)
    setFuncoes((fns ?? []) as any)
  }, [ctx.escola.id])

  useEffect(() => { load() }, [load])

  function toggleFiltro(campo: string, valor: string) {
    setFiltros(f => {
      const arr = f[campo] ?? []
      return { ...f, [campo]: arr.includes(valor) ? arr.filter(v=>v!==valor) : [...arr, valor] }
    })
    setPagina(1)
  }

  const filtrado = cadastros.filter(c => {
    const nome = c.nome_social || c.nome_registro
    const matchBusca = !busca || nome.toLowerCase().includes(busca.toLowerCase()) || c.cpf.includes(busca.replace(/\D/g,''))
    const matchPos = !filtros.pos?.length || filtros.pos.includes(c.posicionamento_id)
    const matchFunc = !filtros.func?.length || filtros.func.includes(c.funcao_id)
    const matchPele = !filtros.pele?.length || filtros.pele.includes(c.cor_pele ?? '')
    const matchSexo = !filtros.sexo?.length || filtros.sexo.includes(c.sexo_biologico)
    const matchGenero = !filtros.genero?.length || filtros.genero.includes(c.identidade_genero ?? '')
    const matchPcd = !filtros.pcd?.length || (filtros.pcd.includes('sim') && c.tem_necessidade_especial) || (filtros.pcd.includes('nao') && !c.tem_necessidade_especial)
    const matchDesfilou = !filtros.desfilou?.length || (filtros.desfilou.includes('sim') && c.ja_desfilou) || (filtros.desfilou.includes('nao') && !c.ja_desfilou)
    return matchBusca && matchPos && matchFunc && matchPele && matchSexo && matchGenero && matchPcd && matchDesfilou
  })

  const paginado = filtrado.slice((pagina-1)*POR_PAG, pagina*POR_PAG)

  async function excluir(c: Cadastro) {
    if (!confirm(`Excluir o cadastro de "${c.nome_social || c.nome_registro}"? Esta ação não pode ser desfeita.`)) return
    await supabase.from('cadastros').delete().eq('id', c.id)
    await supabase.from('cpfs_autorizados').update({ cadastrado: false, cadastro_id: null }).eq('escola_id', ctx.escola.id).eq('cpf', c.cpf)
    setSelecionado(null)
    load()
  }

  function exportarCSV() {
    const campos = ['Nome', 'CPF', 'Posicionamento', 'Função', 'WhatsApp', 'Email', 'Altura', 'Peso', 'Manequim', 'Sapato', 'Busto', 'Cintura', 'Quadril', 'Cor da Pele', 'Já desfilou', 'Necessidade especial']
    const rows = filtrado.map(c => [
      c.nome_social || c.nome_registro, c.cpf,
      (c as any).posicionamento?.nome ?? '', (c as any).funcao?.nome ?? '',
      c.whatsapp, c.email, c.altura ?? '', c.peso ?? '',
      c.manequim ?? '', c.numero_sapato ?? '',
      c.busto ?? '', c.cintura ?? '', c.quadril ?? '',
      c.cor_pele ?? '', c.ja_desfilou ? 'Sim' : 'Não',
      c.tem_necessidade_especial ? 'Sim' : 'Não'
    ])
    const csv = [campos, ...rows].map(r => r.join(';')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    a.download = `componentes_${ctx.escola.slug}.csv`
    a.click()
    setShowExport(false)
  }

  const GrupoFiltro = ({ titulo, campo, opcoes }: { titulo:string; campo:string; opcoes:{label:string;val:string}[] }) => (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#aaa', marginBottom: 6 }}>{titulo}</div>
      {opcoes.map(o => (
        <label key={o.val} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#444', marginBottom: 5, cursor: 'pointer' }}>
          <input type="checkbox" checked={(filtros[campo]??[]).includes(o.val)} onChange={()=>toggleFiltro(campo, o.val)} style={{ accentColor: 'var(--cor-primaria)' }}/> {o.label}
        </label>
      ))}
    </div>
  )

  return (
    <div style={{ display: 'flex', gap: 20 }}>
      {/* FILTROS SIDEBAR */}
      <div style={{ width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ ...card, padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>Filtros</div>

          <GrupoFiltro titulo="Posicionamento" campo="pos" opcoes={posicionamentos.map(p=>({label:p.nome,val:p.id}))} />
          <GrupoFiltro titulo="Função" campo="func" opcoes={funcoes.map(f=>({label:f.nome,val:f.id}))} />
          <GrupoFiltro titulo="Sexo biológico" campo="sexo" opcoes={[{label:'Feminino',val:'Feminino'},{label:'Masculino',val:'Masculino'}]} />
          <GrupoFiltro titulo="Cor da pele" campo="pele" opcoes={['Branca','Preta','Parda','Amarela','Indígena'].map(v=>({label:v,val:v}))} />
          <GrupoFiltro titulo="Identidade de gênero" campo="genero" opcoes={['Mulher cisgênero','Homem cisgênero','Mulher transgênero','Homem transgênero','Não-binário'].map(v=>({label:v,val:v}))} />
          <GrupoFiltro titulo="Necessidade especial" campo="pcd" opcoes={[{label:'Possui',val:'sim'},{label:'Não possui',val:'nao'}]} />
          <GrupoFiltro titulo="Histórico" campo="desfilou" opcoes={[{label:'Já desfilou',val:'sim'},{label:'Primeiro desfile',val:'nao'}]} />

          <button onClick={()=>{ setFiltros({}); setBusca('') }} style={{ ...btn('#f0f0f0','#666'), width: '100%', justifyContent: 'center', fontSize: 12 }}>
            Limpar filtros
          </button>
        </div>
      </div>

      {/* LISTA */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
            Componentes <span style={{ fontSize: 14, color: '#aaa', fontWeight: 400 }}>({filtrado.length})</span>
          </h2>
          <button onClick={()=>setShowExport(true)} style={btn('var(--cor-primaria)')}>
            📤 Exportar
          </button>
        </div>

        <input type="text" placeholder="Buscar por nome ou CPF..." value={busca} onChange={e=>{setBusca(e.target.value);setPagina(1)}}
          style={{ ...input, marginBottom: 14, background: 'white' }}/>

        <div style={tableWrap}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={th}>Foto</th>
              <th style={th}>Nome</th>
              <th style={th}>Posicionamento</th>
              <th style={th}>Função</th>
              <th style={th}>WhatsApp</th>
              <th style={th}>Cadastrado em</th>
              <th style={th}></th>
            </tr></thead>
            <tbody>
              {paginado.length === 0 && (
                <tr><td colSpan={7} style={{ ...td, textAlign: 'center', color: '#aaa', padding: 40 }}>Nenhum componente encontrado.</td></tr>
              )}
              {paginado.map((c: any) => (
                <tr key={c.id} style={{ cursor: 'pointer' }} onClick={()=>setSelecionado(c)}>
                  <td style={td}>
                    {c.foto_url
                      ? <img src={c.foto_url} alt="" style={{ width:36, height:36, borderRadius:'50%', objectFit:'cover' }}/>
                      : <div style={{ width:36, height:36, borderRadius:'50%', background:'#e0e0e0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>👤</div>
                    }
                  </td>
                  <td style={td}>
                    <div style={{ fontWeight: 500 }}>{c.nome_social || c.nome_registro}</div>
                    {c.nome_social && <div style={{ fontSize:11, color:'#aaa' }}>{c.nome_registro}</div>}
                  </td>
                  <td style={{ ...td, fontSize:13, color:'#666' }}>{c.posicionamento?.nome ?? '—'}</td>
                  <td style={{ ...td, fontSize:13, color:'#666' }}>{c.funcao?.nome ?? '—'}</td>
                  <td style={{ ...td, fontSize:13 }}>{c.whatsapp}</td>
                  <td style={{ ...td, fontSize:12, color:'#aaa' }}>{new Date(c.criado_em).toLocaleDateString('pt-BR')}</td>
                  <td style={td} onClick={e=>e.stopPropagation()}>
                    <button onClick={()=>{setSelecionado(c);setEditando(true)}} style={btn('#f0f0f0','#444')}>✏️</button>
                    {ctx.perfil !== 'usuario' && (
                      <button onClick={()=>excluir(c)} style={{ ...btn('#FEE2E2','#991B1B'), marginLeft:4 }}>🗑️</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {filtrado.length > POR_PAG && (
          <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:16 }}>
            {Array.from({length:Math.ceil(filtrado.length/POR_PAG)},(_,i)=>(
              <button key={i} onClick={()=>setPagina(i+1)}
                style={{ width:32, height:32, border:'1px solid #ddd', borderRadius:6, background: pagina===i+1 ? 'var(--cor-primaria)' : 'white', color: pagina===i+1 ? 'white' : '#333', cursor:'pointer', fontWeight:600 }}>
                {i+1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DETALHE/EDIÇÃO */}
      {selecionado && (
        <DetalheModal
          cadastro={selecionado}
          editando={editando}
          ctx={ctx}
          onClose={()=>{ setSelecionado(null); setEditando(false) }}
          onSave={()=>{ setSelecionado(null); setEditando(false); load() }}
          onExcluir={()=>excluir(selecionado)}
        />
      )}

      {/* MODAL EXPORTAR */}
      {showExport && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 }}>
          <div style={{ background:'white', borderRadius:16, padding:28, width:340 }}>
            <h3 style={{ margin:'0 0 20px', fontSize:18 }}>Exportar lista</h3>
            <p style={{ fontSize:13, color:'#888', margin:'0 0 20px' }}>{filtrado.length} componente(s) com os filtros atuais.</p>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={exportarCSV} style={{ ...btn('var(--cor-primaria)'), flex:1, justifyContent:'center' }}>📊 CSV</button>
              <button onClick={()=>setShowExport(false)} style={{ ...btn('#f0f0f0','#666'), flex:1, justifyContent:'center' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── MODAL DETALHE ────────────────────────────────────────────

function DetalheModal({ cadastro, editando, ctx, onClose, onSave, onExcluir }: {
  cadastro: Cadastro; editando: boolean; ctx: AdminContext;
  onClose: ()=>void; onSave: ()=>void; onExcluir: ()=>void
}) {
  const c = cadastro as any
  const [form, setForm] = useState({ ...cadastro })
  const [saving, setSaving] = useState(false)

  async function salvar() {
    setSaving(true)
    await supabase.from('cadastros').update({
      ...form, atualizado_em: new Date().toISOString(), editado_por: ctx.usuario.id
    }).eq('id', cadastro.id)
    setSaving(false)
    onSave()
  }

  const Row = ({ label, val, campo }: { label:string; val:string|null; campo?:keyof typeof form }) => (
    <div style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid #f5f5f5' }}>
      <span style={{ fontSize:12, color:'#aaa', minWidth:130 }}>{label}</span>
      {editando && campo
        ? <input value={(form[campo] as string) ?? ''} onChange={e=>setForm(f=>({...f,[campo]:e.target.value}))}
            style={{ border:'1px solid #ddd', borderRadius:6, padding:'4px 8px', fontSize:13, outline:'none', width:200 }}/>
        : <span style={{ fontSize:14, color:'#333', fontWeight:500, textAlign:'right' }}>{val || '—'}</span>
      }
    </div>
  )

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'flex-start', justifyContent:'flex-end', zIndex:100 }}>
      <div style={{ background:'white', width:420, height:'100vh', overflow:'auto', boxShadow:'-4px 0 20px rgba(0,0,0,0.15)' }}>
        <div style={{ background:'var(--cor-primaria)', padding:'20px 20px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ color:'white', fontWeight:700, fontSize:16 }}>{c.nome_social || c.nome_registro}</div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'white', fontSize:20, cursor:'pointer' }}>✕</button>
        </div>

        <div style={{ padding:20, display:'flex', gap:8, borderBottom:'1px solid #f0f0f0' }}>
          {!editando && <button onClick={()=>setForm({...cadastro})} style={btn('var(--cor-primaria)')}>✏️ Editar</button>}
          {editando && <>
            <button onClick={salvar} disabled={saving} style={btn('#276749')}>💾 {saving ? 'Salvando...' : 'Salvar'}</button>
            <button onClick={()=>setForm({...cadastro})} style={btn('#f0f0f0','#666')}>Cancelar</button>
          </>}
          {ctx.perfil !== 'usuario' && (
            <button onClick={onExcluir} style={{ ...btn('#FEE2E2','#991B1B'), marginLeft:'auto' }}>🗑️ Excluir</button>
          )}
        </div>

        <div style={{ padding:20 }}>
          {c.foto_url && <img src={c.foto_url} alt="" style={{ width:80, height:80, borderRadius:'50%', objectFit:'cover', marginBottom:16, display:'block' }}/>}

          <Section titulo="Identificação">
            <Row label="Nome de registro" val={c.nome_registro} campo="nome_registro"/>
            <Row label="Nome social" val={c.nome_social} campo="nome_social"/>
            <Row label="CPF" val={c.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/,'$1.$2.$3-$4')}/>
            <Row label="Data de nascimento" val={c.data_nascimento ? new Date(c.data_nascimento+'T00:00').toLocaleDateString('pt-BR') : null}/>
          </Section>

          <Section titulo="Identidade">
            <Row label="Pronomes" val={c.pronomes}/>
            <Row label="Identidade de gênero" val={c.identidade_genero}/>
            <Row label="Sexo biológico" val={c.sexo_biologico}/>
            <Row label="Preferência de fantasia" val={c.preferencia_fantasia}/>
          </Section>

          <Section titulo="Contato">
            <Row label="WhatsApp" val={c.whatsapp} campo="whatsapp"/>
            <Row label="E-mail" val={c.email} campo="email"/>
            <Row label="Endereço" val={c.endereco} campo="endereco"/>
            <Row label="Cidade / Estado" val={c.cidade && c.estado ? `${c.cidade} / ${c.estado}` : null}/>
            <Row label="Instagram" val={c.instagram} campo="instagram"/>
            <Row label="TikTok" val={c.tiktok} campo="tiktok"/>
          </Section>

          <Section titulo="Medidas">
            <Row label="Altura" val={c.altura} campo="altura"/>
            <Row label="Peso" val={c.peso} campo="peso"/>
            <Row label="Manequim" val={c.manequim} campo="manequim"/>
            <Row label="Sapato" val={c.numero_sapato} campo="numero_sapato"/>
            <Row label="Busto / Tórax" val={c.busto} campo="busto"/>
            <Row label="Cintura" val={c.cintura} campo="cintura"/>
            <Row label="Quadril" val={c.quadril} campo="quadril"/>
          </Section>

          <Section titulo="Perfil visual">
            <Row label="Cor da pele" val={c.cor_pele}/>
            <Row label="Cor do cabelo" val={c.cor_cabelo}/>
            <Row label="Tipo do cabelo" val={c.tipo_cabelo}/>
            <Row label="Comprimento" val={c.comprimento_cabelo}/>
          </Section>

          <Section titulo="Necessidades especiais">
            <Row label="Possui" val={c.tem_necessidade_especial ? 'Sim' : 'Não'}/>
            {c.tem_necessidade_especial && <>
              {c.necessidade_mobilidade && <Row label="" val="♿ Mobilidade reduzida"/>}
              {c.necessidade_visual && <Row label="" val="👁️ Deficiência visual"/>}
              {c.necessidade_auditiva && <Row label="" val="👂 Deficiência auditiva"/>}
              {c.necessidade_outra && <Row label="Outra" val={c.necessidade_outra}/>}
            </>}
          </Section>

          <Section titulo="Vínculo">
            <Row label="Posicionamento" val={(c as any).posicionamento?.nome}/>
            <Row label="Função" val={(c as any).funcao?.nome}/>
            <Row label="Já desfilou antes" val={c.ja_desfilou ? 'Sim' : 'Não'}/>
          </Section>

          <Section titulo="Controle">
            <Row label="Cadastrado em" val={new Date(c.criado_em).toLocaleString('pt-BR')}/>
            <Row label="Atualizado em" val={c.atualizado_em ? new Date(c.atualizado_em).toLocaleString('pt-BR') : null}/>
          </Section>
        </div>
      </div>
    </div>
  )
}

function Section({ titulo, children }: { titulo:string; children:React.ReactNode }) {
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#aaa', marginBottom:8 }}>{titulo}</div>
      {children}
    </div>
  )
}

// ─── LINKS ───────────────────────────────────────────────────

function Links({ ctx }: { ctx: AdminContext }) {
  const [links, setLinks] = useState<LinkCadastro[]>([])
  const [posicionamentos, setPosicionamentos] = useState<Posicionamento[]>([])
  const [funcoes, setFuncoes] = useState<Funcao[]>([])
  const [criando, setCriando] = useState(false)
  const [form, setForm] = useState({ posicionamento_id:'', funcao_id:'', descricao:'' })
  const [cpfsTexto, setCpfsTexto] = useState('')
  const [copiado, setCopiado] = useState<string|null>(null)

  const load = useCallback(async () => {
    const [{ data: ls }, { data: ps }, { data: fs }] = await Promise.all([
      supabase.from('links_cadastro').select('*, posicionamento:posicionamentos(nome), funcao:funcoes(nome)').eq('escola_id', ctx.escola.id).order('criado_em', { ascending: false }),
      supabase.from('posicionamentos').select('*').eq('escola_id', ctx.escola.id).eq('ativo', true).order('nome'),
      supabase.from('funcoes').select('*').eq('ativo', true).order('ordem'),
    ])
    setLinks((ls ?? []) as any)
    setPosicionamentos((ps ?? []) as any)
    // Filtra funções bloqueadas para usuário
    const fsFilt = ctx.perfil === 'usuario'
      ? (fs ?? []).filter((f: any) => !FUNCOES_BLOQUEADAS_USUARIO.includes(f.nome))
      : (fs ?? [])
    setFuncoes(fsFilt as any)
  }, [ctx.escola.id, ctx.perfil])

  useEffect(() => { load() }, [load])

  async function criarLink() {
    if (!form.posicionamento_id || !form.funcao_id) return alert('Selecione posicionamento e função.')
    const cpfs = cpfsTexto.split(/[\n,;]/).map(c=>limparCPF(c.trim())).filter(c=>c.length===11 && validarCPF(c))
    if (cpfs.length === 0) return alert('Adicione pelo menos um CPF válido.')

    const { data: link } = await supabase.from('links_cadastro').insert({
      escola_id: ctx.escola.id,
      posicionamento_id: form.posicionamento_id,
      funcao_id: form.funcao_id,
      descricao: form.descricao || null,
      criado_por: ctx.usuario.id,
    }).select().single()

    if (link) {
      await supabase.from('cpfs_autorizados').insert(
        cpfs.map(cpf => ({ link_id: link.id, escola_id: ctx.escola.id, cpf }))
      )
    }

    setForm({ posicionamento_id:'', funcao_id:'', descricao:'' })
    setCpfsTexto('')
    setCriando(false)
    load()
  }

  async function renovar(link: LinkCadastro) {
    const novoToken = crypto.randomUUID()
    const novaExpiracao = new Date(Date.now() + 48*3600000).toISOString()
    await supabase.from('links_cadastro').update({ link_token: novoToken, expira_em: novaExpiracao, ativo: true }).eq('id', link.id)
    load()
  }

  async function pausar(link: LinkCadastro) {
    await supabase.from('links_cadastro').update({ ativo: !link.ativo }).eq('id', link.id)
    load()
  }

  async function excluirLink(link: LinkCadastro) {
    if (!confirm('Excluir este link? Os cadastros já realizados serão mantidos.')) return
    await supabase.from('links_cadastro').delete().eq('id', link.id)
    load()
  }

  function copiar(link: LinkCadastro) {
    const url = `${window.location.origin}/cadastro/${link.link_token}`
    navigator.clipboard.writeText(url)
    setCopiado(link.id)
    setTimeout(()=>setCopiado(null), 2000)
  }

  function whatsapp(link: any) {
    const url = `${window.location.origin}/cadastro/${link.link_token}`
    const texto = `📋 *${ctx.escola.nome}*\nCadastro: ${link.posicionamento?.nome} · ${link.funcao?.nome}\n\n${link.descricao ? link.descricao+'\n\n' : ''}Acesse e preencha seus dados:\n${url}\n\n⏰ Link válido por 48 horas.`
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`)
  }

  const statusLink = (l: LinkCadastro) => {
    if (!l.ativo) return { label:'Pausado', color:'#666', bg:'#f0f0f0' }
    if (linkExpirado(l.expira_em)) return { label:'Expirado', color:'#991B1B', bg:'#FEE2E2' }
    return { label:`${horasRestantes(l.expira_em)}h`, color:'#065F46', bg:'#D1FAE5' }
  }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <h2 style={{ margin:0, fontSize:22, fontWeight:700 }}>Links de cadastro</h2>
        {ctx.escola.status === 'ativa' && (
          <button onClick={()=>setCriando(true)} style={btn('var(--cor-primaria)')}>+ Novo link</button>
        )}
      </div>

      {ctx.escola.status !== 'ativa' && (
        <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:10, padding:'12px 18px', marginBottom:20, fontSize:14, color:'#92400E' }}>
          ⚠️ A escola precisa estar <strong>ativa</strong> para gerar links. Complete a estrutura do desfile e envie ao desenvolvedor.
        </div>
      )}

      {/* FORM NOVO LINK */}
      {criando && (
        <div style={{ ...card, padding:24, marginBottom:24 }}>
          <h3 style={{ margin:'0 0 20px', fontSize:16 }}>Novo link de cadastro</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#888', display:'block', marginBottom:5 }}>Posicionamento *</label>
              <select value={form.posicionamento_id} onChange={e=>setForm(f=>({...f,posicionamento_id:e.target.value}))} style={select}>
                <option value="">Selecione...</option>
                {posicionamentos.map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#888', display:'block', marginBottom:5 }}>Função *</label>
              <select value={form.funcao_id} onChange={e=>setForm(f=>({...f,funcao_id:e.target.value}))} style={select}>
                <option value="">Selecione...</option>
                {funcoes.map(f=><option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#888', display:'block', marginBottom:5 }}>Descrição (opcional)</label>
            <input value={form.descricao} onChange={e=>setForm(f=>({...f,descricao:e.target.value}))} placeholder="Ex: Passistas da Ala 5" style={input}/>
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#888', display:'block', marginBottom:5 }}>CPFs autorizados * <span style={{ color:'#aaa', fontWeight:400 }}>(um por linha, ou separados por vírgula)</span></label>
            <textarea value={cpfsTexto} onChange={e=>setCpfsTexto(e.target.value)}
              placeholder="123.456.789-00&#10;987.654.321-00&#10;..."
              style={{ ...input, minHeight:120, resize:'vertical', fontFamily:'monospace' }}/>
            <div style={{ fontSize:12, color:'#aaa', marginTop:4 }}>
              {cpfsTexto.split(/[\n,;]/).map(c=>limparCPF(c.trim())).filter(c=>c.length===11).length} CPFs válidos detectados
            </div>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={criarLink} style={btn('var(--cor-primaria)')}>🔗 Gerar link</button>
            <button onClick={()=>{ setCriando(false); setForm({posicionamento_id:'',funcao_id:'',descricao:''}); setCpfsTexto('') }} style={btn('#f0f0f0','#666')}>Cancelar</button>
          </div>
        </div>
      )}

      {/* LISTA DE LINKS */}
      <div style={tableWrap}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr>
            <th style={th}>Descrição</th>
            <th style={th}>Posicionamento</th>
            <th style={th}>Função</th>
            <th style={th}>CPFs</th>
            <th style={th}>Cadastros</th>
            <th style={th}>Status</th>
            <th style={th}>Ações</th>
          </tr></thead>
          <tbody>
            {links.length === 0 && (
              <tr><td colSpan={7} style={{ ...td, textAlign:'center', color:'#aaa', padding:40 }}>Nenhum link criado ainda.</td></tr>
            )}
            {links.map((l: any) => {
              const st = statusLink(l)
              return (
                <tr key={l.id}>
                  <td style={td}><div style={{ fontWeight:500 }}>{l.descricao || '—'}</div></td>
                  <td style={{ ...td, fontSize:13, color:'#666' }}>{l.posicionamento?.nome}</td>
                  <td style={{ ...td, fontSize:13, color:'#666' }}>{l.funcao?.nome}</td>
                  <td style={td}>{l.total_cadastros}</td>
                  <td style={td}>{l.total_cadastros}</td>
                  <td style={td}><span style={badge(st.color, st.bg)}>{st.label}</span></td>
                  <td style={td}>
                    <div style={{ display:'flex', gap:5 }}>
                      <button onClick={()=>copiar(l)} style={btn(copiado===l.id ? '#276749' : '#f0f0f0', copiado===l.id ? 'white' : '#444')} title="Copiar link">
                        {copiado===l.id ? '✓' : '📋'}
                      </button>
                      <button onClick={()=>whatsapp(l)} style={btn('#25D366')} title="WhatsApp">📲</button>
                      <button onClick={()=>renovar(l)} style={btn('#EFF6FF','#1E40AF')} title="Renovar 48h">🔄</button>
                      <button onClick={()=>pausar(l)} style={btn('#f0f0f0','#666')} title={l.ativo ? 'Pausar' : 'Reativar'}>
                        {l.ativo ? '⏸️' : '▶️'}
                      </button>
                      <button onClick={()=>excluirLink(l)} style={btn('#FEE2E2','#991B1B')} title="Excluir">🗑️</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── ESTRUTURA DO DESFILE ─────────────────────────────────────

function Estrutura({ ctx }: { ctx: AdminContext }) {
  const [posicionamentos, setPosicionamentos] = useState<Posicionamento[]>([])
  const [criando, setCriando] = useState(false)
  const [form, setForm] = useState({ tipo:'ala', nome:'' })

  const load = useCallback(async () => {
    const { data } = await supabase.from('posicionamentos').select('*').eq('escola_id', ctx.escola.id).order('nome')
    setPosicionamentos((data ?? []) as any)
  }, [ctx.escola.id])

  useEffect(() => { load() }, [load])

  async function criar() {
    if (!form.nome) return
    await supabase.from('posicionamentos').insert({ escola_id: ctx.escola.id, tipo: form.tipo, nome: form.nome })
    setForm({ tipo:'ala', nome:'' })
    setCriando(false)
    load()
  }

  async function renomear(p: Posicionamento) {
    const novo = prompt('Novo nome:', p.nome)
    if (!novo || novo === p.nome) return
    await supabase.from('posicionamentos').update({ nome: novo }).eq('id', p.id)
    load()
  }

  async function remover(p: Posicionamento) {
    const { count } = await supabase.from('cadastros').select('*', { count:'exact', head:true }).eq('posicionamento_id', p.id)
    if ((count ?? 0) > 0) return alert(`Este posicionamento tem ${count} cadastro(s) e não pode ser removido.`)
    if (!confirm(`Remover "${p.nome}"?`)) return
    await supabase.from('posicionamentos').delete().eq('id', p.id)
    load()
  }

  async function enviarParaAprovacao() {
    if (!confirm('Enviar estrutura ao desenvolvedor para ativação?')) return
    await supabase.from('escolas').update({ status: 'aguardando' }).eq('id', ctx.escola.id)
    alert('Estrutura enviada! Aguarde a ativação pelo desenvolvedor.')
  }

  const TIPOS = [
    { val:'geral', label:'Geral', ico:'🏫' },
    { val:'comissao_frente', label:'Comissão de Frente', ico:'⭐' },
    { val:'alegoria', label:'Alegoria', ico:'🎭' },
    { val:'ala', label:'Ala', ico:'📍' },
    { val:'bateria', label:'Bateria', ico:'🥁' },
    { val:'carro_som', label:'Carro de Som', ico:'🎤' },
  ]

  const icoporTipo = (tipo: string) => TIPOS.find(t=>t.val===tipo)?.ico ?? '📍'

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <h2 style={{ margin:0, fontSize:22, fontWeight:700 }}>Estrutura do desfile</h2>
        <div style={{ display:'flex', gap:10 }}>
          {ctx.escola.status === 'configuracao' && (
            <button onClick={enviarParaAprovacao} style={btn('#1E40AF')}>📤 Enviar ao desenvolvedor</button>
          )}
          <button onClick={()=>setCriando(true)} style={btn('var(--cor-primaria)')}>+ Adicionar</button>
        </div>
      </div>

      {criando && (
        <div style={{ ...card, padding:20, marginBottom:20 }}>
          <h3 style={{ margin:'0 0 16px', fontSize:15 }}>Novo posicionamento</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#888', display:'block', marginBottom:5 }}>Tipo</label>
              <select value={form.tipo} onChange={e=>setForm(f=>({...f,tipo:e.target.value}))} style={select}>
                {TIPOS.map(t=><option key={t.val} value={t.val}>{t.ico} {t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#888', display:'block', marginBottom:5 }}>Nome *</label>
              <input value={form.nome} onChange={e=>setForm(f=>({...f,nome:e.target.value}))} placeholder="Ex: Ala 5, Alegoria 2..." style={input}/>
            </div>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={criar} style={btn('var(--cor-primaria)')}>Criar</button>
            <button onClick={()=>setCriando(false)} style={btn('#f0f0f0','#666')}>Cancelar</button>
          </div>
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {posicionamentos.map(p => (
          <div key={p.id} style={{ ...card, padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <span style={{ fontSize:22 }}>{icoporTipo(p.tipo)}</span>
              <div>
                <div style={{ fontWeight:600, fontSize:15 }}>{p.nome}</div>
                <div style={{ fontSize:12, color:'#aaa', textTransform:'capitalize' }}>{p.tipo.replace('_',' ')}</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=>renomear(p)} style={btn('#f0f0f0','#444')}>✏️ Renomear</button>
              <button onClick={()=>remover(p)} style={btn('#FEE2E2','#991B1B')}>🗑️</button>
            </div>
          </div>
        ))}
        {posicionamentos.length === 0 && (
          <div style={{ ...card, padding:40, textAlign:'center', color:'#aaa' }}>
            Nenhum posicionamento criado ainda. Adicione alas, alegorias e outros elementos do desfile.
          </div>
        )}
      </div>
    </div>
  )
}

// ─── USUÁRIOS ────────────────────────────────────────────────

function Usuarios({ ctx }: { ctx: AdminContext }) {
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([])
  const [posicionamentos, setPosicionamentos] = useState<Posicionamento[]>([])
  const [criando, setCriando] = useState(false)
  const [form, setForm] = useState({ nome:'', email:'', senha:'', setor_tipo:'todos', setor_id:'' })

  const load = useCallback(async () => {
    const [{ data: us }, { data: ps }] = await Promise.all([
      supabase.from('usuarios_admin').select('*').eq('escola_id', ctx.escola.id).order('nome'),
      supabase.from('posicionamentos').select('*').eq('escola_id', ctx.escola.id).order('nome'),
    ])
    setUsuarios((us ?? []) as any)
    setPosicionamentos((ps ?? []) as any)
  }, [ctx.escola.id])

  useEffect(() => { load() }, [load])

  async function criar() {
    if (!form.nome || !form.email || !form.senha) return alert('Preencha nome, e-mail e senha.')
    const { data: auth, error } = await supabase.auth.admin.createUser({ email: form.email, password: form.senha })
    if (error) return alert('Erro ao criar usuário: ' + error.message)
    await supabase.from('usuarios_admin').insert({
      user_id: auth.user.id, escola_id: ctx.escola.id,
      nome: form.nome, email: form.email, perfil: 'usuario',
      setor_tipo: form.setor_tipo,
      setor_id: form.setor_tipo === 'posicionamento' ? form.setor_id : null,
    })
    setForm({ nome:'', email:'', senha:'', setor_tipo:'todos', setor_id:'' })
    setCriando(false)
    load()
  }

  async function toggleAtivo(u: UsuarioAdmin) {
    await supabase.from('usuarios_admin').update({ ativo: !u.ativo }).eq('id', u.id)
    load()
  }

  async function remover(u: UsuarioAdmin) {
    if (!confirm(`Remover o usuário "${u.nome}"?`)) return
    await supabase.from('usuarios_admin').delete().eq('id', u.id)
    load()
  }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <h2 style={{ margin:0, fontSize:22, fontWeight:700 }}>Usuários</h2>
        <button onClick={()=>setCriando(true)} style={btn('var(--cor-primaria)')}>+ Novo usuário</button>
      </div>

      {criando && (
        <div style={{ ...card, padding:24, marginBottom:24 }}>
          <h3 style={{ margin:'0 0 20px', fontSize:16 }}>Novo usuário</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
            <div><label style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#888', display:'block', marginBottom:5 }}>Nome *</label><input value={form.nome} onChange={e=>setForm(f=>({...f,nome:e.target.value}))} style={input}/></div>
            <div><label style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#888', display:'block', marginBottom:5 }}>E-mail *</label><input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} style={input}/></div>
            <div><label style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#888', display:'block', marginBottom:5 }}>Senha temporária *</label><input type="password" value={form.senha} onChange={e=>setForm(f=>({...f,senha:e.target.value}))} style={input}/></div>
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#888', display:'block', marginBottom:8 }}>Setor de acesso</label>
            <div style={{ display:'flex', gap:8, marginBottom:8 }}>
              {[{val:'todos',label:'Todos os posicionamentos'},{val:'posicionamento',label:'Posicionamento específico'}].map(o=>(
                <label key={o.val} style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, cursor:'pointer' }}>
                  <input type="radio" name="setor" checked={form.setor_tipo===o.val} onChange={()=>setForm(f=>({...f,setor_tipo:o.val}))} style={{ accentColor:'var(--cor-primaria)' }}/> {o.label}
                </label>
              ))}
            </div>
            {form.setor_tipo === 'posicionamento' && (
              <select value={form.setor_id} onChange={e=>setForm(f=>({...f,setor_id:e.target.value}))} style={select}>
                <option value="">Selecione o posicionamento...</option>
                {posicionamentos.map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            )}
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={criar} style={btn('var(--cor-primaria)')}>Criar usuário</button>
            <button onClick={()=>setCriando(false)} style={btn('#f0f0f0','#666')}>Cancelar</button>
          </div>
        </div>
      )}

      <div style={tableWrap}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr>
            <th style={th}>Nome</th><th style={th}>E-mail</th><th style={th}>Setor</th><th style={th}>Status</th><th style={th}>Ações</th>
          </tr></thead>
          <tbody>
            {usuarios.filter(u=>u.perfil==='usuario').map(u => (
              <tr key={u.id}>
                <td style={{ ...td, fontWeight:500 }}>{u.nome}</td>
                <td style={{ ...td, fontSize:13, color:'#666' }}>{u.email}</td>
                <td style={{ ...td, fontSize:13 }}>{u.setor_tipo==='todos' ? 'Todos' : posicionamentos.find(p=>p.id===u.setor_id)?.nome ?? '—'}</td>
                <td style={td}><span style={badge(u.ativo ? '#065F46' : '#666', u.ativo ? '#D1FAE5' : '#f0f0f0')}>{u.ativo ? 'Ativo' : 'Pausado'}</span></td>
                <td style={td}>
                  <button onClick={()=>toggleAtivo(u)} style={{ ...btn('#f0f0f0','#444'), marginRight:6 }}>{u.ativo ? '⏸️ Pausar' : '▶️ Ativar'}</button>
                  <button onClick={()=>remover(u)} style={btn('#FEE2E2','#991B1B')}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── CONFIGURAÇÕES ────────────────────────────────────────────

function Configuracoes({ ctx }: { ctx: AdminContext }) {
  const [form, setForm] = useState({ nome: ctx.escola.nome, cor_primaria: ctx.escola.cor_primaria, cor_secundaria: ctx.escola.cor_secundaria })
  const [saving, setSaving] = useState(false)
  const [logoFile, setLogoFile] = useState<File|null>(null)
  const [logoPreview, setLogoPreview] = useState(ctx.escola.logo_url)

  async function salvar() {
    setSaving(true)
    let logo_url = ctx.escola.logo_url
    if (logoFile) {
      const path = `logos/${ctx.escola.id}.${logoFile.name.split('.').pop()}`
      await supabase.storage.from('logos').upload(path, logoFile, { upsert: true })
      const { data } = supabase.storage.from('logos').getPublicUrl(path)
      logo_url = data.publicUrl
    }
    await supabase.from('escolas').update({ ...form, logo_url }).eq('id', ctx.escola.id)
    document.documentElement.style.setProperty('--cor-primaria', form.cor_primaria)
    document.documentElement.style.setProperty('--cor-secundaria', form.cor_secundaria)
    setSaving(false)
    alert('Configurações salvas!')
  }

  return (
    <div style={{ maxWidth:560 }}>
      <h2 style={{ margin:'0 0 24px', fontSize:22, fontWeight:700 }}>Configurações da escola</h2>
      <div style={{ ...card, padding:28, display:'flex', flexDirection:'column', gap:20 }}>

        <div>
          <label style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#888', display:'block', marginBottom:8 }}>Logo da escola</label>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            {logoPreview
              ? <img src={logoPreview} alt="" style={{ width:64, height:64, objectFit:'contain', borderRadius:8, border:'1px solid #eee' }}/>
              : <div style={{ width:64, height:64, borderRadius:8, background:'#f0f0f0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>🖼️</div>
            }
            <label style={{ ...btn('var(--cor-primaria)'), cursor:'pointer' }}>
              📎 Upload
              <input type="file" accept="image/*" style={{ display:'none' }} onChange={e=>{ const f=e.target.files?.[0]; if(f){ setLogoFile(f); setLogoPreview(URL.createObjectURL(f)) } }}/>
            </label>
          </div>
        </div>

        <div>
          <label style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#888', display:'block', marginBottom:5 }}>Nome da escola</label>
          <input value={form.nome} onChange={e=>setForm(f=>({...f,nome:e.target.value}))} style={input}/>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <div>
            <label style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#888', display:'block', marginBottom:5 }}>Cor primária</label>
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              <input type="color" value={form.cor_primaria} onChange={e=>setForm(f=>({...f,cor_primaria:e.target.value}))} style={{ width:48, height:40, borderRadius:8, border:'1px solid #ddd', cursor:'pointer' }}/>
              <input value={form.cor_primaria} onChange={e=>setForm(f=>({...f,cor_primaria:e.target.value}))} style={{ ...input, fontFamily:'monospace' }}/>
            </div>
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#888', display:'block', marginBottom:5 }}>Cor secundária</label>
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              <input type="color" value={form.cor_secundaria} onChange={e=>setForm(f=>({...f,cor_secundaria:e.target.value}))} style={{ width:48, height:40, borderRadius:8, border:'1px solid #ddd', cursor:'pointer' }}/>
              <input value={form.cor_secundaria} onChange={e=>setForm(f=>({...f,cor_secundaria:e.target.value}))} style={{ ...input, fontFamily:'monospace' }}/>
            </div>
          </div>
        </div>

        <div style={{ background:'#f8f8f8', borderRadius:10, padding:'14px 16px', fontSize:13, color:'#888' }}>
          <strong>Slug:</strong> {ctx.escola.slug} <span style={{ color:'#bbb' }}>(não editável)</span><br/>
          <strong>Plano:</strong> {ctx.escola.plano} · <strong>Status:</strong> {ctx.escola.status}
        </div>

        <button onClick={salvar} disabled={saving} style={{ ...btn('var(--cor-primaria)'), padding:'12px 24px', fontSize:15 }}>
          {saving ? 'Salvando...' : '💾 Salvar alterações'}
        </button>
      </div>
    </div>
  )
}

// ─── LOGIN ───────────────────────────────────────────────────

export function AdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  async function login(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setErro('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) { setErro('E-mail ou senha incorretos.'); setLoading(false); return }
    navigate('/admin/dashboard')
  }

  return (
    <div style={{ minHeight:'100vh', background:'#f5f5f5', display:'flex', alignItems:'center', justifyContent:'center', padding:20, fontFamily:'system-ui,sans-serif' }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        <div style={{ background:'var(--cor-primaria,#CC0000)', borderRadius:'12px 12px 0 0', padding:'32px 24px', textAlign:'center' }}>
          <div style={{ color:'var(--cor-secundaria,#C9A84C)', fontWeight:800, fontSize:20 }}>CadastroCarnaval</div>
          <div style={{ color:'rgba(255,255,255,0.7)', fontSize:14, marginTop:4 }}>Área administrativa</div>
        </div>
        <form onSubmit={login} style={{ background:'white', borderRadius:'0 0 12px 12px', padding:28, boxShadow:'0 4px 16px rgba(0,0,0,0.10)' }}>
          {erro && <div style={{ background:'#FEE2E2', color:'#991B1B', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:14 }}>{erro}</div>}
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#888', display:'block', marginBottom:5 }}>E-mail</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required style={input}/>
          </div>
          <div style={{ marginBottom:24 }}>
            <label style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#888', display:'block', marginBottom:5 }}>Senha</label>
            <input type="password" value={senha} onChange={e=>setSenha(e.target.value)} required style={input}/>
          </div>
          <button type="submit" disabled={loading} style={{ ...btn('var(--cor-primaria,#CC0000)'), width:'100%', justifyContent:'center', padding:'13px', fontSize:16 }}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <div style={{ textAlign:'center', marginTop:16, fontSize:12, color:'#ccc' }}>
          Powered by <a href="https://cadastrocarnaval.com.br" style={{ color:'#bbb' }}>cadastrocarnaval.com.br</a>
        </div>
      </div>
    </div>
  )
}

// ─── PAINEL ADMIN (entry point) ───────────────────────────────

export default function Admin() {
  const navigate = useNavigate()
  const { ctx, loading } = useAdminAuth()

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
      <div style={{ width:36, height:36, border:'3px solid #eee', borderTopColor:'var(--cor-primaria,#CC0000)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!ctx) return <Navigate to="/admin/login" replace/>

  return (
    <AdminLayout ctx={ctx}>
      <Routes>
        <Route index element={<Navigate to="dashboard" replace/>}/>
        <Route path="dashboard"   element={<Dashboard ctx={ctx}/>}/>
        <Route path="componentes" element={<Componentes ctx={ctx}/>}/>
        <Route path="links"       element={<Links ctx={ctx}/>}/>
        <Route path="estrutura"   element={<Estrutura ctx={ctx}/>}/>
        {ctx.perfil !== 'usuario' && <>
          <Route path="usuarios"  element={<Usuarios ctx={ctx}/>}/>
          <Route path="config"    element={<Configuracoes ctx={ctx}/>}/>
        </>}
      </Routes>
    </AdminLayout>
  )
}
