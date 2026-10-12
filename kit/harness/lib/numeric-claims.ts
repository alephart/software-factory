// Extractor de cifras (precios) del arnés. Es una copia FIJADA: no se importa del runtime, porque
// la línea base puede correr sobre un commit que no tiene el parser, y base y candidato deben usar
// el mismo extractor. Si el parser del runtime cambia, eso no debe cambiar el criterio de la regresión.
//
// Formato de pesos colombianos: "." o "," como separador de miles; un grupo final de 1-2 dígitos es la
// parte decimal y se descarta. Un número sin separador solo cuenta con "$" o "pesos"/"COP" al lado
// ("95000" suelto no se reconoce). Para otra moneda, ajustar las expresiones y anotarlo en el README.
const SEPARATED_AMOUNT_REGEX = /\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{1,2})?(?!\d)/g;
const PLAIN_AMOUNT_REGEX = /\$\s?(\d{4,})(?![\d.,])|(?<![\d.,])(\d{4,})\s*(?:pesos|cop)\b/gi;
const SCALED_AMOUNT_REGEX = /(\d+(?:[.,]\d+)?)\s*(mil|millon(?:es)?|millón)\b/gi;
const MIN_PRICE_CLAIM = 1000;

const parseSeparatedAmount = (raw: string): number => {
  const withoutDecimals = raw.replace(/[.,]\d{1,2}$/, '');
  return Number(withoutDecimals.replace(/[.,]/g, ''));
};

const parseScaledAmount = (value: string, unit: string): number => {
  const base = Number(value.replace(',', '.'));
  return Math.round(base * (unit.toLowerCase() === 'mil' ? 1_000 : 1_000_000));
};

export function extractNumericClaims(text: string): number[] {
  const amounts = [
    ...[...text.matchAll(SEPARATED_AMOUNT_REGEX)].map((m) => parseSeparatedAmount(m[0])),
    ...[...text.matchAll(PLAIN_AMOUNT_REGEX)].map((m) => Number(m[1] ?? m[2])),
    ...[...text.matchAll(SCALED_AMOUNT_REGEX)].map((m) => parseScaledAmount(m[1], m[2])),
  ];
  return [...new Set(amounts)].filter((n) => Number.isFinite(n) && n >= MIN_PRICE_CLAIM);
}
