import { useEffect, useState } from 'react'
import { supabase, linkExpirado, horasRestantes } from '../lib/supabase'
import type { LinkCadastro, Escola } from '../lib/types'

type UseLinkResult = {
  link: LinkCadastro | null
  escola: Escola | null
  loading: boolean
  erro: string | null
  horasRestantes: number
}

export function useLink(token: string | undefined): UseLinkResult {
  const [link, setLink] = useState<LinkCadastro | null>(null)
  const [escola, setEscola] = useState<Escola | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [horas, setHoras] = useState(0)

  useEffect(() => {
    if (!token) {
      setErro('Link inválido.')
      setLoading(false)
      return
    }

    async function fetchLink() {
      const { data, error } = await supabase
        .from('links_cadastro')
        .select(`
          *,
          posicionamento:posicionamentos(*),
          funcao:funcoes(*)
        `)
        .eq('link_token', token)
        .single()

      if (error || !data) {
        setErro('Link não encontrado. Solicite um novo ao seu responsável.')
        setLoading(false)
        return
      }

      if (!data.ativo) {
        setErro('Este link está pausado. Fale com seu responsável.')
        setLoading(false)
        return
      }

      if (linkExpirado(data.expira_em)) {
        setErro('Este link expirou. Solicite um novo ao seu responsável.')
        setLoading(false)
        return
      }

      // Busca escola
      const { data: esc } = await supabase
        .from('escolas')
        .select('*')
        .eq('id', data.escola_id)
        .single()

      if (!esc || !esc.ativo || esc.status !== 'ativa') {
        setErro('Esta escola está indisponível no momento.')
        setLoading(false)
        return
      }

      if (esc.plano === 'trial' && new Date(esc.trial_fim) < new Date()) {
        setErro('O período de teste desta escola expirou.')
        setLoading(false)
        return
      }

      setLink(data)
      setEscola(esc)
      setHoras(horasRestantes(data.expira_em))

      // Aplica tema
      document.documentElement.style.setProperty('--cor-primaria', esc.cor_primaria)
      document.documentElement.style.setProperty('--cor-secundaria', esc.cor_secundaria)

      setLoading(false)
    }

    fetchLink()
  }, [token])

  return { link, escola, loading, erro, horasRestantes: horas }
}
