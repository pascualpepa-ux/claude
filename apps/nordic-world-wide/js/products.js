/* =========================================================
   CATÁLOGO — NORDIC WORLD WIDE
   ---------------------------------------------------------
   Este es el ÚNICO archivo que hay que tocar para añadir,
   quitar o editar camisetas. El diseño se adapta solo.

   Campos de cada producto:
     id          → identificador único, sin espacios (va en la URL)
     nombre      → nombre visible
     precio      → número en euros (ej: 39.9) o null = "Precio a consultar"
     tallas      → tallas disponibles
     fotos       → rutas o URLs de imágenes (la primera es la portada)
     descripcion → texto corto para la página de producto
     etiqueta    → (opcional) badge sobre la foto, ej: "DROP 01", "AGOTADO"

   Para añadir una camiseta: copia un bloque { ... }, pégalo
   al final de la lista y cambia los datos.
   ========================================================= */

window.PRODUCTS = [
  // Todavía no hay camisetas publicadas. Mientras la lista esté vacía,
  // el Shop muestra "Próximo drop muy pronto".
  //
  // Ejemplo para copiar (quita las // del principio de cada línea):
  // {
  //   id: "nombre-camiseta",
  //   nombre: "NOMBRE CAMISETA",
  //   precio: null,
  //   tallas: ["S", "M", "L", "XL"],
  //   fotos: ["img/products/foto-frente.jpg", "img/products/foto-espalda.jpg"],
  //   descripcion: "Descripción corta.",
  //   etiqueta: "DROP 01"
  // },
];
