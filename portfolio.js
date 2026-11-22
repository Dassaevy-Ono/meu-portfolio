const root = document.documentElement;
const dialog = document.querySelector('#preferencias');
const language = document.querySelector('#idioma');
const theme = document.querySelector('#tema');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const dark = matchMedia('(prefers-color-scheme: dark)');
const translated = [...document.querySelectorAll('[data-en]')].map(element => ({
  element, pt: element.textContent.trim(), en: element.dataset.en,
}));
const defaults = { language: 'pt', theme: 'system', accent: 'teal', size: 'normal',
  background: true, spotlight: true, motion: true };
let settings = { ...defaults };
try {
  const saved = JSON.parse(localStorage.getItem('portfolio-preferencias'));
  for (const [key, initial] of Object.entries(defaults)) {
    const control = dialog.querySelector('[name="' + key + '"]');
    const value = saved?.[key];
    if (typeof initial === 'boolean' ? typeof value === 'boolean' :
      [...control.options].some(option => option.value === value)) settings[key] = value;
  }
} catch {}
const hero = document.querySelector('.apresentacao');
const canvas = document.querySelector('#pontos');
const context = canvas.getContext('2d');
let pointer = null;
const queries = {
  projetos: { sql: 'SELECT projeto, plataforma FROM portfolio;', rows: [
    ['Portal da Câmara de Boa Vista do Ramos', 'Web'], ['Notícias do Ramos', 'Web'], ['NEXFIT', 'Mobile'],
  ] },
  tecnologias: { sql: 'SELECT tecnologia, projeto FROM tecnologias;', rows: [
    ['Supabase / Cloudflare Workers', 'Portal da Câmara'],
    ['Node.js / Express', 'Notícias do Ramos'], ['React Native / Expo', 'NEXFIT'],
  ] },
  backend: { sql: "SELECT projeto, plataforma\nFROM portfolio\nWHERE plataforma = 'Web';" },
};
queries.backend.rows = queries.projetos.rows.filter(([, platform]) => platform === 'Web');
let selectedQuery;
const queryButtons = [...document.querySelectorAll('[data-query]')];

