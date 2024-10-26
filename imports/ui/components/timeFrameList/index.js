import React, { useContext, useState } from "react";

import FrameCard from "../timeFrameBox";
import { DatePicker, Flex, Form, Input, Modal, Row } from "antd";
import { GlobalContext } from "../../context/globalsContext";
import { PlusCircleOutlined } from "@ant-design/icons";
import { Meteor } from "meteor/meteor";
import moment from "moment";

export default function TimeFrameList({ timeFrames, setReload, project, canCreate }) {
  const { globals } = useContext(GlobalContext);
  const [openModal, setOpenModal] = useState(false);
  const [form] = Form.useForm();

  function addFrame() {
    const fieldValues = form.getFieldsValue();
    const date = form.getFieldValue("date");
    setOpenModal(false);
    setReload(Math.random());

    Meteor.callAsync("timeFrame.create", {
      ...fieldValues,
      project: globals?.project._id,
      date: moment(JSON.stringify(date).replace(/["']/g, "")).format(
        "DD/MM/YYYY"
      ),
    });
  }

  function AddFrameCard() {
    return (
      <button
        style={{
          height: "15rem",
          width: "13rem",
          marginLeft: "2rem",
          boxShadow: "1rem 1rem 20px gray",
          borderRadius: "10px",
          cursor: "pointer",
        }}
        onClick={() => setOpenModal(true)}
        disabled={!(globals?.project && canCreate)}
      >
        <Flex
          justify="center"
          align="center"
          style={{ flexDirection: "column" }}
          gap={"1rem"}
        >
          <PlusCircleOutlined style={{ fontSize: 32 }} />
          {globals?.project ? "Agregar Periodo" : "No hay proyecto activo"}
        </Flex>
      </button>
    );
  }

  return (
    <>
      <Row gutter={[16, 32]} style={{ marginBottom: "2rem" }}>
        <AddFrameCard />
        {timeFrames &&
          timeFrames
            .map((frameData, number) => (
              <FrameCard
                key={number}
                frameData={frameData}
                project={project}
              />
            ))
            .reverse()}
      </Row>
      <Modal
        open={openModal}
        onOk={addFrame}
        onClose={() => setOpenModal(false)}
        onCancel={() => setOpenModal(false)}
        closable={false}
        width={"20rem"}
        styles={{
          content: {
            background:
              "linear-gradient(54deg, rgba(255,255,255,0.9444152661064426) 0%, rgba(219,212,212,1) 100%)",
          },
        }}
      >
        <Form form={form}>
          <Form.Item name={"title"} label="Titulo">
            <Input
              placeholder="Titulo del periodo"
              maxLength={20}
              autoCapitalize="sentences"
              autoFocus
            />
          </Form.Item>
          <Form.Item name={"date"} label="Fecha de inicio">
            <DatePicker placeholder="Fecha de inicio" format={"DD/MM/YYYY"} />
          </Form.Item>
          {/* <Form.Item name={"image"}>
            <Input placeholder="Image" />
            </Form.Item> */}
        </Form>
      </Modal>
    </>
  );
}
