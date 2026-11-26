import Link from "next/link";

export default function NoEncontrado() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <p className="text-7xl font-black texto-degrade">404</p>
      <h1 className="mt-4 text-2xl font-bold">Este nivel no existe</h1>
      <p className="mt-2 text-tenue">El juego o la página que buscabas no está. Pero hay miles más esperándote.</p>
      <Link href="/explorar" className="mt-6 rounded-xl bg-marca px-5 py-3 font-semibold transition hover:bg-marca-2">Explorar juegos</Link>
    </div>
  );
}
