-- ================================================
-- Retífica Mendonça - Setup Supabase
-- Execute este SQL no SQL Editor do Supabase
-- ================================================

-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  document TEXT DEFAULT '',
  whatsapp TEXT DEFAULT '',
  city TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Ordens de Serviço
CREATE TABLE IF NOT EXISTS orders (
  id BIGINT PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  motor_model TEXT DEFAULT '',
  displacement TEXT DEFAULT '',
  service_status TEXT DEFAULT 'Na Fila',
  payment_status TEXT DEFAULT 'Não Pago',
  payment_method TEXT,
  second_payment_method TEXT,
  entry_value NUMERIC DEFAULT 0,
  balance_value NUMERIC DEFAULT 0,
  parts_left TEXT[] DEFAULT '{}',
  additional_parts TEXT[] DEFAULT '{}',
  services JSONB DEFAULT '[]',
  discount NUMERIC DEFAULT 0,
  total_value NUMERIC DEFAULT 0,
  net_value NUMERIC DEFAULT 0,
  finished BOOLEAN DEFAULT false,
  delivery_date TEXT,
  arrival_date TEXT,
  observations TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas (acesso total via anon key - uso interno)
CREATE POLICY "Allow all access to clients" ON clients
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to orders" ON orders
  FOR ALL USING (true) WITH CHECK (true);
