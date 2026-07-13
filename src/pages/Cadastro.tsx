import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, validarCPF, limparCPF, verificarCpfAutorizado, mascararCPF } from '../lib/supabase'
import { useLink } from '../hooks/useLink'
import type { FormCadastro } from '../lib/types'

const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
             'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC',
             'SP','SE','TO']

const INITIAL: FormCadastro = {
  foto: null, nome_registro: '', nome_social: '', cpf: '',
  data_nascimento: '', foto_url: null,
  pronomes: '', identidade_genero: '', sexo_biologico: '',
  preferencia_fantasia: '', whatsapp: '', email: '',
  endereco: '', cidade: '', estado: '', instagram: '', tiktok: '',
  altura: '', peso: '', manequim: '', numero_sapato: '',
  busto: '', cintura: '', quadril: '',
  cor_pele: '', cor_cabelo: '', tipo_cabelo: '', comprimento_cabelo: '',
  tem_necessidade_especial: false,
  necessidade_mobilidade: false, necessidade_visual: false,
  necessidade_auditiva: false, necessidade_outra: null,
  ja_desfilou: null, aceite_lgpd: false, aceite_imagem: false,
  posicionamento_id: '', funcao_id: '', link_token_origem: null,
}

function mascaraCPF(v: string) {
  return v.replace(/\D/g,'').slice(0,11)
    .replace(/(\d{3})(\d)/,'$1.$2')
    .replace(/(\d{3})(\d)/,'$1.$2')
    .replace(/(\d{3})(\d{1,2})$/,'$1-$2')
}
function mascaraWhats(v: string) {
  return v.replace(/\D/g,'').slice(0,11)
    .replace(/(\d{2})(\d)/,'($1) $2')
    .replace(/(\d{5})(\d)/,'$1-$2')
}

