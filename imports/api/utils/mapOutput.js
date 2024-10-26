const formatColumnTitle = (title) => {
  return title
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export default function mapOutput(output, project="movilidad") {
  const movilidadColumns = [
    "PRODUCTO",
    "CONTRATO",
    "CLIENTE",
    "DESCRIPCION_TIPO_PRODUCTO",
    "DESCRIPCION_LOCALIDAD",
    "DESCRIPCION_BARRIO",
    "DESCRIPCION_CICLO",
    "TIPO_CLIENTE",
    "IDENTIFICACION",
    "NOMBRE_CLIENTE",
    "DIRECCION_PREDIO",
    "GESTOR",
    "fecha_gestion",
    "updatedAt",
    "causal_de_no_pago",
    "contacto",
    "resultado_de_gestion",
    "telefono_sugerido",
    "tipo_de_vivienda",
    "ubicacion",
    "PERIODO",
    "LATITUD",
    "LONGITUD",
    "ELEMENTO_MEDICION",
    "EMAIL",
    "estado_servicio",
    "lectura",
    "COMENTARIO",
    "causal_de_pago",
    "recibo",
    "valor_recibo",
    "IDENTIFICACION_CODEUDOR",
    "NOMBRE_CODEUDOR",
    "TELEFONO_MOVIL_CODEUDOR",
    "TELEFONO_FIJO_CODEUDOR",
    "PAGOS_PERIODOS_ASIGNADO",
    "PROYECTO",
    "status",
    "observacion",
    "FOTO1",
    "FOTO2",
  ];

  const sierraColumns = [
    
    "PRODUCTO",
    "GESTOR",
    "NOMBRE_CLIENTE",
    "NUMERO_DE_LA_ORDEN",
    "DESCRIPCION_BARRIO",
    "DIRECCION_PREDIO",
    "causal_de_pago",
    "causal_de_no_pago",
    "fecha_compromiso",
    "recibo",
    "valor_recibo",
    "tipo_de_vivienda",
    "contacto",
    "telefono_sugerido",
    "uso_del_predio",
    "tipo_habitante",
    "clase_predio",
    "tipo_comercio",
    "nivel_estado_servicio",
    "cuota_inicial_ofrece",
    "cuota_mensual",
    "numero_de_personas",
    "observacion",
    "LATITUD",
    "LONGITUD",
    "status",
    "FOTO1",
    "FOTO2",
    "PERIODO",
    "fecha_asignacion",
    "fecha_gestion",
    "updatedAt",
  ];

  const columns = project === "sierra" ? sierraColumns : movilidadColumns;
  const formattedHeaders = columns.map(formatColumnTitle);

  const mappedData = output.map((record) => {
    const mappedRecord = {};
    columns.forEach((col) => {
      mappedRecord[formatColumnTitle(col)] = record[col] || "";
    });
    return mappedRecord;
  });
  return { formattedHeaders, mappedData, columns };
}
