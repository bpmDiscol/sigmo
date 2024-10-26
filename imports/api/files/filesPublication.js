import { Meteor } from "meteor/meteor";
import { projectImageCollection, reportImageCollection } from "./filesCollection";

Meteor.publish("projectImage", function () {
  return projectImageCollection.find({}).cursor();
});
Meteor.publish("reportImage", function () {
  return reportImageCollection.find({}).cursor();
});
