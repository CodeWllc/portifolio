// Carrega header e footer dinâmicos e então inicializa funcionalidades
async function injectLayout(){
  const headerHolder = document.getElementById('app-header');
  const footerHolder = document.getElementById('app-footer');
  try {
    const [h, f] = await Promise.all([
      fetch('partials/header.html').then(r=>r.text()),
      fetch('partials/footer.html').then(r=>r.text())
    ]);
    if(headerHolder) headerHolder.innerHTML = h;
    if(footerHolder) footerHolder.innerHTML = f;
  } catch(e){
    console.error('Erro ao carregar layout', e);
  }
  initInteractions();
}

function initInteractions(){
  // Scroll suave para links âncora internos
  document.addEventListener('click', function(e){
    const a = e.target.closest('a[href^="#"]');
    if(a){
      const id = a.getAttribute('href').substring(1);
      const el = document.getElementById(id);
      if(el){
        e.preventDefault();
        el.scrollIntoView({behavior:'smooth'});
      }
    }
  });

  // Fade-in ao rolar
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

  // Menu mobile
  const btnMenu = document.getElementById('btnMenu');
  const mobileMenu = document.getElementById('mobileMenu');
  if(btnMenu){
    btnMenu.addEventListener('click', () => {
      const expanded = btnMenu.getAttribute('aria-expanded') === 'true';
      btnMenu.setAttribute('aria-expanded', String(!expanded));
      mobileMenu.classList.toggle('nav-active');
      // Alterna estado visual (cor controlada via CSS data attribute)
      btnMenu.setAttribute('data-icon-state', expanded ? 'closed' : 'open');
    });
  }

  // Clique fora fecha menu mobile
  document.addEventListener('click', (e) => {
    if(!mobileMenu) return;
    const isOpen = mobileMenu.classList.contains('nav-active');
    if(!isOpen) return;
    const target = e.target;
    const clickedInsideMenu = mobileMenu.contains(target);
    const clickedButton = btnMenu && btnMenu.contains(target);
    if(!clickedInsideMenu && !clickedButton){
      mobileMenu.classList.remove('nav-active');
      if(btnMenu){
        btnMenu.setAttribute('aria-expanded','false');
        btnMenu.setAttribute('data-icon-state','closed');
        btnMenu.blur();
      }
    }
  });

  // High-light item ativo
  const path = location.pathname.split('/').pop();
  const activeMap = {
    'index.html':'home','':'home',
    'projetos.html':'projetos',
    'curriculo.html':'curriculo',
    'contato.html':'contato'
  };
  const current = activeMap[path];
  if(current){
    document.querySelectorAll(`[data-active="${current}"]`).forEach(a=>a.classList.add('text-blue-600'));
  }

  // Status dinâmico no footer por página
  const statusEl = document.getElementById('pageStatusText');
  if(statusEl){
    const statusMap = {
      home: 'Página inicial: overview e destaques.',
      projetos: 'Explorando projetos e experimentos em andamento.',
      curriculo: 'Currículo: formação, experiência e habilidades.',
      contato: 'Entre em contato: responderei assim que possível.'
    };
    const key = current || 'home';
    if(statusMap[key]){
      statusEl.textContent = statusMap[key];
    } else {
      statusEl.textContent = statusEl.getAttribute('data-default') || statusEl.textContent;
    }
  }

  // Confirmação envio de formulário (Formspree)
  const contatoForm = document.getElementById('contatoForm');
  if(contatoForm){
    contatoForm.addEventListener('submit', function(){
      setTimeout(()=>{
        alert('Mensagem enviada! Obrigado pelo contato.');
      }, 300);
    });
  }

  // Botão flutuante WhatsApp (todas as páginas exceto contato)
  if(current !== 'contato'){
    if(!document.getElementById('btnWhatsAppFloat')){
      const a = document.createElement('a');
      a.id = 'btnWhatsAppFloat';
      a.href = 'https://wa.me/5528999003898?text=Ol%C3%A1%20Wallace,%20vi%20seu%20portf%C3%B3lio%20e%20gostaria%20de%20conversar.';
      a.target = '_blank';
      a.rel = 'noopener';
      a.setAttribute('aria-label','WhatsApp');
      a.className = 'fixed z-50 bottom-5 right-5 bg-green-500 hover:bg-green-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-green-300';
      a.innerHTML = '\n        <svg viewBox="0 0 32 32" class="w-8 h-8 fill-current" aria-hidden="true">\n          <path d="M16.001 3.2c-7.02 0-12.8 5.68-12.8 12.674 0 2.236.586 4.415 1.703 6.343L3.2 28.8l6.767-1.776a12.73 12.73 0 0 0 6.034 1.537h.005c7.02 0 12.8-5.68 12.8-12.674 0-3.39-1.326-6.574-3.735-8.968C22.575 4.52 19.39 3.2 16 3.2h.001zm0 2.133c2.79 0 5.414 1.085 7.384 3.053 1.97 1.968 3.055 4.586 3.055 7.354 0 5.74-4.7 10.427-10.472 10.427h-.004a10.4 10.4 0 0 1-5.29-1.432l-.379-.225-4.017 1.054 1.075-3.917-.247-.402a10.47 10.47 0 0 1-1.61-5.505c0-5.74 4.7-10.407 10.505-10.407zm6.027 12.278c-.329-.164-1.94-.957-2.24-1.067-.301-.11-.52-.165-.74.164-.219.329-.849 1.067-1.04 1.286-.192.219-.383.247-.712.082-.329-.164-1.39-.513-2.647-1.635-.979-.87-1.64-1.948-1.832-2.277-.192-.329-.02-.507.145-.67.149-.148.329-.383.493-.575.165-.192.219-.329.329-.548.11-.219.055-.41-.027-.575-.082-.164-.74-1.78-1.013-2.438-.266-.64-.538-.55-.74-.56-.192-.01-.41-.012-.63-.012-.219 0-.575.082-.876.41-.301.329-1.15 1.123-1.15 2.737 0 1.614 1.178 3.175 1.343 3.394.164.219 2.322 3.55 5.62 4.977.786.339 1.4.541 1.877.693.788.25 1.505.215 2.073.13.633-.094 1.94-.793 2.214-1.56.273-.767.273-1.424.191-1.56-.082-.137-.301-.219-.63-.383z" />\n        </svg>\n      ';
      document.body.appendChild(a);
    }
  }

  // Indicador de disponibilidade
  try {
    const badge = document.getElementById('availabilityBadge');
    if(badge){
      // Configuração central: ajuste manual aqui quando mudar status
      const availabilityConfig = {
        status: 'open', // 'open' | 'focus'
        updated: '2025-09' // ano-mes da última alteração
        // version removido da exibição
      };
      const variants = {
        open: {
          label: 'Aberto a oportunidades',
          color: 'bg-green-500/80 text-white ring-white/40'
        },
        focus: {
          label: 'Focado em estudos',
          color: 'bg-amber-500/80 text-white ring-white/40'
        }
      };
      const v = variants[availabilityConfig.status] || variants.open;
      badge.classList.add(...v.color.split(' '));
  badge.innerHTML = `<span class=\"w-2.5 h-2.5 rounded-full bg-white animate-pulse shadow\"></span>${v.label}<span class=\"text-white/70 text-[11px] font-normal ml-2\">${availabilityConfig.updated}</span>`;
      requestAnimationFrame(()=> badge.classList.remove('opacity-0'));
    }
  } catch(err){
    console.warn('Falha indicador disponibilidade', err);
  }

  // Ano corrente no footer
  const yearEl = document.getElementById('currentYear');
  if(yearEl){
    const y = new Date().getFullYear();
    if(yearEl.textContent !== String(y)) yearEl.textContent = y;
  }
}

injectLayout();
