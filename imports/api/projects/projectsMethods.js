import { Meteor } from "meteor/meteor";
import { projectsCollection } from "./projectsCollection";

Meteor.methods({
  "project.create": async function (data) {
    return await projectsCollection.insertAsync(data);
  },
  "project.update": async function (id, data) {
    return await projectsCollection.updateAsync(
      id,
      { $set: data },
      { upsert: false }
    );
  },
  "project.read": async function () {
    return projectsCollection.find().fetch();
  },
  "project.delete": function (id) {
    projectsCollection.remove(id);
  },
  "project.getMembers": async function () {
    return await Meteor.users.find({}).fetchAsync();
  },
  "project.addMember": async function (username, project) {
    return await Meteor.users.updateAsync(
      { username },
      { $addToSet: { "profile.projects": project } }
    );
  },
  "project.allMembers": async function (_id) {
    const project = await projectsCollection.findOneAsync({ _id });
    return project?.members || [];
  },
  "project.myProjects": async function (id) {
    const user = await Meteor.users.findOneAsync(id);
    const username = user.username;
    return await projectsCollection
      .find({ "members.member": username }, { _id: 1, name: 1, image: 1 })
      .fetchAsync();
  },
  "project.getMembership": async function (project, member) {
    const memberShip = await projectsCollection
      .rawCollection()
      .aggregate([
        {
          $match: {
            "members.member": member,
            _id: project,
          },
        },
        {
          $project: {
            memberPosition: {
              $filter: {
                input: "$members",
                as: "member",
                cond: { $eq: ["$$member.member", member] },
              },
            },
          },
        },
        {
          $unwind: "$memberPosition",
        },
        {
          $project: {
            position: "$memberPosition.position",
          },
        },
      ])
      .toArray();
    return memberShip.length > 0 ? memberShip[0].position : null;
  },
});
