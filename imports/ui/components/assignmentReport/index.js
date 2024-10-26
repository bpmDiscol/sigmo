import { Button, message, Table, Typography } from "antd";
import moment from "moment";
import React, { useEffect, useState } from "react";
import XLSX from "xlsx";

export default function AssignmentReport({ id, timeFrame }) {
  const voidSorter = { sortField: null, sortOrder: 1 };
  const [assignments, setAssignments] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    total: 0,
  });

  const [downloadReport, setDownloadReport] = useState({
    loading: false,
    percent: 0,
  });

  useEffect(() => {
    fetchAssignments(1, pagination.pageSize);
  }, []);

  function fetchAssignments(current, pageSize) {
    Meteor.call(
      "assignment.reportRecents",
      id,
      timeFrame,
      current,
      pageSize,
      {},
      voidSorter,
      (err, res) => {
        const data = res.data;
        const newAssignments = data.map((data) => ({
          ...data.record,
          ...data.report,
          manager: data.manager,
          assignmentDate: data.date,
        }));
        setAssignments(newAssignments);
      }
    );
  }

  function handleTableChange(pagination) {
    fetchAssignments(pagination.current, pagination.pageSize);
    setPagination(pagination);
  }

  async function handleExport() {
    const pageSize = 100;
    let page = 1;
    const allData = [];
    let total = 10000000;
    try {
      while (total / pageSize >= page) {
        const partData = await Meteor.callAsync(
          "assignment.reportRecents",
          id,
          timeFrame,
          page,
          pageSize,
          {},
          voidSorter
        ).catch((e) => {
          console.error(e);
          throw new TypeError("Error durante la descarga");
        });
        if (partData.total) total = partData.total;
        const data = partData.data.map((data) => ({
          ...data.record,
          ...data.report,
          manager: data.manager,
          fecha_asignacion: moment(data.date).format("DD/MM/YYYY"),
        }));

        allData.push(data);
        setDownloadReport({ percent: page / total, loading: true });
        page++;
      }
      //   const { mappedData, formattedHeaders } = mapOutput(allData);

      const ws = XLSX.utils.json_to_sheet(allData[0]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Report");
      XLSX.writeFile(wb, `Reporte-${Date.now()}.xlsx`);
    } catch (error) {
      message.error(error.message);
    } finally {
      setDownloadReport({ percent: 0, loading: false });
    }
  }

  const columns = [
    {
      title: "Gestor",
      dataIndex: "manager",
      width: "15rem",
    },
    {
      title: "Producto",
      dataIndex: "PRODUCTO",
      width: "15rem",
    },
    {
      title: "Contrato",
      dataIndex: "CONTRATO",
      width: "15rem",
    },
    {
      title: "Cliente",
      dataIndex: "CLIENTE",
      width: "15rem",
    },
    {
      title: "Descripción Tipo Producto",
      dataIndex: "DESCRIPCION_TIPO_PRODUCTO",
      width: "15rem",
    },
    {
      title: "Descripción Localidad",
      dataIndex: "DESCRIPCION_LOCALIDAD",
      width: "15rem",
    },
    {
      title: "Descripción Barrio",
      dataIndex: "DESCRIPCION_BARRIO",
      width: "15rem",
    },
    {
      title: "Descripción Ciclo",
      dataIndex: "DESCRIPCION_CICLO",
      width: "15rem",
    },
    {
      title: "Tipo Cliente",
      dataIndex: "TIPO_CLIENTE",
      width: "15rem",
    },
    {
      title: "Identificación",
      dataIndex: "IDENTIFICACION",
      width: "15rem",
    },
    {
      title: "Nombre Cliente",
      dataIndex: "NOMBRE_CLIENTE",
      width: "15rem",
    },
    {
      title: "Dirección Predio",
      dataIndex: "DIRECCION_PREDIO",
      width: "15rem",
    },
    {
      title: "Fecha Asignación",
      dataIndex: "assignmentDate",
      key: "assignmentDate",
      render: (date) => moment(date).format("DD/MM/YYYY"),
    },
    {
      title: "Teléfono Sugerido",
      dataIndex: "TELEFONO",
      width: "15rem",
    },
    {
      title: "Email",
      dataIndex: "EMAIL",
      width: "15rem",
    },
    {
      title: "Causal de No Pago",
      dataIndex: "CAUSAL_DE_NO_PAGO",
      width: "15rem",
    },
    {
      title: "Resultado de Gestión",
      dataIndex: "RESULTADO_DE_GESTION",
      width: "15rem",
    },
    // Agrega más columnas aquí según sea necesario
  ];

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
