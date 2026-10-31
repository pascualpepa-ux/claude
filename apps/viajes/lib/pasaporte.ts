// Lectura del código de abajo del pasaporte (MRZ, formato TD3 de la OACI: 2 líneas de 44 caracteres).
// Los dígitos de control confirman que el número y las fechas se leyeron bien; si no coinciden, no se usan.

// Países: código de 3 letras (el del pasaporte) seguido del de 2 letras (ISO 3166-1, de pycountry).
const PAISES = "ABWAWAFGAFAGOAOAIAAIALAAXALBALANDADAREAEARGARARMAMASMASATAAQATFTFATGAGAUSAUAUTATAZEAZBDIBIBELBEBENBJBESBQBFABFBGDBDBGRBGBHRBHBHSBSBIHBABLMBLBLRBYBLZBZBMUBMBOLBOBRABRBRBBBBRNBNBTNBTBVTBVBWABWCAFCFCANCACCKCCCHECHCHLCLCHNCNCIVCICMRCMCODCDCOGCGCOKCKCOLCOCOMKMCPVCVCRICRCUBCUCUWCWCXRCXCYMKYCYPCYCZECZDEUDEDJIDJDMADMDNKDKDOMDODZADZECUECEGYEGERIERESHEHESPESESTEEETHETFINFIFJIFJFLKFKFRAFRFROFOFSMFMGABGAGBRGBGEOGEGGYGGGHAGHGIBGIGINGNGLPGPGMBGMGNBGWGNQGQGRCGRGRDGDGRLGLGTMGTGUFGFGUMGUGUYGYHKGHKHMDHMHNDHNHRVHRHTIHTHUNHUIDNIDIMNIMINDINIOTIOIRLIEIRNIRIRQIQISLISISRILITAITJAMJMJEYJEJORJOJPNJPKAZKZKENKEKGZKGKHMKHKIRKIKNAKNKORKRKWTKWLAOLALBNLBLBRLRLBYLYLCALCLIELILKALKLSOLSLTULTLUXLULVALVMACMOMAFMFMARMAMCOMCMDAMDMDGMGMDVMVMEXMXMHLMHMKDMKMLIMLMLTMTMMRMMMNEMEMNGMNMNPMPMOZMZMRTMRMSRMSMTQMQMUSMUMWIMWMYSMYMYTYTNAMNANCLNCNERNENFKNFNGANGNICNINIUNUNLDNLNORNONPLNPNRUNRNZLNZOMNOMPAKPKPANPAPCNPNPERPEPHLPHPLWPWPNGPGPOLPLPRIPRPRKKPPRTPTPRYPYPSEPSPYFPFQATQAREUREROURORUSRURWARWSAUSASDNSDSENSNSGPSGSGSGSSHNSHSJMSJSLBSBSLESLSLVSVSMRSMSOMSOSPMPMSRBRSSSDSSSTPSTSURSRSVKSKSVNSISWESESWZSZSXMSXSYCSCSYRSYTCATCTCDTDTGOTGTHATHTJKTJTKLTKTKMTMTLSTLTONTOTTOTTTUNTNTURTRTUVTVTWNTWTZATZUGAUGUKRUAUMIUMURYUYUSAUSUZBUZVATVAVCTVCVENVEVGBVGVIRVIVNMVNVUTVUWLFWFWSMWSYEMYEZAFZAZMBZMZWEZW";

/** Código de 2 letras de un país a partir del de 3 letras. Alemania figura como "D" en los pasaportes. */
export function paisDos(tres: string): string | null {
  const c = tres.replace(/</g, "");
  if (c === "D") return "DE";
  for (let i = 0; i < PAISES.length; i += 5) if (PAISES.slice(i, i + 3) === c) return PAISES.slice(i + 3, i + 5);
  return null;
}

/** Todos los países (códigos de 2 letras), para elegir a mano. */
export const CODIGOS_PAIS = Array.from({ length: PAISES.length / 5 }, (_, i) => PAISES.slice(i * 5 + 3, i * 5 + 5));

const VALOR = (c: string) => (c === "<" ? 0 : /\d/.test(c) ? Number(c) : c.charCodeAt(0) - 55);

/** Dígito de control de la OACI (pesos 7, 3, 1). */
export function control(texto: string): number {
  let suma = 0;
  for (let i = 0; i < texto.length; i++) suma += VALOR(texto[i]) * [7, 3, 1][i % 3];
  return suma % 10;
}

export interface DatosPasaporte {
  nombre: string;
  apellido: string;
  numero: string;
  pais: string; // país que lo emitió, 2 letras
  nacimiento: string; // AAAA-MM-DD
  vence: string; // AAAA-MM-DD
  genero: "m" | "f" | null;
}

/** AAMMDD → AAAA-MM-DD. Nacimiento: si quedaría en el futuro, es del siglo pasado. Vencimiento: siempre 20AA. */
function fecha(aammdd: string, tipo: "nacimiento" | "vence"): string | null {
  if (!/^\d{6}$/.test(aammdd)) return null;
  const aa = Number(aammdd.slice(0, 2));
  const anioActual = new Date().getFullYear() % 100;
  const siglo = tipo === "vence" ? 2000 : aa > anioActual ? 1900 : 2000;
  return `${siglo + aa}-${aammdd.slice(2, 4)}-${aammdd.slice(4, 6)}`;
}

/** Arreglos típicos del lector en zonas que solo llevan números. */
const numeros = (s: string) => s.replace(/O/g, "0").replace(/[IL]/g, "1").replace(/S/g, "5").replace(/B/g, "8").replace(/Z/g, "2");
const nombreLindo = (s: string) =>
  s.split("<").filter(Boolean).join(" ").toLowerCase().replace(/(^|\s)\p{L}/gu, (l) => l.toUpperCase());

/** Busca las dos líneas del pasaporte en el texto leído y saca los datos. null si no se pudo leer bien. */
export function leerMrz(texto: string): DatosPasaporte | null {
  const lineas = texto
    .toUpperCase()
    .split(/\n/)
    .map((l) => l.replace(/[^A-Z0-9<]/g, ""))
    .filter((l) => l.length >= 40);
  const i = lineas.findIndex((l) => l.startsWith("P"));
  if (i < 0 || !lineas[i + 1]) return null;
  const l1 = lineas[i].padEnd(44, "<").slice(0, 44);
  const l2 = lineas[i + 1].padEnd(44, "<").slice(0, 44);

  const numero = l2.slice(0, 9);
  const nacimiento = numeros(l2.slice(13, 19));
  const vence = numeros(l2.slice(21, 27));
  if (control(numero) !== Number(numeros(l2[9]))) return null;
  if (control(nacimiento) !== Number(numeros(l2[19]))) return null;
  if (control(vence) !== Number(numeros(l2[27]))) return null;

  const [apellidos, nombres = ""] = l1.slice(5).split("<<");
  const pais = paisDos(l1.slice(2, 5));
  const fn = fecha(nacimiento, "nacimiento");
  const fv = fecha(vence, "vence");
  if (!pais || !fn || !fv) return null;
  return {
    nombre: nombreLindo(nombres),
    apellido: nombreLindo(apellidos),
    numero: numero.replace(/</g, ""),
    pais,
    nacimiento: fn,
    vence: fv,
    genero: l2[20] === "M" ? "m" : l2[20] === "F" ? "f" : null,
  };
}
