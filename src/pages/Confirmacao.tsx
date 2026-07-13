import { useSearchParams } from 'react-router-dom'

export default function Confirmacao() {
  const [p] = useSearchParams()
  const nome = p.get('nome') ?? 'Componente'
  const escola = p.get('escola') ?? ''
  const posicionamento = p.get('posicionamento') ?? ''
  const funcao = p.get('funcao') ?? ''
  const cpf = p.get('cpf') ?? ''
  const corPrimaria = p.get('cor_primaria') ?? '#CC0000'
  const corSecundaria = p.get('cor_secundaria') ?? '#C9A84C'

  const initials = escola.split(' ').filter(w=>w.length>2).slice(0,2).map(w=>w[0]).join('')

  return (
    <div style={{ maxWidth:520, margin:'0 auto', paddingBottom:48, fontFamily:'system-ui,sans-serif' }}>

      {/* Cabeçalho */}
      <div style={{ background: corPrimaria, padding:'28px 20px 24px', textAlign:'center' }}>
        <div style={{ width:72, height:72, borderRadius:'50%', background: corSecundaria, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', fontSize:22, fontWeight:800, color: corPrimaria }}>
          {initials}
        </div>
        <div style={{ color: corSecundaria, fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>{escola}</div>
        <div style={{ color:'white', fontSize:17, fontWeight:600 }}>Cadastro de Componentes</div>
      </div>

      <div style={{ padding:'40px 24px', textAlign:'center' }}>
        {/* Ícone de sucesso */}
        <div style={{
          width:80, height:80, borderRadius:'50%',
          background:`rgba(${corSecundaria},0.12)`,
          border:`3px solid ${corSecundaria}`,
          display:'flex', alignItems:'center', justifyContent:'center',
          margin:'0 auto 20px', fontSize:36,
          animation:'popIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275)'
        }}>✅</div>
        <style>{`@keyframes popIn{from{transform:scale(0.5);opacity:0}to{transform:scale(1);opacity:1}}`}</style>

        <h2 style={{ fontSize:26, fontWeight:700, color:'#1a1a1a', margin:'0 0 8px' }}>Cadastro realizado!</h2>
        <p style={{ color:'#666', fontSize:15, margin:'0 0 28px', lineHeight:1.6 }}>
          Bem-vindo(a/e), <strong>{nome}</strong>!<br/>
          Seu cadastro em <strong>{escola}</strong> foi recebido com sucesso.
        </p>

        {/* Card resumo */}
        <div style={{ background:'white', borderRadius:12, padding:'16px 20px', border:'1px solid #eee', marginBottom:24, textAlign:'left', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
          {[
            { label:'Nome', val: nome },
            { label:'Posicionamento', val: posicionamento },
            { label:'Função', val: funcao },
            { label:'CPF', val: cpf },
          ].map(({label,val})=>(
            <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f5f5f5' }}>
              <span style={{ fontSize:12, color:'#aaa' }}>{label}</span>
              <span style={{ fontSize:14, color:'#333', fontWeight:500 }}>{val}</span>
            </div>
          ))}
        </div>

        {/* Aviso de print */}
        <div style={{ background:'#fffbef', border:'1px solid #f0d060', borderRadius:10, padding:'14px 18px', color:'#7a6000', fontSize:13, lineHeight:1.6, marginBottom:20 }}>
          📱 <strong>Faça um print desta tela</strong> como comprovante do seu cadastro.
        </div>

        <div style={{ background:'#f0fff4', border:'1px solid #9ae6b4', borderRadius:10, padding:'14px 18px', color:'#276749', fontSize:13, lineHeight:1.6 }}>
          Em breve o responsável da sua alegoria entrará em contato pelo WhatsApp cadastrado.
        </div>
      </div>

      <div style={{ textAlign:'center', padding:'0 0 32px', color:'#ccc', fontSize:12 }}>
        Powered by <a href="https://cadastrocarnaval.com.br" style={{ color:'#bbb' }}>cadastrocarnaval.com.br</a>
      </div>
    </div>
  )
}
