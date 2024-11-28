import { Button, DatePicker, Flex, message, Table, Typography } from "antd";
import React, { useEffect, useState } from "react";
import ImagesRender from "../assignmentReport/imagesRender";
import moment from "moment";
import ExcelJS from "exceljs";

export default function PhotoReport({
  projectName,
  timeFrame,
  locality,
  translate,
  id,
}) {
  const [reportData, setReportData] = useState([]);
  const [downloadReport, setDownloadReport] = useState({
    loading: false,
    percent: 0,
  });
  const [columns, setColumns] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchDate, setSearchDate] = useState();

  
  function getLink(image) {
    return Meteor.absoluteUrl(
      `download?fileName=${encodeURIComponent(
        image.id
      )}.jpg&predio=${encodeURIComponent(image.predio)}`
    );
  }
  async function getColumns(page, pageSize, excel = false) {
    const columnsStr = await Meteor.callAsync(
      "getTextAssets",
      "photoReportOutput.json"
    );

    const imagesData = await Meteor.callAsync(
      "report.photoReports",
      page,
      pageSize,
      projectName,
      {
        "recordData.timeFrame": timeFrame,
        "recordData.locality": locality,
        "recordData.project": id,
        date: searchDate ? { field: "createdAt", searchDate } : null,
      }
    );

    if (excel) {
      return {
        data: imagesData[0].data,
        total: imagesData[0].total,
      };
    } else {
      const parsedColumns = JSON.parse(columnsStr);
      const myColumns = parsedColumns[projectName].columns;

      const processedColumns = myColumns.map((column) => {
        let render = {};
        if (column.type === "text") render = (data) => translate(data) || data;
        if (column.type === "date")
          render = (data) => moment(data).format("DD/MM/YYYY hh:mm A");
        if (column.type === "images")
          render = (data) => <ImagesRender images={data} />;

        return {
          ...column,
          render,
        };
      });

      setColumns(processedColumns);
      setReportData(imagesData[0].data);
      setPagination((prev) => ({
        ...prev,
        current: page,
        total: imagesData[0].total,
      }));
    }
  }

  function handleTableChange(pagination) {
    getColumns(pagination.current, pagination.pageSize);
    // setPagination(pagination);
  }

  useEffect(() => {
    if (translate) getColumns(pagination.current, pagination.pageSize);
  }, [translate, searchDate]);

  async function handleExport() {
    const pageSize = 100;
    let page = 1;
    const allData = [];
    let total = 10000000;
    try {
      while (total / pageSize > page - 1) {
        const data = await getColumns(page, pageSize, true);
        if (data.total) total = data.total;
        allData.push(data.data);
        setDownloadReport({
          status: "Leyendo datos",
          percent: page > pageSize ? (page * pageSize) / total : page / total,
          loading: true,
        });
        page++;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Gestiones con Fotos");
      const correctedColumns = columns.slice(0, -1);

      worksheet.columns = correctedColumns.map((col) => ({
        header: col.title,
        key: col.dataIndex,
        width: 20,
      }));

      const formattedData = allData.flat(1).map((item) => {
        const formattedItem = {};
        columns.forEach((col, index) => {
          setDownloadReport({
            status: "Obteniendo vinculos",
            percent: index / columns.length,
            loading: true,
          });

          if (col.type === "date") {
            const date = item[col.dataIndex]
              ? moment(item[col.dataIndex]).format("DD/MM/YYYY, h:mm A")
              : "fecha";
            formattedItem[col.dataIndex] = date;
          } else if (col.type === "images") {
            formattedItem[col.dataIndex] = item[col.dataIndex].map((image) =>
              getLink(image)
            );
          } else
            formattedItem[col.dataIndex] =
              translate(item[col.dataIndex]) || item[col.dataIndex];
        });
        return formattedItem;
      });

      let dataIndx = 0;
      for (const data of formattedData) {
        const { images, ...item } = data;
        const row = worksheet.addRow(item);
        worksheet.getRow(row.number).height = 120;

        setDownloadReport({
          status: "Descargando imagenes",
          percent: dataIndx / formattedData.length,
          loading: true,
        });
        dataIndx++;

        // Manejar imágenes
        let inx = Object.keys(item).length;
        for (const image of images) {
          const imageBuffer = await fetch(image)
            .catch((e) => console.warn(e))
            .then((res) => res.arrayBuffer())
            .then((buffer) => new Uint8Array(buffer));

          if (imageBuffer.length > 100) {
            const imageElement = new Image();
            imageElement.src = URL.createObjectURL(new Blob([imageBuffer]));
            await new Promise((resolve) => {
              imageElement.onload = () => resolve();
            });

            const imageId = workbook.addImage({
              buffer: imageBuffer,
              extension: "jpeg",
            });
            worksheet.addImage(imageId, {
              tl: { col: inx, row: row.number - 1 },
              ext: {
                width: imageElement.width * 0.2,
                height: imageElement.height * 0.2,
              },
            });
            worksheet.getColumn(inx + 1).width = 16;
          }
          inx++;
        }

        const headerRow = worksheet.getRow(1);
        headerRow.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFD700" }, // Color de fondo (oro)
          };
          cell.font = {
            bold: true,
            color: { argb: "000000" }, // Color del texto (negro)
          };
          cell.alignment = { vertical: "middle", horizontal: "center" };
        });
        worksheet.eachRow((row) => {
          row.eachCell((cell) => {
            cell.alignment = { vertical: "middle", horizontal: "center" };
          });
        });
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Gestiones con Fotos-${Date.now()}.xlsx`;
      link.click();
    } catch (error) {
      message.error(error.message);
    } finally {
      setDownloadReport({ percent: 0, loading: false });
    }
  }

  function changeDate(date) {
    date &&
      setSearchDate({
        start: date[0].valueOf(),
        end: date[1].valueOf(),
      });
  }

  return (
    <div>
      <Flex justify="space-between">
        <Flex>
          <Button
            type="primary"
            style={{ width: "10rem", marginRight: "8px" }}
            onClick={handleExport}
            disabled={reportData.length === 0}
            loading={downloadReport.loading}
            danger={downloadReport.loading}
          >
            Exportar a Excel
          </Button>
          {downloadReport.loading && (
            <Typography.Text color="red">
              {`${downloadReport.status} ` +
                (downloadReport.percent * 100).toFixed(1) +
                "%"}
            </Typography.Text>
          )}
        </Flex>
        <DatePicker.RangePicker onChange={changeDate} showTime />
      </Flex>
      <Table
        size="small"
        columns={columns}
        dataSource={reportData}
        rowKey={(record) => record._id}
        scroll={{ x: "max-content" }}
        pagination={{
          ...pagination,
          position: ["topRight"],
          showTotal: (total) => `${total} Registros con fotos`,
        }}
        onChange={handleTableChange}
      />
    </div>
  );
}
