/** Banner de Ribera del Paraíso (Marina de Sotogrande) — alojamiento recomendado, link externo. */
export function AnuncioRibera() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-10 md:pt-14">
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
          preload="none"
          className="block aspect-video w-full object-cover transition group-hover:scale-[1.01]"
        />
      </a>
    </section>
  );
}
