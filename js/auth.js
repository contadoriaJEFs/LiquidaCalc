// ============================================
// Auth Controller - ContadJus
// ============================================

// Modo de desenvolvimento (logs ativados)
const DEV_MODE = true;

// Referências aos elementos do DOM
const overlay = document.getElementById('authOverlay');
const loginForm = document.getElementById('authForm');
const emailInput = document.getElementById('authEmail');
const passwordInput = document.getElementById('authPassword');
const errorDiv = document.getElementById('authError');
const loginBtn = document.getElementById('authLoginBtn');
const btnText = document.getElementById('authBtnText');
const btnLoader = document.getElementById('authBtnLoader');
const forgotLink = document.getElementById('authForgotLink');
const logoutBtn = document.getElementById('authLogoutBtn');

// --- Utilitários de log (DEV_MODE) ---
function log(...args) {
  if (DEV_MODE) console.log('[AUTH]', ...args);
}

function logError(...args) {
  if (DEV_MODE) console.error('[AUTH]', ...args);
}

// --- Controle do overlay ---
function showOverlay() {
  overlay.classList.remove('auth-hidden');
  overlay.classList.add('auth-visible');
  logoutBtn.classList.remove('visible');
}

function hideOverlay() {
  overlay.classList.remove('auth-visible');
  overlay.classList.add('auth-hidden');
  logoutBtn.classList.add('visible');
}

// --- Exibir mensagem de erro ---
function showError(msg) {
  errorDiv.textContent = msg;
  errorDiv.classList.add('show');
}

function hideError() {
  errorDiv.classList.remove('show');
}

// --- Estado de loading do botão ---
function setLoading(loading) {
  if (loading) {
    loginBtn.disabled = true;
    btnText.textContent = 'Entrando...';
    btnLoader.style.display = 'inline-block';
  } else {
    loginBtn.disabled = false;
    btnText.textContent = 'Entrar';
    btnLoader.style.display = 'none';
  }
}

// --- Verificação de sessão ---
async function checkSession() {
  try {
    const { data: { session }, error } = await CONTADJUS.supabase.auth.getSession();
    if (error) throw error;
    if (session) {
      log('Sessão ativa:', session.user.email);
      hideOverlay();
    } else {
      log('Nenhuma sessão ativa.');
      showOverlay();
    }
  } catch (err) {
    logError('Erro ao verificar sessão:', err);
    showOverlay();
  }
}

// --- Login ---
async function handleLogin(e) {
  e.preventDefault();
  hideError();
  setLoading(true);

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    showError('Preencha e-mail e senha.');
    setLoading(false);
    return;
  }

  try {
    const { data, error } = await CONTADJUS.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    log('Login bem-sucedido:', data.user.email);
    hideOverlay();
    setLoading(false);
    // Limpa o formulário
    loginForm.reset();
  } catch (err) {
    logError('Falha no login:', err.message);
    showError(err.message || 'Erro ao autenticar. Verifique suas credenciais.');
    setLoading(false);
  }
}

// --- Logout ---
async function handleLogout() {
  try {
    const { error } = await CONTADJUS.supabase.auth.signOut();
    if (error) throw error;
    log('Logout efetuado.');
    showOverlay();
  } catch (err) {
    logError('Erro no logout:', err);
    // Mesmo com erro, tenta forçar exibição do overlay
    showOverlay();
  }
}

// --- Recuperação de senha ---
async function handleForgotPassword(e) {
  e.preventDefault();
  hideError();

  const email = emailInput.value.trim();
  if (!email) {
    showError('Informe seu e-mail para recuperação.');
    return;
  }

  try {
    const { error } = await CONTADJUS.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname,
    });
    if (error) throw error;

    alert('Enviamos um link de recuperação para o seu e-mail.');
    log('Recuperação enviada para:', email);
  } catch (err) {
    logError('Erro na recuperação:', err);
    showError(err.message || 'Não foi possível enviar o e-mail de recuperação.');
  }
}

// --- Event listeners ---
document.addEventListener('DOMContentLoaded', () => {
  log('DOM carregado. Inicializando autenticação...');

  // Verificar sessão inicial
  checkSession();

  // Login
  loginForm.addEventListener('submit', handleLogin);

  // Logout
  logoutBtn.addEventListener('click', handleLogout);

  // Recuperação de senha
  forgotLink.addEventListener('click', handleForgotPassword);

  // Escuta mudanças de autenticação (ex: expiração de sessão)
  CONTADJUS.supabase.auth.onAuthStateChange((event, session) => {
    log('Evento de auth:', event, session?.user?.email);

    if (event === 'SIGNED_IN' && session) {
      hideOverlay();
    } else if (event === 'SIGNED_OUT' || !session) {
      showOverlay();
    }
  });
});
