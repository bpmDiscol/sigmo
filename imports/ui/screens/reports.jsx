import { Typography, Tabs, Flex, Select } from "antd";
import React, { Children, useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Meteor } from "meteor/meteor";
import ServicesReport from "../components/servicesReport";
import LocalityTable from "../components/reportCarteraByLocality";
import { GlobalContext } from "../context/globalsContext";
import ManagerResultsTable from "../components/managerResultTable";
import AssignmentReport from "../components/assignmentReport";
import PhotoReport from "../components/photoReport";
import ReportServiceStatus from "../components/reportServiceStatus";

export default function Reports() {
  const { state } = useLocation();
  const { globals } = useContext(GlobalContext);
  const [data, setData] = useState([]);
  const myLocality = Meteor.user().profile.locality;
  const [localities, setLocalities] = useState([]);
  const [currentLocality, setCurrentLocality] = useState(myLocality);
  const [diccionario, setDiccionario] = useState();

  function translate(name) {
    return diccionario.find((entry) => entry.value == name)?.label;
  }

  async function getDiccionario() {
    const diccionarioStr = await Meteor.callAsync(
      "getTextAssets",
      "diccionario.json"
    );
    const parsedDiccionario = JSON.parse(diccionarioStr);
    setDiccionario(parsedDiccionario);
  }

  useEffect(() => {
    Meteor.call("getTextAssets", "localities.json", (err, file) => {
      if (!err) setLocalities(JSON.parse(file));
    });
    getDiccionario();
  }, []);

  useEffect(() => {
    Meteor.call(
      "assignment.managersResults",
      state.id,
      globals?.project?._id,
      currentLocality,
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
              setData(totals);
            }
          }
        );
      }
    );
  }, [globals, currentLocality]);

  const items = [
    {
      label: "Comportamiento de ingreso",
      key: 1,
      children: <ManagerResultsTable data={data} />,
    },
    {
      label: "Cartera por localidad",
      key: 2,
      children: <LocalityTable id={state?.id} />,
    },
    {
      label: "Cartera por gestión/causales",
      key: 3,
      children: (
        <ServicesReport
          id={state.id}
          locality={currentLocality}
          translate={translate}
        />
      ),
    },
    {
      label: "Gestiones asignadas",
      key: 4,
      children: (
        <AssignmentReport
          id={globals?.project?._id}
          projectName={globals?.project?.name}
          timeFrame={state.id}
          locality={currentLocality}
          translate={translate}
        />
      ),
    },
    {
      label: "Reportes con fotos",
      key: 5,
      children: (
        <PhotoReport
          id={globals?.project?._id}
          projectName={globals?.project?.name}
          timeFrame={state.id}
          locality={currentLocality}
          translate={translate}
        />
      ),
    },
    {
      label: "Estado de servicio",
      key: 6,
      children: (
        <ReportServiceStatus
          id={globals?.project?._id}
          projectName={globals?.project?.name}
          timeFrame={state.id}
          locality={currentLocality}
          translate={translate}
          field={"estado"}
        />
      ),
    },
    {
      label: "Reportes Efectividad",
      key: 7,
      children: (
        <ReportServiceStatus
          id={globals?.project?._id}
          projectName={globals?.project?.name}
          timeFrame={state.id}
          locality={currentLocality}
          translate={translate}
          field={"resultadoDeGestion"}
        />
      ),
    },
    {
      label: "Reportes con télefonos",
      key: 8,
      children: (
        <ReportServiceStatus
          id={globals?.project?._id}
          projectName={globals?.project?.name}
          timeFrame={state.id}
          locality={currentLocality}
          translate={translate}
          field={"telefonoContacto"}
          all
        />
      ),
    },
  ];

  return (
    <>
      <Flex align="center" justify="space-between">
        <Typography.Title>Reportes</Typography.Title>
        <Select
          placeholder="Selecciona una localidad"
          defaultValue={myLocality}
          onChange={setCurrentLocality}
        >
          {localities.map((locality) => (
            <Select.Option key={locality} value={locality}>
              {locality.toUpperCase()}
            </Select.Option>
          ))}
        </Select>
      </Flex>
      <Tabs defaultActiveKey="1" items={items} />
    </>
  );
}
