/* Yair Artz — interacción y motion graphics
   Requiere GSAP + ScrollTrigger + SplitText (CDN). Si no cargan, el sitio funciona sin animaciones. */
(function(){
  "use strict";
  var doc=document.documentElement;
  var reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap=typeof window.gsap!=="undefined";
  if(!hasGsap){doc.classList.remove("js");}
  if(hasGsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  if(hasGsap && window.SplitText) gsap.registerPlugin(SplitText);

  /* ---------- Año en el pie ---------- */
  document.querySelectorAll("[data-year]").forEach(function(el){el.textContent=new Date().getFullYear();});

  /* ---------- Encabezado sólido al hacer scroll ---------- */
  var header=document.querySelector(".site-header");
  function onScroll(){ if(header) header.classList.toggle("is-solid",window.scrollY>40); }
  onScroll(); window.addEventListener("scroll",onScroll,{passive:true});

  /* ---------- Menú móvil ---------- */
  var menu=document.getElementById("mobile-menu");
  document.querySelectorAll("[data-menu-open]").forEach(function(b){b.addEventListener("click",function(){
    menu.classList.add("is-open");menu.setAttribute("aria-hidden","false");b.setAttribute("aria-expanded","true");
    document.body.style.overflow="hidden";var f=menu.querySelector("a,button");if(f)f.focus();
    if(hasGsap&&!reduce) gsap.from(menu.querySelectorAll("li"),{xPercent:-20,opacity:0,stagger:.05,duration:.5,delay:.15,ease:"power3.out"});
  });});
  document.querySelectorAll("[data-menu-close]").forEach(function(b){b.addEventListener("click",closeMenu);});
  function closeMenu(){ if(!menu)return; menu.classList.remove("is-open");menu.setAttribute("aria-hidden","true");document.body.style.overflow="";
    var t=document.querySelector("[data-menu-open]"); if(t){t.setAttribute("aria-expanded","false");t.focus();} }

  /* ---------- Transición de página (viñetas que cubren la pantalla) ---------- */
  var wipe=document.querySelector(".page-wipe");
  if(wipe&&hasGsap&&!reduce){
    var bars=wipe.querySelectorAll("i"), mark=wipe.querySelector("img");
    if(sessionStorage.getItem("ya-wipe")==="1"){
      wipe.style.visibility="visible";
      gsap.set(bars,{scaleY:1,transformOrigin:"bottom"});
      gsap.to(bars,{scaleY:0,duration:.55,stagger:.07,ease:"power3.inOut",delay:.05,onComplete:function(){wipe.style.visibility="hidden";}});
    }
    sessionStorage.removeItem("ya-wipe");
    document.addEventListener("click",function(e){
      var a=e.target.closest("a");
      if(!a||e.defaultPrevented||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||a.target==="_blank"||a.hasAttribute("download"))return;
      var url=new URL(a.href,location.href);
      if(url.origin!==location.origin||url.pathname===location.pathname||!/(\.html|\/)$/.test(url.pathname))return;
      e.preventDefault();
      wipe.style.visibility="visible";
      gsap.set(bars,{transformOrigin:"top"});
      var tl=gsap.timeline({onComplete:function(){sessionStorage.setItem("ya-wipe","1");location.href=a.href;}});
      tl.fromTo(bars,{scaleY:0},{scaleY:1,duration:.45,stagger:.06,ease:"power3.in"});
      if(mark) tl.fromTo(mark,{scale:.4,opacity:0,rotate:-12},{scale:1,opacity:1,rotate:0,duration:.25,ease:"back.out(2)"},"-=.15");
    });
    window.addEventListener("pageshow",function(ev){ if(ev.persisted){ gsap.set(bars,{scaleY:0}); if(mark)gsap.set(mark,{opacity:0}); wipe.style.visibility="hidden"; }});
  }

  /* ---------- Animación de entrada del héroe (un solo momento orquestado por página) ---------- */
  if(hasGsap&&!reduce){
    var hero=document.querySelector("[data-hero]");
    if(hero){
      var tl=gsap.timeline({defaults:{ease:"power4.out"},delay:sessionStorage.getItem("ya-wipe")?0:.15});
      var title=hero.querySelector("h1");
      if(title&&window.SplitText&&!title.querySelector("img")){
        var split=new SplitText(title,{type:"chars,words",charsClass:"ch"});
        tl.from(split.chars,{yPercent:110,rotate:8,opacity:0,duration:.9,stagger:.025});
      } else if(title){ tl.from(title,{y:40,opacity:0,duration:.8}); }
      var frame=hero.querySelector(".splash__frame");
      if(frame) tl.from(frame,{clipPath:"inset(0 0 100% 0)",duration:.8,ease:"power3.inOut"},0.1);
      var heroArt=hero.querySelector(".splash__hero");
      if(heroArt) tl.from(heroArt,{y:120,scale:.85,opacity:0,duration:1.1,ease:"back.out(1.4)"},.45);
      var kt=hero.querySelector(".splash__koatl"), yr=hero.querySelector(".splash__yair");
      if(kt) tl.from(kt,{y:60,scale:1.12,opacity:0,duration:1.3,ease:"power3.out"},.35);
      if(yr) tl.from(yr,{x:-80,opacity:0,duration:1,ease:"power4.out"},.6);
      hero.querySelectorAll("[data-pop]").forEach(function(p,i){
        tl.fromTo(p,{scale:0,rotate:-25,opacity:0},{scale:1,rotate:+(p.dataset.rot||0),opacity:1,duration:.6,ease:"back.out(2.2)"},.9+i*.12);
      });
      var rest=hero.querySelectorAll("[data-hero-item]:not(h1)");
      if(rest.length) tl.from(rest,{y:28,opacity:0,duration:.7,stagger:.08},.5);
      var bg=hero.querySelector(".hero__bg img, .hero__bg video");
      if(bg) tl.from(bg,{scale:1.18,duration:1.8,ease:"power2.out"},0);
    }
  }
  /* zoom lento del fondo al hacer scroll (arte clave y modo aventura) */
  if(hasGsap&&window.ScrollTrigger&&!reduce){
    document.querySelectorAll(".keyart__img img, .aventura__bg img").forEach(function(im){
      gsap.fromTo(im,{scale:1.18},{scale:1,ease:"none",scrollTrigger:{trigger:im.parentNode.parentNode,start:"top bottom",end:"bottom top",scrub:true}});
    });
  }
  /* data-pop fuera del héroe: aparece con rebote al entrar en pantalla */
  document.querySelectorAll("[data-pop]").forEach(function(p){
    if(p.closest("[data-hero]"))return;
    if(hasGsap&&window.ScrollTrigger&&!reduce){
      gsap.fromTo(p,{scale:.6,rotate:-10,opacity:0},{scale:1,rotate:+(p.dataset.rot||0),opacity:1,duration:.7,ease:"back.out(2)",scrollTrigger:{trigger:p,start:"top 88%",once:true}});
    } else p.style.opacity=1;
  });
  if(!hasGsap||reduce) document.querySelectorAll("[data-pop]").forEach(function(p){p.style.opacity=1;});

  /* ---------- Roles rotativos del splash ---------- */
  var roles=document.querySelector("[data-roles]");
  if(roles){
    var list=JSON.parse(roles.getAttribute("data-roles")), i=0, b=roles.querySelector("b");
    if(!reduce) setInterval(function(){
      i=(i+1)%list.length;
      if(hasGsap){ gsap.to(b,{yPercent:-60,opacity:0,duration:.25,ease:"power2.in",onComplete:function(){b.textContent=list[i];gsap.fromTo(b,{yPercent:60,opacity:0},{yPercent:0,opacity:1,duration:.35,ease:"power3.out"});}}); }
      else b.textContent=list[i];
    },2400);
  }

  /* ---------- Parallax del arte del splash con el mouse ---------- */
  var art=document.querySelector(".splash__art");
  if(art&&hasGsap&&!reduce&&window.matchMedia("(pointer:fine)").matches){
    var layers=art.querySelectorAll("[data-depth]");
    window.addEventListener("mousemove",function(e){
      var x=(e.clientX/innerWidth-.5), y=(e.clientY/innerHeight-.5);
      layers.forEach(function(l){var d=parseFloat(l.dataset.depth);gsap.to(l,{x:x*d*40,y:y*d*30,duration:.8,ease:"power2.out",overwrite:"auto"});});
    });
  }

  /* ---------- Revelado de viñetas al entrar en pantalla ---------- */
  if(hasGsap&&window.ScrollTrigger&&!reduce){
    gsap.utils.toArray("[data-reveal]").forEach(function(el){
      gsap.to(el,{clipPath:"inset(0 0 0% 0)",duration:1,ease:"power3.inOut",scrollTrigger:{trigger:el,start:"top 85%",once:true}});
    });
    gsap.utils.toArray("[data-parallax]").forEach(function(el){
      var s=parseFloat(el.dataset.parallax)||.15;
      gsap.fromTo(el,{yPercent:-s*50},{yPercent:s*50,ease:"none",scrollTrigger:{trigger:el.parentElement,start:"top bottom",end:"bottom top",scrub:true}});
    });
    /* Cinta: velocidad ligada al scroll */
    document.querySelectorAll(".ribbon__track").forEach(function(t){
      var tw=gsap.to(t,{xPercent:-50,repeat:-1,duration:28,ease:"none"});
      ScrollTrigger.create({onUpdate:function(self){var v=gsap.utils.clamp(-4,4,self.getVelocity()/300);gsap.to(tw,{timeScale:1+Math.abs(v),duration:.3,overwrite:true});gsap.to(tw,{timeScale:1,duration:1,delay:.3});}});
    });
    /* Contadores de datos */
    document.querySelectorAll("[data-count]").forEach(function(el){
      var end=parseFloat(el.dataset.count), pre=el.dataset.pre||"", suf=el.dataset.suf||"", o={v:0};
      gsap.to(o,{v:end,duration:1.6,ease:"power2.out",scrollTrigger:{trigger:el,start:"top 88%",once:true},onUpdate:function(){el.textContent=pre+Math.round(o.v)+suf;}});
    });
    /* Línea de tiempo horizontal fijada */
    var mq=window.matchMedia("(min-width:900px)");
    document.querySelectorAll("[data-hscroll]").forEach(function(sec){
      if(!mq.matches)return;
      var track=sec.querySelector(".hscroll__track");
      gsap.to(track,{x:function(){return -(track.scrollWidth-innerWidth);},ease:"none",
        scrollTrigger:{trigger:sec,start:"top top",end:function(){return "+="+(track.scrollWidth-innerWidth);},pin:true,scrub:.6,invalidateOnRefresh:true,anticipatePin:1}});
    });
  } else {
    document.querySelectorAll(".ribbon__track").forEach(function(t){t.style.flexWrap="wrap";});
  }

  /* ---------- Brillo holográfico / inclinación en cartas ---------- */
  if(!reduce&&window.matchMedia("(pointer:fine)").matches){
    document.querySelectorAll(".holo").forEach(function(c){
      c.addEventListener("mousemove",function(e){
        var r=c.getBoundingClientRect(), x=(e.clientX-r.left)/r.width, y=(e.clientY-r.top)/r.height;
        c.style.transform="perspective(800px) rotateY("+((x-.5)*14)+"deg) rotateX("+((.5-y)*14)+"deg)";
        c.style.setProperty("--gx",(x*100)+"%");c.style.setProperty("--gy",(y*100)+"%");
      });
      c.addEventListener("mouseleave",function(){c.style.transform="";});
    });
  }

  /* ---------- Videos en bucle: pausar fuera de pantalla ---------- */
  var loops=document.querySelectorAll("video[data-loop]");
  if("IntersectionObserver" in window){
    var io=new IntersectionObserver(function(ents){ents.forEach(function(en){
      if(en.isIntersecting&&!reduce){var p=en.target.play();if(p&&p.catch)p.catch(function(){});} else en.target.pause();
    });},{threshold:.15});
    loops.forEach(function(v){io.observe(v);});
  }

  /* ---------- YouTube con carga diferida ---------- */
  document.querySelectorAll(".yt[data-id]").forEach(function(box){
    var id=box.dataset.id, title=box.dataset.title||"Video";
    box.innerHTML='<button type="button" aria-label="Reproducir: '+title.replace(/"/g,"&quot;")+'"><img src="https://i.ytimg.com/vi/'+id+'/hqdefault.jpg" alt="" loading="lazy"></button>';
    box.querySelector("button").addEventListener("click",function(){
      box.innerHTML='<iframe src="https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1&rel=0" title="'+title.replace(/"/g,"&quot;")+'" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>';
    });
  });

  /* ---------- Lightbox ---------- */
  var lb=document.createElement("div");
  lb.className="lightbox";lb.setAttribute("role","dialog");lb.setAttribute("aria-modal","true");lb.setAttribute("aria-label","Imagen ampliada");
  lb.innerHTML='<button class="lightbox__close" type="button" aria-label="Cerrar">✕</button><button class="lightbox__nav lightbox__nav--prev" type="button" aria-label="Anterior">‹</button><figure><img alt=""><figcaption></figcaption></figure><button class="lightbox__nav lightbox__nav--next" type="button" aria-label="Siguiente">›</button>';
  document.body.appendChild(lb);
  var lbImg=lb.querySelector("img"), lbCap=lb.querySelector("figcaption"), group=[], idx=0, opener=null;
  function show(k){idx=(k+group.length)%group.length;var t=group[idx];var im=t.querySelector("img");
    lbImg.src=t.dataset.full||im.currentSrc||im.src;lbImg.alt=im.alt||"";lbCap.textContent=t.dataset.caption||im.alt||"";
    lb.querySelectorAll(".lightbox__nav").forEach(function(n){n.style.display=group.length>1?"":"none";});
    if(hasGsap&&!reduce)gsap.fromTo(lbImg,{scale:.92,opacity:0},{scale:1,opacity:1,duration:.3,ease:"power2.out"});}
  document.addEventListener("click",function(e){
    var t=e.target.closest("[data-lightbox]"); if(!t)return; e.preventDefault();
    var g=t.dataset.lightbox; group=Array.prototype.slice.call(document.querySelectorAll('[data-lightbox="'+g+'"]'));
    opener=t; show(group.indexOf(t)); lb.classList.add("is-open"); lb.querySelector(".lightbox__close").focus();
  });
  function closeLb(){lb.classList.remove("is-open");if(opener)opener.focus();}
  lb.querySelector(".lightbox__close").addEventListener("click",closeLb);
  lb.querySelector(".lightbox__nav--prev").addEventListener("click",function(){show(idx-1);});
  lb.querySelector(".lightbox__nav--next").addEventListener("click",function(){show(idx+1);});
  lb.addEventListener("click",function(e){if(e.target===lb)closeLb();});
  document.addEventListener("keydown",function(e){
    if(e.key==="Escape"){ if(lb.classList.contains("is-open"))closeLb(); else if(menu&&menu.classList.contains("is-open"))closeMenu(); }
    if(lb.classList.contains("is-open")){ if(e.key==="ArrowRight")show(idx+1); if(e.key==="ArrowLeft")show(idx-1); }
  });

  /* ---------- Buscador del glosario ---------- */
  var gq=document.getElementById("glosario-buscar");
  if(gq){
    var items=document.querySelectorAll("#glosario-lista > div"), count=document.getElementById("glosario-conteo");
    gq.addEventListener("input",function(){
      var q=gq.value.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,""), n=0;
      items.forEach(function(it){var ok=!q||it.textContent.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").indexOf(q)>-1;it.hidden=!ok;if(ok)n++;});
      if(count)count.textContent=n+(n===1?" término":" términos");
    });
  }

  /* ---------- Navegación lateral activa (reglas) ---------- */
  var rlinks=document.querySelectorAll(".rules-nav a");
  if(rlinks.length&&"IntersectionObserver" in window){
    var map={};rlinks.forEach(function(a){map[a.getAttribute("href").slice(1)]=a;});
    var ro=new IntersectionObserver(function(ents){ents.forEach(function(en){if(en.isIntersecting){rlinks.forEach(function(a){a.classList.remove("is-active");});var a=map[en.target.id];if(a)a.classList.add("is-active");}});},{rootMargin:"-40% 0px -55% 0px"});
    document.querySelectorAll(".rule-block[id]").forEach(function(s){ro.observe(s);});
  }

  if(hasGsap&&window.ScrollTrigger) window.addEventListener("load",function(){ScrollTrigger.refresh();});
})();
