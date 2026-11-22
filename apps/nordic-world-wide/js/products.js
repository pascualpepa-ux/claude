/* =========================================================
   CATÁLOGO — NORDIC WORLD WIDE
   ---------------------------------------------------------
   Este es el ÚNICO archivo que hay que tocar para añadir,
   quitar o editar camisetas. El diseño se adapta solo.

   Campos de cada producto:
     id             → identificador único, sin espacios (va en la URL)
     nombre         → nombre visible
     precio         → número en euros (ej: 39.9) o null = "Precio a consultar"
     tallas         → tallas disponibles
     fotos          → rutas o URLs de imágenes (la primera es la portada).
                      Formato recomendado: cuadradas, 900×900 o más.
     descripcion    → texto corto para la página de producto (español)
     descripcion_en → (opcional) el mismo texto en inglés, para el botón EN
     etiqueta       → (opcional) badge sobre la foto, ej: "CHICO", "AGOTADO"
     etiqueta_en    → (opcional) la etiqueta en inglés, ej: "MEN", "SOLD OUT"

   Para añadir una camiseta: copia un bloque { ... }, pégalo
   al final de la lista y cambia los datos.
   Si la lista queda vacía, el Shop muestra "Próximo drop muy pronto".
   ========================================================= */

window.PRODUCTS = [
  /* ---------- CHICO ---------- */
  {
    id: "nordic-original",
    nombre: "NORDIC ORIGINAL",
    precio: 35,
    tallas: ["XS", "S", "M", "L", "XL"],
    fotos: ["img/products/polaris-tee-frente.jpg", "img/products/polaris-tee-espalda.jpg"],
    descripcion: "Camiseta oversized blanca con estampado azul marino. Delante: logo NORDIC WORLDWIDE con la estrella polar, un planeta con órbita y franjas en la manga. Detrás: gran logo NORDIC en órbita, montañas y el lema «Explore · Discover · Belong».",
    descripcion_en: "White oversized tee with navy print. Front: NORDIC WORLDWIDE logo with the north star, an orbiting planet and sleeve stripes. Back: large orbiting NORDIC logo, mountains and the «Explore · Discover · Belong» motto.",
    etiqueta: "CHICO",
    etiqueta_en: "MEN"
  },
  {
    id: "summit-tee",
    nombre: "SUMMIT TEE",
    precio: 35,
    tallas: ["XS", "S", "M", "L", "XL"],
    fotos: ["img/products/summit-tee-frente.jpg", "img/products/summit-tee-espalda.jpg"],
    descripcion: "Camiseta oversized blanca con estampado azul marino. Delante: logo NORDIC WORLDWIDE con montañas, rosa de los vientos en la manga y detalle «Explore more · Est. 2024». Detrás: gran logo de montañas con el lema «Explore more, go further».",
    descripcion_en: "White oversized tee with navy print. Front: NORDIC WORLDWIDE mountain logo, compass rose on the sleeve and an «Explore more · Est. 2024» detail. Back: large mountain logo with the «Explore more, go further» slogan.",
    etiqueta: "CHICO",
    etiqueta_en: "MEN"
  },

  /* ---------- CHICA ---------- */
  {
    id: "alpenglow-tee",
    nombre: "ALPENGLOW TEE",
    precio: 36,
    tallas: ["XS", "S", "M", "L", "XL"],
    fotos: ["img/products/alpenglow-tee-frente.jpg", "img/products/alpenglow-tee-espalda.jpg", "img/products/alpenglow-tee-detalle.jpg"],
    descripcion: "Camiseta oversized blanca con estampado en rojo granate y azul marino. Delante: logo NORDIC con montañas, estrellas fugaces y «Explore more, go further» escrito a mano. Detrás: gran logo NORDIC WORLDWIDE entre montañas y estrellas, con coordenadas. Rosa de los vientos y franjas en las mangas.",
    descripcion_en: "White oversized tee with burgundy red and navy print. Front: NORDIC mountain logo, shooting stars and a handwritten «Explore more, go further». Back: large NORDIC WORLDWIDE logo among mountains and stars, with coordinates. Compass rose and stripes on the sleeves.",
    etiqueta: "CHICA",
    etiqueta_en: "WOMEN"
  },
  {
    id: "nordlys-tee",
    nombre: "NORDLYS TEE",
    precio: 35,
    tallas: ["XS", "S", "M", "L", "XL"],
    fotos: ["img/products/nordlys-tee-frente.jpg", "img/products/nordlys-tee-espalda.jpg", "img/products/nordlys-tee-detalle.jpg"],
    descripcion: "Camiseta oversized color crema con estampado azul marino y franjas rosas en la manga. Delante: logo NORDIC con la estrella polar. Detrás: logo NORDIC WORLDWIDE en órbita y «Explore · Discover · Belong». «Nordlys» significa aurora boreal en noruego.",
    descripcion_en: "Cream oversized tee with navy print and pink sleeve stripes. Front: NORDIC logo with the north star. Back: orbiting NORDIC WORLDWIDE logo and «Explore · Discover · Belong». «Nordlys» means northern lights in Norwegian.",
    etiqueta: "CHICA",
    etiqueta_en: "WOMEN"
  }
];
