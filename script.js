const button = document.querySelector('.menu-button');
const nav = document.querySelector('.nav-links');
button?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  button.setAttribute('aria-expanded', open);
  button.textContent = open ? 'Close' : 'Menu';
});

