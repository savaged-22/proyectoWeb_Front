/**
 * Helpers para exportar arrays de objetos a CSV.
 * Escapa comillas y comas según RFC 4180.
 */

function escape(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = typeof v === 'string' ? v : String(v);
  if (/[",\n\r]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

/**
 * Convierte filas a CSV y dispara descarga en el navegador.
 * @param filename nombre del archivo (incluye .csv)
 * @param columnas mapa label -> getter sobre cada fila
 * @param filas datos a exportar
 */
export function descargarCsv<T>(
  filename: string,
  columnas: Record<string, (row: T) => unknown>,
  filas: T[],
): void {
  const headers = Object.keys(columnas);
  const lineas: string[] = [headers.map(escape).join(',')];
  for (const fila of filas) {
    lineas.push(headers.map(h => escape(columnas[h](fila))).join(','));
  }
  // BOM para que Excel detecte UTF-8 con tildes correctas.
  const blob = new Blob(['﻿' + lineas.join('\r\n')],
                       { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Sufijo de fecha legible para nombres de archivo. */
export function timestampFileSafe(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}
