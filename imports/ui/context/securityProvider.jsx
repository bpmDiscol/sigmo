import React, { useState } from "react";
import { useLoggedUser } from "meteor/quave:logged-user-react";
import { Spin } from "antd";

export const SecurityContext = React.createContext();

export default function SecurityProvider({ children, publicPage }) {
  const { loggedUser, isLoadingLoggedUser } = useLoggedUser();
  const [userOptions, setUserOptions] = useState({});

  if (isLoadingLoggedUser) return <Spin fullscreen />;
  return (
    <SecurityContext.Provider value={{ userOptions, setUserOptions }}>
      {!loggedUser && publicPage}
      {loggedUser && children}
    </SecurityContext.Provider>
  );
}
