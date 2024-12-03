import React, { useContext, useEffect, useState } from "react";
import { Button, Flex, Progress, Table } from "antd";
import XLSX from "xlsx";

import formatCurrency from "../../../api/utils/formatCurrency";
import { GlobalContext } from "../../context/globalsContext";

// Componente de la tabla
const LocalityTable = ({ id }) => {
  const [dataSource, setDataSource] = useState([]);
  const { globals } = useContext(GlobalContext);

  useEffect(() => {
    const fetchData = async () => {
      const assignments = await Meteor.callAsync(
        "assignment.localities",
        id,
        globals?.project?._id
      );
      const records = await Meteor.callAsync(
        "record.localities",
        id,
        globals?.project?._id
      );
      const { carteraAsignada, carteraGestionada } = assignments[0];
      const carteraParaGestion = records;
      const merged = mergeData(
        carteraAsignada,
        carteraGestionada,
        carteraParaGestion
      );
      setDataSource(merged);
    };

    fetchData();
  }, [globals]);

  function mergeData(
    carteraAsignada_,
    carteraGestionada_,
    carteraParaGestion_
  ) {
    const combinedData = [];

    // Iterar sobre los resultados del segundo agregado (carteraParaGestion)
    carteraParaGestion_.forEach((item) => {
      const localidad = item._id.locality;
      const paraGestion = item.carteraParaGestion;

      // Buscar las entradas correspondientes en carteraAsignada y carteraGestionada
      const asignada = carteraAsignada_.find(
        (entry) => entry._id.localidad === localidad
      );
      const gestionada = carteraGestionada_.find(
        (entry) => entry._id.localidad === localidad
      );

      const carteraAsignada = asignada ? asignada.cartera : 0;
      const carteraGestionada = gestionada ? gestionada.cartera : 0;
      const carteraPorGestionar = carteraAsignada - carteraGestionada;

      // Agregar al array de datos combinados
      combinedData.push({
        key: localidad,
        localidad,
        carteraParaGestion: paraGestion,
        carteraAsignada,
        carteraGestionada,
        carteraPorGestionar,
      });
    });

    return combinedData;
  }

  const calculateTotals = () => {
    return dataSource.reduce(
      (totals, item) => {
        totals.carteraParaGestion += item.carteraParaGestion;
        totals.carteraAsignada += item.carteraAsignada;
        totals.carteraGestionada += item.carteraGestionada;
        totals.carteraPorGestionar += item.carteraPorGestionar;
        return totals;
      },
      {
        carteraParaGestion: 0,
        carteraAsignada: 0,
        carteraGestionada: 0,
        carteraPorGestionar: 0,
      }
    );
  };

  const totals = calculateTotals();

  // Definir las columnas de la tabla
  const columns = [
    {
      title: "Localidades",
      dataIndex: "localidad",
      key: "localidad",
      render: (text) => text.toUpperCase(),
      fixed: true,
    },
    {
      title: "Cartera Entregada para Gestión",
      dataIndex: "carteraParaGestion",
      key: "carteraParaGestion",
      render: (text) => formatCurrency(text),
      align: "right",
    },
    {
      title: "Cartera Asignada",
      dataIndex: "carteraAsignada",
      key: "carteraAsignada",
      render: (text) => formatCurrency(text),
      align: "right",
    },
    {
      title: "Cartera Gestionada",
      dataIndex: "carteraGestionada",
      key: "carteraGestionada",
      render: (text) => formatCurrency(text),
      align: "right",
    },
    {
      title: "Cartera por Gestionar",
      dataIndex: "carteraPorGestionar",
      key: "carteraPorGestionar",
      render: (text) => formatCurrency(text),
      align: "right",
    },
    {
      title: "Asignación de cartera",
      dataIndex: "carteraAsignada",
      key: "carteraAsignada",
      render: (text, r) => (
        <Flex vertical justify="center" align="center">
          <Progress
            type="dashboard"
            percent={(
              (r.carteraAsignada * 100) / r.carteraParaGestion || 0
            ).toFixed(1)}
            size={60}
            strokeWidth={15}
            strokeColor={"#02f737"}
          />
        </Flex>
      ),
    },
    {
      title: "Gestión de la asignación",
      dataIndex: "carteraGestionada",
      key: "carteraGestionada",
      render: (text, r) => (
        <Flex vertical justify="center" align="center">
          <Progress
            type="dashboard"
            percent={(
              (r.carteraGestionada * 100) / r.carteraAsignada || 0
            ).toFixed(1)}
            size={60}
            strokeWidth={15}
          />
        </Flex>
      ),
    },
    {
      title: "Gestión por terminar",
      dataIndex: "carteraPorGestionar",
      key: "carteraPorGestionar",
      render: (text, r) => (
        <Flex vertical justify="center" align="center">
          <Progress
            type="dashboard"
            percent={(
              (r.carteraPorGestionar * 100) / r.carteraAsignada || 0
            ).toFixed(1)}
            size={60}
            strokeWidth={15}
            strokeColor={"#ff0202"}
          />
        </Flex>
      ),
    },
  ];

  // Agregar una fila de totales
  const totalRow = {
    key: "total",
    localidad: "TOTAL",
    carteraParaGestion: totals.carteraParaGestion,
    carteraAsignada: totals.carteraAsignada,
    carteraGestionada: totals.carteraGestionada,
    carteraPorGestionar: totals.carteraPorGestionar,
  };

  function exportCarteraToExcel(data) {
    // Crear un objeto para las filas
    const rows = [];

    // Encabezado de la tabla
    const headers = [
      "Localidad",
      "Cartera Asignada",
      "Cartera Gestionada",
      "Cartera Para Gestionar",
      "Cartera Por Gestionar",
      "% Asignación de cartera",
      "% Gestión de la asignación",
      "% Gestión por terminar",
    ];

    // Crear las filas de datos
    data.forEach((item) => {
      const row = [
        item.localidad,
        item.carteraAsignada,
        item.carteraGestionada,
        item.carteraParaGestion,
        item.carteraPorGestionar,
        parseFloat(
          ((item.carteraAsignada * 100) / item.carteraParaGestion || 0).toFixed(
            1
          )
        ),
        parseFloat(
          ((item.carteraGestionada * 100) / item.carteraAsignada || 0).toFixed(
            1
          )
        ),
        parseFloat(
          (
            (item.carteraPorGestionar * 100) / item.carteraAsignada || 0
          ).toFixed(1)
        ),
      ];

      // Añadir la fila
      rows.push(row);
    });

    // Calcular totales de cada columna numérica
    const totalCarteraAsignada = data.reduce(
      (sum, item) => sum + item.carteraAsignada,
      0
    );
    const totalCarteraGestionada = data.reduce(
      (sum, item) => sum + item.carteraGestionada,
      0
    );
    const totalCarteraParaGestion = data.reduce(
      (sum, item) => sum + item.carteraParaGestion,
      0
    );
    const totalCarteraPorGestionar = data.reduce(
      (sum, item) => sum + item.carteraPorGestionar,
      0
    );

    const asignacionDeCartera = parseFloat(
      ((totalCarteraAsignada * 100) / totalCarteraParaGestion || 0).toFixed(1)
    );
    const gestionDeAsignacion = parseFloat(
      ((totalCarteraGestionada * 100) / totalCarteraAsignada || 0).toFixed(1)
    );
    const gestionPorTerminar = parseFloat(
      ((totalCarteraPorGestionar * 100) / totalCarteraAsignada || 0).toFixed(1)
    );

    // Agregar la fila de totales
    const totalRow = [
      "Total", // Para la columna "Localidad"
      totalCarteraAsignada,
      totalCarteraGestionada,
      totalCarteraParaGestion,
      totalCarteraPorGestionar,
      asignacionDeCartera,
      gestionDeAsignacion,
      gestionPorTerminar,
    ];
    rows.push(totalRow); // Añadir fila de totales al final

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
    XLSX.utils.book_append_sheet(workbook, worksheet, `Cartera`);

    // Exportar el archivo
    XLSX.writeFile(workbook, `cartera por localidad - ${Date.now()} {}.xlsx`);
  }

  return (
    <>
      <Button type="primary" onClick={() => exportCarteraToExcel(dataSource)}>
        Exportar a Excel
      </Button>
      <Table
        dataSource={[...dataSource, totalRow]} // Añadir la fila de totales al final
        columns={columns}
        pagination={false}
        scroll={{ x: "max-content" }}
      />
    </>
  );
};

export default LocalityTable;
