export type Plano = 'trial' | 'basico' | 'premium'
export type StatusEscola = 'configuracao' | 'aguardando' | 'ativa' | 'pausada'
export type Perfil = 'desenvolvedor' | 'administrador' | 'usuario'
export type TipoPosicionamento =
  | 'geral' | 'comissao_frente' | 'alegoria'
  | 'ala' | 'bateria' | 'carro_som'
export type CategoriaFuncao =
  | 'ala' | 'alegoria' | 'bateria'
  | 'carro_som' | 'comissao' | 'geral'

export type Escola = {
  id: string
  slug: string
  nome: string
  logo_url: string | null
  cor_primaria: string
  cor_secundaria: string
  plano: Plano
  status: StatusEscola
  trial_inicio: string
  trial_fim: string
  ativo: boolean
  criado_em: string
}

export type Funcao = {
  id: string
  nome: string
  categoria: CategoriaFuncao
  ativo: boolean
  ordem: number
}

export type Posicionamento = {
  id: string
  escola_id: string
  tipo: TipoPosicionamento
  numero: number | null
  nome: string
  ativo: boolean
  criado_em: string
}

export type OrdemDesfile = {
  id: string
  escola_id: string
  posicionamento_id: string
  posicao: number
}

export type UsuarioAdmin = {
  id: string
  user_id: string
  escola_id: string
  nome: string
  email: string
  perfil: Perfil
  setor_tipo: 'todos' | 'posicionamento' | null
  setor_id: string | null
  ativo: boolean
  criado_em: string
}

export type LinkCadastro = {
  id: string
  escola_id: string
  posicionamento_id: string
  funcao_id: string
  link_token: string
  descricao: string | null
  criado_por: string
  criado_em: string
  expira_em: string
  ativo: boolean
  total_cadastros: number
  // joins
  posicionamento?: Posicionamento
  funcao?: Funcao
}

export type CpfAutorizado = {
  id: string
  link_id: string
  escola_id: string
  cpf: string
  nome_ref: string | null
  cadastrado: boolean
  cadastro_id: string | null
  tentativas: number
  criado_em: string
}

export type Cadastro = {
  id: string
  escola_id: string
  posicionamento_id: string
  funcao_id: string
  link_token_origem: string | null

  // Identificação
  nome_registro: string
  nome_social: string | null
  cpf: string
  data_nascimento: string
  foto_url: string | null

  // Identidade
  pronomes: string | null
  identidade_genero: string | null
  sexo_biologico: string
  preferencia_fantasia: string | null

  // Contato
  whatsapp: string
  email: string
  endereco: string | null
  cidade: string | null
  estado: string | null
  instagram: string | null
  tiktok: string | null

  // Medidas obrigatórias
  altura: string | null
  peso: string | null
  manequim: string | null
  numero_sapato: string | null
  busto: string | null
  cintura: string | null
  quadril: string | null

  // Medidas opcionais
  pescoco: string | null
  ombros: string | null
  abdomen: string | null
  braco: string | null
  antebraco: string | null
  punho: string | null
  comprimento_braco: string | null
  coxa: string | null
  joelho: string | null
  panturrilha: string | null
  tornozelo: string | null
  comprimento_perna: string | null
  entrepernas: string | null

  // Perfil visual
  cor_pele: string | null
  cor_cabelo: string | null
  tipo_cabelo: string | null
  comprimento_cabelo: string | null

  // Necessidades especiais
  tem_necessidade_especial: boolean
  necessidade_mobilidade: boolean | null
  necessidade_visual: boolean | null
  necessidade_auditiva: boolean | null
  necessidade_outra: string | null

  // Histórico
  ja_desfilou: boolean | null

  // LGPD
  aceite_lgpd: boolean
  aceite_imagem: boolean

  // Controle
  criado_em: string
  atualizado_em: string
  editado_por: string | null

  // Joins
  posicionamento?: Posicionamento
  funcao?: Funcao
}

// Formulário — estado local
export type FormCadastro = Omit<Cadastro,
  'id' | 'escola_id' | 'criado_em' | 'atualizado_em' |
  'editado_por' | 'posicionamento' | 'funcao'
> & {
  foto: File | null
}

// Funções bloqueadas para usuário
export const FUNCOES_BLOQUEADAS_USUARIO = [
  'Diretor de Carnaval',
  'Carnavalesco'
]
