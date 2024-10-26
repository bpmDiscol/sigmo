import React, { useContext, useEffect, useState } from "react";
import { DownOutlined, PlusOutlined, UserOutlined } from "@ant-design/icons";
import { Avatar, Button, Dropdown, Flex, Modal, Typography } from "antd";
import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import CreateProject from "../createProject";
import { GlobalContext } from "../../context/globalsContext";
import { useNavigate } from "react-router-dom";
import isAccesible from "../../../api/utils/isAccesible";

export default function MyHeader() {
  const { globals, setGlobals } = useContext(GlobalContext);
  const navigate = useNavigate();
  const [modalOptions, setModalOptions] = useState({});

  const [accessTeam, setAccessTeam] = useState(true);
  const [addProject, setAddProject] = useState(true);

  useEffect(() => {
    async function getTeamAccess() {
      const access = await isAccesible(
        "adminTeam",
        globals?.membership,
        globals?.userRole
      );
      setAccessTeam(!access);
    }
    async function getAddProjectAccess() {
      const access = await isAccesible(
        "createProject",
        globals?.membership,
        globals?.userRole
      );
      setAddProject(!access);
    }
    getTeamAccess();
    getAddProjectAccess()
  }, [globals?.membership, globals?.userRole]);



  const myProjects = useTracker(() => {
    const user = Meteor.user({});

    if (!globals.allProjects) return [];

    const myProjects_ = globals?.allProjects?.map((project) => ({
      label: project.name,
      value: project._id,
      style:
        project._id == globals?.project?._id
          ? { backgroundColor: "gray", color: "white" }
          : {},
      onClick: () => setGlobals((prev) => ({ ...prev, project })),
    }));

    const addButton = {
      label: "Agregar Proyecto",
      disabled: addProject,
      onClick: () =>
        handleModal(
          <CreateProject onCancel={() => setModalOptions({})} />,
          true,
          "Dale un nombre al proyecto"
        ),
      icon: <Avatar size="small" icon={<PlusOutlined />} />,
    };
    return [...myProjects_, { type: "divider" }, addButton];
  });

  useEffect(() => {
    if (myProjects.length > 2) {
      const myFirstOption = globals?.allProjects.find(
        (generalProject) => generalProject._id == myProjects[0].value
      );
      setGlobals((prev) => ({ ...prev, project: myFirstOption }));
    }
  }, [myProjects.length]);

  function handleModal(Element, openState, title) {
    setModalOptions({ Element, openState, title });
  }

  function myTeam() {
    if (!globals?.members) return [];
    return globals.members.map((member) => ({
      key: member.id,
      label: member.member,
      icon: <Avatar size="small" icon={<UserOutlined />} />,
    }));
  }

  const projects = [
    {
      type: "group",
      label: "Tus proyectos",
      children: myProjects,
    },
  ];

  const persons = [
    {
      type: "group",
      label: "Tus colaboradores",
      children: myTeam(),
    },
    { type: "divider" },
    {
      label: "Administrar tu equipo",
      key: "add",
      disabled: accessTeam,
      icon: <Avatar size="small" icon={<PlusOutlined />} />,
      onClick: () => navigate("/team"),
    },
  ];

  const personal = [
    {
      type: "group",
      label: "Mi menú",
      children: [
        {
          label: (
            <Flex vertical style={{ width: "15rem" }}>
              <Typography.Text>{Meteor.user().username}</Typography.Text>
              <Typography.Text code>{globals?.membership}</Typography.Text>
            </Flex>
          ),
          key: "0001",
          icon: <Avatar size="large" icon={<UserOutlined />} />,
        },
        {
          label: "Mis datos",
          key: "0002",
        },
      ],
    },
    { type: "divider" },
    {
      label: (
        <Button type="link" onClick={() => Meteor.logout()}>
          Cerrar sesión
        </Button>
      ),
      key: "0003",
    },
  ];

  return (
    <Flex justify="space-between" align="center" style={{ height: "100%" }}>
      <Flex justify="center" align="center" gap={32}>
        <img src="/logo-sigmo.png" style={{ height: "48px" }} />
        <Flex align="center" gap={16}>
          <Dropdown menu={{ items: projects }} trigger={["click"]}>
            <Button type="link">
              Proyecto <DownOutlined />
            </Button>
          </Dropdown>
          <Dropdown menu={{ items: persons }} trigger={["click"]}>
            <Button type="link">
              Equipo <DownOutlined />
            </Button>
          </Dropdown>
        </Flex>
      </Flex>
      <Flex align="center" gap={8}>
        <Dropdown menu={{ items: personal }} trigger={["click"]}>
          <Avatar size="default" icon={<UserOutlined />} />
        </Dropdown>
      </Flex>
      <Modal
        title={modalOptions.title}
        open={modalOptions.openState}
        onCancel={() => setModalOptions({})}
        footer={[]}
      >
        {modalOptions.Element}
      </Modal>
    </Flex>
  );
}
