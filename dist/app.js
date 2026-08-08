const API = 'https://sarkari-api-d1-zip.sonukalakhari76.workers.dev';
const LABELS = {
  latestjob: 'Latest Job', result: 'Result', admitcard: 'Admit Card',
  online: 'New Vacancy', admission: 'Admission', answerkey: 'Answer Key'
};
const TABS = [
  { to: '/', label: 'Home' },
  { to: '/section/latestjob', label: 'Latest Job' },
  { to: '/section/result', label: 'Result' },
  { to: '/section/online', label: 'New Vacancy' },
  { to: '/section/admitcard', label: 'Admit Card' },
];

function escapeHtml(s){
  return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function $(sel, el=document){ return el.querySelector(sel); }
async function api(path){
  const r = await fetch(API + path);
  if(!r.ok) throw new Error('API '+r.status);
  return r.json();
}
function setTheme(t){
  document.documentElement.setAttribute('data-theme', t);
  try{ localStorage.setItem('sp-theme', t); }catch(e){}
}
function getTheme(){
  try{ return localStorage.getItem('sp-theme')||'light'; }catch(e){ return 'light'; }
}

function renderShell(activePath){
  setTheme(getTheme());
  const tabs = TABS.map(t=>{
    const active = t.to==='/' ? activePath==='/' : activePath.startsWith(t.to);
    return `<a class="nav-tab${active?' active':''}" href="#${t.to}">${t.label}</a>`;
  }).join('');
  return `
  <header class="topbar">
    <a href="#/" class="brand"><span class="brand-mark">SP</span><span>Sarkari Paper</span></a>
    <div class="topbar-actions">
      <a href="#/search" class="icon-btn" aria-label="Search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3-3"/></svg>
      </a>
      <button type="button" class="icon-btn" id="themeBtn" aria-label="Theme">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 14.5A8.5 8.5 0 1 1 9.5 3a7 7 0 0 0 11.5 11.5z"/></svg>
      </button>
      <button type="button" class="icon-btn" id="menuBtn" aria-label="Menu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
    </div>
  </header>
  <nav class="nav-tabs"><div class="nav-tabs-inner">${tabs}</div></nav>
  <main class="page" id="app"></main>
  <footer class="site-footer">
    <div class="footer-brand">Sarkari Paper</div>
    <p class="footer-made">Made by <strong>Mitt Ydv</strong></p>
    <div class="footer-socials">
      <a class="social-btn wa" href="https://whatsapp.com/channel/0029Va5IElwBlHpVBd6i5a18" target="_blank" rel="noopener" aria-label="WhatsApp">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </a>
      <a class="social-btn tg" href="https://t.me/SarkariResult2012" target="_blank" rel="noopener" aria-label="Telegram">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
      </a>
    </div>
    <p class="footer-copy">© ${new Date().getFullYear()} Sarkari Paper · Govt jobs, results & admit cards</p>
  </footer>
  <div id="drawerRoot"></div>`;
}

function jobRows(list, limit){
  const items = (list||[]).slice(0, limit ?? 999);
  if(!items.length) return '<div class="empty">No updates yet</div>';
  return '<ul class="job-list">'+items.map(j=>`
    <li><a class="job-row" href="#/job/${encodeURIComponent(j.slug)}">
      <span class="job-row-bullet"></span>
      <span class="job-row-title">${escapeHtml(j.title)}</span>
    </a></li>`).join('')+'</ul>';
}

function board(title, emoji, key, cls, listings, limit=20){
  const n = Math.min((listings||[]).length, limit);
  return `<section class="board">
    <div class="board-head ${cls}">
      <h2 class="board-title"><span>${emoji}</span> ${title}${n?` <span class="board-badge">${n}</span>`:''}</h2>
      <a class="view-more" href="#/section/${key}">View More →</a>
    </div>
    ${jobRows(listings, limit)}
  </section>`;
}

function aboutHtml(){
  return `<section class="about-box">
    <h2>About Sarkari Paper</h2>
    <p><strong>Sarkari Paper</strong> ek free platform hai jahan aap latest government jobs, admit cards, results aur vacancies ek jagah dekh sakte ho.</p>
    <p>SSC, Banking, Railway, UPSC, State PSC aur dusri bharti updates regular update hoti rehti hain. Apply se pehle hamesha official notification check karein.</p>
    <p>Site mobile aur computer dono par comfortably chalane ke liye design ki gayi hai. Made by <strong>Mitt Ydv</strong>.</p>
  </section>
  <section class="faq-box">
    <h2>FAQ</h2>
    <div class="faq-item"><strong>Sarkari Paper kya hai?</strong><p>Government job, result aur admit card ki latest information dene wala free website.</p></div>
    <div class="faq-item"><strong>Kya yahan se form apply hota hai?</strong><p>Nahi. Yahan details milti hain; Apply Online button se official website khulti hai jahan form bhara jata hai.</p></div>
    <div class="faq-item"><strong>Updates kitni jaldi aate hain?</strong><p>Naye jobs, results aur admit cards regular sync se add hote rehte hain.</p></div>
    <div class="faq-item"><strong>Mobile par chhote dikhe to?</strong><p>Browser zoom (pinch / Ctrl +) se bada-chhota kar sakte ho — layout har screen ke hisaab se adjust hota hai.</p></div>
  </section>`;
}

async function pageHome(root){
  root.innerHTML = '<div class="loading">Loading…</div>';
  try{
    const data = await api('/api/homepage');
    const s = data.sections || {};
    root.innerHTML = `
      <section class="hero">
        <h1>Latest Government Jobs & Results</h1>
        <p>Sarkari Naukri, Admit Card, Result aur New Vacancy — ek jagah, fast updates. Official link se apply karein.</p>
      </section>
      <div class="headline-row">
        <span class="headline-chip"><span class="dot"></span> Live updates</span>
        <span class="headline-chip">SSC · Banking · Railway · State</span>
        <span class="headline-chip">PC &amp; Mobile friendly</span>
      </div>
      <div class="boards">
        ${board('Result','📊','result','result', s.result?.listings)}
        ${board('Admit Card','🎫','admitcard','admit', s.admitcard?.listings)}
        ${board('Latest Job','💼','latestjob','job', s.latestjob?.listings)}
      </div>
      ${aboutHtml()}
    `;
  }catch(e){
    root.innerHTML = `<div class="error-box">${escapeHtml(e.message)}</div>`;
  }
}

async function pageSection(root, key){
  root.innerHTML = '<div class="loading">Loading…</div>';
  try{
    const data = await api('/api/jobs?section='+encodeURIComponent(key));
    const title = LABELS[key] || data.label || key;
    const list = data.listings || [];
    root.innerHTML = `
      <h1 style="font-size:1.2rem;font-weight:700;margin-bottom:14px">${escapeHtml(title)}</h1>
      <section class="section-block">
        <div class="section-head">
          <h2 class="section-title">${escapeHtml(title)} <span class="section-badge">${list.length}</span></h2>
        </div>
        ${jobRows(list)}
      </section>
      ${aboutHtml()}
    `;
  }catch(e){
    root.innerHTML = `<div class="error-box">${escapeHtml(e.message)}</div>`;
  }
}

function kvHtml(obj){
  if(!obj||typeof obj!=='object') return '';
  return '<div class="kv-grid">'+Object.entries(obj).filter(([,v])=>v!=null&&String(v).trim()!=='')
    .map(([k,v])=>`<div class="kv-item"><span class="kv-key">${escapeHtml(k)}</span><span class="kv-val">${escapeHtml(v)}</span></div>`).join('')+'</div>';
}
function card(label, body, full){
  if(!body) return '';
  return `<div class="info-card${full?' full':''}"><div class="info-card-label">${label}</div><div class="info-card-body">${body}</div></div>`;
}

async function pageDetail(root, slug){
  root.innerHTML = '<div class="loading">Loading…</div>';
  try{
    const job = await api('/api/job/'+encodeURIComponent(slug));
    const posts = job.posts || job.vacancy?.posts || [];
    let postsHtml = '';
    if(job.total_posts!=null || posts.length){
      postsHtml = (job.total_posts!=null?`<p style="font-weight:600;margin-bottom:10px">Total Post : ${job.total_posts}</p>`:'');
      if(posts.length){
        postsHtml += `<div class="table-wrap"><table class="data-table"><thead><tr><th>Post Name</th><th>Total</th><th>Eligibility</th></tr></thead><tbody>`+
          posts.map(p=>`<tr><td>${escapeHtml(p.post_name||p.name)}</td><td>${p.total??p.count??'—'}</td><td>${escapeHtml(p.eligibility||'—')}</td></tr>`).join('')+
          `</tbody></table></div>`;
      }
    }
    let linksHtml = '';
    const links = job.official_links||[];
    const pdfs = job.pdfs||[];
    if(job.official_apply_link || links.length || pdfs.length){
      linksHtml = '<div class="link-list">';
      if(job.official_apply_link) linksHtml += `<a class="link-btn apply" href="${escapeHtml(job.official_apply_link)}" target="_blank" rel="noopener">Apply Online <span>→</span></a>`;
      links.forEach(l=>{ linksHtml += `<a class="link-btn" href="${escapeHtml(l.url)}" target="_blank" rel="noopener">${escapeHtml(l.label||'Link')} <span>→</span></a>`; });
      pdfs.forEach(l=>{ linksHtml += `<a class="link-btn" href="${escapeHtml(l.url)}" target="_blank" rel="noopener">${escapeHtml(l.label||'PDF')} <span>→</span></a>`; });
      linksHtml += '</div>';
    }
    root.innerHTML = `
      <button type="button" class="detail-back" id="backBtn">← Back</button>
      <div class="detail-grid">
        ${card('Name Of Post', escapeHtml(job.title), true)}
        ${job.post_date?card('Post Date / Update', escapeHtml(job.post_date)):''}
        ${(job.description||job.short_info)?card('Short Information', `<p class="muted">${escapeHtml(job.description||job.short_info)}</p>`):''}
        ${job.dates?card('Important Dates', kvHtml(job.dates)):''}
        ${job.fees?card('Application Fee', kvHtml(job.fees)):''}
        ${job.age_limit?card('Age Limit', kvHtml(job.age_limit)):''}
        ${postsHtml?card('Vacancy Details', postsHtml, true):''}
        ${linksHtml?card('Important Links', linksHtml, true):''}
      </div>
      ${aboutHtml()}
    `;
    $('#backBtn')?.addEventListener('click', ()=> history.back());
  }catch(e){
    root.innerHTML = `<div class="error-box">${escapeHtml(e.message)}</div>`;
  }
}

async function pageSearch(root){
  root.innerHTML = `
    <h1 style="font-size:1.2rem;font-weight:700;margin-bottom:14px">Search</h1>
    <form class="search-box" id="sf">
      <input id="sq" placeholder="Search jobs, exams…" />
      <button type="submit">Go</button>
    </form>
    <div id="sr"></div>`;
  $('#sf').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const q = $('#sq').value.trim();
    if(!q) return;
    const box = $('#sr');
    box.innerHTML = '<div class="loading">Searching…</div>';
    try{
      const data = await api('/api/search?q='+encodeURIComponent(q));
      const list = data.results || data.listings || [];
      box.innerHTML = `<section class="section-block"><div class="section-head"><h2 class="section-title">Results <span class="section-badge">${list.length}</span></h2></div>${jobRows(list)}</section>`;
    }catch(err){
      box.innerHTML = `<div class="error-box">${escapeHtml(err.message)}</div>`;
    }
  });
}

