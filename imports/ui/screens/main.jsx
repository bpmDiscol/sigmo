import React, { useContext } from "react";
import { Layout } from "antd";
import MyHeader from "../components/MyHeader";

import "./styles.css";
import MySider from "../components/MySider";
import { Route, Routes } from "react-router-dom";
import TimeLine from "./timeLine";
import Dashboard from "./dashboard";
import TimeFrame from "./timeFrame";
import Assignments from "./assignments";
import AdminUsers from "./adminUsers";
import Reports from "./reports";
import ProjectsConfiguration from "./projectsConfiguration";
import { GlobalContext } from "../context/globalsContext";
import TeamAdmin from "./teamAdmin";
import Detour from "../components/detour";

const { Header, Content, Sider } = Layout;

export default function Main() {
  const { globals } = useContext(GlobalContext);
  return (
    <Layout className="main">
      <Header className="header">
        <MyHeader />
      </Header>
      <Layout>
        <Sider width={250} className="sider">
          <MySider />
        </Sider>
        <Content className="content">
          <Routes>
            <Route path="/timeline" element={<TimeLine />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects" element={<ProjectsConfiguration />} />
            <Route path="/assignments" element={<Assignments />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/team" element={<TeamAdmin />} />
            <Route path="/users" element={<AdminUsers />} />
            <Route path="/detour" element={<Detour />} />
            <Route path="*" element={<Detour isAuthorized />} />
            <Route
              path="/timeframe"
              element={<TimeFrame project={globals?.project?._id} />}
            />
            <Route
              path="*"
              element={<TimeFrame project={globals?.project?._id} />}
            />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}
