import { Meteor } from "meteor/meteor";

export default function uploadRecords(records, cb, timeFrame, project, locality) {
  if (records?.length == 0) return;
  records.forEach((record) => {
    Meteor.call("record.insert", { ...record, timeFrame, project, locality }, () => {
      cb((prev) => ({ ...prev, uploads: prev.uploads + 1 }));
    });
  });
}
