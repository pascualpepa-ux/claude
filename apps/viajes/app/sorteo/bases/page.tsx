import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { textosActuales } from "@/lib/idioma-servidor";
import { datosSorteo, sorteoActivo } from "@/lib/sorteo";
import { LOCALE } from "@/lib/idioma";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Bases del sorteo | Rumbo Traveling", robots: { index: false, follow: true } };

const FALTA = { es: "[a completar]", en: "[to be completed]" };

export default async function BasesSorteo() {
  if (!sorteoActivo()) notFound();
  const { idioma } = await textosActuales();
  const { cierre, organizador } = datosSorteo();
  const fecha = cierre
    ? new Date(`${cierre}T12:00:00`).toLocaleDateString(LOCALE[idioma], { day: "numeric", month: "long", year: "numeric" })
    : FALTA[idioma];
  const quien = organizador || FALTA[idioma];

  const secciones =
    idioma === "es"
      ? [
          ["Organizador", `Organiza el sorteo ${quien}, responsable de Rumbo Traveling (rumbotraveling.com). Contacto: info@rumbotraveling.com.`],
          ["Quién puede participar", "Personas mayores de 18 años, o menores con autorización de su madre, padre o tutor. Participar es gratis y no hace falta comprar nada."],
          ["Cómo se participa", `Suscribiéndose gratis a Rumbo Traveling en rumbotraveling.com/sorteo y confirmando el email hasta el ${fecha}, a las 23:59 (hora de Madrid). Cada suscriptor confirmado tiene 1 chance, y suma 1 chance más por cada persona que se suscriba y confirme con su link personal. Una persona solo puede suscribirse una vez con el mismo email; las suscripciones falsas o automáticas no cuentan.`],
          ["Premio", "Un viaje de 3 días a una ciudad de Europa para 1 persona: vuelo de ida y vuelta en clase turista, 2 noches de hotel y algunas actividades. Las fechas y el destino se acuerdan con el ganador. El premio no se puede cambiar por dinero."],
          ["Sorteo", "Al cierre se hace un único sorteo al azar entre todos los suscriptores confirmados, con un sistema que tiene en cuenta las chances de cada uno. El sorteo queda registrado y se publica el resultado."],
          ["Ganador", "Se avisa al ganador por email. Si no responde en 7 días, el premio se sortea de nuevo entre el resto de los participantes."],
          ["Datos personales", "El email se usa para el sorteo y para mandar novedades de Rumbo Traveling. Te podés dar de baja cuando quieras con el link que va en cada email; si te das de baja antes del cierre, dejás de participar."],
        ]
      : [
          ["Organizer", `The giveaway is organized by ${quien}, in charge of Rumbo Traveling (rumbotraveling.com). Contact: info@rumbotraveling.com.`],
          ["Who can enter", "People aged 18 or older, or minors with permission from a parent or guardian. Entry is free and no purchase is required."],
          ["How to enter", `Subscribe to Rumbo Traveling for free at rumbotraveling.com/sorteo and confirm your email by ${fecha}, 11:59 p.m. (Madrid time). Each confirmed subscriber has 1 chance, plus 1 more for every person who subscribes and confirms with their personal link. One subscription per email; fake or automated subscriptions don't count.`],
          ["Prize", "A 3-day trip to a European city for 1 person: round-trip economy flight, 2 hotel nights and some activities. Dates and destination are agreed with the winner. The prize cannot be exchanged for cash."],
          ["Draw", "When the giveaway closes, a single random draw is made among all confirmed subscribers, weighted by each person's chances. The draw is recorded and the result is published."],
          ["Winner", "The winner is notified by email. If they don't reply within 7 days, the prize is drawn again among the other entrants."],
          ["Personal data", "Your email is used for the giveaway and to send Rumbo Traveling news. You can unsubscribe at any time with the link in every email; if you unsubscribe before the close, you leave the giveaway."],
        ];

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 md:py-16">
      <h1 className="text-3xl font-semibold tracking-tight">{idioma === "es" ? "Bases y condiciones del sorteo" : "Giveaway official rules"}</h1>
      <dl className="mt-8 grid gap-6">
        {secciones.map(([titulo, texto]) => (
          <div key={titulo}>
            <dt className="font-semibold">{titulo}</dt>
            <dd className="mt-1 leading-relaxed text-arena-700 dark:text-arena-300">{texto}</dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
