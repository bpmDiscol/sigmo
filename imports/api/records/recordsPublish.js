import { Meteor } from "meteor/meteor";
import { recordsCollection } from "./recordsCollection";

Meteor.publish("records", () => recordsCollection.find().cursor);
