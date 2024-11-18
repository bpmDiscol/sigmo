import { Meteor } from "meteor/meteor";
import { Button, message, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import XLSX from "xlsx";
import React, { useState } from "react";

export default function BatchAssign({ setReload, timeFrame }) {
  const [loading, setLoading] = useState(false);
  const [percent, setPercent] = useState(null);
  const [errorassignments, setErrorAssignments] = useState([]);

  const handleFileUpload = (file) => {
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = XLSX.utils.sheet_to_json(
        workbook.Sheets[firstSheetName],
        { header: 1 }
      );

      const rows = worksheet;

      rows.forEach(async (row, index) => {
        const [manager, NUMERO_DE_LA_ORDEN] = row;

        if (!manager) {
          return console.warn("Sin gestor", row);
        }

        Meteor.callAsync(
          "assignment.createByOrderId",
          NUMERO_DE_LA_ORDEN.toString(),
          timeFrame,
          manager.trim(),
          Date.now()
        )
          .catch((err) => {
            console.log(err);
            message.error(
              `Error al asignar la orden ${NUMERO_DE_LA_ORDEN} al gestor ${manager}`
            );
          })
          .then((answer) => {
            setPercent(((index * 100) / (rows.length - 1)).toFixed(1) + "%");
            if (answer?.error) setErrorAssignments((prev) => [...prev, answer]);
            if ((index * 100) / (rows.length - 1) == 100) {
              setPercent();
              setLoading(false);
              setReload(Math.random());
              if (errorassignments.length) {
                message.warning("Operacion terminada con fallos");
                console.table(errorassignments);
              } else message.success("Operación terminada exitosamente.");
            }
          });
      });
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
      <Button
        danger
        type="primary"
        loading={loading || percent}
        icon={<UploadOutlined />}
      >
        {percent ? "Asignando " + percent : "Cargar asignaciones"}
      </Button>
    </Upload>
  );
}
