const button = document.querySelector('.menu-button');
const nav = document.querySelector('.nav-links');
button?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  button.setAttribute('aria-expanded', open);
  button.textContent = open ? 'Close' : 'Menu';
});

const supabase = window.supabase?.createClient(
  window.NOVAX_SUPABASE?.url,
  window.NOVAX_SUPABASE?.publishableKey
);

async function updateAccountUI() {
  const { data: { user } = {} } = await supabase?.auth.getUser();
  if (!user) return;
  document.querySelectorAll('.login').forEach((link) => {
    link.textContent = user.email.split('@')[0];
    link.href = '#markets';
  });
  document.querySelectorAll('.button').forEach((link) => {
    if (/account/i.test(link.textContent)) link.textContent = 'Demo dashboard';
  });
}

async function openAccount(event) {
  event.preventDefault();
  if (!supabase) return alert('Supabase is not configured yet.');
  const { data: { user } = {} } = await supabase.auth.getUser();
  if (user) return document.querySelector('#markets').scrollIntoView({ behavior: 'smooth' });
  const email = prompt('Enter your email for the NOVAX demo:');
  if (!email) return;
  const password = prompt('Create a password (at least 6 characters):');
  if (!password) return;
  let result = await supabase.auth.signUp({ email, password });
  if (result.error?.message?.toLowerCase().includes('already')) {
    result = await supabase.auth.signInWithPassword({ email, password });
  }
  if (result.error) return alert(result.error.message);
  const account = result.data.user;
  if (account) await supabase.from('profiles').upsert({ id: account.id, display_name: email.split('@')[0] });
  alert('Demo account ready. Check your email if confirmation is enabled.');
  updateAccountUI();
}

document.querySelectorAll('a.button, .login').forEach((link) => {
  if (/account|log in|exploring/i.test(link.textContent)) link.addEventListener('click', openAccount);
});
updateAccountUI();

