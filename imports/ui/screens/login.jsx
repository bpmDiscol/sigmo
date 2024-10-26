import React, { useContext } from "react";
import { Button, Flex, Form, Input, Typography } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { NotificationContext } from "../context/notificationContext";

export default function Login() {
  const { Title, Text } = Typography;
  const { setAlertMessage } = useContext(NotificationContext);

  const onFinish = ({ username, password }) => {
    Meteor.loginWithPassword(username, password , (resp) => {
      if (resp?.error)
        setAlertMessage({
          type: "error",
          message: "Ha ocurrido un error",
          description: resp.reason,
          placement: "top",
        });
    });
  };

  return (
    <Flex
      align="center"
      justify="center"
      style={{ width: "100%", height: "95dvh", overflow: "hidden" }}
    >
      <Flex vertical align="center" gap={32}>
        <Flex vertical align="center">
          <Flex justify="center" gap={10}>
            <img
              src="/logo-image.png"
              style={{ objectFit: "contain", objectPosition: "center 60%" }}
            />
            <Title level={2}>Discol</Title>
          </Flex>
          <Text>Movilidad</Text>
        </Flex>
        <Form onFinish={onFinish} requiredMark={false} autoComplete="off">
          <Form.Item
            name={"username"}
            rules={[
              {
                required: true,
                message: "Introduce tu usuario",
              },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="Ingrese su usuario" />
          </Form.Item>
          <Form.Item
            name={"password"}
            rules={[
              {
                required: true,
                message: "Introduce tu contraseña",
              },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Ingrese su contraseña"
            />
          </Form.Item>
          <Form.Item>
            <Button block type="primary" htmlType="submit">
              Entrar
            </Button>
          </Form.Item>
        </Form>
      </Flex>
    </Flex>
  );
}
