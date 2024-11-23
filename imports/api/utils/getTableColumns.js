import moment from "moment";
import ImagesRender from "../../ui/components/assignmentReport/imagesRender";
import React from "react";

export default async function getTableColumns(field, projectName, translate) {
  const columnsStr = await Meteor.callAsync("getTextAssets", field + ".json");
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
  return processedColumns;
}
