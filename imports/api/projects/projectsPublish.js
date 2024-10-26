import { Meteor } from "meteor/meteor";
import { projectsCollection } from "./projectsCollection";

Meteor.publish("projects", () => projectsCollection.find().cursor);
