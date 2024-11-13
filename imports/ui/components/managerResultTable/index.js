// ManagerResultsTable.js
import { Button, Table } from "antd";
import React from "react";
import XLSX from "xlsx";

import formatCurrency from "../../../api/utils/formatCurrency";

export default function ManagerResultsTable({ data }) {
  function exportResultsToExcel() {
    const rows = [];

    const headers = [
      "Gestor",
      "Asignaciones",
      "Asignaciones finalizadas",
      "Asignaciones pendientes",
      "Reasignaciones",
      "Asignación total",
      "Total asignación gestionada",
    ];

    const datesSet = new Set();
    data.forEach((item) => {
      item.resultsByDay.forEach((result) => {
        datesSet.add(result.date);
      });
    });

    const dynamicColumns = [];
    datesSet.forEach((date) => {
      dynamicColumns.push(`Resueltas (${date})`);
      dynamicColumns.push(`Recaudado (${date})`);
    });
    headers.push(...dynamicColumns);

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

      dynamicColumns.forEach((column, index) => {
        const dateIndex = Math.floor(index / 2);
        const date = Array.from(datesSet)[dateIndex];
        const result = item.resultsByDay.find((result) => result.date === date);

        if (index % 2 === 0) {
          row.push(result ? result.resolvedCount : 0);
        } else {
          row.push(result ? result.totalPendingDebt : 0);
        }
      });

      rows.push(row);
    });

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    const colWidths = headers.map((header, i) => {
      const columnData = [
        header,
        ...rows.map((row) => row[i]?.toString() || ""),
      ];
      const maxWidth = Math.max(...columnData.map((val) => val.length));
      return { wch: maxWidth + 2 };
    });

    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Results");
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
      width: "9rem",

    },
    {
      title: "Total Asignacion gestionada",
      dataIndex: "totalPendingDebt",
      render: (value) => formatCurrency(value),
      width: "9rem",
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
      width: "16rem",

    },
  ];

  return (
    <>
      <Button type="primary" onClick={exportResultsToExcel}>
        Exportar a Excel
      </Button>
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
