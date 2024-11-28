import { Meteor } from "meteor/meteor";
import { reportsCollection } from "./reportsCollection";
import getFilters from "../utils/getFilters";

Meteor.methods({
  "report.create": async function (data) {
    let status = data.status;
    if (status === "done" || status === "stasis3") return;
    if (status === "completed" || status === "stasis") status = "done";
    if (status === "stasis2") status = "stasis3";
    return await reportsCollection.updateAsync(
      { _id: data._id },
      {
        $set: { ...data, createdAt: Date.now(), status },
      },
      { upsert: true }
    );
    // try {
    //   return reportsCollection.insertAsync({ ...data, createdAt: Date.now() });
    // } catch {
    //   console.warn(Date.now(), "Intento de crear nuevamente un registro", data);
    // }
  },
  "report.update": function (id, data) {
    return reportsCollection.updateAsync(
      id,
      {
        ...data,
        updatedAt: Date.now(),
      },
      { upsert: false }
    );
  },
  "report.read": async function (filters) {
    let filter = {};
    if (filters)
      for (const [key, value] of Object.entries(filters)) {
        filter[key] = { $regex: value, $options: "i" };
      }

    const records = await reportsCollection
      .rawCollection()
      .aggregate([
        {
          $match: filter,
        },
      ])
      .toArray();
    return records;
  },
  "report.readRecents": async function (
    project,
    page,
    pageSize,
    filters,
    sort
  ) {
    page = parseInt(page, 10) || 1;
    pageSize = parseInt(pageSize, 10) || 10;

    const { sortField, sortOrder } = sort;

    const records = await reportsCollection
      .rawCollection()
      .aggregate([
        {
          $match: getFilters({ ...filters, project }), // Filtra por project, recordId y el manager asignado
        },
        {
          // Ordena por recordId y por fecha (date) de manera descendente
          $sort: { recordId: 1, date: -1 },
        },
        {
          // Agrupa por recordId y selecciona el más reciente por cada recordId
          $group: {
            _id: "$recordId",
            mostRecentRecord: { $first: "$$ROOT" }, // Selecciona el más reciente
          },
        },
        {
          // Filtro adicional: Asegura que el registro más reciente pertenezca al manager específico
          $match: { "mostRecentRecord.manager": filters.manager },
        },
        {
          $replaceRoot: { newRoot: "$mostRecentRecord" }, // Desanida el documento seleccionado
        },
        {
          $sort: { [sortField]: sortOrder }, // Ordena según el campo de sort recibido
        },
        {
          $facet: {
            metadata: [{ $count: "totalCount" }],
            data: [{ $skip: (page - 1) * pageSize }, { $limit: pageSize }],
          },
        },
        {
          $project: {
            data: 1,
            totalCount: { $arrayElemAt: ["$metadata.totalCount", 0] },
          },
        },
      ])
      .toArray();

    return {
      data: records[0].data,
      total: records[0].totalCount,
    };
  },
  "report.delete": function (id) {
    reportsCollection.remove(id);
  },
  "report.readByRecordId": async function (recordId) {
    return await reportsCollection.findOneAsync({ recordId });
  },
  // timeFrame, project, locality

  "report.photoReports": async function (page, pageSize, projectName, filters) {
    page = parseInt(page, 10) || 1;
    pageSize = parseInt(pageSize, 10) || 10;
    const projectText = await Assets.getTextAsync("photoReportOutput.json");
    const project = JSON.parse(projectText)[projectName];

    return await reportsCollection
      .rawCollection()
      .aggregate([
        {
          $match: { images: { $exists: true, $ne: [] } },
        },
        {
          $lookup: {
            from: "assignments",
            localField: "_id",
            foreignField: "_id",
            as: "assignmentData",
          },
        },
        { $unwind: "$assignmentData" },
        {
          $lookup: {
            from: "records",
            localField: "assignmentData.recordId",
            foreignField: "_id",
            as: "recordData",
          },
        },
        { $unwind: "$recordData" },
        { $match: getFilters(filters) },
        { $project: project.project },
        {
          $facet: {
            metadata: [{ $count: "totalCount" }],
            data: [{ $skip: (page - 1) * pageSize }, { $limit: pageSize }],
          },
        },
        {
          $project: {
            data: 1,
            total: { $arrayElemAt: ["$metadata.totalCount", 0] },
          },
        },
      ])
      .toArray();
  },
  "report.serviceStatus": async function (
    page,
    pageSize,
    projectName,
    search,
    filters
  ) {
    let projectText = "";
    try {
      projectText = await Assets.getTextAsync(Object.keys(search)[0] + ".json");
    } catch {
      projectText = await Assets.getTextAsync(
        Object.values(search)[0] + ".json"
      );
    }

    const project = JSON.parse(projectText)[projectName];

    return await reportsCollection
      .rawCollection()
      .aggregate([
        {
          $match: getFilters(search),
        },
        {
          $lookup: {
            from: "assignments",
            localField: "_id",
            foreignField: "_id",
            as: "assignmentData",
          },
        },
        { $unwind: "$assignmentData" },
        {
          $lookup: {
            from: "records",
            localField: "assignmentData.recordId",
            foreignField: "_id",
            as: "recordData",
          },
        },
        { $unwind: "$recordData" },
        { $match: getFilters(filters) },
        { $project: project.project },
        {
          $facet: {
            metadata: [{ $count: "totalCount" }],
            data: [{ $skip: (page - 1) * pageSize }, { $limit: pageSize }],
          },
        },
        {
          $project: {
            data: 1,
            total: { $arrayElemAt: ["$metadata.totalCount", 0] },
          },
        },
      ])
      .toArray();
  },
  "report.distinct": async function (field) {
    return await reportsCollection.rawCollection().distinct(field);
  },
});
