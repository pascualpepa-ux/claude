/**
 * Banner de Ribera del Paraíso (Marina de Sotogrande) — alojamiento recomendado, link externo.
 * Sin ancho propio: cada página lo envuelve con el contenedor que le corresponda.
 */
export function AnuncioRibera() {
  return (
    <a
      href="https://riberadelparaiso.com"
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="group mx-auto block max-w-2xl overflow-hidden rounded-3xl shadow-lg shadow-black/10 transition hover:shadow-xl hover:shadow-black/15"
    >
      <video
        src="/anuncios/ribera-del-paraiso.mp4"
        poster="/anuncios/ribera-del-paraiso-poster.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="block aspect-video w-full object-cover transition group-hover:scale-[1.01]"
      />
    </a>
  );
}
