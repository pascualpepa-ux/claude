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
  {
    id: "aurora-tee",
    nombre: "AURORA OVERSIZED TEE",
    precio: null,
    tallas: ["S", "M", "L", "XL"],
    fotos: ["img/products/aurora-1.svg", "img/products/aurora-2.svg"],
    descripcion: "Algodón pesado 240 g, corte oversized y hombro caído. Estampado frontal en azul hielo.",
    etiqueta: "DROP 01"
  },
  {
    id: "fjord-tee",
    nombre: "FJORD BLACK TEE",
    precio: null,
    tallas: ["S", "M", "L", "XL"],
    fotos: ["img/products/fjord-1.svg", "img/products/fjord-2.svg"],
    descripcion: "Negro total. Logo frontal y espalda NORDIC WORLD WIDE en blanco. Fit boxy.",
    etiqueta: "DROP 01"
  },
  {
    id: "polar-tee",
    nombre: "POLAR GREY TEE",
    precio: null,
    tallas: ["S", "M", "L", "XL"],
    fotos: ["img/products/polar-1.svg", "img/products/polar-2.svg"],
    descripcion: "Gris nórdico lavado, cuello canalé grueso y estampado tono sobre tono."
  },
  {
    id: "frost-tee",
    nombre: "FROST WHITE TEE",
    precio: null,
    tallas: ["S", "M", "L", "XL"],
    fotos: ["img/products/frost-1.svg", "img/products/frost-2.svg"],
    descripcion: "Blanco óptico con detalles en azul hielo. Edición limitada.",
    etiqueta: "LIMITADA"
  }
];
