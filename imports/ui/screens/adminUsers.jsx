import React, { useEffect, useState } from "react";
import { Form, Input, Button, Select, message, Typography, Flex } from "antd";
import { Meteor } from "meteor/meteor";

const { Option } = Select;
const { Title } = Typography;

export default function AdminUsers({ onClose }) {
  const [form] = Form.useForm();
  const [localities, setLocalities] = useState([]);

  useEffect(() => {
    Meteor.call("getTextAssets", "localities.json", (err, file) => {
      if (!err) setLocalities(JSON.parse(file));
    });
  }, []);

  const onFinish = (values) => {
    const { username, password, locality } = values;
    Meteor.call(
      "createUserWithRole",
      username,
      password,
      locality,
      (error) => {
        if (error) {
          message.error("Error creando usuario: " + error.reason);
        } else {
          message.success("Usuario creado con exito");
          form.resetFields();
        }
        onClose();
      }
    );
  };
  return (
    <>
      <Flex
        vertical
        align="center"
        justify="center"
        style={{ width: "100%", flex: 1 }}
      >
        <Title level={2}>Creación de usuarios</Title>
      </Flex>
      <Form
        title="Creacion de usuarios"
        form={form}
        layout="vertical"
        onFinish={onFinish}
        style={{ maxWidth: "400px", margin: "auto" }}
      >
        <Form.Item
          name="username"
          rules={[
            { required: true, message: "Por favor introduce el nombre!" },
          ]}
        >
          <Input placeholder="Asignar nombre de Usuario" />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[
            { required: true, message: "Plor favor asifna una contraseña!" },
          ]}
        >
          <Input placeholder="Asignar contraseña" />
        </Form.Item>
        <Form.Item
          name="locality"
          rules={[
            { required: true, message: "Por favor introduce una localidad!" },
          ]}
        >
          <Select placeholder="Selecciona una localidad">
            {localities.map((locality) => (
              <Option key={locality} value={locality}>
                {locality.toUpperCase()}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item>
          <Button type="primary" block htmlType="submit">
            Crear usuario
          </Button>
        </Form.Item>
      </Form>
    </>
  );
}
