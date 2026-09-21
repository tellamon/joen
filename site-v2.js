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
