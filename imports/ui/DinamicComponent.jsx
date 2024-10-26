import React, { useState, useEffect } from "react";
import * as Babel from "@babel/standalone";

const DynamicComponent = ({ ruta, InnerComponent }) => {
  const [component, setComponent] = useState(null);

  useEffect(() => {
    Meteor.call("getPrivateComponent", ruta, (error, result) => {
      if (error) {
        console.error("Error fetching component:", error);
      } else {
        const transpiledCode = Babel.transform(result, {
          presets: ["react"],

        }).code;
        const evaluatedComponent = eval(transpiledCode); // Ten cuidado con eval por razones de seguridad

        setComponent(() => evaluatedComponent);
      }
    });
  }, []);

  return component ? React.createElement(component, {InnerComponent}) : <div>Loading...</div>;
};

export default DynamicComponent;
