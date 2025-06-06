import { Meteor } from "meteor/meteor";
import "../imports/api/assignments";
import "../imports/api/records";
import "../imports/api/timeFrame";
import "../imports/api/roles/rolesMethods";
import "../imports/api/reports";
import "../imports/api/files";
import "../imports/api/projects";
import "../imports/api/utils/filemanagement";

Meteor.startup(async () => {
  const admin = await Meteor.users.findOneAsync({
    username: process.env.ADMIN,
  });
  if (!admin) {
    Accounts.createUser({
      profile: { role: "superadmin" },
    });
  }
});

Meteor.methods({
  getTextAssets: async function (route) {
    return await Assets.getTextAsync(route);
  },
});
