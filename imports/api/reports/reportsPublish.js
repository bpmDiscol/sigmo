import { Meteor } from "meteor/meteor";
import { reportsCollection } from "./reportsCollection";

Meteor.publish("reports", () => reportsCollection.find().cursor);
