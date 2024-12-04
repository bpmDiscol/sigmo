import { Meteor } from "meteor/meteor";
import { assignmentsCollection } from "./assignmensCollection";
import { reportsCollection } from "../reports/reportsCollection";
import { recordsCollection } from "../records/recordsCollection";
import moment from "moment";
import getFilters from "../utils/getFilters";

Meteor.methods({
  "assignment.create": async function (data) {
    const thisAssignment = await assignmentsCollection.findOneAsync(
      { recordId: data.recordId },
      {
        sort: { date: -1, manager: 1 },
      }
    );

    if (thisAssignment) {
      await reportsCollection.updateAsync(
        { _id: thisAssignment._id },
        {
          $set: { status: "reassigned" },
        },
        { upsert: true }
      );
      Meteor.users.updateAsync(
        { username: thisAssignment.manager },
        { $set: { "profile.assignments": Math.random() } }
      );
    }
    await assignmentsCollection.insertAsync(data, (err, id) => {
      if (err) throw new Error("error al asignar");
      return id;
    });
    Meteor.users.updateAsync(
      { username: data.manager },
      { $set: { "profile.assignments": Math.random() } }
    );
  },
  "assignment.recreate": async function (data) {
    const sameRecord = await assignmentsCollection.findOneAsync(
      { recordId: data.recordId },
      null,
      {
        $sort: { date: -1 },
      }
    );
    if (sameRecord) {
      const report = await recordsCollection.findOneAsync(sameRecord._id);
      if (report && !["done"].includes(report?.status)) return false;
    }
    const user = await Meteor.users.findOneAsync({ _id: data.currentUser });
    const manager = user?.username;
    if (manager)
      return await assignmentsCollection
        .insertAsync({ ...data, manager, date: Date.now() })
        .catch((e) => console.error(e));
  },
  "assignment.getRecordId": async function (_id) {
    const assignment = await assignmentsCollection.findOneAsync(_id);
    return assignment?.recordId;
  },
  "assignment.createByOrderId": async function (
    NUMERO_DE_LA_ORDEN,
    timeFrame,
    manager,
    date
  ) {
    const data = { NUMERO_DE_LA_ORDEN, timeFrame, manager, error: false };
    const record = await recordsCollection.findOneAsync(
      {
        NUMERO_DE_LA_ORDEN,
        timeFrame,
      },
      { _id: 1 }
    );
    if (record) {
      const obj = manager
        ? {
            recordId: record._id,
            manager,
            date,
          }
        : {
            recordId: record._id,
            date,
          };
      const id = await Meteor.callAsync("assignment.create", obj).catch(
        (err) => {
          console.log(err);
          data.error = true;
        }
      );
      if (!id) {
        console.warn(id);
        data.error = true;
      }
      return data;
    }
  },
  "assignment.update": function (id, data) {
    return assignmentsCollection.updateAsync(id, data);
  },
  "assignment.read": async function (project, page, pageSize, filters, sort) {
    page = parseInt(page, 10) || 1;
    pageSize = parseInt(pageSize, 10) || 10;

    let filter = { project };
    if (filters)
      for (const [key, value] of Object.entries(filters)) {
        key === "recordId"
          ? value == 0
            ? (filter[key] = { $eq: null })
            : (filter[key] = { $in: value })
          : (filter[key] = { $regex: value, $options: "i" });
      }

    const { sortField, sortOrder } = sort;
    const records = await assignmentsCollection
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
  "assignment.readRecents": async function (
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
          filter[key] = { $eq: value };
        } else {
          filter[key] = { $regex: value, $options: "i" };
        }
      }
    }

    const { sortField, sortOrder } = sort;

    const records = await assignmentsCollection
      .rawCollection()
      .aggregate([
        {
          $match: filter,
        },
        {
          $sort: { recordId: 1, date: -1 },
        },
        {
          $group: {
            _id: "$recordId",
            mostRecentRecord: { $first: "$$ROOT" },
          },
        },
        {
          $match: { "mostRecentRecord.manager": filters.manager },
        },
        {
          $replaceRoot: { newRoot: "$mostRecentRecord" },
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
  "assignment.reportRecents": async function (
    projectId,
    timeFrame,
    page,
    pageSize,
    filters,
    sort
  ) {
    page = parseInt(page, 10) || 1;
    pageSize = parseInt(pageSize, 10) || 10;

    let filter = {};

    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (key === "recordId" || key === "manager") {
          filter[key] = { $in: value };
        } else if (key === "date") {
          filter[key] = { $eq: moment(value).startOf("day").toDate() };
        } else {
          filter[key] = { $regex: value, $options: "i" };
        }
      }
    }

    const { sortField, sortOrder } = sort;

    const records = await assignmentsCollection
      .rawCollection()
      .aggregate([
        {
          $match: filter,
        },
        {
          $lookup: {
            from: "reports",
            localField: "_id",
            foreignField: "_id",
            as: "reportData",
          },
        },
        {
          $lookup: {
            from: "records",
            localField: "recordId",
            foreignField: "_id",
            as: "recordData",
          },
        },
        {
          $sort: { recordId: 1, date: -1 },
        },
        {
          $group: {
            _id: "$recordId",
            mostRecentRecord: { $first: "$$ROOT" },
          },
        },

        {
          $replaceRoot: { newRoot: "$mostRecentRecord" },
        },
        {
          $sort: { [sortField]: sortOrder },
        },
        {
          $addFields: {
            report: { $arrayElemAt: ["$reportData", 0] },
            record: { $arrayElemAt: ["$recordData", 0] },
          },
        },
        {
          $unset: ["reportData", "recordData"],
        },
        {
          $match: {
            "record.project": projectId,
            "record.timeFrame": timeFrame,
          },
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
  "assignment.delete": function (id) {
    assignmentsCollection.remove(id);
  },
  "assignment.readByRecordId": async function (recordId) {
    return await assignmentsCollection.findOneAsync({ recordId });
  },
  "assignment.managersResults": async function (filters) {
    const result = await assignmentsCollection
      .rawCollection()
      .aggregate([
        {
          $lookup: {
            from: "records",
            localField: "recordId",
            foreignField: "_id",
            as: "recordData",
          },
        },
        { $unwind: "$recordData" },
        { $match: getFilters(filters) },
        {
          $lookup: {
            from: "reports",
            localField: "_id",
            foreignField: "_id",
            as: "reportData",
          },
        },
        {
          $addFields: {
            assignmentDate: {
              $toDate: { $arrayElemAt: ["$reportData.createdAt", 0] },
            },
            deuda_pendiente: { $toDouble: "$recordData.DEUDA_TOTAL_ASIGNADA" },
            status: { $arrayElemAt: ["$reportData.status", 0] },
          },
        },
        {
          $facet: {
            resultsByDay: [
              { $unwind: "$reportData" },
              {
                $match: { status: "done" },
              },
              {
                $group: {
                  _id: {
                    dia: { $dayOfMonth: "$assignmentDate" },
                    month: { $month: "$assignmentDate" },
                    year: { $year: "$assignmentDate" },
                    manager: "$manager",
                  },

                  resolvedCount: { $sum: 1 },
                  totalPendingDebt: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            { $eq: ["$status", "done"] },
                            {
                              $eq: [
                                "$reportData.resultadoDeGestion",
                                "efectiva",
                              ],
                            },
                          ],
                        },
                        "$deuda_pendiente",
                        0,
                      ],
                    },
                  },
                  totalIncome: {
                    $sum: { $toDouble: "$reportData.valorRecibo" },
                  },
                },
              },
            ],
            totalIncome: [
              { $unwind: "$reportData" },
              {
                $match: { status: "done" },
              },

              {
                $group: {
                  _id: "$recordData.NUMERO_DE_LA_ORDEN",
                  manager: { $first: "$manager" },
                  deuda_pendiente: { $first: "$deuda_pendiente" },
                  efectiveIncome: {
                    $sum: { $toDouble: "$reportData.valorRecibo" },
                  },
                  carteraEfectiva: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            { $eq: ["$status", "done"] },
                            {
                              $eq: [
                                "$reportData.resultadoDeGestion",
                                "efectiva",
                              ],
                            },
                          ],
                        },
                        "$deuda_pendiente",
                        0,
                      ],
                    },
                  },
                },
              },
              {
                $group: {
                  _id: { manager: "$manager" },
                  totalPendingDebt: {
                    $sum: "$deuda_pendiente",
                  },
                  efectiveIncome: { $sum: "$efectiveIncome" },
                  carteraEfectiva: { $sum: "$carteraEfectiva" },
                },
              },
              // {
              //   $group: {
              //     _id: { manager: "$manager" },
              //     totalPendingDebt: {
              //       $sum: {
              //         $cond: [
              //           {
              //             $and: [
              //               { $eq: ["$status", "done"] },
              //               {
              //                 $eq: [
              //                   "$reportData.resultadoDeGestion",
              //                   "efectiva",
              //                 ],
              //               },
              //             ],
              //           },
              //           "$deuda_pendiente",
              //           0,
              //         ],
              //       },
              //     },
              //   },
              // },
            ],
            assignments: [
              {
                $group: {
                  _id: { manager: "$manager" },
                  total: { $sum: 1 },
                  completedAssignments: {
                    $sum: {
                      $cond: [
                        {
                          $or: [
                            {
                              $eq: [
                                { $arrayElemAt: ["$reportData.status", 0] },
                                "done",
                              ],
                            },
                            {
                              $eq: [
                                { $arrayElemAt: ["$reportData.gestion", 0] },
                                "15",
                              ],
                            },
                            {
                              $eq: [
                                { $arrayElemAt: ["$reportData.gestion", 0] },
                                "20",
                              ],
                            },
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                  fullfitAssignments: {
                    $sum: {
                      $cond: [
                        {
                          $or: [
                            {
                              $and: [
                                {
                                  $eq: [
                                    { $arrayElemAt: ["$reportData.status", 0] },
                                    "done",
                                  ],
                                },
                                {
                                  $eq: [
                                    {
                                      $arrayElemAt: [
                                        "$reportData.resultadoDeGestion",
                                        0,
                                      ],
                                    },
                                    "efectiva",
                                  ],
                                },
                              ],
                            },
                            {
                              $or: [
                                {
                                  $eq: [
                                    {
                                      $arrayElemAt: ["$reportData.gestion", 0],
                                    },
                                    "15",
                                  ],
                                },
                                {
                                  $eq: [
                                    {
                                      $arrayElemAt: ["$reportData.gestion", 0],
                                    },
                                    "20",
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                  totalIncome: {
                    $sum: {
                      $toDouble: {
                        $arrayElemAt: ["$reportData.valorRecibo", 0],
                      },
                    },
                  },
                  reAssignments: {
                    $sum: {
                      $cond: [
                        {
                          $eq: [
                            { $arrayElemAt: ["$reportData.status", 0] },
                            "reassigned",
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                  promises: {
                    $sum: {
                      $cond: [
                        {
                          $eq: [
                            { $arrayElemAt: ["$reportData.gestion", 0] },
                            "compromisoPago",
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                  assignedDebt: {
                    $sum: {
                      $cond: [
                        { $and: [{ $ne: ["$status", "reassigned"] }] },
                        "$deuda_pendiente",
                        0,
                      ],
                    },
                  },
                },
              },
            ],
          },
        },
      ])
      .toArray();

    const organizedData = reorganizeData({
      assignments: result[0].assignments,
      resultsByDay: result[0].resultsByDay,
      totalIncome: result[0].totalIncome,
    });
    return organizedData;
  },
  "assignment.localities": async function (timeFrame, project) {
    return await assignmentsCollection
      .rawCollection()
      .aggregate([
        {
          $lookup: {
            from: "records",
            localField: "recordId",
            foreignField: "_id",
            as: "recordData",
          },
        },
        { $unwind: "$recordData" },
        {
          $match: {
            "recordData.timeFrame": timeFrame.id,
            "recordData.project": project,
            manager: { $ne: null },
          },
        },
        {
          $lookup: {
            from: "reports",
            localField: "_id",
            foreignField: "_id",
            as: "reportData",
          },
        },
        {
          $addFields: {
            deuda_pendiente: { $toDouble: "$recordData.DEUDA_TOTAL_ASIGNADA" },
            status: { $arrayElemAt: ["$reportData.status", 0] },
          },
        },
        {
          $facet: {
            carteraGestionada: [
              { $unwind: "$reportData" },
              {
                $match: {
                  status: "done",
                },
              },
              {
                $group: {
                  _id: "$recordData.NUMERO_DE_LA_ORDEN",
                  localidad: { $first: "$recordData.locality" },
                  deuda_pendiente: { $first: "$deuda_pendiente" },
                },
              },
              {
                $group: {
                  _id: { localidad: "$localidad" },
                  cartera: {
                    $sum: "$deuda_pendiente",
                  },
                },
              },
              // {
              //   $group: {
              //     _id: { localidad: "$recordData.locality" },
              //     cartera: {
              //       $sum: {
              //         $cond: [
              //           {
              //             $and: [
              //               { $eq: ["$status", "done"] },
              //               {
              //                 $eq: [
              //                   "$reportData.resultadoDeGestion",
              //                   "efectiva",
              //                 ],
              //               },
              //             ],
              //           },
              //           "$deuda_pendiente",
              //           0,
              //         ],
              //       },
              //     },
              //   },
              // },
            ],
            carteraAsignada: [
              {
                $group: {
                  _id: { localidad: "$recordData.locality" },
                  cartera: {
                    $sum: {
                      $cond: [
                        {
                          $ne: ["$status", "reassigned"],
                        },
                        "$deuda_pendiente",
                        0,
                      ],
                    },
                  },
                },
              },
            ],
          },
        },
      ])
      .toArray();
  },
  "assignment.usersCount": async function (timeFrame, project) {
    return await assignmentsCollection
      .rawCollection()
      .aggregate([
        {
          $lookup: {
            from: "records",
            localField: "recordId",
            foreignField: "_id",
            as: "recordData",
          },
        },
        { $unwind: "$recordData" },

        {
          $lookup: {
            from: "reports",
            localField: "_id",
            foreignField: "_id",
            as: "reportData",
          },
        },
        {
          $match: {
            "recordData.timeFrame": timeFrame.id,
            "recordData.project": project,
            manager: { $ne: null },
            $expr: {
              $ne: [{ $arrayElemAt: ["$reportData", 0] }, "reassigned"],
            },
          },
        },
        {
          $group: {
            _id: { localidad: "$recordData.locality" },
            uniqueClients: {
              $addToSet: "$recordData.NOMBRE_CLIENTE",
            },
            gestionados: {
              $addToSet: {
                $cond: [
                  {
                    $eq: [{ $arrayElemAt: ["$reportData.status", 0] }, "done"],
                  },
                  "$recordData.NOMBRE_CLIENTE",
                  null,
                ],
              },
            },
          },
        },
        {
          $project: {
            localidad: "$_id.localidad",
            uniqueClients: { $size: "$uniqueClients" }, // Cuenta de valores únicos
            gestionadosEfectivos: {
              $size: {
                $filter: {
                  input: "$gestionados",
                  as: "client",
                  cond: { $ne: ["$$client", null] }, // Elimina valores nulos
                },
              },
            },
          },
        },
      ])
      .toArray();
  },
  "assignment.reassignmentsCount": async function (timeFrame, project) {
    const result = await assignmentsCollection
      .rawCollection()
      .aggregate([
        {
          $lookup: {
            from: "records",
            localField: "recordId",
            foreignField: "_id",
            as: "recordData",
          },
        },
        { $unwind: "$recordData" },
        {
          $match: {
            "recordData.timeFrame": timeFrame,
            "recordData.project": project,
          },
        },
        {
          $group: {
            _id: { manager: "$manager", recordId: "$recordId" },
            count: { $sum: 1 }, // Cuenta cuántas veces se asigna el mismo recordId al mismo manager
          },
        },
        {
          $group: {
            _id: "$_id.manager",
            reAssignmentsCount: {
              $sum: {
                $cond: [
                  { $gt: ["$count", 1] },
                  { $subtract: ["$count", 1] },
                  0,
                ],
              },
            },
          },
        },
        {
          $project: {
            manager: "$_id",
            reAssignmentsCount: 1,
            _id: 0,
          },
        },
      ])
      .toArray();

    return result;
  },

  "assignment.gestiones": async function (filters) {
    return await assignmentsCollection
      .rawCollection()
      .aggregate([
        {
          $lookup: {
            from: "records",
            localField: "recordId",
            foreignField: "_id",
            as: "recordData",
          },
        },
        { $unwind: "$recordData" },
        {
          $match: getFilters(filters),
        },
        {
          $lookup: {
            from: "reports",
            localField: "_id",
            foreignField: "_id",
            as: "reportData",
          },
        },
        { $unwind: "$reportData" },
        {
          $match: { "reportData.status": { $ne: "reassigned" } },
        },
        {
          $group: {
            _id: "$reportData.gestion",
            totalAssignments: { $sum: 1 },
            totalPendingDebt: {
              $sum: {
                $toDouble: "$recordData.DEUDA_TOTAL_ASIGNADA",
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            totalAssignmentsGlobal: { $sum: "$totalAssignments" }, // Total de asignaciones
            totalPendingDebtGlobal: { $sum: "$totalPendingDebt" }, // Total de deuda pendiente
            data: { $push: "$$ROOT" },
          },
        },
        { $unwind: "$data" },
        {
          $project: {
            _id: "$data._id",
            totalAssignments: "$data.totalAssignments",
            totalPendingDebt: "$data.totalPendingDebt",
            assignmentPercentage: {
              $multiply: [
                {
                  $divide: [
                    "$data.totalAssignments",
                    "$totalAssignmentsGlobal",
                  ],
                },
                100,
              ],
            },
            debtPercentage: {
              $cond: {
                if: { $eq: ["$totalPendingDebtGlobal", 0] },
                then: 0,
                else: {
                  $multiply: [
                    {
                      $divide: [
                        "$data.totalPendingDebt",
                        "$totalPendingDebtGlobal",
                      ],
                    },
                    100,
                  ],
                },
              },
            },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ])
      .toArray();
  },
  "assignments.reportAll": async function (filters, page, pageSize) {
    const outputFieldsStr = await Assets.getTextAsync("assignmentOutput.json");
    const outputFields = JSON.parse(outputFieldsStr);
    const recordFields = outputFields.fields || [];
    const recordProject = {};
    recordFields.forEach((field) => (recordProject[field] = 1));

    return await assignmentsCollection
      .rawCollection()
      .aggregate([
        {
          $lookup: {
            from: "records",
            localField: "recordId",
            foreignField: "_id",
            as: "recordData",
            pipeline: [{ $project: recordProject }],
          },
        },
        { $unwind: "$recordData" },
        {
          $match: getFilters(filters),
        },
        {
          $addFields: {
            "recordData.CONTRATO_NUMERIC": {
              $cond: {
                if: { $gt: [{ $type: "$recordData.CONTRATO" }, "missing"] },
                then: { $toInt: "$recordData.CONTRATO" },
                else: null,
              },
            },
          },
        },
        {
          $sort: { "recordData.CONTRATO_NUMERIC": 1 },
        },
        {
          $lookup: {
            from: "reports",
            localField: "_id",
            foreignField: "_id",
            as: "reportData",
          },
        },
        {
          $addFields: {
            report: { $arrayElemAt: ["$reportData", 0] },
          },
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
  },
  "assignments.managers": async function (filters) {
    return await assignmentsCollection
      .rawCollection()
      .aggregate([
        {
          $lookup: {
            from: "reports",
            localField: "_id",
            foreignField: "_id",
            as: "reportData",
          },
        },
        {
          $lookup: {
            from: "records",
            localField: "recordId",
            foreignField: "_id",
            as: "recordData",
            // pipeline: [{ $project: recordProject }],
          },
        },
        { $unwind: "$recordData" },
        {
          $lookup: {
            from: "timeFrame",
            localField: "recordData.timeFrame",
            foreignField: "_id",
            as: "timeFrame",
            // pipeline: [{ $project: recordProject }],
          },
        },
        { $unwind: "$timeFrame" },
        {
          $match: getFilters(filters),
        },
        {
          $match: {
            "reportData.status": { $not: { $regex: "closed", $options: "i" } },
          },
        },
      ])
      .toArray();
  },

  "assignments.closeTimeFrame": async function (filters) {
    const assignments = await assignmentsCollection
      .rawCollection()
      .aggregate([
        {
          $lookup: {
            from: "reports",
            localField: "_id",
            foreignField: "_id",
            as: "reportData",
          },
        },
        {
          $lookup: {
            from: "records",
            localField: "recordId",
            foreignField: "_id",
            as: "recordData",
          },
        },
        { $unwind: "$recordData" },
        {
          $match: getFilters(filters),
        },
        {
          $project: {
            _id: "$_id",
            recordId: "$recordId",
          },
        },
      ])
      .toArray();

    assignments.forEach(async (ass) => {
      const thisAssignmentReport = await reportsCollection.findOneAsync({
        _id: ass._id,
      });

      if (thisAssignmentReport?.status === "done") {
        await reportsCollection.updateAsync(
          { _id: ass._id },
          {
            $set: { status: "closed" },
          },
          { upsert: false }
        );
      } else {
        // const newAssignment = await assignmentsCollection.insertAsync({
        //   date: Date.now(),
        //   recordId: ass.recordId,
        // });
        await reportsCollection.updateAsync(
          {
            _id: ass._id,
          },
          { $set: { status: "reassigned" } },
          {upsert:true}
        );
      }
    });

    Meteor.users.updateAsync(
      {},
      { $set: { "profile.assignments": Math.random() } },
      { multi: true }
    );
  },
});

function reorganizeData(data) {
  const managerMap = {};

  data.assignments.forEach((assignment) => {
    const manager = assignment._id.manager || "Unknown";
    if (!managerMap[manager]) {
      managerMap[manager] = {
        manager: manager,
        completedAssignments: 0,
        totalAssignments: 0,
        totalPendingDebt: 0,
        efectiveIncome: 0,
        carteraEfectiva: 0,
        pendingAssignments: 0,
        resultsByDay: [],
        assignedDebt: 0,
        reAssignments: 0,
        fullfit: 0,
        totalIncome: 0,
        promises: 0,
      };
    }
    managerMap[manager].completedAssignments = assignment.completedAssignments;
    managerMap[manager].totalAssignments =
      assignment.total - assignment.reAssignments;
    managerMap[manager].reAssignments = assignment.reAssignments;
    managerMap[manager].totalAssignedDebt = assignment.assignedDebt;

    managerMap[manager].pendingAssignments =
      assignment.total -
      assignment.completedAssignments -
      assignment.reAssignments;
    managerMap[manager].fullfit = assignment.fullfitAssignments;
    managerMap[manager].totalIncome = assignment.totalIncome;
    managerMap[manager].promises = assignment.promises;
  });

  data.totalIncome.forEach((income) => {
    const manager = income._id.manager || "Unknown";
    if (!managerMap[manager]) {
      managerMap[manager] = {
        manager: manager,
        completedAssignments: 0,
        totalAssignments: 0,
        totalPendingDebt: 0,
        efectiveIncome: 0,
        carteraEfectiva: 0,
        pendingAssignments: 0,
        resultsByDay: [],
      };
    }
    managerMap[manager].totalPendingDebt = income.totalPendingDebt;
    managerMap[manager].efectiveIncome = income.efectiveIncome;
    managerMap[manager].carteraEfectiva = income.carteraEfectiva;
  });

  data.resultsByDay.forEach((result) => {
    const manager = result._id.manager || "Unknown";
    if (!managerMap[manager]) {
      managerMap[manager] = {
        manager: manager,
        completedAssignments: 0,
        totalAssignments: 0,
        totalPendingDebt: 0,
        pendingAssignments: 0,
        resultsByDay: [],
      };
    }
    managerMap[manager].resultsByDay.push({
      date: `${result._id.dia}/${result._id.month}/${result._id.year}`,
      resolvedCount: result.resolvedCount,
      totalPendingDebt: result.totalPendingDebt,
      totalIncome: result.totalIncome,
    });
    managerMap[manager].resultsByDay.sort((a, b) => {
      const dateA = new Date(a.date.split("/").reverse().join("-"));
      const dateB = new Date(b.date.split("/").reverse().join("-"));
      return dateA - dateB;
    });
  });

  return Object.values(managerMap);
}
