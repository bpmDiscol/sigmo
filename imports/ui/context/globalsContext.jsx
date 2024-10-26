import React, { createContext, useEffect, useState } from "react";
import { Meteor } from "meteor/meteor";

export const GlobalContext = createContext();

export default function GlobalsProvider({ children }) {
  const [globals, setGlobals] = useState({});
  const [update, setUpdate] = useState(0);

  function forceUpdate() {
    setUpdate(Math.random());
  }

  useEffect(() => {
    const currentProfile = Meteor.user({ profile: 1 }).profile;
    setGlobals((prev) => ({ ...prev, userRole: currentProfile.role }));
  }, []);

  useEffect(() => {
    if (globals?.project)
    Meteor.call("project.allMembers", globals?.project._id, (err, members) => {
      if (!err) setGlobals((prev) => ({ ...prev, members }));
    });
  }, [globals?.project, update]);

  useEffect(() => {
    if (globals?.project)
      Meteor.call(
        "project.getMembership",
        globals?.project._id,
        Meteor.user().username,
        (err, membership) => {
          setGlobals((prev) => ({ ...prev, membership }));
        }
      );
  }, [globals?.project]);

  useEffect(() => {
    Meteor.call("project.myProjects", Meteor.userId(), (err, allProjects) => {
      if (!err) setGlobals((prev) => ({ ...prev, allProjects }));
    });
  }, [update]);

  useEffect(() => {
    async function getProjectTeam() {
      const members = await Meteor.callAsync("project.getMembers");
      const allMembers = members.map((member) => ({
        value: member.username,
        label: member.username,
      }));
      setGlobals((prev) => ({ ...prev, allMembers }));
    }
    getProjectTeam();
  }, [update]);

  return (
    <GlobalContext.Provider value={{ globals, setGlobals, forceUpdate }}>
      {children}
    </GlobalContext.Provider>
  );
}
