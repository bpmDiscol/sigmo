import { Button, Flex, message, Select, Table } from "antd";
import React, { useEffect, useState } from "react";
import ExcelJS from "exceljs";

import getTableColumns from "../../../api/utils/getTableColumns";
import { CloudDownloadOutlined } from "@ant-design/icons";

export default function ReportServiceStatus({
  projectName,
  field,
  timeFrame,
  locality,
  translate,
  all = false,
}) {
  const [filterOption, setFilterOption] = useState(null);
  const [options, setOptions] = useState([]);
  const [columns, setColumns] = useState();
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [downloadReport, setDownloadReport] = useState({
    loading: false,
    percent: 0,
  });
  async function getTableOutput() {
    const processedColumns = await getTableColumns(
      field,
      projectName,
      translate
    );
    setColumns(processedColumns);
  }

  async function getData(page, pageSize, excel = false) {
    const search = all ? { exists: field } : { [field]: filterOption };
    console.log("🚀 ~ getData ~ search:", search);
    const resp = await Meteor.callAsync(
      "report.serviceStatus",
      page,
      pageSize,
      projectName,
      search,
      { "recordData.timeFrame": timeFrame, "recordData.locality": locality }
    );

    if (excel) {
      return {
        data: resp[0].data,
        total: resp[0].total,
      };
    } else {
      setData(resp[0].data);
      setPagination((prev) => ({
        ...prev,
        current: page,
        total: resp[0].total,
      }));
    }
  }

  async function handleExport() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`${field} ${filterOption}`);

    worksheet.columns = columns.map((col) => ({
      header: col.title,
      key: col.dataIndex,
      width: 20,
    }));

    let page = 1;
    const pageSize = 1000;
    let total = 10000000;
    const allData = [];

    try {
      while (total / pageSize > page - 1) {
        const data = await getData(page, pageSize, true);
        if (data.total) total = data.total;
        allData.push(data.data);

        setDownloadReport({
          percent: (page * pageSize) / total,
          loading: true,
          message: "downloading...",
        });
        page++;
      }
      const flatData = allData.flat(1);

      //procesar
      flatData.forEach((item, index) => {
        const row = {};
        columns.forEach((col) => {
          if (col.type === "date") {
            const date = item[col.dataIndex]
              ? moment(item[col.dataIndex]).format("DD/MM/YYYY, h:mm A")
              : "fecha";
            row[col.dataIndex] = date;
          } else if (col.type === "images") {
            row[col.dataIndex] = item[col.dataIndex].map((image) =>
              getLink(image)
            );
          } else
            row[col.dataIndex] =
              translate(item[col.dataIndex]) || item[col.dataIndex];
        });
        setDownloadReport({
          percent: index / flatData.length,
          message: "data process...",
        });
        worksheet.addRow(row);
      });

      // Finalizar el archivo
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Gestiones con Fotos-${Date.now()}.xlsx`;
      link.click();
    } catch (error) {
      console.error("Error durante la exportación:", error);
      message.error(error.message);
    } finally {
      setDownloadReport({ percent: 0, loading: false });
    }
  }

  async function getOptions() {
    const options = await Meteor.callAsync("report.distinct", field);
    const myOptions = options.map((option) => ({
      label: option.toUpperCase(),
      value: option,
    }));
    setOptions(myOptions);
  }

  function handleTableChange(pagination) {
    getData(pagination.current, pagination.pageSize);
    setPagination(pagination);
  }

  useEffect(() => {
    !all && getOptions();
    getTableOutput();
  }, [locality, timeFrame]);

  useEffect(() => {
    (filterOption || all) && getData(1, pagination.pageSize);
  }, [filterOption, locality, timeFrame]);

  return (
    <div>
      <Flex gap={16}>
        {!all && (
          <Select
            options={options}
            style={{ width: "15rem" }}
            placeholder="Selecciona una opción"
            onSelect={setFilterOption}
          />
        )}
        <Button
          type="primary"
          icon={<CloudDownloadOutlined />}
          disabled={!data.length}
          onClick={handleExport}
        >
          {downloadReport.message || "Download"}
          {downloadReport.percent * 100 || ""}
        </Button>
      </Flex>
      <Table
        size="small"
        columns={columns}
        dataSource={data}
        rowKey={(record) => record._id}
        scroll={{ x: "max-content" }}
        pagination={{
          pagination,
          position: ["bottomLeft"],
          showTotal: (total) => `${total} Registros`,
        }}
        onChange={handleTableChange}
      />
    </div>
  );
}
