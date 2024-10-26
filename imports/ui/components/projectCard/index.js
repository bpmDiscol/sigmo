import React, { useEffect, useState } from "react";
import {
  deleteFile,
  getFileLink,
  uploadFile,
} from "../../../api/utils/filemanagement";
import { Card, Image, List, message, Spin, Typography, Upload } from "antd";

export default function ProjectCard({ project }) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentFile, setCurrentFile] = useState({
    uid: project.image,
    name: project.image,
    status: "done",
  });
  const [currentImage, setCurrentImage] = useState();
  async function getLink(image) {
    if (!image) return;
    const link = await Meteor.callAsync("getFileLink", image, "projects");
    if (link) setCurrentImage(link);
  }

  function upload(file) {
    if (file.size > 10485760) {
      message.warning("El archivo no puede tener mas de 10Mb");
      return;
    }
    setIsLoading(true);

    uploadFile(
      "projects",
      file,
      async (file) => {
        if (!file) return;
        const result = {
          uid: file.name,
          name: file.name,
          status: "done",
        };
        if (currentFile) deleteFile("projects", currentFile?.uid);
        Meteor.call(
          "project.update",
          project._id,
          {
            image: result.name,
          },
          (err) => {
            if (result.name) {
              getLink(result.name);
              setCurrentFile(result);
            }
            setIsLoading(false);
          }
        );
      },
      (error) => {
        message.error(error.reason);
        setIsLoading(false);
      }
    );
    return false;
  }

  useEffect(() => {
    getLink(project.image);
  });

  return (
    <List.Item
      extra={
        <Spin spinning={isLoading}>
          <Upload maxCount={1} beforeUpload={upload} showUploadList={false}>
            <Image
              style={{ width: "150px", cursor: "pointer", objectFit: "fill" }}
              src={currentImage || "logo-sigmo.png"}
              preview={false}
            />
          </Upload>
        </Spin>
      }
      style={{ width: "400px" }}
    >
      <Card.Meta
        style={{ width: "200px" }}
        title={
          <Typography.Text strong>{project.name.toUpperCase()}</Typography.Text>
        }
        description={"Proyecto gestion de cartera"}
      />
    </List.Item>
  );
}
