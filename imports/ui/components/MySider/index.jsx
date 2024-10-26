import {
  AppstoreAddOutlined,
  DashboardOutlined,
  FieldTimeOutlined,
  GroupOutlined,
  SlidersOutlined,
  TableOutlined,
  UsergroupAddOutlined,
} from "@ant-design/icons";
import { Flex, Menu, Typography } from "antd";
import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GlobalContext } from "../../context/globalsContext";

export default function MySider() {
  const navigate = useNavigate();
  const { globals } = useContext(GlobalContext);
  const [currentImage, setCurrentImage] = useState();
  const user = Meteor.user();
  const isManager = user.profile.role === "manager";
  const isLeader = user.profile.role === "leader";
  const isSuperAdmin = user.profile.role === "superadmin";

  async function getLink(image) {
    if (!image) return;
    const link = await Meteor.callAsync("getFileLink", image, "projects");
    setCurrentImage(link);
  }

  useEffect(() => {
    getLink(globals?.project?.image);
  });

  return (
    <Flex vertical>
      <Flex align="center" justify="center" vertical>
        <img
          src={currentImage || "logo-sigmo.png"}
          style={{ width: "150px", margin: "32px 0", objectFit: "cover" }}
        />
        <Typography.Text>Proyecto: {globals?.project?.name}</Typography.Text>
      </Flex>
      <Flex>
        <Menu
          theme="light"
          style={{ background: "transparent" }}
          mode="inline"
          onClick={({ key }) => navigate(`/${key}`)}
          items={[
            {
              key: "1",
              icon: <AppstoreAddOutlined />,
              label: "Planeacion",
              type: "group",

              children: [
                {
                  label: "Dashboard",
                  key: "dashboard",
                  icon: <DashboardOutlined />,
                },
                {
                  label: "Periodos",
                  key: "timeframe",
                  icon: <GroupOutlined />,
                },
                {
                  label: "Linea de tiempo",
                  key: "timeline",
                  icon: <FieldTimeOutlined />,
                },
              ],
            },
          ]}
        />
      </Flex>
      {isLeader && (
        <Flex>
          <Menu
            theme="light"
            style={{ background: "transparent" }}
            mode="inline"
            onClick={({ _, key }) => navigate(`/${key}`)}
            items={[
              {
                key: "1",
                icon: <AppstoreAddOutlined />,
                label: "Administrativo",
                type: "group",

                children: [
                  // {
                  //   label: "TimeFrame",
                  //   key: "timeframe",
                  //   icon: <GroupOutlined />,
                  // },
                  // {
                  //   label: "Timeline",
                  //   key: "timeline",
                  //   icon: <FieldTimeOutlined />,
                  // },
                  // {
                  //   label: "Dashboard",
                  //   key: "dashboard",
                  //   icon: <DashboardOutlined />,
                  // },
                  // {
                  //   label: "List",
                  //   key: "datalist",
                  //   icon: <TableOutlined />,
                  // },
                  // {
                  //   label: "Goals",
                  //   key: "goals",
                  //   icon: <SlidersOutlined />,
                  // },
                ],
              },
            ]}
          />
        </Flex>
      )}
      {isSuperAdmin && (
        <Flex>
          <Menu
            theme="light"
            style={{ background: "transparent" }}
            mode="inline"
            onClick={({ _, key }) => navigate(`/${key}`)}
            items={[
              {
                key: "1",
                icon: <AppstoreAddOutlined />,
                label: "Administrativo",
                type: "group",

                children: [
                  {
                    label: "Usuarios",
                    key: "users",
                    icon: <UsergroupAddOutlined />,
                  },
                ],
              },
            ]}
          />
        </Flex>
      )}
    </Flex>
  );
}
