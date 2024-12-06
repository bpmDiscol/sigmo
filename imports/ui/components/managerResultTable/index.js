// ManagerResultsTable.js
import { Button, Progress, Table } from "antd";
import React from "react";
import XLSX from "xlsx";

import formatCurrency from "../../../api/utils/formatCurrency";

export default function ManagerResultsTable({ data, locality }) {
  function calculateTotals(data) {
    const totals = {
      manager: "Total",
      totalAssignments: data.reduce(
        (sum, item) => sum + item.totalAssignments,
        0
      ),
      completedAssignments: data.reduce(
        (sum, item) => sum + item.completedAssignments,
        0
      ),
      fullfit: data.reduce((sum, item) => sum + item.fullfit, 0),
      pendingAssignments: data.reduce(
        (sum, item) => sum + item.pendingAssignments,
        0
      ),
      totalAssignedDebt: data.reduce(
        (sum, item) => sum + item.totalAssignedDebt,
        0
      ),
      totalPendingDebt: data.reduce(
        (sum, item) => sum + item.totalPendingDebt,
        0
      ),
      efectiveIncome: data.reduce((sum, item) => sum + item.efectiveIncome, 0),
      carteraEfectiva: data.reduce((sum, item) => sum + item.carteraEfectiva, 0),
      resultsByDay: calculateTotalsByDay(data),
      promises: data.reduce((sum, item) => sum + item.promises, 0),
    };
    const finisheds = parseFloat(
      ((totals.completedAssignments * 100) / totals.totalAssignments).toFixed(1)
    );
    const eficiency = parseFloat(
      ((totals.fullfit * 100) / totals.totalAssignments).toFixed(1)
    );
    const efectivity = parseFloat(
      ((totals.fullfit * 100) / totals.completedAssignments).toFixed(1)
    );

    return { ...totals, finisheds, efectivity, eficiency };
  }

  const totalsRow = calculateTotals(data);
  const extendedData = [...data, totalsRow];

  function exportResultsToExcel() {
    const rows = [];

    const headers = [
      "Gestor",
      "Asignaciones",
      "Finalizadas",
      "Pendientes",
      "Efectivas",
      "Compromisos",
      "% Finalizado",
      "% Efectividad",
      "% Eficiencia",
      "Cartera asignada",
      "Cartera gestionada",
      "Cartera recuperada",
      "Recaudo",
    ];

    const datesSet = new Set();
    data.forEach((item) => {
      item.resultsByDay.forEach((result) => {
        datesSet.add(result.date);
      });
    });

    const sortedDates = Array.from(datesSet).sort((a, b) => {
      const dateA = new Date(a.split("/").reverse().join("-"));
      const dateB = new Date(b.split("/").reverse().join("-"));
      return dateA - dateB;
    });

    const dynamicColumns = [];
    sortedDates.forEach((date) => {
      dynamicColumns.push(`Resueltas (${date})`);
      dynamicColumns.push(`Normalizado (${date})`);
      dynamicColumns.push(`Recaudo (${date})`);
    });
    headers.push(...dynamicColumns);

    data.forEach((item) => {
      const row = [
        item.manager,
        item.totalAssignments,
        item.pendingAssignments,
        item.completedAssignments,
        item.fullfit,
        item.promises,
        parseFloat(
          ((item.completedAssignments * 100) / item.totalAssignments).toFixed(1)
        ),
        parseFloat(
          ((item.fullfit * 100) / item.completedAssignments).toFixed(1)
        ),
        parseFloat(((item.fullfit * 100) / item.totalAssignments).toFixed(1)),
        item.totalAssignedDebt,
        item.totalPendingDebt,
        item.carteraEfectiva,
        item.efectiveIncome,
      ];

      sortedDates.forEach((date) => {
        const result = item.resultsByDay.find((result) => result.date === date);

        row.push(result ? result.resolvedCount : 0);
        row.push(result ? result.totalPendingDebt : 0);
        row.push(result ? result.totalIncome : 0); // Agregar recaudos diarios
      });

      rows.push(row);
    });

    // Calcular totales
    const excelTotalsRow = [
      "Total",
      totalsRow.totalAssignments,
      totalsRow.pendingAssignments,
      totalsRow.completedAssignments,
      totalsRow.fullfit,
      totalsRow.promises,
      totalsRow.finisheds,
      totalsRow.efectivity,
      totalsRow.eficiency,
      totalsRow.totalAssignedDebt,
      totalsRow.totalPendingDebt,
      totalsRow.carteraEfectiva,
      totalsRow.efectiveIncome,
    ];

    sortedDates.forEach((date) => {
      const result = totalsRow.resultsByDay.find(
        (result) => result.date === date
      );

      excelTotalsRow.push(result ? result.resolvedCount : 0);
      excelTotalsRow.push(result ? result.totalPendingDebt : 0);
      excelTotalsRow.push(result ? result.totalIncome : 0);
    });

    rows.push(excelTotalsRow);

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
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      locality || "Todas las localidades"
    );
    XLSX.writeFile(
      workbook,
      `Comportamiento de ingreso ${locality || ""} - ${Date.now()}.xlsx`
    );
  }

  const columns = [
    {
      title: "Gestor",
      dataIndex: "manager",
      sorter: (a, b) => a.manager.localeCompare(b.manager),
      width: "15rem",
      fixed:true
    },
    {
      title: "Asignaciones",
      dataIndex: "totalAssignments",
      align: "right",
    },
    {
      title: "Pendientes",
      dataIndex: "pendingAssignments",
      align: "right",
    },
    {
      title: "Finalizadas",
      dataIndex: "completedAssignments",
      align: "right",
    },
    {
      title: "Efectivas",
      dataIndex: "fullfit",
      align: "right",
    },
    {
      title: "Compromisos",
      dataIndex: "promises",
      align: "right",
    },
    {
      title: "Finalizado",
      dataIndex: "_id",
      render: (_, r) => (
        <Progress
          type="dashboard"
          status="active"
          percent={(
            (r.completedAssignments * 100) /
            r.totalAssignments
          ).toFixed(1)}
          size={60}
          strokeWidth={15}
          strokeColor={"#02f737"}
        />
      ),
      align: "center",
    },
    {
      title: "Efectividad",
      dataIndex: "_id",
      render: (_, r) => (
        <Progress
          type="dashboard"
          status="active"
          percent={((r.fullfit * 100) / r.completedAssignments ||0).toFixed(1)}
          size={60}
          strokeColor={"#3493db"}
          strokeWidth={15}
        />
      ),
      align: "center",
    },
    {
      title: "Eficiencia",
      dataIndex: "_id",
      render: (_, r) => (
        <Progress
          type="dashboard"
          status="active"
          percent={((r.fullfit * 100) / r.totalAssignments).toFixed(1)}
          size={60}
          strokeColor={"#ee0aff"}
          strokeWidth={15}
        />
      ),
      align: "center",
    },
    {
      title: "Cartera asignada",
      dataIndex: "totalAssignedDebt",
      render: (value) => formatCurrency(value),
      width: "9rem",
      align: "right",
    },
    {
      title: "Cartera gestionada",
      dataIndex: "totalPendingDebt",
      render: (value) => formatCurrency(value),
      width: "9rem",
      align: "right",
    },
    {
      title: "Cartera recuperada",
      dataIndex: "carteraEfectiva",
      render: (value) => formatCurrency(value),
      width: "9rem",
      align: "right",
    }, {
      title: "Recaudo",
      dataIndex: "efectiveIncome",
      render: (value) => formatCurrency(value),
      width: "9rem",
      align: "right",
    },
    {
      title: "Resultados por dia",
      dataIndex: "resultsByDay",
      render: (resultsByDay) => (
        <ul>
          {resultsByDay.map((result, index) => (
            <li key={index}>{`${result.date}, Resueltas: ${
              result.resolvedCount
            } \nNormalizado: ${formatCurrency(
              result.totalPendingDebt
            )} \nRecaudado: ${formatCurrency(result.totalIncome)}`}</li>
          ))}
        </ul>
      ),
      width: "16rem",
    },
  ];

  function calculateTotalsByDay(data) {
    const resultDays = {};
    data.forEach((d) => {
      d.resultsByDay.forEach((result) => {
        const date = result.date;
        if (!resultDays[date]) {
          resultDays[date] = {
            resolvedCount: 0,
            totalIncome: 0,
            totalPendingDebt: 0,
          };
        }
        resultDays[date] = {
          resolvedCount: resultDays[date].resolvedCount + result.resolvedCount,
          totalIncome: resultDays[date].totalIncome + result.totalIncome,
          totalPendingDebt:
            resultDays[date].totalPendingDebt + result.totalPendingDebt,
        };
      });
    });
    const results = Object.keys(resultDays).map((key) => {
      return {
        date: key,
        resolvedCount: resultDays[key].resolvedCount,
        totalIncome: resultDays[key].totalIncome,
        totalPendingDebt: resultDays[key].totalPendingDebt,
      };
    });

    return results.sort((a, b) => {
      const dateA = new Date(a.date.split("/").reverse().join("-"));
      const dateB = new Date(b.date.split("/").reverse().join("-"));
      return dateA - dateB;
    });
  }

  return (
    <>
      <Button type="primary" onClick={exportResultsToExcel}>
        Exportar a Excel
      </Button>
      <Table
        size="small"
        columns={columns}
        dataSource={extendedData}
        rowKey={(data) => data.manager}
        pagination={false}
        scroll={{ x: "max-content" }}
      />
    </>
  );
}
