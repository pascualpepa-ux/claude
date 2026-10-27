/** Aerolíneas que la gente suele escribir en "Aerolínea preferida", con su código IATA. */
const AEROLINEAS: [codigo: string, nombres: string[]][] = [
  ["UX", ["air europa", "aireuropa"]],
  ["IB", ["iberia"]],
  ["I2", ["iberia express"]],
  ["AR", ["aerolineas argentinas", "aerolineas", "aerolíneas argentinas"]],
  ["LA", ["latam", "lan", "tam"]],
  ["AA", ["american", "american airlines"]],
  ["UA", ["united", "united airlines"]],
  ["DL", ["delta", "delta air lines"]],
  ["AF", ["air france"]],
  ["KL", ["klm"]],
  ["LH", ["lufthansa"]],
  ["BA", ["british", "british airways"]],
  ["EK", ["emirates"]],
  ["QR", ["qatar", "qatar airways"]],
  ["EY", ["etihad"]],
  ["TK", ["turkish", "turkish airlines"]],
  ["CM", ["copa", "copa airlines"]],
  ["AV", ["avianca"]],
  ["G3", ["gol"]],
  ["AD", ["azul"]],
  ["JA", ["jetsmart", "jet smart"]],
  ["FO", ["flybondi", "fly bondi"]],
  ["H2", ["sky", "sky airline"]],
  ["AM", ["aeromexico", "aeroméxico"]],
  ["AZ", ["ita", "ita airways", "alitalia"]],
  ["TP", ["tap", "tap portugal", "tap air portugal"]],
  ["LX", ["swiss"]],
  ["AC", ["air canada"]],
  ["VY", ["vueling"]],
  ["FR", ["ryanair"]],
  ["U2", ["easyjet"]],
  ["PU", ["plus ultra"]],
  ["DM", ["arajet"]],
  ["OB", ["boliviana", "boa"]],
  ["ZP", ["paranair"]],
  ["CA", ["air china"]],
  ["MU", ["china eastern"]],
  ["CZ", ["china southern"]],
  ["CX", ["cathay", "cathay pacific"]],
  ["SQ", ["singapore", "singapore airlines"]],
  ["JL", ["japan airlines", "jal"]],
  ["NH", ["ana", "all nippon"]],
  ["KE", ["korean", "korean air"]],
  ["ET", ["ethiopian"]],
  ["AT", ["royal air maroc"]],
  ["MS", ["egyptair"]],
  ["SK", ["sas"]],
  ["AY", ["finnair"]],
  ["EI", ["aer lingus"]],
  ["LO", ["lot"]],
  ["OS", ["austrian"]],
  ["SN", ["brussels airlines"]],
  ["QF", ["qantas"]],
  ["NZ", ["air new zealand"]],
];

const normalizar = (t: string) =>
  t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

/** Código IATA de la aerolínea escrita por la persona ("Air Europa" -> "UX"), o null si no la conocemos. */
export function codigoAerolinea(nombre: string): string | null {
  const n = normalizar(nombre);
  if (!n) return null;
  if (/^[a-z0-9]{2}$/.test(n)) return n.toUpperCase(); // ya escribió el código
  for (const [codigo, nombres] of AEROLINEAS) if (nombres.some((x) => normalizar(x) === n)) return codigo;
  for (const [codigo, nombres] of AEROLINEAS) if (nombres.some((x) => n.includes(normalizar(x)) && normalizar(x).length > 3)) return codigo;
  return null;
}
