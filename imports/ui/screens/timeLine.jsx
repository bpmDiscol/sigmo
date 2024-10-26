import * as React from "react";
import { InteractionModeType, Timeline } from "react-svg-timeline";

export default function TimeLine() {
  const laneId = "demo-lane";
  const lanes = [
    {
      laneId,
      label: "Demo Lane",
    },
    {
      laneId: "demo-lane-2",
      label: "Demo Lane 2",
    },
  ];
  const events = [
    {
      eventId: "event-1",
      tooltip: "Event 1",
      laneId: "demo-lane",
      startTimeMillis: 1167606000000,
      endTimeMillis: 1230698892000,
    },
    {
      eventId: "event-2",
      tooltip: "Event 2",
      laneId: "demo-lane-2",
      startTimeMillis: 1167606000000,
      endTimeMillis: 1231698895000,
      title: "titulo",
    },
  ];
  const dateFormat = (ms) => new Date(ms).toLocaleString();
  return (
    <Timeline
      width={600}
      height={300}
      events={events}
      lanes={lanes}
      dateFormat={dateFormat}
      onEventClick={(e)=>console.log(e)}
      enabledInteractions={[InteractionModeType.Grab, InteractionModeType.Zoom]}
      customRange={[1167606000000, 1167607000000]}
    />
  );
}
