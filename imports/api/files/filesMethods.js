import { Meteor } from "meteor/meteor";
import { WebApp } from "meteor/webapp";
import { projectImageCollection } from "./filesCollection";
import busboy from "busboy";
import * as fs from "node:fs";
import path from "node:path";

const Busboy = busboy;

const tempUploadDir = path.join("/app/uploads/temp");
if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true });
}

const collection = {
  projects: projectImageCollection,
};

function replaceBaseUrl(link) {
  return link.replace("http://localhost/", Meteor.absoluteUrl());
}

Meteor.methods({
  async getFileById(id, collectionId) {
    const collectionType = collection[`${collectionId}`];
    return await collectionType.find({ _id: id });
  },
  async getFileLink(name, collectionName) {
    const image = await collection[collectionName].collection
      .find({ name })
      .fetch();

    let link = "";
    try {
      link = collection[collectionName].link(image[0]);
    } catch (e) {}
    if (link) return link;
  },
  "formGenerator.getUpdate": async function (version) {
    const forms = await Assets.getTextAsync("forms.json");
    const jsonForms = JSON.parse(forms);
    if (jsonForms.version > version) return forms;
  },
  "files.getPhotos": async function (
    timeFrame,
    project,
    page,
    pageSize,
    sort
  ) {},
});

const convertBase64ToFile = function (image, type) {
  const byteString = atob(image.split(",")[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i += 1) {
    ia[i] = byteString.charCodeAt(i);
  }
  const newBlob = new Blob([ab], {
    type,
  });
  return newBlob;
};

WebApp.rawConnectHandlers.use((req, res, next) => {
  res.setHeader("Content-Length", "50000000"); // 50MB
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.url.includes(".jpg")) {
    res.setHeader("Content-Encoding", "identity");
  }
  next();
});

WebApp.connectHandlers.use("/upload", (req, res, next) => {
  console.log("Acceso", req.method);
  if (req.method === "OPTIONS") {
    res.writeHead(200);
    return res.end();
  }

  if (req.method === "POST") {
    console.warn("receiving upload...");
    const busboy = Busboy({
      headers: req.headers,
      highWaterMark: 2 * 1024 * 1024,
    });

    let fileType = "";
    let fileName = "";
    const fileData = {};

    busboy.on("file", (name, file, info) => {
      fileName = info.filename;
      fileType = info.mimeType;
      file.pipe(fs.createWriteStream(path.join(tempUploadDir, info.filename)));
    });

    busboy.on("field", (name, value) => {
      fileData[name] = value;
    });
    busboy.on("error", (err) => {
      console.warn("Error al cargar archivo:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({
          success: false,
          message: "Error al mover el archivo",
        })
      );
    });

    busboy.on("finish", () => {
      console.log("finished");
      const tempFilePath = path.join(tempUploadDir, fileName);
      const uploadDir = path.join("/app/uploads/reportImage/", fileData.predio);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      fs.rename(tempFilePath, path.join(uploadDir, fileName), (err) => {
        if (err) {
          console.warn("Error al mover el archivo:", err);
          res.writeHead(500, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({
              success: false,
              message: "Error al mover el archivo",
            })
          );
        } else {
          res.writeHead(200);
          res.end(JSON.stringify({ success: true, fileName }));
        }
      });
    });

    req.pipe(busboy);
  } else {
    res.writeHead(405);
    res.end(
      JSON.stringify({ success: false, message: "Método no permitido." })
    );
  }
});
