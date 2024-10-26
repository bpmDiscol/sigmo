import { Meteor } from "meteor/meteor";
import { Accounts } from "meteor/accounts-base";
import { check } from "meteor/check";

Meteor.methods({
  getManagerList() {
    const users = Meteor.users.find({ "profile.role": "manager" });
    return users.map((user) => ({
      label: user.username,
      value: user.username,
      key: user._id,
    }));
  },
  getUsersByRole(role) {
    check(role, String);
    return Meteor.users.find({ "profile.role": role }).fetch();
  },
  createUserWithRole(username, password, locality) {
    check(username, String);
    check(password, String);
    check(locality, String);

    Accounts.createUser({
      username,
      password,
      profile: { locality },
    });
  },
  assignManagersToLeader(leaderId, managerIds) {
    check(leaderId, String);
    check(managerIds, [String]);

    Meteor.users.update(leaderId, {
      $set: { "profile.managers": managerIds },
    });
  },
  getManagersForLeader(leaderId) {
    check(leaderId, String);

    const leader = Meteor.users.findOne(leaderId);

    if (!leader) {
      throw new Meteor.Error("Lider no encontrado");
    }

    return leader.profile.managers || [];
  },
  getLoggedInLeaderManagers(userId) {
    const user = Meteor.users.findOne(userId);
    if (!user || user.profile.role !== "leader") {
      throw new Meteor.Error("Sin autorización");
    }

    return user.profile.managers || [];
  },
  getManagers(leaderId) {
    const user = Meteor.users.findOneAsync(leaderId);
    const managers = user.profile?.managers || [];
    return managers.map((managerId) => {
      const manager = Meteor.users.findOne(managerId);
      return { username: manager.username, id: manager._id };
    });
  },
  getLeaders(userId) {
    const user = Meteor.users.findOne(userId);
    if (!user || user.profile.role !== "admin") {
      throw new Meteor.Error(
        "Sin autorización",
        "Usuario sin autorización suficiente"
      );
    }

    const leaders = Meteor.users.find({ "profile.role": "leader" }).fetch();
    return leaders.map((user) => ({ id: user._id, username: user.username }));
  },
  getAllManagers(userId) {
    const user = Meteor.users.findOne(userId);
    if (!user || user.profile.role !== "admin") {
      throw new Meteor.Error(
        "Sin autorización",
        "Usuario sin autorización suficiente"
      );
    }

    const managers = Meteor.users
      .find({ "profile.role": "management" })
      .fetch();
    return managers.map((user) => ({ id: user._id, username: user.username }));
  },
});
