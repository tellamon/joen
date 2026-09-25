/* Browse an entire case gallery without closing the enlarged photo. */
(() => {
  const box = document.querySelector('.lightbox');
  const photos = Array.from(document.querySelectorAll('.content .wp-block-image img')).filter(img => !img.closest('a'));
  if (!box || !photos.length) return;
  const picture = box.querySelector('.lightbox-image');
  const stage = box.querySelector('.lightbox-stage');
  const close = box.querySelector('[data-lightbox-close]');
  const prev = box.querySelector('[data-lightbox-prev]');
  const next = box.querySelector('[data-lightbox-next]');
  const counter = box.querySelector('.lightbox-count');
  const status = box.querySelector('.lightbox-status');
  const error = box.querySelector('.lightbox-error');
  let current = 0, opener = null, oldOverflow = '', background = [];
  let gesture = null, multipleTouches = false;
  const warmed = new Set();
  const source = img => img.currentSrc || img.src;
  function preload(index) {
    const src = source(photos[(index + photos.length) % photos.length]);
    if (!warmed.has(src)) { warmed.add(src); const img = new Image(); img.src = src; }
  }
  function show(index) {
    current = (index + photos.length) % photos.length;
    const selected = photos[current];
    picture.alt = selected.alt || '조은공조시스템 시공사진';
    error.hidden = true;
    stage.setAttribute('aria-busy', 'true');
    picture.src = source(selected);
    if (picture.complete && picture.naturalWidth > 0) stage.setAttribute('aria-busy', 'false');
    counter.textContent = `${current + 1} / ${photos.length}`;
    status.textContent = `${photos.length}장 중 ${current + 1}번째 사진. ${picture.alt}`;
    prev.disabled = next.disabled = photos.length < 2;
    preload(current - 1); preload(current + 1);
  }
  function open(index, trigger) {
    opener = trigger;
    oldOverflow = document.body.style.overflow;
    background = Array.from(document.body.children).filter(el => el !== box && !['SCRIPT','STYLE'].includes(el.tagName)).map(el => [el, el.inert]);
    background.forEach(([el]) => { el.inert = true; });
    box.hidden = false;
    document.body.style.overflow = 'hidden';
    gesture = null; multipleTouches = false;
    show(index);
    close.focus({preventScroll:true});
  }
  function hide() {
    if (box.hidden) return;
    box.hidden = true;
    gesture = null; multipleTouches = false;
    document.body.style.overflow = oldOverflow;
    background.forEach(([el, inert]) => { el.inert = inert; });
    background = [];
    opener?.focus({preventScroll:true});
  }
  photos.forEach((img, index) => {
    img.tabIndex = 0;
    img.setAttribute('role', 'button');
    img.setAttribute('aria-haspopup', 'dialog');
    img.setAttribute('aria-label', (img.alt || '시공사진') + ' 크게 보기');
    img.addEventListener('click', () => open(index, img));
    img.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(index, img); }
    });
  });
  close.addEventListener('click', hide);
  prev.addEventListener('click', () => show(current - 1));
  next.addEventListener('click', () => show(current + 1));
  box.addEventListener('click', e => { if (e.target === box) hide(); });
  picture.addEventListener('load', () => stage.setAttribute('aria-busy', 'false'));
  picture.addEventListener('error', () => { stage.setAttribute('aria-busy', 'false'); error.hidden = false; });
  document.addEventListener('keydown', e => {
    if (box.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); hide(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); show(current - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); show(current + 1); }
    else if (e.key === 'Tab') {
      const buttons = [close, prev, next].filter(button => !button.disabled);
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (e.shiftKey && (document.activeElement === first || !box.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || !box.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
    }
  });
  // Ignore vertical scrolling, short taps and two-finger/pinch gestures.
  stage.addEventListener('touchstart', e => {
    if (e.touches.length !== 1 || (window.visualViewport?.scale || 1) > 1.05) {
      multipleTouches = true; gesture = null; return;
    }
    if (multipleTouches) return;
    const point = e.touches[0];
    gesture = {x:point.clientX, y:point.clientY, id:point.identifier};
  }, {passive:true});
  stage.addEventListener('touchend', e => {
    if (e.touches.length) return;
    if (!multipleTouches && gesture && (window.visualViewport?.scale || 1) <= 1.05) {
      const point = Array.from(e.changedTouches).find(t => t.identifier === gesture.id);
      if (point) {
        const dx = point.clientX - gesture.x, dy = point.clientY - gesture.y;
        if (Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy) * 1.3) show(current + (dx < 0 ? 1 : -1));
      }
    }
    gesture = null; multipleTouches = false;
  }, {passive:true});
  stage.addEventListener('touchcancel', () => { gesture = null; multipleTouches = false; }, {passive:true});
})();

