import { FilesCollection } from "meteor/ostrio:files";

function checkFormat(regex_formats, file) {
  return regex_formats.test(file.extension);
}
function checkFile(regex_formats, file) {
  if (!checkFormat(regex_formats, file)) return "Formato no válido";
  return true;
}
export const projectImageCollection = new FilesCollection({
  collectionName: "projectImage",
  storagePath: "/data/projectImage",
  onBeforeUpload(file) {
    return checkFile(/png|jpg|jpeg/i, file);
  },
});

export const reportImageCollection = new FilesCollection({
  collectionName: "reportImage",
  storagePath: "/data/reportImage",
  allowClientCode: false,
});
