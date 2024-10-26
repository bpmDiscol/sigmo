import { Button, Flex, Input, message } from "antd";
import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GlobalContext } from "../../context/globalsContext";

export default function CreateProject({ onCancel }) {
  const [name, setName] = useState();
  const { forceUpdate } = useContext(GlobalContext);

  const navigate = useNavigate();
  function create() {
    const user = Meteor.user();
    const newProject = {
      name,
      members: [
        {
          member: user.username,
          position: user.profile.role,
          id: user._id,
        },
      ],
    };
    Meteor.call("project.create", newProject, (err, data) => {
      if (err) message.error("Error al crear el proyecto");
      if (data) {
        message.success("Proyecto creado con éxito");
        forceUpdate();
      }
    });
    navigate("/projects");
    onCancel();
  }
  return (
    <Flex vertical gap={16}>
      <Input
        value={name}
        onChange={(e) => setName(e.currentTarget.value)}
        allowClear
        autoCapitalize="on"
        onKeyDown={(e) => {
          if (e.key === "Enter") create();
        }}
      />
      <Flex justify="end" gap={16}>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button onClick={create} type="primary">
          Crear
        </Button>
      </Flex>
    </Flex>
  );
}
