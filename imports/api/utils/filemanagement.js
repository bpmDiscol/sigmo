import { projectImageCollection } from "../files/filesCollection";
import { Random } from "meteor/random";

const collection = {
  projects: projectImageCollection,
};

export function deleteFile(collectionId, name) {
  collection[`${collectionId}`].remove({ name });
}

export async function uploadFile(
  collectionId,
  fileData,
  callback,
  errCallback
) {
  const collectionType = collection[`${collectionId}`];
  const upload = collectionType.insert(
    {
      file: fileData,
      fileName: Random.id() + ".png",
      chunkSize: "dynamic",
    },
    false
  );

  upload.on("end", (error, fileObj) => {
    if (error) console.warn(error.reason);
    else {
      return callback(fileObj);
    }
  });
  upload.on("error", errCallback);
  upload.start();
}

