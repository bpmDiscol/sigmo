import React, { useContext, useEffect, useState } from "react";
import { Random } from "meteor/random";

import { GlobalContext } from "../context/globalsContext";
import {
  AutoComplete,
  Button,
  Flex,
  Modal,
  Select,
  Table,
  Typography,
} from "antd";
import { PlusCircleTwoTone, UserOutlined } from "@ant-design/icons";
import AdminUsers from "./adminUsers";
import { useNavigate } from "react-router-dom";
import isAccesible from "../../api/utils/isAccesible";

export default function TeamAdmin() {
  const navigate = useNavigate();
  const { globals, forceUpdate } = useContext(GlobalContext);
  const [options, setOptions] = useState([]);
  const [currentMembers, setCurrentMembers] = useState([]);
  const [roles, setRoles] = useState([]);

  const [openModal, setopenModal] = useState(false);

  useEffect(() => {
    async function getTeamAccess() {
      const access = await isAccesible(
        "adminTeam",
        globals?.membership,
        globals?.userRole
      );
      if (!access) navigate("/");
    }
    getTeamAccess();
  }, [globals?.membership, globals?.userRole]);

  useEffect(() => {
    if (globals?.members) {
      const members = globals.members;
      // .sort((a, b) => {
      //   if (a.member.toLowerCase() < b.member.toLowerCase()) return -1;
      //   if (a.member.toLowerCase() > b.member.toLowerCase()) return 1;
      //   return 0;
      // });
      setCurrentMembers(members);
    }
  }, [globals?.members]);

  useEffect(() => {
    Meteor.call("getTextAssets", "roles.json", (err, file) => {
      if (err) return;
      setRoles(JSON.parse(file));
    });
  }, []);

  const columns = [
    {
      title: "Miembro",
      dataIndex: "id",
      width: "20rem",
      render: (id) => (
        <AutoComplete
          options={options}
          onSearch={handleSearch}
          style={{ width: "18rem" }}
          onSelect={(member) => updateMembers(id, { member }, true)}
          value={getValue(id, "member")}
          onChange={(member) => updateMembers(id, { member }, true)}
        />
      ),
    },
    {
      title: "Posición",
      dataIndex: "id",
      width: "14rem",
      render: (id) => (
        <Select
          options={roles}
          placeholder="Selecciona un rol"
          style={{ width: "12rem" }}
          onSelect={(position) => updateMembers(id, { position }, true)}
          value={getValue(id, "position")}
        />
      ),
    },
    {
      title: (
        <Button
          type="primary"
          style={{ width: "8rem" }}
          onClick={() => setopenModal(true)}
        >
          Crear
        </Button>
      ),
      dataIndex: "id",
      render: (id) => (
        <Button
          danger
          style={{ width: "8rem" }}
          type="primary"
          onClick={() => deleteMember(id)}
        >
          Eliminar
        </Button>
      ),
    },
  ];

  function updateMembers(id, data, save = false) {
    const newMembers = currentMembers.map((member) => {
      if (member.id == id) return { ...member, ...data };
      return member;
    });
    setCurrentMembers(newMembers);
    if (save) saveMembers(newMembers);
    forceUpdate();
  }

  function getValue(id, label) {
    const member = currentMembers.filter((member) => {
      return member.id == id;
    });
    return member[0][label];
  }

  function handleSearch(value) {
    if (!globals) return;
    const filteredOptions = globals.allMembers.filter((option) =>
      option.value.toLowerCase().includes(value.toLowerCase())
    );
    setOptions(filteredOptions);
  }

  function addMember() {
    const id = Random.id();
    const member = { id, member: "", position: "" };
    const newMembers = [...currentMembers, member];
    setCurrentMembers(newMembers);
  }
  function deleteMember(id) {
    const newMembers = currentMembers.filter((member) => member.id != id);
    setCurrentMembers(newMembers);
    saveMembers(newMembers);
    forceUpdate();
  }

  function saveMembers(members) {
    Meteor.callAsync("project.update", globals?.project?._id, {
      members,
    });
  }

  function onCloseModal() {
    setopenModal(false);
    forceUpdate();
  }
  return (
    <Flex vertical>
      <Flex justify="space-between" align="center">
        <Typography.Title>Mi equipo</Typography.Title>
        <Button onClick={addMember} disabled={!globals?.project}>
          Agregar miembro
        </Button>
      </Flex>
      <Table
        key={roles.length}
        columns={columns}
        dataSource={currentMembers}
        rowKey={(value) => value.id}
        pagination={false}
      />
      <Modal open={openModal} onCancel={() => setopenModal(false)} footer="">
        <AdminUsers
          onClose={onCloseModal}
          saveMembers={saveMembers}
          setCurrentMembers={setCurrentMembers}
          currentMembers={currentMembers}
        />
      </Modal>
    </Flex>
  );
}
