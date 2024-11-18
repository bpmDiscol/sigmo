import { Descriptions, Flex, Typography } from "antd";
import React, { useEffect, useState } from "react";

export default function Incidences({ timeFrame, groupField, title }) {
  const [incidences, setIncidences] = useState([]);
  const locality = Meteor.user({ profile: 1 })?.profile?.locality;
  async function getIncidences() {
    const inc = await Meteor.callAsync("record.incidences", groupField, {
      timeFrame,
      locality,
    });
    const incid = Object.keys(inc).map((field) => ({
      key: field,
      label: field,
      children: inc[field],
    }));
    setIncidences(incid);
  }
  useEffect(() => {
    getIncidences();
  }, []);
  return (
    <Descriptions
      style={{ visibility: incidences.length ? "visible" : "collapse", marginTop:'2rem' }}
      contentStyle={{width: "5rem"}}
      title={title}
      items={incidences}
      column={1}
      size="small"
      bordered
    />
  );
}
