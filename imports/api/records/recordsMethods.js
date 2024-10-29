import { Meteor } from "meteor/meteor";
import { recordsCollection } from "./recordsCollection";

Meteor.methods({
  "record.create": function (data) {
    return recordsCollection.insertAsync(data);
  },
  "record.update": function (id, data) {
    return recordsCollection.updateAsync(id, data);
  },
  "record.insert": async function (data) {
    const preExists = await recordsCollection.findOneAsync({
      PRODUCTO: data.PRODUCTO,
      CONTRATO: data.CONTRATO,
      CLIENTE: data.CLIENTE,
      timeFrame: data.timeFrame,
      project: data.project,
    });
    if (preExists)
      return await recordsCollection.updateAsync(preExists._id, { $set: data });

    return await recordsCollection.insertAsync(data);
  },
  "record.read": async function (page, pageSize, filters, sort, fields) {
    page = parseInt(page, 10) || 1;
    pageSize = parseInt(pageSize, 10) || 10;

    let filter = {};
    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (key === "GESTOR") {
          filter[key] = value == 0 ? { $eq: null } : { $eq: value };
        } else if (key === "_id") {
          filter[key] = { $in: Array.isArray(value) ? value : [value] };
        } else {
          filter[key] = { $regex: value, $options: "i" };
        }
      }
    }

    const { sortField, sortOrder } = sort;

    const projection = {
      // data: 1,
      totalCount: { $arrayElemAt: ["$metadata.totalCount", 0] },
    };
    if (Array.isArray(fields) && fields.length > 0) {
      fields.forEach((field) => {
        projection[`data.${field}`] = 1;
      });
    }

    const records = await recordsCollection
      .rawCollection()
      .aggregate([
        {
          $match: filter,
        },
        {
          $sort: { [sortField]: sortOrder },
        },
        {
          $facet: {
            metadata: [{ $count: "totalCount" }],
            data: [{ $skip: (page - 1) * pageSize }, { $limit: pageSize }],
          },
        },
        {
          $project: projection,
        },
      ])
      .toArray();

    return {
      data: records[0].data,
      total: records[0].totalCount,
    };
  },

  "record.incidences": async function (
    timeFrame,
    filtersArray,
    additionalFilter // filtro adicional
  ) {
    const filter = { timeFrame };

    // Procesar el objeto additionalFilter (campo y valores)
    if (additionalFilter && additionalFilter.field && additionalFilter.values) {
      const { field, values } = additionalFilter;
      if (Array.isArray(values)) {
        filter[field] = { $in: values };
      } else {
        filter[field] = values;
      }
    }

    // Procesar el array de filters y contar incidencias
    const aggregationPipeline = [{ $match: filter }];

    if (Array.isArray(filtersArray) && filtersArray.length > 0) {
      filtersArray.forEach((field) => {
        aggregationPipeline.push({
          $group: {
            _id: `$${field}`, // Agrupar por el campo especificado
            count: { $sum: 1 }, // Contar incidencias
          },
        });
      });
    }

    // Ejecutar la consulta de agregación
    const records = await recordsCollection
      .rawCollection()
      .aggregate(aggregationPipeline)
      .toArray();

    // Procesar los resultados de incidencias por campo
    let incidencesByField = {};
    records.forEach((record) => {
      incidencesByField[record._id] = record.count;
    });

    return {
      incidencesByField, // Devuelve las incidencias por campo
      records,
    };
  },

  "record.delete": function (id) {
    recordsCollection.remove(id);
  },

  "record.localities": async function (timeFrame, project) {
    return await recordsCollection
      .rawCollection()
      .aggregate([
        {
          $match: { timeFrame: timeFrame.id, project },
        },
        {
          $addFields: {
            deuda_pendiente: { $toDouble: "$DEUDA_TOTAL_ASIGNADA" },
          },
        },
        {
          $group: {
            _id: { locality: "$locality" },
            carteraParaGestion: { $sum: "$deuda_pendiente" },
          },
        },
      ])
      .toArray();
  },
});
