export default function normalizeKey(key) {
  // Convierte a snake_case y reemplaza caracteres no válidos
  const normalizedKey = key
  .normalize('NFD') // Descompone los caracteres acentuados
  .replace(/[\u0300-\u036f]/g, '') // Elimina los acentos
  .replace(/\s+/g, '_') // Reemplaza espacios por guiones bajos
  .replace(/[^a-zA-Z0-9_]/g, '') // Elimina caracteres no alfanuméricos excepto guiones bajos
  .replace(/_{2,}/g, '_') // Reemplaza múltiples guiones bajos por uno solo
  .replace(/^_+|_+$/g, ''); // Elimina guiones bajos al principio y al final

// Convierte a mayúsculas y retorna
return normalizedKey.toUpperCase();
}