/* Shareable case categories for advertising links, reloads and browser history. */
(() => {
 const buttons = Array.from(document.querySelectorAll('[data-filter]'));
 const cards = Array.from(document.querySelectorAll('.project-card[data-category]'));
 if (!buttons.length) return;
 const valid = new Set(buttons.map(button => button.dataset.filter));
 const originalSizes = new Map(cards.map(card => [card, card.querySelector('img').sizes]));
 function selectedFromUrl() {
   const value = new URLSearchParams(location.search).get('category');
   return valid.has(value) ? value : 'all';
 }
 function apply(filter) {
   const selected = valid.has(filter) ? filter : 'all';
   document.body.classList.toggle('has-project-filter', selected !== 'all');
   buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === selected)));
   cards.forEach(card => {
     card.hidden = selected !== 'all' && card.dataset.category !== selected;
     const img = card.querySelector('img');
     img.sizes = selected === 'all' ? originalSizes.get(card) : '(max-width:760px) calc(100vw - 36px), (max-width:1000px) calc((100vw - 98px)/2), 375px';
   });
   const button = buttons.find(button => button.dataset.filter === selected);
   document.getElementById('project-status').textContent = button.textContent.replace(/\d/g, '').trim() + ' 시공사진 ' + cards.filter(card => !card.hidden).length + '개';
 }
 buttons.forEach(button => button.addEventListener('click', () => {
   const selected = button.dataset.filter;
   apply(selected);
   // Preserve advertising attribution parameters when the visitor changes category.
   try {
     const url = new URL(location.href);
     if (selected === 'all') url.searchParams.delete('category');
     else url.searchParams.set('category', selected);
     url.hash = 'projects';
     if (url.href !== location.href) history.pushState(null, '', url);
   } catch (_) { /* Local srcdoc previews cannot always update browser history. */ }
 }));
 window.addEventListener('popstate', () => apply(selectedFromUrl()));
 apply(selectedFromUrl());
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
    function hydrate(img) {
      if (img.dataset.srcset) { img.srcset = img.dataset.srcset; delete img.dataset.srcset; }
      if (img.dataset.src) { img.src = img.dataset.src; delete img.dataset.src; }
      img.loading = 'eager';
    }
    function preload() {
      const img = slides[nextIndex()].querySelector('img');
      hydrate(img);
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
      hydrate(img);
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
        const first = slides[current].querySelector('img');
        if (visible && first.complete && first.naturalWidth) preload();
        else if (visible) first.addEventListener('load', preload, {once:true});
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
  let activeId = null;
  function refreshLinks() {
    links.forEach(link => {
      if (!link.dataset.mobileAnchor) return;
      const href = mobileNav.matches ? link.dataset.mobileAnchor : link.dataset.desktopHref;
      if (link.getAttribute('href') !== href) link.setAttribute('href', href);
    });
    activeId = null;
    if (!mobileNav.matches) {
      links.forEach(link => link.removeAttribute('aria-current'));
      links[0]?.setAttribute('aria-current', 'page');
    }
  }
  function refreshPosition() {
    if (!mobileNav.matches) return;
    // Finish geometry reads before changing any attributes that affect styling.
    const headerHeight = document.querySelector('.site-header').getBoundingClientRect().height;
    let active = 'top';
    sectionIds.slice(1).forEach(id => {
      const section = document.getElementById(id);
      if (section && section.getBoundingClientRect().top <= headerHeight + 50) active = id;
    });
    if (active !== activeId) { mark(active); activeId = active; }
  }
  let ticking = false;
  function queuePosition() {
    if (ticking || !mobileNav.matches) return;
    ticking = true;
    requestAnimationFrame(() => { refreshPosition(); ticking = false; });
  }
  document.addEventListener('scroll', queuePosition, {passive:true});
  mobileNav.addEventListener('change', () => { refreshLinks(); queuePosition(); });
  window.addEventListener('resize', queuePosition);
  refreshLinks();
  queuePosition();
})();

