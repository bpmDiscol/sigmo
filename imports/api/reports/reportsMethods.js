import { Meteor } from "meteor/meteor";
import { reportsCollection } from "./reportsCollection";

Meteor.methods({
  "report.create": function (data) {
    try {
      return reportsCollection.insertAsync({ ...data, createdAt: Date.now() });
    } catch {
      console.warn(Date.now(), "Intento de crear nuevamente un registro", data);
    }
  },
  "report.update": function (id, data) {
    return reportsCollection.updateAsync(id, {
      ...data,
      updatedAt: Date.now(),
    });
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

    let filter = { project };

    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (key === "recordId") {
          filter[key] = { $in: Array.isArray(value) ? value : [value] };
        } else if (key === "manager") {
          // Filtra por el manager asignado específico
          filter[key] = { $eq: value }; // Asegúrate de que 'manager' sea el valor pasado
        } else {
          filter[key] = { $regex: value, $options: "i" };
        }
      }
    }

    const { sortField, sortOrder } = sort;

    const records = await reportsCollection
      .rawCollection()
      .aggregate([
        {
          $match: filter, // Filtra por project, recordId y el manager asignado
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
});
