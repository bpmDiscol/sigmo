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
      NUMERO_DE_LA_ORDEN: data.NUMERO_DE_LA_ORDEN,
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

  "record.incidences": async function (groupField, additionalFilter) {
    const filter = {};

    Object.keys(additionalFilter).forEach((field) => {
      if (Array.isArray(additionalFilter[field]))
        filter[field] = { $in: additionalFilter[field] };
      else filter[field] = additionalFilter[field];
    });

    const aggregationPipeline = [{ $match: filter }];
    aggregationPipeline.push({
      $group: {
        _id: `$${groupField}`,
        count: { $sum: 1 },
      },
    });

    const records = await recordsCollection
      .rawCollection()
      .aggregate(aggregationPipeline)
      .toArray();

    let incidencesByField = {};
    records.forEach((record) => {
      if (record._id) incidencesByField[record._id] = record.count;
    });

    return incidencesByField;
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
  "record.totalDebt": async function ({ timeFrame, locality }) {
    const total = await recordsCollection
      .rawCollection()
      .aggregate([
        {
          $match: { timeFrame, locality },
        },
        {
          $group: {
            _id: null,
            deudaTotalAsignada: {
              $sum: { $toDouble: "$DEUDA_TOTAL_ASIGNADA" },
            },
          },
        },
      ])
      .toArray();
    return total.length ? total[0].deudaTotalAsignada : 0;
  },
});
