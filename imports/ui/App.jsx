import React from "react";
import Main from "./screens/main.jsx";
import NotificationProvider from "./context/notificationContext.jsx";
import { BrowserRouter } from "react-router-dom";
import SecurityProvider from "./context/securityProvider.jsx";
import Login from "./screens/login.jsx";
import GlobalsProvider from "./context/globalsContext.jsx";

export const App = () => (
  <BrowserRouter>
    <NotificationProvider>
      <SecurityProvider publicPage={<Login />}>
        <GlobalsProvider>
          <Main />
        </GlobalsProvider>
      </SecurityProvider>
    </NotificationProvider>
  </BrowserRouter>
);
