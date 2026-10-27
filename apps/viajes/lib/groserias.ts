/**
 * Detecta insultos y malas palabras en el chat de ayuda (español e inglés).
 * Quien las usa queda en pausa un minuto: ver app/pausa y middleware.ts.
 */

export const COOKIE_PAUSA = "rumbo_pausa";
export const SEGUNDOS_PAUSA = 60;

// Raíces escritas sin tildes ni letras repetidas (ver `normalizar`). Cada una se busca como palabra
// entera; las que terminan en "*" aceptan cualquier final (putas, fucking, etc.).
// Se evitan raíces que choquen con palabras comunes de viaje: "put" (inglés), "Vergara", "retraso/retrasado",
// "cono", "paja", "polla", "perra", "forro (polar)", "Gil", "HP", "cocktail", "Assisi", "Moroni", "spicy"...
const RAICES = [
  // Español (Argentina, Uruguay, España, México, Chile, Colombia, Perú, Venezuela...)
  "puta*", "puto*", "putit*", "hijo de puta", "hija de puta", "hijueputa*", "hdp", "lpm", "ptm", "ptmr", "lpqtp", "mrd",
  "mierd*", "carajo", "carajos", "conchud*", "concha de tu madre", "concha tu madre", "concha de la lora",
  "conchetumare", "conchetumadre", "conchatumadre", "conchesumadre", "conchasumadre", "ctm", "csm", "chuchetumare",
  "pelotud*", "bolud*", "pendej*", "verga", "vergas", "vergon*", "pija", "pijas", "pijud*", "orto", "ojete", "culo", "culos",
  "culer*", "culiao", "culiad*", "cagon*", "cagad*", "cagate", "sorete*", "garca*", "choto*", "chota", "trolo*", "trola",
  "pajer*", "pajud*", "pajuo", "coño de tu madre", "joder", "jodete", "jodet", "gilipol*", "cabron*", "maricon*", "marica",
  "maricas", "joto*", "chupala", "chupame", "chupapij*", "chupavergas", "mamaguevo*", "mamahuevo*", "comemierd*",
  "lameculo*", "lameculos", "mamon*", "mamad*", "chingad*", "chingar*", "chinga", "chingas", "chingate", "pinche*",
  "huevon*", "weon*", "aweonad*", "cojud*", "cojon*", "malparid*", "malnacid*", "desgraciad*", "zorra", "zorras",
  "hija de perra", "hijo de perra", "cornud*", "tetas", "putamadre", "putisima", "mogolic*", "idiota*", "imbecil*",
  "estupid*", "tarad*", "subnormal*", "sudaca*", "andate a la mierda", "vete a la mierda",
  // Inglés
  "fuck*", "fck*", "fuk*", "fuq*", "fking", "fkn", "motherfuck*", "mf", "mofo", "shit", "shits", "shity", "shitier",
  "shithead*", "shitole*", "bulshit", "horseshit", "dipshit*", "crap", "crapy", "bitch*", "ass", "ases", "asshole*",
  "arse", "arsehole*", "dumbas*", "jackas*", "smartas*", "badas", "kiss my ass", "bastard*", "cunt*", "dick", "dicks",
  "dickhead*", "prick", "pricks", "cock", "cocks", "cocksucker*", "pusy", "pusies", "whore*", "slut*", "twat*", "wank*",
  "bolock*", "douche*", "scumbag*", "piss", "pised", "pis of", "damn", "damned", "damnit", "godamn*", "moron", "morons",
  "moronic", "idiot*", "stupid", "retard", "retards", "retarded", "stfu", "wtf", "gtfo", "nigger*", "niga", "nigas",
  "fag", "fags", "faggot*", "tranny", "spic", "spics",
];

/** Minúsculas, sin tildes, con números/símbolos pasados a letras y sin letras repetidas ("putaaa" -> "puta"). */
export function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[4@]/g, "a")
    .replace(/3/g, "e")
    .replace(/[1!|]/g, "i")
    .replace(/0/g, "o")
    .replace(/[5$]/g, "s")
    .replace(/[^a-z ]+/g, " ")
    .replace(/(.)\1+/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

const PATRON = new RegExp(
  `(?:^| )(?:${RAICES.map((r) => {
    const base = normalizar(r.replace(/\*/g, ""));
    return base + (r.endsWith("*") ? "[a-z]*" : "");
  }).join("|")})(?= |$)`,
);

export function tieneGroserias(texto: string) {
  // También sin separadores dentro de la palabra: "p.u.t.a", "f*u*c*k".
  return PATRON.test(normalizar(texto)) || PATRON.test(normalizar(texto.replace(/[.*_\-]/g, "")));
}
