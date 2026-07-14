import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Escola } from '../lib/types'

// Extrai o slug do subdomínio:
//   mox.cadastrocarnaval.com.br  → 'mox'
//   www.cadastrocarnaval.com.br  → null (landing page)
//   cadastrocarnaval.vercel.app  → null (3 partes)
//   localhost                    → null (dev; use ?escola=mox)
export function getSlugFromHostname(): string | null {
  const hostname = window.location.hostname
  const parts = hostname.split('.')

  if (parts.length >= 4 && parts[0] !== 'www') {
    return parts[0]
  }

  // Dev local: permite simular subdomínio com ?escola=mox
  const params = new URLSearchParams(window.location.search)
  return params.get('escola')
}

// Carrega a escola pelo slug informado ou, na ausência dele, pelo
// subdomínio atual. Sem slug e sem subdomínio → contexto global
// (landing), sem erro.
export function useEscola(slugParam?: string) {
  const slug = slugParam ?? getSlugFromHostname() ?? undefined
  const [escola, setEscola] = useState<Escola | null>(null)
  const [loading, setLoading] = useState(!!slug)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) {
      setLoading(false)
      return
    }

    async function fetchEscola() {
      const { data, error } = await supabase
        .from('escolas')
        .select('*')
        .eq('slug', slug)
        .eq('ativo', true)
        .single()

      if (error || !data) {
        setError('Escola não encontrada ou inativa.')
      } else {
        setEscola(data)
        // Aplica tema
        document.documentElement.style.setProperty('--cor-primaria', data.cor_primaria)
        document.documentElement.style.setProperty('--cor-secundaria', data.cor_secundaria)
      }
      setLoading(false)
    }

    fetchEscola()
  }, [slug])

  const escolaAtiva = escola?.status === 'ativa'
  const trialValido = escola
    ? new Date(escola.trial_fim) > new Date() || escola.plano !== 'trial'
    : false
  const podeReceberCadastros = escolaAtiva && trialValido

  return {
    escola,
    loading,
    error,
    podeReceberCadastros,
    corPrimaria: escola?.cor_primaria ?? '#CC0000',
    corSecundaria: escola?.cor_secundaria ?? '#C9A84C',
  }
}
