import { Meteor } from "meteor/meteor";
import convertKeys from "./convertKeys";

export default async function uploadRecords(
  records,
  cb,
  timeFrame,
  project,
  locality
) {
  if (records?.length == 0) return;
  const dictionaryStr = await Meteor.callAsync(
    "getTextAssets",
    "diccionario.json"
  );
  const dictionary = JSON.parse(dictionaryStr);

  records.forEach(async (record) => {
    const correctedRecord = await convertKeys(record, dictionary);
    Meteor.call(
      "record.insert",
      { ...correctedRecord, timeFrame, project, locality },
      () => {
        cb((prev) => ({ ...prev, uploads: prev.uploads + 1 }));
      }
    );
  });
}
