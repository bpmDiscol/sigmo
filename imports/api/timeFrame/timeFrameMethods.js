import { Meteor } from "meteor/meteor";
import { timeFrameCollection } from "./timeFrameCollection";

Meteor.methods({
  "timeFrame.create": function (data) {
    return timeFrameCollection.insertAsync(data);
  },
  "timeFrame.update": function (id, data) {
    return timeFrameCollection.updateAsync(id, data);
  },
  "timeFrame.read": async function (project, page, pageSize, filters, sort) {
    page = parseInt(page, 10) || 1;
    pageSize = parseInt(pageSize, 10) || 10;

    let filter = { project };
    if (filters)
      for (const [key, value] of Object.entries(filters)) {
        key === "GESTOR"
          ? value == 0
            ? (filter[key] = { $eq: null })
            : (filter[key] = { $eq: value })
          : (filter[key] = { $regex: value, $options: "i" });
      }

    const { sortField, sortOrder } = sort;
    const records = await timeFrameCollection
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
  "timeFrame.delete": function (id) {
    timeFrameCollection.remove(id);
  },
});
