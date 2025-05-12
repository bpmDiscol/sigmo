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
          onClick={({ key }) => {
            if (String(key).includes("http")) {
              window.location.href = key;
            } else {
              navigate(`/${key}`);
            }
          }}
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
                  disabled: true,
                },
                {
                  label: "Periodos",
                  key: "http://149.50.136.27:3000/actions",
                  icon: <GroupOutlined />,
                },
                {
                  label: "Gestiones",
                  key: "timeframe",
                  icon: (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="1em"
                      height="1em"
                      viewBox="0 0 16 16"
                      {...props}
                    >
                      <path
                        fill="currentColor"
                        fillRule="evenodd"
                        d="M5.28 2.22a.75.75 0 0 1 0 1.06l-2 2a.75.75 0 0 1-1.06 0l-1-1a.75.75 0 0 1 1.06-1.06l.47.47l1.47-1.47a.75.75 0 0 1 1.06 0M6.5 3.75c0 .414.336.75.75.75h7a.75.75 0 0 0 0-1.5h-7a.75.75 0 0 0-.75.75m.75 3.5a.75.75 0 0 0 0 1.5h7a.75.75 0 0 0 0-1.5zm-1.97.03a.75.75 0 0 0-1.06-1.06L2.75 7.69l-.47-.47a.75.75 0 0 0-1.06 1.06l1 1a.75.75 0 0 0 1.06 0zm0 3.19a.75.75 0 0 1 0 1.06l-2 2a.75.75 0 0 1-1.06 0l-1-1a.75.75 0 1 1 1.06-1.06l.47.47l1.47-1.47a.75.75 0 0 1 1.06 0m1.97 1.03a.75.75 0 0 0 0 1.5h7a.75.75 0 0 0 0-1.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ),
                },
                {
                  label: "Linea de tiempo",
                  key: "timeline",
                  icon: <FieldTimeOutlined />,
                  disabled: true,
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
