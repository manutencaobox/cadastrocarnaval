// ⛔ ATENÇÃO: este arquivo usa a SUPABASE_SERVICE_ROLE_KEY, que ignora RLS.
// NUNCA importe este módulo em código do frontend React (componentes, páginas,
// hooks ou qualquer coisa alcançável a partir de src/main.tsx) — a chave seria
// exposta no bundle e daria acesso total ao banco.
// Uso permitido: SOMENTE scripts Node locais (ex: gerar convites em convites_admin).
import { createClient } from '@supabase/supabase-js'

// Script Node local — sem @types/node no projeto, então declaramos o mínimo.
declare const process: { env: Record<string, string | undefined> }

if (typeof window !== 'undefined') {
  throw new Error('supabaseAdmin não pode ser usado no navegador — somente em scripts Node locais.')
}

const url = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRoleKey) {
  throw new Error('Configure VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local')
}

export const supabaseAdmin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})
