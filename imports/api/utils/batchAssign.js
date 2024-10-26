import { Meteor } from "meteor/meteor";
import { Button, message, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import XLSX from "xlsx";
import React, { useState } from "react";

export default function BatchAssign({ managers, setReload, timeFrame }) {
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (file) => {
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      // Suponiendo que los datos están en la primera hoja
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = XLSX.utils.sheet_to_json(
        workbook.Sheets[firstSheetName],
        { header: 1 }
      );

      // const rows = worksheet.slice(1);
      const rows = worksheet;

      rows.forEach((row) => {
        const [manager, NUMERO_DE_LA_ORDEN] = row;

        if (!manager || !NUMERO_DE_LA_ORDEN) {
          return;
        }

        Meteor.callAsync(
          "assignment.createByOrderId",
          NUMERO_DE_LA_ORDEN.toString(),
          timeFrame,
          manager,
          Date.now()
        ).catch(() => {
          message.error(
            `Error al asignar la orden ${NUMERO_DE_LA_ORDEN} al gestor ${manager}`
          );
        });
      });

      setLoading(false);
      setReload(Math.random());
      message.success("Operación terminada exitosamente.");
    };

    reader.onerror = (error) => {
      console.error("Error leyendo el archivo:", error);
      message.error("Error al cargar el archivo.");
    };

    reader.readAsArrayBuffer(file);
    return false;
  };

  return (
    <Upload beforeUpload={handleFileUpload} showUploadList={false}>
      <Button loading={loading} icon={<UploadOutlined />}>
        Subir Archivo de Asignaciones
      </Button>
    </Upload>
  );
}
