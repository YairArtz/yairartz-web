# yairartz.com — sitio estático

Sitio en HTML, CSS y JavaScript sin dependencias de compilación. Las animaciones usan GSAP (ScrollTrigger y SplitText) desde jsDelivr; si no cargan, el sitio funciona igual, sin animaciones.

## Estructura

```
index.html                 Inicio
comics.html                Cómics (Koatl, El Caballero de Cristal, PokeMX, Az-Tek-Oh!)
koatl.html                 Koatl el Defensor: historia, números, Decomixado, lectores
los-tuneles-perdidos.html  El videojuego
choque-de-heroes.html      El TCG
cdh-reglas.html            Reglamento, tablero, cartas limitadas, dudas y glosario
servicios.html             Servicios y portafolio
sobre-mi.html              Biografía, conferencias, talleres, entrevistas
404.html                   Página de error
assets/css/main.css        Estilos (colores y tipografías al inicio, en :root)
assets/js/main.js          Interacción y motion graphics
assets/img/                Imágenes optimizadas en WebP, por sección
assets/video/              Animaciones del juego convertidas de GIF a MP4
cómics/, choque-de-héroes/, …   Redirecciones desde las URLs viejas de Google Sites
CNAME, sitemap.xml, robots.txt
```

## Publicar en GitHub Pages con tu dominio

1. Crea un repositorio nuevo (por ejemplo `yairartz-web`) y sube **todo el contenido de esta carpeta** a la raíz.
2. En el repositorio: Settings → Pages → Source: "Deploy from a branch", rama `main`, carpeta `/ (root)`.
3. El archivo `CNAME` ya contiene `www.yairartz.com`. En Settings → Pages escribe ese dominio en "Custom domain".
4. En Google Sites: Configuración → Dominios personalizados → quita `www.yairartz.com` (si no, el dominio sigue apuntando a Google).
5. En tu proveedor de dominio cambia el DNS:
   - `www` → registro **CNAME** hacia `yairartz.github.io`
   - Dominio raíz `yairartz.com` → registros **A** hacia `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
6. Cuando GitHub verifique el dominio, activa "Enforce HTTPS".

Los cambios de DNS pueden tardar unas horas.

## Editar contenido

- Los textos están directamente en cada `.html`.
- Para agregar una tarjeta de producto en el futuro, copia un bloque `<article class="product">…</article>`.
- Para un video de YouTube: `<div class="yt" data-id="ID_DEL_VIDEO" data-title="Título"></div>`.
- Para una imagen ampliable: envuélvela en `<button type="button" data-lightbox="grupo" data-caption="Pie de foto">`.
- Atributos de animación: `data-reveal` (la viñeta se revela al entrar en pantalla), `data-pop` (aparece con rebote en el héroe), `class="holo"` (brillo holográfico al pasar el mouse).
- Colores: `--oro`, `--jade`, `--grana`, `--energia`, `--obsidiana`, `--amate` en `assets/css/main.css`.
