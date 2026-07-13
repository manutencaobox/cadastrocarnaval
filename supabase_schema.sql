-- ════════════════════════════════════════════
-- CADASTROCARNAVAL — Schema v2
-- ════════════════════════════════════════════

-- PLANOS
CREATE TABLE planos_config (
  plano           TEXT PRIMARY KEY,
  max_alegorias   INTEGER NOT NULL,
  max_alas        INTEGER NOT NULL,
  max_componentes INTEGER NOT NULL,
  preco_mensal    DECIMAL(10,2)
);

INSERT INTO planos_config VALUES
  ('trial',   6, 20, 500,   0.00),
  ('basico',  4, 15, 500,  89.00),
  ('premium', 6, 30, 9999, 199.00);

-- ────────────────────────────────
-- FUNÇÕES (só Desenvolvedor altera)
-- ────────────────────────────────

CREATE TABLE funcoes (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome      TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN (
              'ala','alegoria','bateria',
              'carro_som','comissao','geral')),
  ativo     BOOLEAN DEFAULT true,
  ordem     INTEGER,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO funcoes (nome, categoria, ordem) VALUES
  ('Componente de Ala',      'ala',      1),
  ('Passista',               'ala',      2),
  ('Diretor de Ala',         'ala',      3),
  ('Diretor de Harmonia',    'ala',      4),
  ('Presidente de Ala',      'ala',      5),
  ('Apoio de Ala',           'ala',      6),
  ('Destaque de Chão',       'ala',      7),
  ('Componente de Alegoria', 'alegoria', 8),
  ('Destaque de Alegoria',   'alegoria', 9),
  ('Ritmista',               'bateria',  10),
  ('Mestre de Bateria',      'bateria',  11),
  ('Sub-mestre de Bateria',  'bateria',  12),
  ('Intérprete',             'carro_som',13),
  ('Auxiliar de Intérprete', 'carro_som',14),
  ('Componente de Comissão', 'comissao', 15),
  ('Diretor de Carnaval',    'geral',    16),
  ('Carnavalesco',           'geral',    17),
  ('Segurança',              'geral',    18),
  ('Apoio',                  'geral',    19);

-- ────────────────────────────────
-- ESCOLAS
-- ────────────────────────────────

