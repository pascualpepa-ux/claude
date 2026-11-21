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
  // Todavía no hay camisetas publicadas: el Shop muestra "Próximo drop muy pronto".
  //
  // Ejemplo para copiar (quita las // del principio de cada línea):
  // {
  //   id: "nombre-camiseta",
  //   nombre: "NOMBRE CAMISETA",
  //   precio: null,
  //   tallas: ["S", "M", "L", "XL"],
  //   fotos: ["img/products/foto-frente.jpg", "img/products/foto-espalda.jpg"],
  //   descripcion: "Descripción corta.",
  //   descripcion_en: "Short description.",
  //   etiqueta: "DROP 01"
  // },
];
