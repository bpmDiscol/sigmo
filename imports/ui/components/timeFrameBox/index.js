import React, { useEffect, useState } from "react";
import "./index.css";
import { Button, Flex, Typography, Upload } from "antd";
import { useNavigate } from "react-router-dom";
import processExcel from "../../../api/utils/processExcel";
import uploadRecords from "../../../api/utils/uploadRecords";
import normalizedRecords from "../../../api/utils/normalizeRecords";

export default function FrameCard({ frameData, project }) {
  const navigate = useNavigate();
  const [file, setFile] = useState({ status: "wait", length: 0 });
  const [recordData, setRecordData] = useState({ uploads: 0 });
  const [percent, setPercent] = useState(0);

  const locality = Meteor.user().profile.locality;

  function loadFile(file_, id) {
    processExcel(file_, setFile);
    setFile({ ...file, currentFrame: id });
    return false;
  }

  useEffect(() => {
    if (file?.data) {
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

  return (
    <div className="box-container">
      <div>
        <Typography.Title level={3}>{frameData.title} </Typography.Title>
      </div>
      <div></div>
      <Flex gap={4} vertical>
        <Typography.Text italic code>
          {frameData.date}
        </Typography.Text>
        <Upload
          beforeUpload={(file) => loadFile(file, frameData._id)}
          showUploadList={false}
        >
          <Button
            type="primary"
            size="small"
            danger
            loading={file?.status !== "wait"}
            style={{ width: "11.9rem" }}
          >
            Cargar archivo
            {file?.status !== "wait" ? ` ${percent.toFixed(1)} % ` : ""}
          </Button>
        </Upload>
        <Button
          size="small"
          onClick={() =>
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
    </div>
  );
}
