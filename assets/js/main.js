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

  /* ---------- Scroll suave con inercia (Lenis), sincronizado con GSAP ---------- */
  var lenis=null;
  if(hasGsap&&window.Lenis&&!reduce){
    lenis=new Lenis({duration:1.15,easing:function(t){return Math.min(1,1.001-Math.pow(2,-10*t));},smoothWheel:true,anchors:{offset:-90}});
    if(window.ScrollTrigger) lenis.on("scroll",ScrollTrigger.update);
    gsap.ticker.add(function(t){lenis.raf(t*1000);});
    gsap.ticker.lagSmoothing(0);
    doc.classList.add("has-lenis"); window.__lenis=lenis;
  }
  function lockScroll(on){ if(lenis){ on?lenis.stop():lenis.start(); } document.body.style.overflow=on?"hidden":""; }

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
    lockScroll(true);var f=menu.querySelector("a,button");if(f)f.focus();
    if(hasGsap&&!reduce) gsap.from(menu.querySelectorAll("li"),{xPercent:-20,opacity:0,stagger:.05,duration:.5,delay:.15,ease:"power3.out"});
  });});
  document.querySelectorAll("[data-menu-close]").forEach(function(b){b.addEventListener("click",closeMenu);});
  function closeMenu(){ if(!menu)return; menu.classList.remove("is-open");menu.setAttribute("aria-hidden","true");lockScroll(false);
    var t=document.querySelector("[data-menu-open]"); if(t){t.setAttribute("aria-expanded","false");t.focus();} }

  /* ---------- Transición de página (viñetas que cubren la pantalla) ---------- */
  var wipe=document.querySelector(".page-wipe");
  if(wipe&&hasGsap&&!reduce){
    var bars=wipe.querySelectorAll("i"), mark=wipe.querySelector("img");
    if(sessionStorage.getItem("ya-wipe")==="1"){
      wipe.style.visibility="visible";
      gsap.set(bars,{scaleY:1,transformOrigin:"bottom"});
      gsap.to(bars,{scaleY:0,duration:.5,stagger:.05,ease:"power3.inOut",delay:0,onComplete:function(){wipe.style.visibility="hidden";}});
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
      tl.fromTo(bars,{scaleY:0},{scaleY:1,duration:.36,stagger:.045,ease:"power3.in"});
      if(mark) tl.fromTo(mark,{scale:.4,opacity:0,rotate:-12},{scale:1,opacity:1,rotate:0,duration:.2,ease:"back.out(2)"},"-=.12");
    });
    window.addEventListener("pageshow",function(ev){ if(ev.persisted){ gsap.set(bars,{scaleY:0}); if(mark)gsap.set(mark,{opacity:0}); wipe.style.visibility="hidden"; }});
  }

  /* ---------- Contador del carrito en el encabezado ---------- */
  (function(){ try{ var C=JSON.parse(localStorage.getItem("yz_carrito")||"[]"), n=C.reduce(function(s,i){return s+(i.cant||0);},0);
    document.querySelectorAll("[data-cart-n]").forEach(function(e){e.textContent=n;e.hidden=!n;}); }catch(e){} })();

  /* ---------- Precarga de la página de destino al pasar el cursor o tocar ---------- */
  var pre={};
  function prefetch(a){
    if(!a||!a.href||a.target==="_blank")return;
    var u=new URL(a.href,location.href);
    if(u.origin!==location.origin||u.pathname===location.pathname||pre[u.pathname])return;
    pre[u.pathname]=1; var l=document.createElement("link"); l.rel="prefetch"; l.href=u.pathname; document.head.appendChild(l);
  }
  document.addEventListener("pointerover",function(e){prefetch(e.target.closest&&e.target.closest("a"));},{passive:true});
  document.addEventListener("touchstart",function(e){prefetch(e.target.closest&&e.target.closest("a"));},{passive:true});

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
    ScrollTrigger.batch("[data-reveal]",{start:"top 88%",once:true,
      onEnter:function(b){gsap.to(b,{clipPath:"inset(0 0 0% 0)",duration:.9,ease:"power3.inOut",stagger:.12,overwrite:true});}});
    /* Parallax sutil dentro de las viñetas (solo pantallas grandes) */
    if(window.matchMedia("(min-width:900px) and (pointer:fine)").matches){
      gsap.utils.toArray(".panel.ratio-169 > img, .panel.ratio-1 > img, .panel.ratio-34 > img, .panel.ratio-43 > img").forEach(function(im){
        if(im.closest("[data-hero]"))return;
        gsap.fromTo(im,{yPercent:-4,scale:1.1},{yPercent:4,scale:1.1,ease:"none",scrollTrigger:{trigger:im.parentElement,start:"top bottom",end:"bottom top",scrub:.4}});
      });
    }
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
    opener=t; show(group.indexOf(t)); lb.classList.add("is-open"); lockScroll(true); lb.querySelector(".lightbox__close").focus();
  });
  function closeLb(){lb.classList.remove("is-open");lockScroll(false);if(opener)opener.focus();}
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

  /* ---------- Imágenes que se enfocan al cargar (placeholder borroso) ---------- */
  document.querySelectorAll("img.lqip").forEach(function(im){
    if(im.complete&&im.naturalWidth){im.classList.add("is-done");return;}
    im.addEventListener("load",function(){im.classList.add("is-loaded");},{once:true});
  });

  /* ---------- Explorador de tipos de cartas ---------- */
  document.querySelectorAll("[data-cex]").forEach(function(cx){
    var tabs=Array.prototype.slice.call(cx.querySelectorAll('[role="tab"]')), pans=Array.prototype.slice.call(cx.querySelectorAll(".cex__panel")),
        cnt=cx.querySelector(".cex__count"), stage=cx.querySelector(".cex__stage"), cur=0, busy=false;
    cx.classList.add("is-ready");
    function go(i,dir,focus){
      i=(i+tabs.length)%tabs.length; if(i===cur||busy)return;
      var from=pans[cur], to=pans[i]; dir=dir||(i>cur?1:-1);
      tabs.forEach(function(t,k){t.setAttribute("aria-selected",k===i?"true":"false");t.tabIndex=k===i?0:-1;});
      if(focus)tabs[i].focus();
      tabs[i].scrollIntoView({behavior:reduce?"auto":"smooth",block:"nearest",inline:"center"});
      if(cnt)cnt.textContent=(i+1)+" / "+tabs.length;
      cur=i;
      if(hasGsap&&!reduce){
        busy=true;
        gsap.to(from.querySelector(".cex__card button"),{rotateY:-80*dir,opacity:0,duration:.22,ease:"power2.in"});
        gsap.to(from.querySelector(".cex__text"),{x:-30*dir,opacity:0,duration:.2,ease:"power2.in",onComplete:function(){
          from.classList.remove("is-active"); to.classList.add("is-active");
          gsap.fromTo(to.querySelector(".cex__card button"),{rotateY:80*dir,opacity:0},{rotateY:0,opacity:1,duration:.5,ease:"back.out(1.4)",clearProps:"transform"});
          gsap.fromTo(to.querySelector(".cex__text"),{x:40*dir,opacity:0},{x:0,opacity:1,duration:.45,ease:"power3.out",delay:.05,onComplete:function(){busy=false;}});
        }});
      } else { from.classList.remove("is-active"); to.classList.add("is-active"); }
    }
    tabs.forEach(function(t,k){
      t.addEventListener("click",function(){go(k);});
      t.addEventListener("keydown",function(e){
        if(e.key==="ArrowRight"){e.preventDefault();go(cur+1,1,true);}
        else if(e.key==="ArrowLeft"){e.preventDefault();go(cur-1,-1,true);}
      });
    });
    cx.querySelectorAll("[data-cex-step]").forEach(function(b){b.addEventListener("click",function(){var d=+b.dataset.cexStep;go(cur+d,d);});});
    var sx=null, sy=null;
    stage.addEventListener("pointerdown",function(e){sx=e.clientX;sy=e.clientY;},{passive:true});
    stage.addEventListener("pointerup",function(e){
      if(sx===null)return; var dx=e.clientX-sx, dy=e.clientY-sy; sx=null;
      if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.5){go(cur+(dx<0?1:-1),dx<0?1:-1);}
    },{passive:true});
  });

  /* ---------- Galerías de video (reproductor + tira de miniaturas) ---------- */
  function ytFrame(id,title){return '<iframe src="https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1&rel=0&modestbranding=1" title="'+String(title).replace(/"/g,"&quot;")+'" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>';}
  document.querySelectorAll("[data-vgal]").forEach(function(g){
    var stage=g.querySelector(".vgal__stage .yt"), now=g.querySelector(".vgal__now"), cnt=g.querySelector(".vgal__count"),
        btns=Array.prototype.slice.call(g.querySelectorAll(".vgal__strip button")), strip=g.querySelector(".vgal__strip");
    btns.forEach(function(b,i){b.addEventListener("click",function(){
      btns.forEach(function(x){x.classList.remove("is-active");x.removeAttribute("aria-current");});
      b.classList.add("is-active"); b.setAttribute("aria-current","true");
      stage.dataset.id=b.dataset.id; stage.innerHTML=ytFrame(b.dataset.id,b.dataset.title);
      if(now)now.textContent=b.dataset.title; if(cnt)cnt.textContent=(i+1)+" / "+btns.length;
      if(hasGsap&&!reduce)gsap.fromTo(stage,{opacity:.2,scale:.985},{opacity:1,scale:1,duration:.45,ease:"power2.out"});
      b.scrollIntoView({behavior:reduce?"auto":"smooth",block:"nearest",inline:"center"});
    });});
    g.querySelectorAll("[data-vgal-step]").forEach(function(a){a.addEventListener("click",function(){
      strip.scrollBy({left:(+a.dataset.vgalStep)*strip.clientWidth*.8,behavior:reduce?"auto":"smooth"});
    });});
  });

  /* ---------- Sala de cine: tráiler a pantalla completa ---------- */
  var cin=null, cinOpener=null;
  function fmt(t){t=Math.max(0,t|0);return (t/60|0)+":"+("0"+t%60).slice(-2);}
  function openCinema(src,title,poster){
    if(!cin){
      cin=document.createElement("div"); cin.className="cinema"; cin.setAttribute("role","dialog"); cin.setAttribute("aria-modal","true");
      cin.innerHTML='<div class="cinema__backdrop"></div><div class="cinema__frame"><button class="cinema__close" type="button" aria-label="Cerrar">✕</button><div class="cinema__screen"></div><p class="cinema__title"></p></div>';
      document.body.appendChild(cin);
      cin.querySelector(".cinema__close").addEventListener("click",closeCinema);
      cin.querySelector(".cinema__backdrop").addEventListener("click",closeCinema);
    }
    var scr=cin.querySelector(".cinema__screen"); cin.setAttribute("aria-label",title||"Video");
    cin.querySelector(".cinema__title").textContent=title||"";
    if(src.indexOf("yt:")===0){ scr.innerHTML=ytFrame(src.slice(3),title); }
    else {
      scr.innerHTML='<video playsinline preload="auto"'+(poster?' poster="'+poster+'"':'')+'><source src="'+src.replace(/^mp4:/,"")+'" type="video/mp4"></video>'+
        '<button class="cin-big" type="button" aria-label="Reproducir"></button>'+
        '<div class="cin-bar"><button class="cin-play" type="button" aria-label="Pausar"></button><span class="cin-time">0:00</span>'+
        '<input class="cin-seek" type="range" min="0" max="1000" value="0" aria-label="Avance del video"><span class="cin-dur">0:00</span>'+
        '<button class="cin-mute" type="button" aria-label="Silenciar"></button><button class="cin-fs" type="button" aria-label="Pantalla completa"></button></div>';
      var v=scr.querySelector("video"), big=scr.querySelector(".cin-big"), play=scr.querySelector(".cin-play"), seek=scr.querySelector(".cin-seek"),
          tm=scr.querySelector(".cin-time"), du=scr.querySelector(".cin-dur"), mute=scr.querySelector(".cin-mute"), fs=scr.querySelector(".cin-fs"), hideT=0;
      function sync(){scr.classList.toggle("is-playing",!v.paused);play.setAttribute("aria-label",v.paused?"Reproducir":"Pausar");}
      function toggle(){ if(v.paused){var p=v.play();if(p&&p.catch)p.catch(function(){});} else v.pause(); }
      function wake(){scr.classList.add("show-ui");clearTimeout(hideT);hideT=setTimeout(function(){if(!v.paused)scr.classList.remove("show-ui");},2200);}
      v.addEventListener("click",toggle); big.addEventListener("click",toggle); play.addEventListener("click",toggle);
      v.addEventListener("play",sync); v.addEventListener("pause",sync); v.addEventListener("ended",function(){scr.classList.add("show-ui");sync();});
      v.addEventListener("loadedmetadata",function(){du.textContent=fmt(v.duration);});
      v.addEventListener("timeupdate",function(){tm.textContent=fmt(v.currentTime);if(v.duration)seek.value=v.currentTime/v.duration*1000;seek.style.setProperty("--p",(seek.value/10)+"%");});
      seek.addEventListener("input",function(){if(v.duration)v.currentTime=seek.value/1000*v.duration;});
      mute.addEventListener("click",function(){v.muted=!v.muted;scr.classList.toggle("is-muted",v.muted);});
      fs.addEventListener("click",function(){var el=scr;if(document.fullscreenElement)document.exitFullscreen();else if(el.requestFullscreen)el.requestFullscreen();else if(v.webkitEnterFullscreen)v.webkitEnterFullscreen();});
      scr.addEventListener("pointermove",wake); scr.classList.add("show-ui");
      cin._v=v; cin._toggle=toggle;
      setTimeout(toggle,350);
    }
    cin.classList.add("is-open"); lockScroll(true);
    if(hasGsap&&!reduce){
      gsap.fromTo(cin.querySelector(".cinema__backdrop"),{opacity:0},{opacity:1,duration:.35});
      gsap.fromTo(cin.querySelector(".cinema__frame"),{clipPath:"inset(48% 0 48% 0)",scale:.96},{clipPath:"inset(0% 0 0% 0)",scale:1,duration:.6,ease:"expo.out",delay:.05,clearProps:"clipPath,transform"});
    }
    cin.querySelector(".cinema__close").focus();
  }
  function closeCinema(){
    if(!cin||!cin.classList.contains("is-open"))return;
    var done=function(){cin.classList.remove("is-open");cin.querySelector(".cinema__screen").innerHTML="";cin._v=null;lockScroll(false);if(cinOpener)cinOpener.focus();};
    if(cin._v)cin._v.pause();
    if(document.fullscreenElement)document.exitFullscreen();
    if(hasGsap&&!reduce){gsap.to(cin.querySelector(".cinema__frame"),{clipPath:"inset(48% 0 48% 0)",duration:.35,ease:"power3.in"});gsap.to(cin.querySelector(".cinema__backdrop"),{opacity:0,duration:.35,delay:.1,onComplete:done});}
    else done();
  }
  document.addEventListener("click",function(e){
    var t=e.target.closest&&e.target.closest("[data-cinema]"); if(!t)return; e.preventDefault();
    cinOpener=t; openCinema(t.dataset.cinema,t.dataset.title,t.dataset.poster);
  });
  document.addEventListener("keydown",function(e){
    if(!cin||!cin.classList.contains("is-open"))return;
    if(e.key==="Escape"){e.preventDefault();closeCinema();}
    else if(cin._v&&(e.key===" "||e.key==="k")&&e.target.tagName!=="BUTTON"){e.preventDefault();cin._toggle();}
    else if(cin._v&&e.key==="ArrowRight"){cin._v.currentTime+=5;}
    else if(cin._v&&e.key==="ArrowLeft"){cin._v.currentTime-=5;}
  });
  /* Botón B / Start de un control cierra la sala de cine */
  if("getGamepads" in navigator){
    var gpPrev=false;
    (function gpLoop(){
      if(cin&&cin.classList.contains("is-open")){
        var pads=navigator.getGamepads?navigator.getGamepads():[], pressedB=false, pressedA=false;
        for(var i=0;i<pads.length;i++){var p=pads[i];if(p&&p.buttons){if(p.buttons[1]&&p.buttons[1].pressed)pressedB=true;if(p.buttons[0]&&p.buttons[0].pressed)pressedA=true;}}
        if(pressedB&&!gpPrev)closeCinema(); else if(pressedA&&!gpPrev&&cin._toggle)cin._toggle();
        gpPrev=pressedA||pressedB;
      }
      requestAnimationFrame(gpLoop);
    })();
  }

  if(hasGsap&&window.ScrollTrigger) window.addEventListener("load",function(){ScrollTrigger.refresh();});
})();
