import { Meteor } from "meteor/meteor";
import { assignmentsCollection } from "./assignmensCollection";
import { reportsCollection } from "../reports/reportsCollection";
import { recordsCollection } from "../records/recordsCollection";
import moment from "moment";

Meteor.methods({
  "assignment.create": async function (data) {
    Meteor.users
      .updateAsync(
        {},
        { $pull: { "profile.assignments": data.recordId } },
        { multi: true }
      )
      .then(
        Meteor.users.updateAsync(
          { username: data.manager },
          { $push: { "profile.assignments": data.recordId } }
        )
      );
    const thisAssignment = await assignmentsCollection.findOneAsync(
      { recordId: data.recordId },
      {
        sort: { date: -1 },
      }
    );

    if (thisAssignment)
      reportsCollection.update(
        { _id: thisAssignment._id }, // Filtro por _id
        {
          $setOnInsert: {
            _id: thisAssignment._id,
            status: "reassigned",
          },
        },
        { upsert: true }
      );

    return assignmentsCollection.insertAsync(data);
  },
  "assignment.createByOrderId": async function (
    NUMERO_DE_LA_ORDEN,
    timeFrame,
    manager,
    date
  ) {
    const record = await recordsCollection.findOneAsync({
      NUMERO_DE_LA_ORDEN,
      timeFrame,
    });
    if (record)
      Meteor.callAsync("assignment.create", {
        recordId: record._id,
        manager,
        date,
      });
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
          // Filtra por el manager asignado específico
          filter[key] = { $eq: value }; // Asegúrate de que 'manager' sea el valor pasado
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
        // { $unwind: "$reportData" },
        {
          $lookup: {
            from: "records",
            localField: "recordId",
            foreignField: "_id",
            as: "recordData",
          },
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
        // {
        //   // Filtro adicional: Asegura que el registro más reciente pertenezca al manager específico
        //   $match: { "mostRecentRecord.manager": { $in: filters.manager } },
        // },
        {
          $replaceRoot: { newRoot: "$mostRecentRecord" }, // Desanida el documento seleccionado
        },
        {
          $sort: { [sortField]: sortOrder }, // Ordena según el campo de sort recibido
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
  "assignment.managersResults": async function (timeFrame, project) {
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
          $lookup: {
            from: "reports",
            localField: "_id",
            foreignField: "_id",
            as: "reportData",
          },
        },
        {
          // Convertir la fecha de asignación de milisegundos a una fecha legible
          $addFields: {
            assignmentDate: { $toDate: "$date" },
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
                  totalPendingDebt: { $sum: "$deuda_pendiente" },
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
                  _id: { manager: "$manager" },
                  totalPendingDebt: { $sum: "$deuda_pendiente" },
                },
              },
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
                          $eq: [
                            { $arrayElemAt: ["$reportData.status", 0] },
                            "done",
                          ],
                        },
                        1,
                        0,
                      ],
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
                  assignedDebt: {
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
                $group: {
                  _id: { localidad: "$recordData.locality" },
                  cartera: {
                    $sum: {
                      $cond: [
                        {
                          $eq: ["$status", "done"],
                        },
                        "$deuda_pendiente",
                        0,
                      ],
                    },
                  },
                },
              },
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
  "assignment.gestiones": async function (timeFrame, project) {
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
            "recordData.timeFrame": timeFrame,
            "recordData.project": project,
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
            data: { $push: "$$ROOT" }, // Guardar el detalle para cada tipo de gestión
          },
        },
        { $unwind: "$data" },
        {
          $project: {
            _id: "$data._id", // Tipo de gestión
            totalAssignments: "$data.totalAssignments",
            totalPendingDebt: "$data.totalPendingDebt",
            assignmentPercentage: {
              $multiply: [
                // Porcentaje de asignaciones
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
              $multiply: [
                // Porcentaje de deuda pendiente
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
        {
          $sort: { _id: 1 }, // Ordenar por tipo de gestión
        },
      ])
      .toArray();
  },
});

function reorganizeData(data) {
  const managerMap = {};

  // Recorrer assignments para agregar los totales por manager
  data.assignments.forEach((assignment) => {
    const manager = assignment._id.manager || "Unknown"; // Usa "Unknown" si no hay manager
    if (!managerMap[manager]) {
      managerMap[manager] = {
        manager: manager,
        completedAssignments: 0,
        totalAssignments: 0,
        totalPendingDebt: 0,
        pendingAssignments: 0,
        resultsByDay: [],
        assignedDebt: 0,
        reAssignments: 0,
      };
    }
    managerMap[manager].completedAssignments = assignment.completedAssignments;
    managerMap[manager].totalAssignments =
      assignment.total - assignment.reAssignments;
    managerMap[manager].reAssignments = assignment.reAssignments;
    managerMap[manager].totalAssignedDebt = assignment.assignedDebt;

    // Calcular asignaciones pendientes (totalAssignments - completedAssignments)
    managerMap[manager].pendingAssignments =
      assignment.total -
      assignment.completedAssignments -
      assignment.reAssignments;
  });

  // Recorrer totalIncome para agregar la deuda pendiente total por manager
  data.totalIncome.forEach((income) => {
    const manager = income._id.manager || "Unknown";
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
    managerMap[manager].totalPendingDebt = income.totalPendingDebt;
  });

  // Recorrer resultsByDay para agregar los resultados por día por manager
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
    });
  });

  // Convertir el mapa en un array
  return Object.values(managerMap);
}
