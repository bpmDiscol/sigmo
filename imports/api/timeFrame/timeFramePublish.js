import { Meteor } from "meteor/meteor";
import { timeFrameCollection } from "./timeFrameCollection";

Meteor.publish("timeFrame", () => timeFrameCollection.find().cursor);
