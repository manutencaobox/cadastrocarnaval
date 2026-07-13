import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Escola } from '../lib/types'

export function useEscola(slug: string | undefined) {
  const [escola, setEscola] = useState<Escola | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) {
      setError('Escola não encontrada.')
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
