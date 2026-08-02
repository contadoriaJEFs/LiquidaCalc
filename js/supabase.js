// ============================================
// Supabase Client - Namespace CONTADJUS
// ============================================

// Cria o namespace se não existir
const CONTADJUS = CONTADJUS || {};

// Credenciais (substitua pelas suas)
CONTADJUS.SUPABASE_URL = 'https://seu-projeto.supabase.co';
CONTADJUS.SUPABASE_ANON_KEY = 'sua-chave-anon-publica';

// Inicializa o cliente Supabase
CONTADJUS.supabase = supabase.createClient(
  CONTADJUS.SUPABASE_URL,
  CONTADJUS.SUPABASE_ANON_KEY
);