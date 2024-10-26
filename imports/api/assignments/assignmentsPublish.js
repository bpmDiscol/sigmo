import { Meteor } from "meteor/meteor";
import { assignmentsCollection } from "./assignmensCollection";

Meteor.publish("assignments", () => assignmentsCollection.find().cursor);
