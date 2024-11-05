import React, { useContext, useEffect, useState } from "react";
import { useTracker } from "meteor/react-meteor-data";
import { Flex, Typography } from "antd";
import TimeFrames from "../components/TImeFrames";
import { useNavigate } from "react-router-dom";
import { GlobalContext } from "../context/globalsContext";
import isAccesible from "../../api/utils/isAccesible";

export default function TimeFrame({ project }) {
  const [canCreate, setCanCreate] = useState(false);

  const [reload, setReload] = useState(0);
  const { globals } = useContext(GlobalContext);
  const navigate = useNavigate();

  useEffect(() => {
    async function getTeamAccess() {
      const access = await isAccesible(
        "accessProjects",
        globals?.membership,
        globals?.userRole
      );
      if (!access) navigate("/");
    }
    async function getCreateAccess() {
      const access = await isAccesible(
        "createTimeFrame",
        globals?.membership,
        globals?.userRole
      );
      setCanCreate(access);
    }
    getTeamAccess();
    getCreateAccess();
  }, [globals?.membership, globals?.userRole]);

  const frames = useTracker(() => {
    return Meteor.callAsync(
      "timeFrame.read",
      project,
      1,
      100,
      {},
      { sortField: null, sortOrder: 1 }
    );
  });

  return (
    <Flex vertical>
      <Typography.Title>Periodos</Typography.Title>
      <TimeFrames
        frames={frames}
        project={project}
        key={reload}
        setReload={setReload}
        canCreate={canCreate}
      />
    </Flex>
  );
}