CREATE TABLE escolas (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           TEXT UNIQUE NOT NULL,
  nome           TEXT NOT NULL,
  logo_url       TEXT,
  cor_primaria   TEXT DEFAULT '#CC0000',
  cor_secundaria TEXT DEFAULT '#C9A84C',
  plano          TEXT DEFAULT 'trial'
                 CHECK (plano IN ('trial','basico','premium')),
  status         TEXT DEFAULT 'configuracao'
                 CHECK (status IN (
                   'configuracao',
                   'aguardando',
                   'ativa',
                   'pausada'
                 )),
  trial_inicio   TIMESTAMPTZ DEFAULT NOW(),
  trial_fim      TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',
  ativo          BOOLEAN DEFAULT true,
  criado_em      TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────
-- USUÁRIOS ADMIN
-- ────────────────────────────────

CREATE TABLE usuarios_admin (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id),
  escola_id   UUID REFERENCES escolas(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  perfil      TEXT NOT NULL CHECK (perfil IN (
                'desenvolvedor',
                'administrador',
                'usuario'
              )),
  setor_tipo  TEXT CHECK (setor_tipo IN ('todos','posicionamento')),
  setor_id    UUID,
  ativo       BOOLEAN DEFAULT true,
  criado_em   TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────
-- POSICIONAMENTOS
-- ────────────────────────────────

CREATE TABLE posicionamentos (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id UUID REFERENCES escolas(id) ON DELETE CASCADE,
  tipo      TEXT NOT NULL CHECK (tipo IN (
              'geral','comissao_frente','alegoria',
              'ala','bateria','carro_som')),
  numero    INTEGER,
  nome      TEXT NOT NULL,
  ativo     BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ordem_desfile (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id         UUID REFERENCES escolas(id) ON DELETE CASCADE,
  posicionamento_id UUID REFERENCES posicionamentos(id),
  posicao           INTEGER NOT NULL,
  UNIQUE(escola_id, posicao)
);

-- ────────────────────────────────
-- LINKS DE CADASTRO
-- ────────────────────────────────

CREATE TABLE links_cadastro (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id         UUID REFERENCES escolas(id) ON DELETE CASCADE,
  posicionamento_id UUID REFERENCES posicionamentos(id),
  funcao_id         UUID REFERENCES funcoes(id),
  link_token        TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT,
  descricao         TEXT,
  criado_por        UUID REFERENCES usuarios_admin(id),
  criado_em         TIMESTAMPTZ DEFAULT NOW(),
  expira_em         TIMESTAMPTZ DEFAULT NOW() + INTERVAL '48 hours',
  ativo             BOOLEAN DEFAULT true,
  total_cadastros   INTEGER DEFAULT 0
);

CREATE TABLE cpfs_autorizados (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id     UUID REFERENCES links_cadastro(id) ON DELETE CASCADE,
  escola_id   UUID REFERENCES escolas(id) ON DELETE CASCADE,
  cpf         TEXT NOT NULL,
  nome_ref    TEXT,
  cadastrado  BOOLEAN DEFAULT false,
  cadastro_id UUID,
  tentativas  INTEGER DEFAULT 0,
  criado_em   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(escola_id, cpf)
);

-- ────────────────────────────────
-- CADASTROS (tabela unificada)
-- ────────────────────────────────

CREATE TABLE cadastros (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id         UUID REFERENCES escolas(id) ON DELETE CASCADE,
  posicionamento_id UUID REFERENCES posicionamentos(id),
  funcao_id         UUID REFERENCES funcoes(id),
  link_token_origem TEXT,

  -- IDENTIFICAÇÃO
  nome_registro     TEXT NOT NULL,
  nome_social       TEXT,
  cpf               TEXT NOT NULL,
  data_nascimento   DATE NOT NULL,
  foto_url          TEXT,

  -- IDENTIDADE
  pronomes             TEXT,
  identidade_genero    TEXT,
  sexo_biologico       TEXT NOT NULL,
  preferencia_fantasia TEXT,

  -- CONTATO
  whatsapp  TEXT NOT NULL,
  email     TEXT NOT NULL,
  endereco  TEXT,
  cidade    TEXT,
  estado    TEXT,
  instagram TEXT,
  tiktok    TEXT,

  -- MEDIDAS
  altura        TEXT,
  peso          TEXT,
  manequim      TEXT,
  numero_sapato TEXT,
  busto         TEXT,
  cintura       TEXT,
  quadril       TEXT,

  -- MEDIDAS OPCIONAIS
  pescoco           TEXT,
  ombros            TEXT,
  abdomen           TEXT,
  braco             TEXT,
  antebraco         TEXT,
  punho             TEXT,
  comprimento_braco TEXT,
  coxa              TEXT,
  joelho            TEXT,
  panturrilha       TEXT,
  tornozelo         TEXT,
  comprimento_perna TEXT,
  entrepernas       TEXT,

  -- PERFIL VISUAL
  cor_pele           TEXT,
  cor_cabelo         TEXT,
  tipo_cabelo        TEXT,
  comprimento_cabelo TEXT,

  -- NECESSIDADES ESPECIAIS
  tem_necessidade_especial BOOLEAN NOT NULL DEFAULT false,
  necessidade_mobilidade   BOOLEAN DEFAULT false,
  necessidade_visual       BOOLEAN DEFAULT false,
  necessidade_auditiva     BOOLEAN DEFAULT false,
  necessidade_outra        TEXT,

  -- HISTÓRICO
  ja_desfilou BOOLEAN,

  -- LGPD
  aceite_lgpd   BOOLEAN NOT NULL DEFAULT false,
  aceite_imagem BOOLEAN NOT NULL DEFAULT false,

  -- CONTROLE
  criado_em    TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  editado_por  UUID REFERENCES usuarios_admin(id),

  UNIQUE(escola_id, cpf)
);

-- ════════════════════════════════
-- ÍNDICES
-- ════════════════════════════════

CREATE INDEX idx_cadastros_escola        ON cadastros(escola_id);
CREATE INDEX idx_cadastros_cpf           ON cadastros(escola_id, cpf);
CREATE INDEX idx_cadastros_posicionamento ON cadastros(posicionamento_id);
CREATE INDEX idx_cadastros_funcao        ON cadastros(funcao_id);
CREATE INDEX idx_cpfs_escola_cpf         ON cpfs_autorizados(escola_id, cpf);
CREATE INDEX idx_links_token             ON links_cadastro(link_token);
CREATE INDEX idx_links_escola            ON links_cadastro(escola_id);
CREATE INDEX idx_posicionamentos_escola  ON posicionamentos(escola_id);

-- ════════════════════════════════
-- ROW LEVEL SECURITY
-- ════════════════════════════════

ALTER TABLE escolas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE posicionamentos   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordem_desfile     ENABLE ROW LEVEL SECURITY;
ALTER TABLE links_cadastro    ENABLE ROW LEVEL SECURITY;
ALTER TABLE cpfs_autorizados  ENABLE ROW LEVEL SECURITY;
ALTER TABLE cadastros         ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_admin    ENABLE ROW LEVEL SECURITY;

-- Público (formulário)
CREATE POLICY "publico_select_escolas"
  ON escolas FOR SELECT USING (true);

CREATE POLICY "publico_select_posicionamentos"
  ON posicionamentos FOR SELECT USING (true);

CREATE POLICY "publico_select_links"
  ON links_cadastro FOR SELECT USING (true);

CREATE POLICY "publico_select_cpfs"
  ON cpfs_autorizados FOR SELECT USING (true);

CREATE POLICY "publico_update_cpfs"
  ON cpfs_autorizados FOR UPDATE USING (true);

CREATE POLICY "publico_insert_cadastros"
  ON cadastros FOR INSERT WITH CHECK (true);

-- Admin — select
CREATE POLICY "admin_select_cadastros"
  ON cadastros FOR SELECT
  USING (escola_id IN (
    SELECT escola_id FROM usuarios_admin
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "admin_select_links"
  ON links_cadastro FOR SELECT
  USING (escola_id IN (
    SELECT escola_id FROM usuarios_admin
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "admin_select_cpfs"
  ON cpfs_autorizados FOR SELECT
  USING (escola_id IN (
    SELECT escola_id FROM usuarios_admin
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "admin_select_posicionamentos"
  ON posicionamentos FOR SELECT
  USING (escola_id IN (
    SELECT escola_id FROM usuarios_admin
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "admin_select_usuarios"
  ON usuarios_admin FOR SELECT
  USING (escola_id IN (
    SELECT escola_id FROM usuarios_admin
    WHERE user_id = auth.uid()
  ));

-- Admin — update
CREATE POLICY "admin_update_cadastros"
  ON cadastros FOR UPDATE
  USING (escola_id IN (
    SELECT escola_id FROM usuarios_admin
    WHERE user_id = auth.uid()
  ));

-- Admin — delete (só administrador e desenvolvedor)
CREATE POLICY "admin_delete_cadastros"
  ON cadastros FOR DELETE
  USING (escola_id IN (
    SELECT escola_id FROM usuarios_admin
    WHERE user_id = auth.uid()
    AND perfil IN ('desenvolvedor','administrador')
  ));

-- Admin — insert links
CREATE POLICY "admin_insert_links"
  ON links_cadastro FOR INSERT
  WITH CHECK (escola_id IN (
    SELECT escola_id FROM usuarios_admin
    WHERE user_id = auth.uid()
  ));

-- Admin — insert cpfs
CREATE POLICY "admin_insert_cpfs"
  ON cpfs_autorizados FOR INSERT
  WITH CHECK (escola_id IN (
    SELECT escola_id FROM usuarios_admin
    WHERE user_id = auth.uid()
  ));

-- Admin — insert posicionamentos
CREATE POLICY "admin_insert_posicionamentos"
  ON posicionamentos FOR INSERT
  WITH CHECK (escola_id IN (
    SELECT escola_id FROM usuarios_admin
    WHERE user_id = auth.uid()
    AND perfil IN ('desenvolvedor','administrador')
  ));

-- Admin — update posicionamentos
CREATE POLICY "admin_update_posicionamentos"
  ON posicionamentos FOR UPDATE
  USING (escola_id IN (
    SELECT escola_id FROM usuarios_admin
    WHERE user_id = auth.uid()
    AND perfil IN ('desenvolvedor','administrador')
  ));

-- GRANTs
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ════════════════════════════════
-- ESCOLA PILOTO: GRES MOX
-- ════════════════════════════════

INSERT INTO escolas (slug, nome, cor_primaria, cor_secundaria, plano, status)
VALUES ('mox', 'GRES Mox', '#1A1A1A', '#C9A84C', 'trial', 'ativa');

INSERT INTO posicionamentos (escola_id, tipo, nome) VALUES
  ((SELECT id FROM escolas WHERE slug='mox'), 'comissao_frente', 'Comissão de Frente'),
  ((SELECT id FROM escolas WHERE slug='mox'), 'alegoria', 'Alegoria 1 — Carro Abre-Alas'),
  ((SELECT id FROM escolas WHERE slug='mox'), 'ala', 'Ala 1'),
  ((SELECT id FROM escolas WHERE slug='mox'), 'ala', 'Ala 2'),
  ((SELECT id FROM escolas WHERE slug='mox'), 'alegoria', 'Alegoria 2 — Carro Central'),
  ((SELECT id FROM escolas WHERE slug='mox'), 'ala', 'Ala 3'),
  ((SELECT id FROM escolas WHERE slug='mox'), 'ala', 'Ala 4'),
  ((SELECT id FROM escolas WHERE slug='mox'), 'bateria', 'Bateria'),
  ((SELECT id FROM escolas WHERE slug='mox'), 'carro_som', 'Carro de Som'),
  ((SELECT id FROM escolas WHERE slug='mox'), 'geral', 'Geral');
