import React, { useContext, useEffect, useState } from "react";
import { Button, Table } from "antd";
import XLSX from "xlsx";

import formatCurrency from "../../../api/utils/formatCurrency";
import { GlobalContext } from "../../context/globalsContext";

// Definir las columnas de la tabla
const columns = [
  {
    title: "Gestión",
    dataIndex: "gestion",
    key: "gestion",
  },
  {
    title: "Incidencias",
    dataIndex: "totalAssignments",
    key: "totalAssignments",
    width: "9rem",
  },
  {
    title: "Porcentaje Incidencias",
    dataIndex: "assignmentPercentage",
    key: "assignmentPercentage",
  },
  {
    title: "Deuda Pendiente",
    dataIndex: "totalPendingDebt",
    key: "totalPendingDebt",
  },
  {
    title: "Porcentaje Deuda",
    dataIndex: "debtPercentage",
    key: "debtPercentage",
  },
];

// Componente de la tabla
const ServicesReport = (timeFrame) => {
  const [data, setData] = useState([]);
  const { globals } = useContext(GlobalContext);
  const [diccionario, setDiccionario] = useState([]);

  useEffect(() => {
    fillDicctionary();
    Meteor.call(
      "assignment.gestiones",
      timeFrame.id,
      globals?.project?._id,
      (err, resp) => {
        setData(resp);
      }
    );
  }, []);

  async function fillDicctionary() {
    const file = await Meteor.callAsync("getTextAssets", "diccionario.json");
    setDiccionario(JSON.parse(file));
  }

  function translate(name) {
    return diccionario.find((entry) => entry.value == name)?.label;
  }

  const totalAssignments = data.reduce(
    (sum, item) => sum + item.totalAssignments,
    0
  );
  const totalPendingDebt = data.reduce(
    (sum, item) => sum + item.totalPendingDebt,
    0
  );
  const totalAssignmentPercentage = data.reduce(
    (sum, item) => sum + item.assignmentPercentage,
    0
  );
  const totalDebtPercentage = data.reduce(
    (sum, item) => sum + item.debtPercentage,
    0
  );

  const tableData = data.map((item, index) => ({
    key: index,
    gestion: translate(item._id) || "Efectiva",
    totalAssignments: item.totalAssignments,
    assignmentPercentage: `${item.assignmentPercentage.toFixed(2)}%`,
    totalPendingDebt: formatCurrency(item.totalPendingDebt),
    debtPercentage: `${item.debtPercentage.toFixed(2)}%`,
  }));

  function exportGestionToExcel(data) {
    // Crear un objeto para las filas
    const rows = [];

    // Encabezado de la tabla
    const headers = [
      "Gestión",
      "Total Asignaciones",
      "Porcentaje de Asignaciones",
      "Deuda Pendiente",
      "Porcentaje de Deuda",
    ];

    // Crear las filas de datos
    data.forEach((item) => {
      // Añadir la fila de datos
      const row = [
        item.gestion,
        item.totalAssignments,
        item.assignmentPercentage, // Mantenemos el porcentaje en su formato original
        item.totalPendingDebt, // Mantenemos el valor en formato moneda
        item.debtPercentage,
      ];
      rows.push(row);
    });

    // Agregar la fila de totales usando las variables proporcionadas
    const totalRow = [
      "Total",
      totalAssignments,
      `${totalAssignmentPercentage.toFixed(2)}%`,
      formatCurrency(totalPendingDebt),
      `${totalDebtPercentage.toFixed(2)}%`,
    ];
    rows.push(totalRow); // Añadir fila de totales al final

    // Crear la hoja de Excel
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    // Ajustar el ancho de las columnas
    const colWidths = headers.map((header, i) => {
      const columnData = [
        header,
        ...rows.map((row) => row[i]?.toString() || ""),
      ];
      const maxWidth = Math.max(...columnData.map((val) => val.length));
      return { wch: maxWidth + 2 }; // Ajustar ancho con 2 caracteres extra
    });

    // Asignar los anchos de columna a la hoja de trabajo
    worksheet["!cols"] = colWidths;

    // Crear el libro de trabajo
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Gestión");

    // Exportar el archivo
    XLSX.writeFile(workbook, "gestion.xlsx");
  }

  return (
    <>
      <Button type="primary" onClick={() => exportGestionToExcel(tableData)}>
        Exportar a Excel
      </Button>
      <Table
        size="small"
        columns={columns}
        dataSource={tableData}
        scroll={{ y: 55 * 5, x: "max-content" }}
        pagination={false} // Sin paginación para mostrar todos los datos
        summary={() => (
          <Table.Summary.Row>
            <Table.Summary.Cell>
              <strong>Total</strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell>{totalAssignments}</Table.Summary.Cell>
            <Table.Summary.Cell>
              {totalAssignmentPercentage.toFixed(2)}%
            </Table.Summary.Cell>
            <Table.Summary.Cell>
              {formatCurrency(totalPendingDebt)}
            </Table.Summary.Cell>
            <Table.Summary.Cell>
              {totalDebtPercentage.toFixed(2)}%
            </Table.Summary.Cell>
          </Table.Summary.Row>
        )}
      />
    </>
  );
};

export default ServicesReport;
