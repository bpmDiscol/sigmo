import React, { useContext, useEffect, useState } from "react";
import { GlobalContext } from "../../context/globalsContext";
import { Button, Progress, Table } from "antd";
import XLSX from "xlsx";

export default function ReportAssignedUsers({ id }) {
  const [dataSource, setDataSource] = useState([]);
  const { globals } = useContext(GlobalContext);

  useEffect(() => {
    const fetchData = async () => {
      const assignments = await Meteor.callAsync(
        "assignment.usersCount",
        id,
        globals?.project?._id
    );
    const records = await Meteor.callAsync(
        "record.usersCount",
        id,
        globals?.project?._id
    );
    
      const merged = assignments.map((assg) => {
        const rec = records.find((rec) => rec._id.localidad == assg._id.localidad);
        const usuariosPorGestionar =
          assg.uniqueClients - assg.gestionadosEfectivos;
        const porcentajeAsignacion = (assg.uniqueClients * 100) / rec.total;
        const porcentajeUsuariosGestionados =
          (assg.gestionadosEfectivos * 100) / assg.uniqueClients;
        const porcentajeNoGestionados = 100 - porcentajeUsuariosGestionados;
        return {
          ...assg,
          usuariosParaGestionar: rec.total,
          usuariosPorGestionar,
          porcentajeAsignacion,
          porcentajeUsuariosGestionados,
          porcentajeNoGestionados,
        };
      });

      setDataSource(merged);
    };

    fetchData();
  }, [globals]);

  function getTotals() {
    const uniqueClients = dataSource.reduce(
      (sum, item) => sum + item.uniqueClients,
      0
    );
    const gestionadosEfectivos = dataSource.reduce(
      (sum, item) => sum + item.gestionadosEfectivos,
      0
    );
    const usuariosParaGestionar = dataSource.reduce(
      (sum, item) => sum + item.usuariosParaGestionar,
      0
    );
    const usuariosPorGestionar = uniqueClients - gestionadosEfectivos;

    const porcentajeAsignacion = (uniqueClients * 100) / usuariosParaGestionar;
    const porcentajeUsuariosGestionados =
      (gestionadosEfectivos * 100) / uniqueClients;
    const porcentajeNoGestionados = 100 - porcentajeUsuariosGestionados;

    return {
      key: "total",
      localidad: "TOTAL",
      usuariosParaGestionar,
      uniqueClients,
      gestionadosEfectivos,
      usuariosPorGestionar,
      porcentajeAsignacion,
      porcentajeUsuariosGestionados,
      porcentajeNoGestionados,
    };
  }

  const columns = [
    {
      title: "Localidades",
      dataIndex: "localidad",
      key: "localidad",
      render: (text) => text?.toUpperCase(),
      fixed: true,
    },
    {
      title: "Ususarios Entregada para Gestión",
      dataIndex: "usuariosParaGestionar",
      key: "usuariosParaGestionar",
      render: (text) => text,
      align: "right",
    },
    {
      title: "Usuarios Asignados",
      dataIndex: "uniqueClients",
      key: "uniqueClients",
      render: (text) => text,
      align: "right",
    },
    {
      title: "Usuarios Gestionados",
      dataIndex: "gestionadosEfectivos",
      key: "gestionadosEfectivos",
      render: (text) => text,
      align: "right",
    },
    {
      title: "Usuarios por Gestionar",
      dataIndex: "usuariosPorGestionar",
      key: "usuariosPorGestionar",
      render: (text) => text,
      align: "right",
    },
    {
      title: "Nivel de asignación",
      dataIndex: "porcentajeAsignacion",
      render: (r) => (
        <Progress
          type="dashboard"
          status="active"
          percent={r?.toFixed(1)}
          size={60}
          strokeWidth={15}
          strokeColor={"#02f737"}
        />
      ),
      align: "center",
    },
    {
      title: "Nivel usuarios gestionados",
      dataIndex: "porcentajeUsuariosGestionados",
      render: (r) => (
        <Progress
          type="dashboard"
          status="active"
          percent={r?.toFixed(1)}
          size={60}
          strokeWidth={15}
        />
      ),
      align: "center",
    },
    {
      title: "Nivel no gestionados",
      dataIndex: "porcentajeNoGestionados",
      render: (r) => (
        <Progress
          type="dashboard"
          status="active"
          percent={r?.toFixed(1)}
          size={60}
          strokeWidth={15}
          strokeColor={"#ff0202"}
        />
      ),
      align: "center",
    },
  ];

  function exportCarteraToExcel(data) {
    const rows = [];

    const header = [
      "Localidad",
      "Usuarios Asignados",
      "Usuarios Gestionados",
      "Usuarios Para Gestionar",
      "Usuarios Por Gestionar",
      "Nivel de asignación",
      "Nivel usuarios gestionados",
      "Nivel no gestionados",
    ];

    data.push(getTotals());

    const allData = data.map((item) => ({
      Localidad: item.localidad,
      "Usuarios Para Gestionar": item.usuariosParaGestionar,
      "Usuarios Asignados": item.uniqueClients,
      "Usuarios Gestionados": item.gestionadosEfectivos,
      "Usuarios Por Gestionar": item.usuariosPorGestionar,
      "Nivel de asignación": parseFloat(item.porcentajeAsignacion.toFixed(1)),
      "Nivel usuarios gestionados": parseFloat(
        item.porcentajeUsuariosGestionados.toFixed(1)
      ),
      "Nivel no gestionados": parseFloat(
        item.porcentajeNoGestionados.toFixed(1)
      ),
    }));
    const worksheet = XLSX.utils.json_to_sheet(allData);

    const colWidths = header.map((header, i) => {
      const columnData = [
        header,
        ...rows.map((row) => row[i]?.toString() || ""),
      ];
      const maxWidth = Math.max(...columnData.map((val) => val.length));
      return { wch: maxWidth + 2 }; // Ajustar ancho con 2 caracteres extra
    });

    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Usuarios`);
    XLSX.writeFile(workbook, `usuarios por localidad - ${Date.now()}.xlsx`);
  }

  return (
    <div>
      <Button type="primary" onClick={() => exportCarteraToExcel(dataSource)}>
        Exportar a Excel
      </Button>
      {dataSource.length && (
        <Table
          dataSource={[...dataSource, getTotals()]}
          columns={columns}
          pagination={false}
          scroll={{ x: "max-content" }}
          rowKey={(record) => record.localidad}
        />
      )}
    </div>
  );
}
