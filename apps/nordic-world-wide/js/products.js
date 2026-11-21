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
     etiqueta       → (opcional) badge sobre la foto, ej: "DROP 01", "AGOTADO"

   Para añadir una camiseta: copia un bloque { ... }, pégalo
   al final de la lista y cambia los datos.
   Si la lista queda vacía, el Shop muestra "Próximo drop muy pronto".
   ========================================================= */

window.PRODUCTS = [
  {
    // Camiseta de prueba
    id: "explore-tee",
    nombre: "EXPLORE TEE — BLANCA",
    precio: null,
    tallas: ["S", "M", "L", "XL"],
    fotos: ["img/products/explore-tee-frente.jpg", "img/products/explore-tee-espalda.jpg"],
    descripcion: "Camiseta oversized blanca con estampado azul marino. Delante: logo NORDIC WORLDWIDE con montañas, rosa de los vientos en la manga y detalle «Explore more · Est. 2024». Detrás: gran logo de montañas con el lema «Explore more, go further».",
    descripcion_en: "White oversized tee with navy print. Front: NORDIC WORLDWIDE mountain logo, compass rose on the sleeve and an «Explore more · Est. 2024» detail. Back: large mountain logo with the «Explore more, go further» slogan.",
    etiqueta: "DROP 01"
  }
];
