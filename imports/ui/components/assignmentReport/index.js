import {
  BellFilled,
  ClockCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Button,
  Flex,
  Input,
  message,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import moment from "moment";
import React, { useEffect, useState } from "react";
import XLSX from "xlsx";

export default function AssignmentReport({
  id,
  timeFrame,
  projectName,
  locality,
  translate,
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
  const searchTerms = [
    { label: "Buscar por producto", value: "recordData.PRODUCTO" },
    { label: "Buscar por contrato", value: "recordData.CONTRATO" },
    { label: "Buscar por cliente", value: "CLIENTE" },
    { label: "Buscar por identificación", value: "recordData.IDENTIFICACION" },
    { label: "Buscar por gestor", value: "manager" },
  ];
  const [searchText, setSearchText] = useState("");
  const [searchField, setSearchField] = useState();
  const isMoreThanThreeDaysAgo = (timestamp) => {
    const today = moment().startOf("day");
    const inputDate = moment(timestamp).startOf("day");

    const differenceInDays = today.diff(inputDate, "days");
    return differenceInDays >= 3;
  };

  async function getAssignments(current, pageSize, excel = false) {
    const assignments = await Meteor.callAsync(
      "assignments.reportAll",
      {
        [searchField]: searchText,
        "recordData.timeFrame": timeFrame,
        "recordData.locality": locality,
      },
      current,
      pageSize || 10
    );
    const newAssignments = assignments[0].data.map((data) => ({
      ...data.recordData,
      ...data.report,
      causal_de_pago:
        data.report?.resultadoDeGestion === "efectiva"
          ? translate(data.report.gestion)
          : null,
      causal_de_no_pago:
        data.report?.resultadoDeGestion === "no_efectiva"
          ? translate(data.report.gestion)
          : null,
      manager: data.manager,
      projectName,
      assignmentDate: data.date,
      reportDate: data.report?.createdAt,
      status:
        data.report?.status === "done"
          ? "Terminado"
          : data.report?.status === "reassigned"
          ? "Reasignada"
          : "en proceso",
      alert:
        data.report?.status !== "done" && isMoreThanThreeDaysAgo(data.date),
      compromiso:
        data.report?.status === "stasis3"
          ? moment(data.report.fechaCompromiso).format("DD/MM/YYYY")
          : null,
    }));
    const filtereds = newAssignments.filter(
      (assign) => assign.status !== "Reasignada"
    );
    if (!excel) {
      setAssignments(filtereds);
      setPagination((prev) => ({
        current,
        pagination: 10,
        total: assignments[0].totalCount,
      }));
    }

    if (excel)
      return {
        newAssignments: filtereds,
        totalCount: assignments[0].totalCount,
      };
  }

  useEffect(() => {
    getAssignments(1, pagination.pageSize);
  }, [locality]);

  function handleTableChange(pagination) {
    getAssignments(pagination.current, pagination.pageSize);
    // setPagination(pagination);
  }

  async function handleExport() {
    const pageSize = 100;
    let page = 1;
    const allData = [];
    let total = 10000000;
    try {
      while (total / pageSize > page - 1) {
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
              : "";
            formattedItem[col.title] = date;
          } else if (col.type === "alert") {
            formattedItem[col.title] = item[col.dataIndex]
              ? "Vencida"
              : "Regular";
          } else
            formattedItem[col.title] =
              translate(item[col.dataIndex]) || item[col.dataIndex];
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
        if (column.type === "date") {
          column.render = (date) =>
            date ? moment(date).format("DD/MM/YYYY, h:mm:ss a") : "";
        } else if (column.type === "alert") {
          column.render = (alert) => (
            <Tag icon={<ClockCircleOutlined />} color={alert ? "#f50" : "lime"}>
              {alert ? "Vencido" : "Regular"}
            </Tag>
          );
        } else if (column.type === "compromiso") {
          column.render = (compromiso) =>
            compromiso ? (
              <Tag
                icon={<BellFilled style={{ color: "yellow" }} />}
                color={"#ff2b2b"}
              >
                {compromiso}
              </Tag>
            ) : null;
        } else {
          column.render = (data) => translate(data) || data;
        }
        return column;
      });
      setColumns(reconstructeds);
    }

    getColumns();
  }, []);

  return (
    <Flex vertical>
      <Space.Compact>
        <Select
          options={searchTerms}
          style={{ width: "15rem" }}
          defaultValue={undefined}
          placeholder="Selecciona una busqueda"
          onSelect={(field) => setSearchField(field)}
          allowClear
          onClear={() => setSearchField(undefined)}
        />
        <Input
          style={{ width: "15rem" }}
          value={searchText}
          onChange={(text) => setSearchText(text.currentTarget.value)}
          onKeyDown={(key) => {
            if (key.key == "Enter") getAssignments(1, 10);
          }}
        />
        <Button
          icon={<SearchOutlined />}
          onClick={() => getAssignments(1, 10)}
          type="primary"
        />
      </Space.Compact>
      <Table
        size="small"
        columns={columns}
        dataSource={assignments}
        scroll={{ x: "max-content" }}
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
    </Flex>
  );
}
