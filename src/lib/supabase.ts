import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── Helpers de validação ───────────────────────

export function limparCPF(cpf: string): string {
  return cpf.replace(/\D/g, '')
}

export function validarCPF(cpf: string): boolean {
  const c = limparCPF(cpf)
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(c[i]) * (10 - i)
  let r = (sum * 10) % 11
  if (r === 10 || r === 11) r = 0
  if (r !== parseInt(c[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(c[i]) * (11 - i)
  r = (sum * 10) % 11
  if (r === 10 || r === 11) r = 0
  return r === parseInt(c[10])
}

export function mascararCPF(cpf: string): string {
  const c = limparCPF(cpf)
  return c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export function cpfMascaradoExibicao(cpf: string): string {
  const c = limparCPF(cpf)
  return `***.***.${c.slice(6, 9)}-**`
}

export function linkExpirado(expira_em: string): boolean {
  return new Date(expira_em) < new Date()
}

export function horasRestantes(expira_em: string): number {
  const diff = new Date(expira_em).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / 3600000))
}

// ─── Verificações de CPF ────────────────────────

export async function verificarCpfAutorizado(
  cpf: string,
  linkToken: string,
  escolaId: string
): Promise<{
  autorizado: boolean
  jaEmUso: boolean
  motivo?: string
}> {
  const cpfLimpo = limparCPF(cpf)

  // 1. Verifica se CPF já está cadastrado na escola
  const { data: jaExiste } = await supabase
    .from('cadastros')
    .select('id')
    .eq('escola_id', escolaId)
    .eq('cpf', cpfLimpo)
    .single()

  if (jaExiste) {
    return {
      autorizado: false,
      jaEmUso: true,
      motivo: 'Este CPF já possui cadastro em nossa escola.'
    }
  }

  // 2. Verifica se CPF está na lista autorizada do link
  const { data: cpfAuth } = await supabase
    .from('cpfs_autorizados')
    .select('id, cadastrado')
    .eq('link_id', (
      await supabase
        .from('links_cadastro')
        .select('id')
        .eq('link_token', linkToken)
        .single()
        .then(r => r.data?.id)
    ))
    .eq('cpf', cpfLimpo)
    .single()

  if (!cpfAuth) {
    // Incrementa tentativa bloqueada
    await supabase.rpc('incrementar_tentativa', {
      p_escola_id: escolaId,
      p_cpf: cpfLimpo
    })
    return {
      autorizado: false,
      jaEmUso: false,
      motivo: 'Seu CPF não está autorizado neste cadastro. Fale com seu responsável.'
    }
  }

  return { autorizado: true, jaEmUso: false }
}
