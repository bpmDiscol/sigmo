import React, { useEffect, useState } from "react";
import "./index.css";
import {
  Button,
  DatePicker,
  Flex,
  Form,
  Input,
  Modal,
  Typography,
  Upload,
} from "antd";
import { useNavigate } from "react-router-dom";
import processExcel from "../../../api/utils/processExcel";
import uploadRecords from "../../../api/utils/uploadRecords";
import normalizedRecords from "../../../api/utils/normalizeRecords";
import moment from "moment";
import { LockFilled } from "@ant-design/icons";

export default function FrameCard({
  frameData,
  project,
  setReload,
  canCreate,
}) {
  const navigate = useNavigate();
  const [file, setFile] = useState({ status: "wait", length: 0 });
  const [recordData, setRecordData] = useState({ uploads: 0 });
  const [percent, setPercent] = useState(0);

  const [openModal, setOpenModal] = useState(false);
  const [form] = Form.useForm();

  const locality = Meteor.user().profile.locality;
  const activeState = frameData.state !== "closed";

  function loadFile(file_, id) {
    setFile({ status: "analizing", length: 0 });
    processExcel(file_, setFile);
    setFile({ ...file, currentFrame: id });
    return false;
  }

  function addFrame() {
    if (!activeState) return;
    const fieldValues = form.getFieldsValue();
    const date = form.getFieldValue("date");
    const endDate = form.getFieldValue("endDate");
    setOpenModal(false);
    setReload(Math.random());

    Meteor.callAsync("timeFrame.update", frameData._id, {
      ...fieldValues,
      project,
      date: date.format("DD/MM/YYYY"),
      endDate: endDate.format("DD/MM/YYYY"),
    });
  }

  useEffect(() => {
    if (file?.data && activeState) {
      setFile({ ...file, status: "uploading" });
      setRecordData({ uploads: 0 });
      const data = normalizedRecords(file.data);
      uploadRecords(data, setRecordData, file.currentFrame, project, locality);
      setFile({ ...file, data: null });
    }
  }, [file]);

  useEffect(() => {
    if (!file?.length || !recordData?.uploads) return;
    setPercent((recordData.uploads / file.length) * 100);
    if ((recordData.uploads / file.length) * 100 >= 100) {
      setFile({ ...file, status: "wait", length: 0 });
      setRecordData({ uploads: 0 });
      setPercent(0);
    }
  }, [recordData, file.data]);

  useEffect(() => {
    if (form.getFieldsValue()) {
      form.setFieldValue("title", frameData.title);
    }
  }, [form]);

  return (
    <div className="box-container">
      <div>
        <Typography.Title level={3}>{frameData.title} </Typography.Title>
      </div>
      {!activeState && (
        <Typography.Text italic>
          <LockFilled /> Cerrado
        </Typography.Text>
      )}
      <Flex gap={4} vertical>
        <Flex onClick={() => activeState && canCreate && setOpenModal(true)}>
          <Typography.Text italic code>
            {frameData.date} - {frameData.endDate}
          </Typography.Text>
        </Flex>
        <Upload
          beforeUpload={(file) => loadFile(file, frameData._id)}
          showUploadList={false}
          disabled={!activeState}
        >
          <Button
            type="primary"
            size="small"
            danger
            disabled={!activeState}
            loading={file?.status !== "wait"}
            style={{ width: "11.9rem" }}
          >
            {file?.status == "analizing" ? "Analizando archivo" : "Cargar base"}
            {file?.status !== "wait" ? ` ${percent.toFixed(1)} % ` : ""}
          </Button>
        </Upload>
        <Button
          size="small"
          disabled={!activeState}
          onClick={() =>
            activeState &&
            navigate("/assignments", { state: { id: frameData._id } })
          }
        >
          Asignaciones
        </Button>
        <Button
          size="small"
          onClick={() => navigate("/reports", { state: { id: frameData._id } })}
        >
          Reportes
        </Button>
      </Flex>
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
              defaultValue={frameData.title}
            />
          </Form.Item>
          <Form.Item
            name={"date"}
            label="Fecha de inicio"
            valuePropName="value"
          >
            <DatePicker
              placeholder="Fecha de inicio"
              // defaultValue={moment(frameData.date, "DD/MM/YYYY")}
              // format={"YYYY-MM-DD"}
            />
          </Form.Item>
          <Form.Item
            name={"endDate"}
            label="Fecha de cierre"
            valuePropName="value"
          >
            <DatePicker
              placeholder="Fecha de cierre"
              // defaultValue={moment(frameData.endDate, "DD/MM/YYYY")}
              // format={"YYYY-MM-DD"}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
