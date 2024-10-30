// ManagerResultsTable.js
import { Button, Table } from "antd";
import React from "react";
import XLSX from "xlsx";

import formatCurrency from "../../../api/utils/formatCurrency";

export default function ManagerResultsTable({ data }) {
  function exportResultsToExcel() {
    // Crear un objeto para las filas
    const rows = [];

    // Encabezado básico
    const headers = [
      "Gestor",
      "Asignaciones",
      "Asignaciones finalizadas",
      "Asignaciones pendientes",
      "Reasignaciones",
      "Asignación total",
      "Total asignación gestionada",
    ];

    // Mapear las fechas encontradas en resultsByDay para generar los encabezados dinámicos
    const datesSet = new Set(); // Usamos un Set para no repetir fechas
    data.forEach((item) => {
      item.resultsByDay.forEach((result) => {
        datesSet.add(result.date); // Agregar la fecha única
      });
    });

    // Añadir las columnas dinámicas al encabezado
    const dynamicColumns = [];
    datesSet.forEach((date) => {
      dynamicColumns.push(`Resueltas (${date})`);
      dynamicColumns.push(`Recaudado (${date})`);
    });
    headers.push(...dynamicColumns);

    // Crear las filas de datos
    data.forEach((item) => {
      const row = [
        item.manager,
        item.totalAssignments,
        item.completedAssignments,
        item.pendingAssignments,
        item.reAssignments,
        item.assignedDebt,
        item.totalPendingDebt,
      ];

      // Agregar las columnas dinámicas según las fechas
      dynamicColumns.forEach((column, index) => {
        const dateIndex = Math.floor(index / 2); // Cada fecha tiene dos columnas
        const date = Array.from(datesSet)[dateIndex]; // Obtener la fecha en el índice correcto
        const result = item.resultsByDay.find((result) => result.date === date);

        if (index % 2 === 0) {
          // resolvedCount
          row.push(result ? result.resolvedCount : 0); // Si no hay datos para la fecha, se pone 0
        } else {
          // totalPendingDebt
          row.push(result ? result.totalPendingDebt : 0);
        }
      });

      // Añadir la fila
      rows.push(row);
    });

    // Crear la hoja de Excel
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    // Ajustar el ancho de las columnas
    const colWidths = headers.map((header, i) => {
      // Calcular el ancho máximo del contenido en la columna
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Results");

    // Exportar el archivo
    XLSX.writeFile(workbook, "results.xlsx");
  }

  const columns = [
    {
      title: "Manager",
      dataIndex: "manager",
      sorter: (a, b) => a.manager.localeCompare(b.manager),
    },
    {
      title: "Asignaciones",
      dataIndex: "totalAssignments",
      width: "8rem",
    },
    {
      title: "Asignaciones finalizadas",
      dataIndex: "completedAssignments",
      width: "8rem",
    },
    {
      title: "Asignaciones pendientes",
      dataIndex: "pendingAssignments",
      width: "8rem",
    },
    {
      title: "Reasignaciones",
      dataIndex: "reassignedCount",
      width: "9rem",
    },
    {
      title: "Total Asignacion",
      dataIndex: "totalAssignedDebt",
      render: (value) => formatCurrency(value),
    },
    {
      title: "Total Asignacion gestionada",
      dataIndex: "totalPendingDebt",
      render: (value) => formatCurrency(value),
    },
    {
      title: "Resultados por dia",
      dataIndex: "resultsByDay",
      render: (resultsByDay) => (
        <ul>
          {resultsByDay.map((result, index) => (
            <li key={index}>{`${result.date}, Resueltas: ${
              result.resolvedCount
            }, Recaudado: ${formatCurrency(result.totalPendingDebt)}`}</li>
          ))}
        </ul>
      ),
    },
  ];

  return (
    <>
      <Button type="primary" onClick={exportResultsToExcel}>Exportar a Excel</Button>
      <Table
        size="small"
        columns={columns}
        dataSource={data}
        rowKey={(data) => data.manager}
        pagination={false}
        scroll={{ y: 55 * 5, x: "max-content" }}
      />
    </>
  );
}
