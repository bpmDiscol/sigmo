import { Typography, Tabs } from "antd";
import React, { useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Meteor } from "meteor/meteor";
import ServicesReport from "../components/servicesReport";
import LocalityTable from "../components/reportCarteraByLocality";
import { GlobalContext } from "../context/globalsContext";
import ManagerResultsTable from "../components/managerResultTable";
import AssignmentReport from "../components/assignmentReport";

export default function Reports() {
  const { state } = useLocation();
  const { globals } = useContext(GlobalContext);
  const [data, setData] = useState([]);
  useEffect(() => {
    Meteor.call(
      "assignment.managersResults",
      state.id,
      globals?.project?._id,
      (err, resp) => {
        const filteredData = resp.filter((item) => item.manager !== "Unknown");
        // setData(filteredData);
        Meteor.call(
          "assignment.reassignmentsCount",
          state.id,
          globals?.project?._id,
          (err, resp) => {
            if (!err) {
              const totals = filteredData.map((data) => {
                const reassignedCount =
                  resp.find((r) => r.manager === data.manager)
                    .reAssignmentsCount || 0;
                return { ...data, reassignedCount };
              });
              setData(totals)
            }
          }
        );
      }
    );
  }, [globals]);

  return (
    <>
      <Typography.Title>Reportes</Typography.Title>
      <Tabs defaultActiveKey="1">
        <Tabs.TabPane tab="Comportamiento de ingreso" key="1">
          <ManagerResultsTable data={data} />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Cartera por localidad" key="2">
          <LocalityTable id={state.id} />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Cartera por gestión/causales" key="3">
          <ServicesReport id={state.id} />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Gestiones asignadas" key="4">
          <AssignmentReport id={globals?.project?._id} timeFrame={state.id} />
        </Tabs.TabPane>
      </Tabs>
    </>
  );
}
