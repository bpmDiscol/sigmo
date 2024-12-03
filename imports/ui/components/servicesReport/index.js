import React, { useContext, useEffect, useState } from "react";
import { Button, Progress, Table } from "antd";
import XLSX from "xlsx";

import formatCurrency from "../../../api/utils/formatCurrency";
import { GlobalContext } from "../../context/globalsContext";

// Definir las columnas de la tabla
const columns = [
  {
    title: "Causal",
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
    render: (percent) => (
      <Progress type="dashboard" percent={percent.toFixed(1)} size={50} strokeWidth={15} />
    ),
  },
  {
    title: "Valor cartera",
    dataIndex: "totalPendingDebt",
    key: "totalPendingDebt",
  },
  {
    title: "Porcentaje cartera",
    dataIndex: "debtPercentage",
    key: "debtPercentage",
    render: (percent) => (
      <Progress type="dashboard" percent={percent.toFixed(1)} size={50} strokeWidth={15} />
    ),
  },
];

export default function ServicesReport({ id, locality, translate }) {
  const [data, setData] = useState([]);
  const { globals } = useContext(GlobalContext);

  useEffect(() => {
    Meteor.call(
      "assignment.gestiones",
      {
        "recordData.timeFrame": id,
        "recordData.project": globals?.project?._id,
        "recordData.locality": locality,
      },
      (err, resp) => {
        if (resp) setData(resp);
      }
    );
  }, [locality]);

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
    gestion: translate(item._id) || "No gestionada",
    totalAssignments: item.totalAssignments,
    assignmentPercentage: item.assignmentPercentage,
    totalPendingDebt: formatCurrency(item.totalPendingDebt),
    debtPercentage: item.debtPercentage,
  }));

  function exportGestionToExcel(data) {
    // Crear un objeto para las filas
    const rows = [];

    // Encabezado de la tabla
    const headers = [
      "Causal",
      "Incidencias",
      "Porcentaje Incidencias",
      "Valor cartera",
      "Porcentaje cartera",
    ];

    // Crear las filas de datos
    data.forEach((item) => {
      // Añadir la fila de datos
      const row = [
        item.gestion,
        item.totalAssignments,
        item.assignmentPercentage.toFixed(1), 
        item.totalPendingDebt,
        item.debtPercentage.toFixed(1),
      ];
      rows.push(row);
    });

    // Agregar la fila de totales usando las variables proporcionadas
    const totalRow = [
      "Total",
      totalAssignments,
      `${(totalAssignmentPercentage || 0).toFixed(1)}%`,
      formatCurrency(totalPendingDebt),
      `${(totalDebtPercentage || 0).toFixed(1)}%`,
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
        scroll={{ x: "max-content" }}
        pagination={false} // Sin paginación para mostrar todos los datos
        summary={() => (
          <Table.Summary.Row>
            <Table.Summary.Cell>
              <strong>Total</strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell>{totalAssignments}</Table.Summary.Cell>
            <Table.Summary.Cell>
              {(totalAssignmentPercentage || 0).toFixed(1)}%
            </Table.Summary.Cell>
            <Table.Summary.Cell>
              {formatCurrency(totalPendingDebt)}
            </Table.Summary.Cell>
            <Table.Summary.Cell>
              {(totalDebtPercentage || 0).toFixed(1)}%
            </Table.Summary.Cell>
          </Table.Summary.Row>
        )}
      />
    </>
  );
}
