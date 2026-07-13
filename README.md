# CadastroCarnaval v2

Plataforma SaaS para gestão de componentes de escolas de samba.

## O que há de novo na v2

- Funções e posicionamentos separados e independentes
- Controle de acesso por CPF autorizado
- Links com validade de 48h e renovação
- Três níveis de perfil: Desenvolvedor, Administrador, Usuário
- Necessidades especiais (mobilidade, visual, auditiva, outra)
- Instagram e TikTok no cadastro
- Validação de CPF em tempo real no formulário
- Status da escola (configuração → aguardando → ativa → pausada)
- Foto frontal do rosto

## Deploy

### 1. Supabase

Crie um projeto em supabase.com e execute o arquivo `supabase_schema.sql` no SQL Editor.

Depois crie o bucket de fotos em Storage:
- Nome: `fotos-componentes`
- Acesso: público

### 2. Variáveis de ambiente

```
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key
```

### 3. Vercel

- Suba no GitHub
- Importe no Vercel
- Adicione as variáveis de ambiente
- Deploy automático

### 4. Primeiro acesso Desenvolvedor

No Supabase → Authentication → Users, crie um usuário.
Depois insira em `usuarios_admin`:

```sql
INSERT INTO usuarios_admin (user_id, escola_id, nome, email, perfil, setor_tipo)
VALUES ('[UUID]', NULL, 'Seu Nome', 'seu@email.com', 'desenvolvedor', 'todos');
```

## Estrutura do projeto

```
src/
├── lib/
│   ├── supabase.ts   — cliente + helpers de CPF e validação
│   └── types.ts      — todos os tipos TypeScript
├── hooks/
│   ├── useEscola.ts  — busca escola e aplica tema
│   └── useLink.ts    — busca link e valida token
├── pages/
│   ├── Cadastro.tsx  — formulário público universal
│   ├── Confirmacao.tsx — tela pós-cadastro
│   └── [admin pages em breve]
└── App.tsx           — rotas
```

## Fluxo do formulário

```
Componente acessa /cadastro/[token]
        ↓
useLink valida: ativo? expirado? escola ativa?
        ↓
Preenche CPF → verificação em tempo real
  ├── CPF não autorizado → bloqueado
  ├── CPF já cadastrado → bloqueado
  └── CPF autorizado → continua
        ↓
Preenche todos os blocos
        ↓
Marca os dois checkboxes de LGPD
        ↓
Envio → INSERT em cadastros
      → UPDATE em cpfs_autorizados (cadastrado=true)
      → UPDATE total_cadastros no link
        ↓
Redireciona para /confirmacao com dados
```