function renderQuery() {
  const english = settings.language === 'en';
  const result = document.querySelector('#resultado');
  const query = queries[selectedQuery];
  document.querySelector('#sql').textContent = query?.sql ??
    (english ? '-- Choose a query' : '-- Escolha uma consulta');
  result.replaceChildren();
  if (!query) return;
  const table = document.createElement('table');
  const header = table.createTHead().insertRow();
  const columns = selectedQuery === 'tecnologias'
    ? (english ? ['Technology', 'Project'] : ['Tecnologia', 'Projeto'])
    : (english ? ['Project', 'Platform'] : ['Projeto', 'Plataforma']);
  for (const title of columns) {
    const cell = document.createElement('th');
    cell.scope = 'col';
    cell.textContent = title;
    header.append(cell);
  }
  const body = table.createTBody();
  for (const values of query.rows) {
    const row = body.insertRow();
    for (const value of values) {
      row.insertCell().textContent = english && value === 'Portal da Câmara'
        ? 'City Council portal' : english && value === 'Portal da Câmara de Boa Vista do Ramos'
          ? 'Boa Vista do Ramos City Council portal' : value;
    }
  }
  result.append(table);
}
function draw() {
  if (!context) return;
  const { width, height } = hero.getBoundingClientRect();
  const scale = Math.min(devicePixelRatio, 2);
  const pixelWidth = Math.round(width * scale);
  const pixelHeight = Math.round(height * scale);
  if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
  if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
  context.setTransform(scale, 0, 0, scale, 0, 0);
  context.clearRect(0, 0, width, height);
  if (!settings.background) return;

  const activePointer = reduced.matches || !settings.motion ? null : pointer;
  const radius = 74;
  const spacing = 26;
  const nodes = [];
  context.fillStyle = '#a5d2e6';
  context.globalAlpha = .16;
  context.beginPath();
  for (let x = spacing / 2; x < width; x += spacing) {
    for (let y = spacing / 2; y < height; y += spacing) {
      const distance = activePointer ? Math.hypot(x - activePointer.x, y - activePointer.y) : Infinity;
      if (distance < radius) {
        nodes.push({ x, y, strength: 1 - distance / radius });
      } else {
        context.moveTo(x + 1, y);
        context.arc(x, y, 1, 0, Math.PI * 2);
      }
    }
  }
  context.fill();

  context.strokeStyle = '#81e5ef';
  context.fillStyle = '#a5f0f7';
  context.lineWidth = .75;
  for (const [index, node] of nodes.entries()) {
    for (const peer of nodes.slice(index + 1)) {
      if (Math.hypot(node.x - peer.x, node.y - peer.y) > spacing * 1.45) continue;
      context.globalAlpha = .42 * Math.min(node.strength, peer.strength);
      context.beginPath();
      context.moveTo(node.x, node.y);
      context.lineTo(peer.x, peer.y);
      context.stroke();
    }
    context.globalAlpha = .2 + .72 * node.strength;
    context.beginPath();
    context.arc(node.x, node.y, 1 + 1.7 * node.strength, 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = 1;
}
function apply() {
  const english = settings.language === 'en';
  root.lang = english ? 'en' : 'pt-BR';
  document.title = english ? 'Dassaévy Ono | Junior Backend Development' : 'Dassaévy Ono | Desenvolvimento Backend Júnior';
  for (const { element, pt, en } of translated) element.textContent = english ? en : pt;
  language.textContent = english ? 'PT' : 'EN';
  language.setAttribute('aria-label', english ? 'Mudar para Português' : 'Switch to English');
  for (const [key, value] of Object.entries(settings)) {
    root.dataset[key] = value;
    const control = dialog.querySelector('[name="' + key + '"]');
    if (control.type === 'checkbox') control.checked = value;
    else control.value = value;
  }
  root.dataset.spotlight = settings.spotlight && !reduced.matches;
  renderQuery();
  draw();
}
function save() {
  try { localStorage.setItem('portfolio-preferencias', JSON.stringify(settings)); } catch {}
  apply();
}
document.querySelector('#abrir').addEventListener('click', () => dialog.showModal());
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const box = dialog.getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right ||
      event.clientY < box.top || event.clientY > box.bottom) dialog.close();
});
dialog.addEventListener('change', ({ target }) => {
  settings[target.name] = target.type === 'checkbox' ? target.checked : target.value;
  save();
});
document.querySelector('#restaurar').addEventListener('click', () => { settings = { ...defaults }; save(); });
language.addEventListener('click', () => { settings.language = settings.language === 'en' ? 'pt' : 'en'; save(); });
theme.addEventListener('click', () => {
  const currentlyDark = settings.theme === 'dark' || (settings.theme === 'system' && dark.matches);
  settings.theme = currentlyDark ? 'light' : 'dark';
  save();
});
for (const button of queryButtons) {
  button.addEventListener('click', () => {
    selectedQuery = button.dataset.query;
    for (const peer of queryButtons) peer.setAttribute('aria-pressed', peer === button);
    renderQuery();
  });
}
let frame;
function scheduleDraw() {
  if (frame) return;
  frame = requestAnimationFrame(() => { frame = null; draw(); });
}
hero.addEventListener('pointermove', event => {
  if (event.pointerType === 'touch') return;
  hero.dataset.pointer = 'true';
  const box = hero.getBoundingClientRect();
  pointer = { x: event.clientX - box.left, y: event.clientY - box.top };
  hero.style.setProperty('--x', pointer.x + 'px');
  hero.style.setProperty('--y', pointer.y + 'px');
  scheduleDraw();
});
function clearPointer() {
  pointer = null;
  delete hero.dataset.pointer;
  scheduleDraw();
}
hero.addEventListener('pointerleave', clearPointer);
hero.addEventListener('pointercancel', clearPointer);
window.addEventListener('blur', clearPointer);
new ResizeObserver(scheduleDraw).observe(hero);
dark.addEventListener('change', scheduleDraw);
reduced.addEventListener('change', apply);
const sectionLinks = [...document.querySelectorAll('.barra nav a')];
const observer = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    const link = sectionLinks.find(item => item.hash === '#' + entry.target.id);
    for (const item of sectionLinks) item.removeAttribute('aria-current');
    link?.setAttribute('aria-current', 'location');
    entry.target.classList.add('entrada');
  }
}, { rootMargin: '-25% 0px -45% 0px' });
for (const section of document.querySelectorAll('main section, #inicio')) observer.observe(section);
apply();

const copyButton = document.querySelector('#copiar');
const copyStatus = document.querySelector('#status-copia');
copyButton.hidden = !navigator.clipboard?.writeText;
copyButton.addEventListener('click', async () => {
  copyStatus.textContent = '';
  try {
    await navigator.clipboard.writeText(document.querySelector('#perfil').href);
    copyStatus.textContent = settings.language === 'en' ? 'Link copied.' : 'Link copiado.';
  } catch {
    copyStatus.textContent = settings.language === 'en'
      ? 'Could not copy the link. You can open the GitHub profile above.'
      : 'Não foi possível copiar o link. Você pode abrir o perfil do GitHub acima.';
  }
});