export default function Cadastro() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { link, escola, loading, erro } = useLink(token)

  const [form, setForm] = useState<FormCadastro>(INITIAL)
  const [errors, setErrors] = useState<Partial<Record<keyof FormCadastro, string>>>({})
  const [cpfStatus, setCpfStatus] = useState<'idle'|'verificando'|'ok'|'erro'>('idle')
  const [cpfMensagem, setCpfMensagem] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [fotoPreview, setFotoPreview] = useState<string|null>(null)
  const [toast, setToast] = useState<{msg:string,tipo:'error'|'success'}|null>(null)

  function set(field: keyof FormCadastro, value: any) {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: undefined }))
  }

  function showToast(msg: string, tipo: 'error'|'success') {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 4000)
  }

  async function handleCPFBlur() {
    const cpf = limparCPF(form.cpf)
    if (cpf.length < 11) return
    if (!validarCPF(cpf)) {
      setCpfStatus('erro')
      setCpfMensagem('CPF inválido.')
      return
    }
    setCpfStatus('verificando')
    const result = await verificarCpfAutorizado(cpf, token!, escola!.id)
    if (!result.autorizado) {
      setCpfStatus('erro')
      setCpfMensagem(result.motivo!)
    } else {
      setCpfStatus('ok')
      setCpfMensagem('CPF autorizado ✓')
    }
  }

  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    set('foto', file)
    setFotoPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (cpfStatus !== 'ok') {
      showToast('Verifique o CPF antes de enviar.', 'error')
      return
    }

    const errs: Partial<Record<keyof FormCadastro, string>> = {}
    if (!form.nome_registro.trim()) errs.nome_registro = 'Obrigatório'
    if (!form.cpf) errs.cpf = 'Obrigatório'
    if (!form.data_nascimento) errs.data_nascimento = 'Obrigatório'
    if (!form.sexo_biologico) errs.sexo_biologico = 'Obrigatório'
    if (!form.whatsapp || form.whatsapp.replace(/\D/g,'').length < 10) errs.whatsapp = 'WhatsApp inválido'
    if (!form.email || !form.email.includes('@')) errs.email = 'E-mail inválido'
    if (form.tem_necessidade_especial === null || form.tem_necessidade_especial === undefined)
      errs.tem_necessidade_especial = 'Obrigatório'
    if (!form.aceite_lgpd) errs.aceite_lgpd = 'Necessário'
    if (!form.aceite_imagem) errs.aceite_imagem = 'Necessário'

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      showToast('Preencha todos os campos obrigatórios.', 'error')
      return
    }

    setSubmitting(true)
    try {
      let foto_url = null
      if (form.foto) {
        const ext = form.foto.name.split('.').pop()
        const path = `${escola!.id}/${Date.now()}.${ext}`
        const { error: ue } = await supabase.storage
          .from('fotos-componentes').upload(path, form.foto)
        if (!ue) {
          const { data: ud } = supabase.storage
            .from('fotos-componentes').getPublicUrl(path)
          foto_url = ud.publicUrl
        }
      }

      const { error: ie } = await supabase.from('cadastros').insert({
        escola_id: escola!.id,
        posicionamento_id: link!.posicionamento_id,
        funcao_id: link!.funcao_id,
        link_token_origem: token,
        foto_url,
        nome_registro: form.nome_registro,
        nome_social: form.nome_social || null,
        cpf: limparCPF(form.cpf),
        data_nascimento: form.data_nascimento,
        pronomes: form.pronomes || null,
        identidade_genero: form.identidade_genero || null,
        sexo_biologico: form.sexo_biologico,
        preferencia_fantasia: form.preferencia_fantasia || null,
        whatsapp: form.whatsapp,
        email: form.email,
        endereco: form.endereco || null,
        cidade: form.cidade || null,
        estado: form.estado || null,
        instagram: form.instagram || null,
        tiktok: form.tiktok || null,
        altura: form.altura || null,
        peso: form.peso || null,
        manequim: form.manequim || null,
        numero_sapato: form.numero_sapato || null,
        busto: form.busto || null,
        cintura: form.cintura || null,
        quadril: form.quadril || null,
        cor_pele: form.cor_pele || null,
        cor_cabelo: form.cor_cabelo || null,
        tipo_cabelo: form.tipo_cabelo || null,
        comprimento_cabelo: form.comprimento_cabelo || null,
        tem_necessidade_especial: form.tem_necessidade_especial,
        necessidade_mobilidade: form.necessidade_mobilidade || false,
        necessidade_visual: form.necessidade_visual || false,
        necessidade_auditiva: form.necessidade_auditiva || false,
        necessidade_outra: form.necessidade_outra || null,
        ja_desfilou: form.ja_desfilou,
        aceite_lgpd: true,
        aceite_imagem: true,
      })

      if (ie) throw ie

      // Marca CPF como cadastrado
      await supabase
        .from('cpfs_autorizados')
        .update({ cadastrado: true })
        .eq('escola_id', escola!.id)
        .eq('cpf', limparCPF(form.cpf))

      // Incrementa contador do link
      await supabase
        .from('links_cadastro')
        .update({ total_cadastros: (link!.total_cadastros || 0) + 1 })
        .eq('id', link!.id)

      const nome = form.nome_social || form.nome_registro
      navigate(`/confirmacao?` + new URLSearchParams({
        nome,
        escola: escola!.nome,
        posicionamento: link!.posicionamento?.nome ?? '',
        funcao: link!.funcao?.nome ?? '',
        cpf: mascararCPF(limparCPF(form.cpf)),
        cor_primaria: escola!.cor_primaria,
        cor_secundaria: escola!.cor_secundaria,
      }))
    } catch {
      showToast('Erro ao enviar cadastro. Tente novamente.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
      <div style={{ width:36, height:36, border:'3px solid #eee', borderTopColor:'#CC0000', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (erro || !link || !escola) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', gap:12, padding:24, textAlign:'center', color:'#888' }}>
      <p style={{ fontSize:48 }}>⚠️</p>
      <h2 style={{ color:'#333', margin:0 }}>Link indisponível</h2>
      <p>{erro}</p>
      <p style={{ fontSize:12, color:'#bbb' }}>cadastrocarnaval.com.br</p>
    </div>
  )

  const canSubmit = form.aceite_lgpd && form.aceite_imagem && !submitting && cpfStatus === 'ok'

  const s = (field: keyof FormCadastro) => errors[field] ? { borderColor:'#e53e3e' } : {}

  return (
    <div style={{ maxWidth:520, margin:'0 auto', paddingBottom:48 }}>

      {/* CABEÇALHO */}
      <div style={{ background: escola.cor_primaria, padding:'28px 20px 24px', textAlign:'center' }}>
        {escola.logo_url
          ? <img src={escola.logo_url} alt={escola.nome} style={{ width:72, height:72, objectFit:'contain', marginBottom:12, borderRadius:8 }}/>
          : <div style={{ width:72, height:72, borderRadius:'50%', background: escola.cor_secundaria, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', fontSize:22, fontWeight:800, color: escola.cor_primaria }}>
              {escola.nome.split(' ').filter(w=>w.length>2).slice(0,2).map(w=>w[0]).join('')}
            </div>
        }
        <div style={{ color: escola.cor_secundaria, fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>{escola.nome}</div>
        <div style={{ color:'white', fontSize:17, fontWeight:600, marginBottom:16 }}>Cadastro de Componentes</div>

        {/* Banner posicionamento + função */}
        <div style={{ background:'rgba(255,255,255,0.10)', border:`1px solid ${escola.cor_secundaria}`, borderRadius:10, padding:'12px 16px', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ fontSize:26 }}>📍</div>
          <div style={{ textAlign:'left', flex:1 }}>
            <div style={{ color: escola.cor_secundaria, fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:2 }}>Você está se cadastrando em</div>
            <div style={{ color:'white', fontSize:15, fontWeight:700, marginBottom:4 }}>{link.posicionamento?.nome}</div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:5, background: escola.cor_secundaria, color: escola.cor_primaria, fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>
              🔒 {link.funcao?.nome}
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ padding:'16px 16px 0', display:'flex', flexDirection:'column', gap:14 }}>

        {/* BLOCO 1 — IDENTIFICAÇÃO */}
        <Block titulo="Identificação" ico="🪪">
          <div onClick={() => document.getElementById('foto-input')?.click()} style={{ border:'2px dashed #ddd', borderRadius:10, padding:20, textAlign:'center', cursor:'pointer', background:'#fafafa' }}>
            {fotoPreview
              ? <img src={fotoPreview} alt="preview" style={{ width:80, height:80, borderRadius:'50%', objectFit:'cover', margin:'0 auto', display:'block' }}/>
              : <>
                  <div style={{ fontSize:32, marginBottom:6 }}>📷</div>
                  <div style={{ color:'#888', fontSize:13 }}>Envie uma foto do seu rosto de frente <span style={{ color:'#bbb' }}>(opcional)</span></div>
                  <div style={{ color:'#bbb', fontSize:11, marginTop:4 }}>Olhe diretamente para a câmera · JPG ou PNG até 5 MB</div>
                </>
            }
            <input id="foto-input" type="file" accept="image/jpeg,image/png" style={{ display:'none' }} onChange={handleFoto}/>
          </div>

          <Field label="Nome completo de registro" req>
            <input type="text" value={form.nome_registro} onChange={e=>set('nome_registro',e.target.value)} placeholder="Conforme seu documento" style={s('nome_registro')}/>
            {errors.nome_registro && <Err>{errors.nome_registro}</Err>}
          </Field>
          <Field label="Nome social">
            <input type="text" value={form.nome_social||''} onChange={e=>set('nome_social',e.target.value)} placeholder="Como prefere ser chamado(a/e)"/>
            <span style={{ fontSize:11, color:'#aaa' }}>Se preenchido, será usado em todas as comunicações da escola.</span>
          </Field>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <Field label="CPF" req>
              <input
                type="text"
                value={form.cpf}
                onChange={e=>{ set('cpf', mascaraCPF(e.target.value)); setCpfStatus('idle') }}
                onBlur={handleCPFBlur}
                placeholder="000.000.000-00"
                style={{ borderColor: cpfStatus==='erro' ? '#e53e3e' : cpfStatus==='ok' ? '#38a169' : undefined }}
              />
              {cpfStatus==='verificando' && <span style={{ fontSize:11, color:'#888' }}>Verificando...</span>}
              {cpfStatus==='ok' && <span style={{ fontSize:11, color:'#38a169' }}>{cpfMensagem}</span>}
              {cpfStatus==='erro' && <Err>{cpfMensagem}</Err>}
            </Field>
            <Field label="Data de nascimento" req>
              <input type="date" value={form.data_nascimento} onChange={e=>set('data_nascimento',e.target.value)} style={s('data_nascimento')}/>
              {errors.data_nascimento && <Err>{errors.data_nascimento}</Err>}
            </Field>
          </div>
        </Block>

        {/* BLOCO 2 — IDENTIDADE */}
        <Block titulo="Como você se identifica" ico="🤍">
          <Field label="Pronomes de preferência">
            <div style={{ display:'flex', flexWrap:'wrap', gap:7, marginTop:4 }}>
              {['Ela/dela','Ele/dele','Eles/deles','Outro','Prefiro não informar'].map(p=>(
                <label key={p} style={{ display:'flex', alignItems:'center', gap:6, border:`1px solid ${form.pronomes===p ? escola.cor_primaria : '#e0e0e0'}`, borderRadius:8, padding:'8px 12px', cursor:'pointer', fontSize:13, background: form.pronomes===p ? '#f5f5f5' : '#fafafa' }}>
                  <input type="radio" name="pronomes" checked={form.pronomes===p} onChange={()=>set('pronomes',p)} style={{ accentColor: escola.cor_primaria }}/> {p}
                </label>
              ))}
            </div>
          </Field>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <Field label="Identidade de gênero">
              <select value={form.identidade_genero||''} onChange={e=>set('identidade_genero',e.target.value)}>
                <option value="">Selecione...</option>
                {['Mulher cisgênero','Homem cisgênero','Mulher transgênero','Homem transgênero','Não-binário','Outro','Prefiro não informar'].map(o=><option key={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Sexo biológico" req>
              <select value={form.sexo_biologico} onChange={e=>set('sexo_biologico',e.target.value)} style={s('sexo_biologico')}>
                <option value="">Selecione...</option>
                <option>Feminino</option><option>Masculino</option>
              </select>
              <span style={{ fontSize:11, color:'#aaa' }}>Uso exclusivo do figurino.</span>
              {errors.sexo_biologico && <Err>{errors.sexo_biologico}</Err>}
            </Field>
          </div>
          <Field label="Preferência de modelo de fantasia">
            <select value={form.preferencia_fantasia||''} onChange={e=>set('preferencia_fantasia',e.target.value)}>
              <option value="">Selecione...</option>
              {['Modelo feminino','Modelo masculino','Modelo neutro','Sem preferência'].map(o=><option key={o}>{o}</option>)}
            </select>
          </Field>
        </Block>

        {/* BLOCO 3 — CONTATO */}
        <Block titulo="Contato" ico="📱">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <Field label="WhatsApp" req>
              <input type="tel" value={form.whatsapp} onChange={e=>set('whatsapp',mascaraWhats(e.target.value))} placeholder="(21) 99999-9999" style={s('whatsapp')}/>
              {errors.whatsapp && <Err>{errors.whatsapp}</Err>}
            </Field>
            <Field label="E-mail" req>
              <input type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="seu@email.com" style={s('email')}/>
              {errors.email && <Err>{errors.email}</Err>}
            </Field>
          </div>
          <Field label="Endereço">
            <input type="text" value={form.endereco||''} onChange={e=>set('endereco',e.target.value)} placeholder="Rua, número, bairro"/>
          </Field>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <Field label="Cidade"><input type="text" value={form.cidade||''} onChange={e=>set('cidade',e.target.value)} placeholder="Cidade"/></Field>
            <Field label="Estado">
              <select value={form.estado||''} onChange={e=>set('estado',e.target.value)}>
                <option value="">UF</option>
                {UFS.map(uf=><option key={uf}>{uf}</option>)}
              </select>
            </Field>
          </div>
          <div style={{ height:1, background:'#f0f0f0', margin:'4px 0' }}/>
          <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#bbb' }}>
            Redes sociais <span style={{ fontWeight:400 }}>(opcional)</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <Field label="Instagram"><input type="text" value={form.instagram||''} onChange={e=>set('instagram',e.target.value)} placeholder="@seuusuario"/></Field>
            <Field label="TikTok"><input type="text" value={form.tiktok||''} onChange={e=>set('tiktok',e.target.value)} placeholder="@seuusuario"/></Field>
          </div>
        </Block>

        {/* BLOCO 4 — MEDIDAS */}
        <Block titulo="Medidas" ico="📏">
          <a href="/ajuda/medidas" target="_blank" rel="noreferrer" style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(201,168,76,0.08)', border:`1px solid ${escola.cor_secundaria}`, borderRadius:8, padding:'10px 13px', textDecoration:'none', color:'#7a5500', fontSize:12, fontWeight:600 }}>
            📐 Como tirar suas medidas com fita métrica — veja o guia completo →
          </a>

          {/* Obrigatórias */}
          <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#CC0000' }}>
            Obrigatórias
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <Field label="① Altura" req><input value={form.altura||''} onChange={e=>set('altura',e.target.value)} placeholder="1,70 m"/></Field>
            <Field label="② Peso" req><input value={form.peso||''} onChange={e=>set('peso',e.target.value)} placeholder="70 kg"/></Field>
            <Field label="Manequim / Roupa" req><input value={form.manequim||''} onChange={e=>set('manequim',e.target.value)} placeholder="P / M / G / 38..."/></Field>
            <Field label="Número do sapato" req><input value={form.numero_sapato||''} onChange={e=>set('numero_sapato',e.target.value)} placeholder="38"/></Field>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
            <Field label="⑤ Tórax / Peito" req><input value={form.busto||''} onChange={e=>set('busto',e.target.value)} placeholder="90 cm"/></Field>
            <Field label="⑥ Cintura" req><input value={form.cintura||''} onChange={e=>set('cintura',e.target.value)} placeholder="70 cm"/></Field>
            <Field label="⑧ Quadril" req><input value={form.quadril||''} onChange={e=>set('quadril',e.target.value)} placeholder="95 cm"/></Field>
          </div>

          {/* Opcionais */}
          <div style={{ height:1, background:'#f0f0f0', margin:'4px 0' }}/>
          <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#aaa' }}>
            Opcionais — quanto mais completo, melhor para o figurino
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <Field label="③ Pescoço"><input value={form.pescoco||''} onChange={e=>set('pescoco',e.target.value)} placeholder="cm"/></Field>
            <Field label="④ Ombros"><input value={form.ombros||''} onChange={e=>set('ombros',e.target.value)} placeholder="cm"/></Field>
            <Field label="⑦ Abdômen"><input value={form.abdomen||''} onChange={e=>set('abdomen',e.target.value)} placeholder="cm"/></Field>
            <Field label="⑨ Braço"><input value={form.braco||''} onChange={e=>set('braco',e.target.value)} placeholder="cm"/></Field>
            <Field label="⑩ Antebraço"><input value={form.antebraco||''} onChange={e=>set('antebraco',e.target.value)} placeholder="cm"/></Field>
            <Field label="⑪ Punho"><input value={form.punho||''} onChange={e=>set('punho',e.target.value)} placeholder="cm"/></Field>
            <Field label="⑫ Comprimento do braço"><input value={form.comprimento_braco||''} onChange={e=>set('comprimento_braco',e.target.value)} placeholder="cm"/></Field>
            <Field label="⑬ Coxa"><input value={form.coxa||''} onChange={e=>set('coxa',e.target.value)} placeholder="cm"/></Field>
            <Field label="⑭ Joelho"><input value={form.joelho||''} onChange={e=>set('joelho',e.target.value)} placeholder="cm"/></Field>
            <Field label="⑮ Panturrilha"><input value={form.panturrilha||''} onChange={e=>set('panturrilha',e.target.value)} placeholder="cm"/></Field>
            <Field label="⑯ Tornozelo"><input value={form.tornozelo||''} onChange={e=>set('tornozelo',e.target.value)} placeholder="cm"/></Field>
            <Field label="⑰ Comprimento da perna"><input value={form.comprimento_perna||''} onChange={e=>set('comprimento_perna',e.target.value)} placeholder="cm"/></Field>
            <Field label="⑱ Entrepernas"><input value={form.entrepernas||''} onChange={e=>set('entrepernas',e.target.value)} placeholder="cm"/></Field>
          </div>
        </Block>

        {/* BLOCO 5 — PERFIL VISUAL */}
        <Block titulo="Perfil visual" ico="🎨">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <Field label="Cor da pele">
              <select value={form.cor_pele||''} onChange={e=>set('cor_pele',e.target.value)}>
                <option value="">Selecione...</option>
                {['Branca','Preta','Parda','Amarela','Indígena','Prefiro não informar'].map(o=><option key={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Cor do cabelo">
              <select value={form.cor_cabelo||''} onChange={e=>set('cor_cabelo',e.target.value)}>
                <option value="">Selecione...</option>
                {['Preto','Castanho escuro','Castanho claro','Loiro','Ruivo','Grisalho / Branco','Colorido / Tingido','Careca'].map(o=><option key={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Tipo do cabelo">
              <select value={form.tipo_cabelo||''} onChange={e=>set('tipo_cabelo',e.target.value)}>
                <option value="">Selecione...</option>
                {['Liso','Ondulado','Cacheado','Crespo'].map(o=><option key={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Comprimento">
              <select value={form.comprimento_cabelo||''} onChange={e=>set('comprimento_cabelo',e.target.value)}>
                <option value="">Selecione...</option>
                {['Careca / raspado','Curto','Médio','Longo','Muito longo'].map(o=><option key={o}>{o}</option>)}
              </select>
            </Field>
          </div>
        </Block>

        {/* BLOCO 6 — NECESSIDADES ESPECIAIS */}
        <Block titulo="Necessidades especiais" ico="♿">
          <Field label="Possui alguma necessidade especial?" req>
            <div style={{ display:'flex', gap:8, marginTop:4 }}>
              {[{label:'Não',val:false},{label:'Sim',val:true}].map(({label,val})=>(
                <label key={label} style={{ display:'flex', alignItems:'center', gap:6, border:`1px solid ${form.tem_necessidade_especial===val ? escola.cor_primaria : '#e0e0e0'}`, borderRadius:8, padding:'8px 16px', cursor:'pointer', fontSize:13, background: form.tem_necessidade_especial===val ? '#f5f5f5' : '#fafafa' }}>
                  <input type="radio" name="pcd" checked={form.tem_necessidade_especial===val} onChange={()=>set('tem_necessidade_especial',val)} style={{ accentColor: escola.cor_primaria }}/> {label}
                </label>
              ))}
            </div>
          </Field>

          {form.tem_necessidade_especial && (
            <div style={{ background:'#f8f8f8', borderRadius:8, border:'1px solid #eee', padding:12, display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#888' }}>Qual tipo? (pode marcar mais de um)</div>
              {[
                { key:'necessidade_mobilidade', ico:'🦽', label:'Mobilidade reduzida' },
                { key:'necessidade_visual',     ico:'👁️', label:'Deficiência visual' },
                { key:'necessidade_auditiva',   ico:'👂', label:'Deficiência auditiva' },
              ].map(({key,ico,label})=>(
                <label key={key} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 13px', border:`1px solid ${form[key as keyof FormCadastro] ? escola.cor_primaria : '#e0e0e0'}`, borderRadius:8, background: form[key as keyof FormCadastro] ? '#f5f5f5' : 'white', cursor:'pointer', fontSize:13 }}>
                  <input type="checkbox" checked={!!form[key as keyof FormCadastro]} onChange={e=>set(key as keyof FormCadastro, e.target.checked)} style={{ accentColor: escola.cor_primaria, width:17, height:17 }}/>
                  <span style={{ fontSize:18 }}>{ico}</span> {label}
                </label>
              ))}
              <label style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 13px', border:`1px solid ${form.necessidade_outra ? escola.cor_primaria : '#e0e0e0'}`, borderRadius:8, background: form.necessidade_outra ? '#f5f5f5' : 'white', cursor:'pointer', fontSize:13 }}>
                <input type="checkbox" checked={!!form.necessidade_outra} onChange={e=>set('necessidade_outra', e.target.checked ? ' ' : null)} style={{ accentColor: escola.cor_primaria, width:17, height:17 }}/>
                <span style={{ fontSize:18 }}>➕</span> Outra
              </label>
              {form.necessidade_outra && (
                <textarea
                  value={form.necessidade_outra.trim()}
                  onChange={e=>set('necessidade_outra',e.target.value)}
                  placeholder="Descreva brevemente sua necessidade..."
                  style={{ border:'1px solid #e0e0e0', borderRadius:8, padding:'10px 12px', fontSize:13, fontFamily:'inherit', resize:'none', minHeight:72, outline:'none', width:'100%' }}
                />
              )}
            </div>
          )}
        </Block>

        {/* BLOCO 7 — VÍNCULO TRAVADO */}
        <div style={{ background:'white', borderRadius:12, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
          <div style={{ background:'#666', padding:'11px 16px', display:'flex', alignItems:'center', gap:9 }}>
            <span>🔒</span>
            <span style={{ color:'white', fontSize:13, fontWeight:600 }}>Vínculo com a escola</span>
          </div>
          <div style={{ padding:16, display:'flex', flexDirection:'column', gap:8 }}>
            <p style={{ fontSize:11, color:'#aaa', margin:0 }}>Definido pelo responsável — não editável.</p>
            {[
              { label:'Escola', val: escola.nome },
              { label:'Posicionamento', val: link.posicionamento?.nome },
              { label:'Função', val: link.funcao?.nome },
            ].map(({label,val})=>(
              <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 12px', background:'#f5f5f5', borderRadius:8, border:'1px solid #e8e8e8' }}>
                <span style={{ fontSize:11, color:'#999' }}>{label}</span>
                <span style={{ fontSize:13, color:'#333', fontWeight:600 }}>{val} 🔒</span>
              </div>
            ))}
            <div style={{ height:1, background:'#eee', margin:'4px 0' }}/>
            <Field label="Já desfilou em nossa escola antes?" req>
              <div style={{ display:'flex', gap:8, marginTop:4 }}>
                {[{label:'Sim',val:true},{label:'Não, será meu primeiro desfile',val:false}].map(({label,val})=>(
                  <label key={label} style={{ display:'flex', alignItems:'center', gap:6, border:`1px solid ${form.ja_desfilou===val ? escola.cor_primaria : '#e0e0e0'}`, borderRadius:8, padding:'8px 12px', cursor:'pointer', fontSize:13, background: form.ja_desfilou===val ? '#f5f5f5' : '#fafafa' }}>
                    <input type="radio" name="desfilou" checked={form.ja_desfilou===val} onChange={()=>set('ja_desfilou',val)} style={{ accentColor: escola.cor_primaria }}/> {label}
                  </label>
                ))}
              </div>
            </Field>
          </div>
        </div>

        {/* BLOCO 8 — LGPD */}
        <div style={{ background:'white', borderRadius:12, padding:16, boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#666', marginBottom:12 }}>
            🛡️ Autorização e privacidade
          </div>
          {[
            { key:'aceite_lgpd', txt: `Autorizo a ${escola.nome} a coletar e utilizar meus dados pessoais para fins de organização e participação no desfile, conforme a LGPD (Lei nº 13.709/2018).` },
            { key:'aceite_imagem', txt: `Autorizo o uso da minha imagem em fotografias, vídeos e materiais relacionados às atividades e ao desfile da ${escola.nome}.` },
          ].map(({key,txt})=>(
            <label key={key} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:12, border:'1px solid #eee', borderRadius:8, marginBottom:8, background:'#fafafa', cursor:'pointer' }}>
              <input type="checkbox" checked={!!form[key as keyof FormCadastro]} onChange={e=>set(key as keyof FormCadastro, e.target.checked)} style={{ accentColor: escola.cor_primaria, width:17, height:17, flexShrink:0, marginTop:1 }}/>
              <span style={{ fontSize:12, color:'#444', lineHeight:1.6 }}>{txt}</span>
            </label>
          ))}
        </div>

        {/* BOTÃO */}
        <button type="submit" disabled={!canSubmit} style={{ width:'100%', background: canSubmit ? escola.cor_primaria : '#ccc', color:'white', border:'none', borderRadius:12, padding:15, fontSize:16, fontWeight:700, cursor: canSubmit ? 'pointer' : 'not-allowed', fontFamily:'inherit', transition:'background 0.2s' }}>
          {submitting ? 'Enviando...' : '✉️ Enviar cadastro'}
        </button>
        {(!form.aceite_lgpd || !form.aceite_imagem) && (
          <p style={{ textAlign:'center', fontSize:11, color:'#aaa', margin:0 }}>Marque as duas caixas acima para habilitar o envio.</p>
        )}
        <div style={{ textAlign:'center', fontSize:11, color:'#ccc', marginTop:8 }}>
          Powered by <a href="https://cadastrocarnaval.com.br" style={{ color:'#bbb' }}>cadastrocarnaval.com.br</a>
        </div>
      </form>

      {toast && (
        <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', background: toast.tipo==='error' ? '#c53030' : '#276749', color:'white', padding:'12px 24px', borderRadius:8, fontSize:14, zIndex:1000 }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

// Componentes auxiliares
function Block({ titulo, ico, children }: { titulo:string; ico:string; children:React.ReactNode }) {
  return (
    <div style={{ background:'white', borderRadius:12, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
      <div style={{ background:'var(--cor-primaria)', padding:'11px 16px', display:'flex', alignItems:'center', gap:9 }}>
        <span style={{ color:'var(--cor-secundaria)', fontSize:16 }}>{ico}</span>
        <span style={{ color:'white', fontSize:13, fontWeight:600 }}>{titulo}</span>
      </div>
      <div style={{ padding:16, display:'flex', flexDirection:'column', gap:13 }}>{children}</div>
    </div>
  )
}

function Field({ label, req, children }: { label:string; req?:boolean; children:React.ReactNode }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
      <label style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#888' }}>
        {label} {req && <span style={{ color:'var(--cor-primaria)' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

function Err({ children }: { children:React.ReactNode }) {
  return <span style={{ fontSize:11, color:'#e53e3e' }}>{children}</span>
}
