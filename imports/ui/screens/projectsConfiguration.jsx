import React, { useContext, useEffect } from "react";
import { GlobalContext } from "../context/globalsContext";
import { List } from "antd";
import ProjectCard from "../components/projectCard";
import { useNavigate } from "react-router-dom";
import isAccesible from "../../api/utils/isAccesible";

export default function ProjectsConfiguration() {
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
    if (globals?.membership) getTeamAccess();
  }, [globals?.membership, globals?.userRole]);

  return (
    <List
      itemLayout="horizontal"
      dataSource={globals?.allProjects || []}
      renderItem={(project) => <ProjectCard project={project} />}
    />
  );
}