function parseRoute(){
  const h = (location.hash || '#/').replace(/^#/, '') || '/';
  const path = h.split('?')[0];
  if(path === '/' || path === '') return { name:'home' };
  if(path.startsWith('/section/')) return { name:'section', key: decodeURIComponent(path.slice(9)) };
  if(path.startsWith('/job/')) return { name:'job', slug: decodeURIComponent(path.slice(5)) };
  if(path.startsWith('/search')) return { name:'search' };
  return { name:'home' };
}

async function route(){
  const r = parseRoute();
  const path = r.name==='home'?'/': r.name==='section'?`/section/${r.key}`: r.name==='search'?'/search':`/job/${r.slug}`;
  document.body.innerHTML = renderShell(path);
  $('#themeBtn')?.addEventListener('click', ()=> setTheme(getTheme()==='light'?'dark':'light'));
  $('#menuBtn')?.addEventListener('click', ()=>{
    const root = $('#drawerRoot');
    root.innerHTML = `<div class="drawer-overlay" id="ov"></div>
      <aside class="drawer">
        <div class="drawer-head"><strong>Menu</strong>
          <button type="button" class="icon-btn" id="cl">✕</button></div>
        <nav class="drawer-nav">
          ${TABS.map(t=>`<a href="#${t.to}">${t.label}</a>`).join('')}
          <a href="#/section/answerkey">Answer Key</a>
          <a href="#/section/admission">Admission</a>
          <a href="#/search">Search</a>
        </nav>
      </aside>`;
    const close = ()=> root.innerHTML='';
    $('#ov')?.addEventListener('click', close);
    $('#cl')?.addEventListener('click', close);
    root.querySelectorAll('a').forEach(a=>a.addEventListener('click', close));
  });
  const app = $('#app');
  if(r.name==='home') await pageHome(app);
  else if(r.name==='section') await pageSection(app, r.key);
  else if(r.name==='job') await pageDetail(app, r.slug);
  else if(r.name==='search') await pageSearch(app);
  else await pageHome(app);
  window.scrollTo(0,0);
}

window.addEventListener('hashchange', route);
route();
