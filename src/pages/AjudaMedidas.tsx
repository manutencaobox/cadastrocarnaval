export default function AjudaMedidas() {
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 20px 48px', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 13, color: '#aaa', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          CadastroCarnaval
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a1a', margin: '0 0 8px' }}>
          Guia de Medidas
        </h1>
        <p style={{ color: '#888', fontSize: 14, margin: 0 }}>
          Use a imagem abaixo como referência para tirar todas as suas medidas com fita métrica.
        </p>
      </div>

      {/* Dica rápida */}
      <div style={{ background: '#fffbef', border: '1px solid #f0d060', borderRadius: 12, padding: '14px 18px', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>💡</span>
        <div style={{ fontSize: 13, color: '#7a6000', lineHeight: 1.7 }}>
          <strong>Antes de começar:</strong> use roupas leves (camiseta fina e short ou legging), fique em pé com postura natural e anote tudo em <strong>centímetros (cm)</strong> e <strong>quilogramas (kg)</strong>. Não aperte nem deixe a fita métrica frouxa.
        </div>
      </div>

      {/* Imagem do guia */}
      <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', marginBottom: 28 }}>
        <img
          src="/guia-medidas.png"
          alt="Manual para tirar as medidas da fantasia — guia completo com 18 medidas"
          style={{ width: '100%', display: 'block' }}
        />
      </div>

      {/* Medidas obrigatórias */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #eee', padding: '20px 24px', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ background: '#CC0000', color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Obrigatórias</span>
          Medidas essenciais para o cadastro
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13, color: '#444' }}>
          {['① Altura','② Peso','⑤ Tórax (Peito)','⑥ Cintura','⑧ Quadril','Manequim / Roupa','Número do sapato'].map(m => (
            <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 10px', background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0' }}>
              <span style={{ color: '#CC0000' }}>✓</span> {m}
            </div>
          ))}
        </div>
      </div>

      {/* Medidas opcionais */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #eee', padding: '20px 24px', marginBottom: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ background: '#f0f0f0', color: '#666', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Opcionais</span>
          Quanto mais completo, melhor para o figurino
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13, color: '#666' }}>
          {['③ Pescoço','④ Ombros','⑦ Abdômen','⑨ Braço','⑩ Antebraço','⑪ Punho','⑫ Comprimento do braço','⑬ Coxa','⑭ Joelho','⑮ Panturrilha','⑯ Tornozelo','⑰ Comprimento da perna','⑱ Entrepernas'].map(m => (
            <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 10px', background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0' }}>
              <span style={{ color: '#aaa' }}>○</span> {m}
            </div>
          ))}
        </div>
      </div>

      {/* Botão fechar */}
      <div style={{ textAlign: 'center' }}>
        <button onClick={() => window.close()} style={{ background: '#1a1a1a', color: 'white', border: 'none', borderRadius: 10, padding: '12px 32px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          ← Fechar e voltar ao cadastro
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: '#ddd' }}>
        cadastrocarnaval.com.br
      </div>
    </div>
  )
}
