(() => {
 const toggle=document.querySelector('.menu-toggle'),menu=document.querySelector('.full-menu');
 if(toggle&&menu){toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));menu.hidden=!open;});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){menu.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.focus();}});}
 const box=document.querySelector('.lightbox');if(!box)return;const picture=box.querySelector('img'),close=box.querySelector('button');let previous=null;
 function hide(){box.hidden=true;document.body.style.overflow='';if(previous)previous.focus();}
 document.querySelectorAll('.content .wp-block-image img').forEach(img=>{if(img.closest('a'))return;img.tabIndex=0;img.setAttribute('role','button');img.setAttribute('aria-label',img.alt?img.alt+' 크게 보기':'시공사진 크게 보기');const show=()=>{previous=img;picture.src=img.currentSrc||img.src;picture.alt=img.alt||'시공사진';box.hidden=false;document.body.style.overflow='hidden';close.focus();};img.addEventListener('click',show);img.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();show();}});});close.addEventListener('click',hide);box.addEventListener('click',e=>{if(e.target===box)hide();});document.addEventListener('keydown',e=>{if(!box.hidden&&e.key==='Escape')hide();if(!box.hidden&&e.key==='Tab'){e.preventDefault();close.focus();}});
})();

(() => {
 const buttons=Array.from(document.querySelectorAll('[data-filter]'));
 const cards=Array.from(document.querySelectorAll('.project-card[data-category]'));
 if(!buttons.length)return;
 buttons.forEach(button=>button.addEventListener('click',()=>{
   const filter=button.dataset.filter;
   buttons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
   cards.forEach(card=>card.hidden=filter!=='all'&&card.dataset.category!==filter);
   document.getElementById('project-status').textContent=button.textContent.replace(/\d/g,'').trim()+' 시공사진 '+cards.filter(c=>!c.hidden).length+'개';
 }));
 document.querySelectorAll('.full-menu a[href^="#"]').forEach(link=>link.addEventListener('click',()=>{document.querySelector('.full-menu').hidden=true;document.querySelector('.menu-toggle').setAttribute('aria-expanded','false');}));
})();

/* Automatic photo sequence: no playback buttons or numeric navigation. */
(() => {
  document.querySelectorAll('[data-carousel]').forEach(gallery => {
    const slides = Array.from(gallery.querySelectorAll('.carousel-slide'));
    if (slides.length < 2) return;
    let current = 0, visible = false, timer = null, pending = false;
    const failed = new Set();
    function stop() { clearTimeout(timer); timer = null; }
    function nextIndex() {
      for (let step = 1; step < slides.length; step++) {
        const index = (current + step) % slides.length;
        if (!failed.has(index)) return index;
      }
      return current;
    }
    function preload() {
      const img = slides[nextIndex()].querySelector('img');
      img.loading = 'eager';
      if (img.decode) img.decode().catch(() => {});
    }
    function schedule() {
      stop();
      if (visible && !document.hidden && !pending && nextIndex() !== current)
        timer = setTimeout(advance, 4000);
    }
    async function advance() {
      stop();
      if (pending || !visible || document.hidden) return;
      pending = true;
      const target = nextIndex(), img = slides[target].querySelector('img');
      img.loading = 'eager';
      try {
        if (img.decode) await img.decode();
        if (visible && !document.hidden) {
          slides.forEach((slide, i) => {
            slide.classList.toggle('is-active', i === target);
            slide.setAttribute('aria-hidden', String(i !== target));
          });
          current = target;
          preload();
        }
      } catch (_) { failed.add(target); }
      finally { pending = false; schedule(); }
    }
    document.addEventListener('visibilitychange', schedule);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        if (visible) preload();
        schedule();
      }, {threshold: .1}).observe(gallery);
    } else { visible = true; preload(); schedule(); }
  });
})();


/* Keep the five visible homepage links in step with the section being read. */
(() => {
  const nav = document.querySelector('.home-page .site-nav');
  if (!nav) return;
  const links = Array.from(nav.querySelectorAll('[data-section-link]'));
  const sectionIds = ['top', 'projects', 'about', 'guide', 'contact'];
  function mark(id) {
    links.forEach(link => {
      if (link.getAttribute('href') === '#' + id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  const mobileNav = window.matchMedia('(max-width:760px)');
  function refresh() {
    links.forEach(link => {
      if (link.dataset.mobileAnchor) link.setAttribute('href', mobileNav.matches ? link.dataset.mobileAnchor : link.dataset.desktopHref);
    });
    if (!mobileNav.matches) { links.forEach(link => link.removeAttribute('aria-current')); links[0]?.setAttribute('aria-current', 'page'); return; }
    const header = document.querySelector('.site-header').getBoundingClientRect().height;
    let active = 'top';
    sectionIds.slice(1).forEach(id => {
      const section = document.getElementById(id);
      if (section && section.getBoundingClientRect().top <= header + 50) active = id;
    });
    mark(active);
  }
  let ticking = false;
  document.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { refresh(); ticking = false; });
  }, {passive:true});
  mobileNav.addEventListener('change', refresh);
  window.addEventListener('resize', refresh);
  refresh();
})();

// Restore the representative cases when a desktop filter switches to mobile.
(() => {
 const mobile = window.matchMedia('(max-width:760px)');
 const all = document.querySelector('.home-page [data-filter="all"]');
 if (!all) return;
 function resetMobileCases() { if (mobile.matches) all.click(); }
 mobile.addEventListener('change', resetMobileCases);
 resetMobileCases();
})();
