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

-- ─── Trigger pós-cadastro ────────────────────────────────────────
-- O cliente anônimo não tem permissão de UPDATE em links_cadastro /
-- cpfs_autorizados (RLS). Este trigger roda como SECURITY DEFINER e
-- cuida do contador do link e da marcação do CPF após cada INSERT.
CREATE OR REPLACE FUNCTION pos_cadastro()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $fn$
BEGIN
  IF NEW.link_token_origem IS NOT NULL THEN
    UPDATE links_cadastro
       SET total_cadastros = total_cadastros + 1
     WHERE link_token = NEW.link_token_origem;
  END IF;
  UPDATE cpfs_autorizados
     SET cadastrado = true, cadastro_id = NEW.id
   WHERE escola_id = NEW.escola_id AND cpf = NEW.cpf;
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_pos_cadastro ON cadastros;
CREATE TRIGGER trg_pos_cadastro
  AFTER INSERT ON cadastros
  FOR EACH ROW EXECUTE FUNCTION pos_cadastro();

-- ─── Funções por escola ──────────────────────────────────────────
-- Cada escola ativa as funções do catálogo global que deseja usar.
-- Sem registros para uma escola = todas as funções ativas (fallback).
CREATE TABLE IF NOT EXISTS escola_funcoes (
  escola_id UUID NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  funcao_id UUID NOT NULL REFERENCES funcoes(id) ON DELETE CASCADE,
  ativo     BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (escola_id, funcao_id)
);

ALTER TABLE escola_funcoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_select_escola_funcoes" ON escola_funcoes
  FOR SELECT USING (
    escola_id IN (SELECT escola_id FROM usuarios_admin WHERE user_id = auth.uid())
  );

CREATE POLICY "admin_insert_escola_funcoes" ON escola_funcoes
  FOR INSERT WITH CHECK (
    escola_id IN (
      SELECT escola_id FROM usuarios_admin
      WHERE user_id = auth.uid() AND perfil IN ('administrador', 'desenvolvedor')
    )
  );

CREATE POLICY "admin_update_escola_funcoes" ON escola_funcoes
  FOR UPDATE USING (
    escola_id IN (
      SELECT escola_id FROM usuarios_admin
      WHERE user_id = auth.uid() AND perfil IN ('administrador', 'desenvolvedor')
    )
  );

CREATE POLICY "publico_select_escola_funcoes" ON escola_funcoes
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_escola_funcoes_escola ON escola_funcoes(escola_id);

-- ─── Convites de admin por link ──────────────────────────────────
-- O token do convite é o segredo; a tabela NÃO tem leitura pública.
-- O fluxo público usa as RPCs convite_info / aceitar_convite
-- (SECURITY DEFINER), que operam apenas sobre o token informado.
CREATE TABLE IF NOT EXISTS convites_admin (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id   UUID NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
  token       TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::TEXT,
  email       TEXT,
  perfil      TEXT NOT NULL DEFAULT 'administrador',
  criado_por  UUID REFERENCES usuarios_admin(id),
  criado_em   TIMESTAMPTZ DEFAULT NOW(),
  expira_em   TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  usado_em    TIMESTAMPTZ,
  usado_por   UUID REFERENCES auth.users(id)
);

ALTER TABLE convites_admin ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gestor_select_convites" ON convites_admin
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM usuarios_admin ua
      WHERE ua.user_id = auth.uid()
        AND (ua.perfil = 'desenvolvedor' OR ua.escola_id = convites_admin.escola_id)
    )
  );

CREATE POLICY "gestor_insert_convites" ON convites_admin
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios_admin ua
      WHERE ua.user_id = auth.uid()
        AND (ua.perfil = 'desenvolvedor'
             OR (ua.perfil = 'administrador' AND ua.escola_id = convites_admin.escola_id))
    )
  );

CREATE OR REPLACE FUNCTION convite_info(p_token text)
RETURNS TABLE (escola_nome text, logo_url text, cor_primaria text, cor_secundaria text, expira_em timestamptz, status text)
SECURITY DEFINER SET search_path = public LANGUAGE plpgsql AS $fn$
DECLARE c convites_admin%ROWTYPE;
BEGIN
  SELECT * INTO c FROM convites_admin WHERE token = p_token;
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::text, NULL::text, NULL::text, NULL::text, NULL::timestamptz, 'nao_encontrado'::text;
    RETURN;
  END IF;
  RETURN QUERY
  SELECT e.nome, e.logo_url, e.cor_primaria, e.cor_secundaria, c.expira_em,
         CASE WHEN c.usado_em IS NOT NULL THEN 'usado'
              WHEN c.expira_em < NOW() THEN 'expirado'
              ELSE 'valido' END
    FROM escolas e WHERE e.id = c.escola_id;
END;
$fn$;

CREATE OR REPLACE FUNCTION aceitar_convite(p_token text, p_nome text, p_user_id uuid, p_email text)
RETURNS void SECURITY DEFINER SET search_path = public LANGUAGE plpgsql AS $fn$
DECLARE c convites_admin%ROWTYPE;
BEGIN
  SELECT * INTO c FROM convites_admin WHERE token = p_token FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Convite nao encontrado'; END IF;
  IF c.usado_em IS NOT NULL THEN RAISE EXCEPTION 'Convite ja utilizado'; END IF;
  IF c.expira_em < NOW() THEN RAISE EXCEPTION 'Convite expirado'; END IF;
  INSERT INTO usuarios_admin (user_id, escola_id, nome, email, perfil, setor_tipo)
  VALUES (p_user_id, c.escola_id, p_nome, p_email, c.perfil, 'todos');
  UPDATE convites_admin SET usado_em = NOW(), usado_por = p_user_id WHERE id = c.id;
END;
$fn$;
