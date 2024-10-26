import React, { createContext, useEffect, useState } from "react";
import { notification } from "antd";

export const NotificationContext = createContext();

export default function NotificationProvider({ children }) {
  const [api, contextHolder] = notification.useNotification();
  const [alertMessage, setAlertMessage] = useState();

  function openNotification(message) {
    api[message.type](message);
  }

  useEffect(() => {
    if (alertMessage) openNotification(alertMessage);
  }, [alertMessage]);

  return (
    <NotificationContext.Provider value={{ setAlertMessage }}>
      {contextHolder}
      {children}
    </NotificationContext.Provider>
  );
}
