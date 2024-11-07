import { Button, message, Table, Typography } from "antd";
import moment from "moment";
import React, { useEffect, useState } from "react";
import XLSX from "xlsx";

export default function AssignmentReport({
  id,
  timeFrame,
  projectName,
  locality,
}) {
  const voidSorter = { sortField: null, sortOrder: 1 };
  const [assignments, setAssignments] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    total: 0,
    pageSize: 10,
  });

  const [downloadReport, setDownloadReport] = useState({
    loading: false,
    percent: 0,
  });

  const [columns, setColumns] = useState([]);

  async function getAssignments(current, pageSize, excel = false) {
    const assignments = await Meteor.callAsync(
      "assignments.reportAll",
      timeFrame,
      locality,
      current,
      pageSize
    );
    const newAssignments = assignments[0].data.map((data) => ({
      ...data.recordData,
      ...data.report,
      causal_de_pago:
        data.report?.resultadoDeGestion === "efectiva"
          ? data.report.gestion
          : null,
      causal_de_no_pago:
        data.report?.resultadoDeGestion === "no_efectiva"
          ? data.report.gestion
          : null,
      manager: data.manager,
      projectName,
      assignmentDate: data.date,
      reportDate: data.report?.createdAt,
      status:
        data.report?.status === "done"
          ? "Terminado"
          : data.report?.status === "reassigned"
          ? "Desasignada"
          : "en proceso",
    }));
    if (!excel) {
      setAssignments(newAssignments);
      setPagination((prev) => ({
        ...prev,
        current,
        total: assignments[0].totalCount,
      }));
    }

    if (excel) return { newAssignments, totalCount: assignments[0].totalCount };
  }

  useEffect(() => {
    getAssignments(1, pagination.pageSize);
  }, [locality]);

  function handleTableChange(pagination) {
    getAssignments(pagination.current, pagination.pageSize);
    setPagination(pagination);
  }

  async function handleExport() {
    const pageSize = 100;
    let page = 1;
    const allData = [];
    let total = 10000000;
    try {
      while (total / pageSize >= page) {
        const data = await getAssignments(page, pageSize, true);
        if (data.totalCount) total = data.totalCount;
        allData.push(data.newAssignments);
        setDownloadReport({ percent: page / total, loading: true });

        page++;
      }
      const formattedData = allData.flat(1).map((item) => {
        const formattedItem = {};
        columns.forEach((col) => {
          if (col.type === "date") {
            const date = item[col.dataIndex]
              ? moment(item[col.dataIndex]).format("DD/MM/YYYY, h:mm:ss a")
              : "Sin terminar";
            formattedItem[col.title] = date;
          } else formattedItem[col.title] = item[col.dataIndex] || "";
        });
        return formattedItem;
      });

      const ws = XLSX.utils.json_to_sheet(formattedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Report");
      XLSX.writeFile(wb, `Gestiones asignadas-${Date.now()}.xlsx`);
    } catch (error) {
      message.error(error.message);
    } finally {
      setDownloadReport({ percent: 0, loading: false });
    }
  }

  useEffect(() => {
    async function getColumns() {
      const columnsStr = await Meteor.callAsync(
        "getTextAssets",
        "reporteAsignaciones.json"
      );
      const parsedColumns = JSON.parse(columnsStr);
      const thisProjectColumns = parsedColumns[id] || [];
      const reconstructeds = thisProjectColumns.map((column) => {
        if (column.type === "date")
          column.render = (date) =>
            date
              ? moment(date).format("DD/MM/YYYY, h:mm:ss a")
              : "Sin terminar";
        return column;
      });
      setColumns(reconstructeds);
    }

    getColumns();
  }, []);

  return (
    <Table
      size="small"
      columns={columns}
      dataSource={assignments}
      scroll={{ y: 55 * 5, x: "max-content" }}
      rowKey={(record) => record._id}
      pagination={{
        ...pagination,
        showTotal: (total) => (
          <>
            <Button
              type="primary"
              style={{ width: "10rem", marginRight: "8px" }}
              onClick={handleExport}
              disabled={assignments.length === 0}
              loading={downloadReport.loading}
              danger={downloadReport.loading}
            >
              {downloadReport.loading
                ? (downloadReport.percent * 10000).toFixed(1) + "% descargado"
                : "Exportar a Excel"}
            </Button>
            <Typography.Text
              keyboard
              type="danger"
            >{`${total} Resultados encontrados `}</Typography.Text>
          </>
        ),
        position: ["topLeft"],
      }}
      onChange={handleTableChange}
    />
  );
}
