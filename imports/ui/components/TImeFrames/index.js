import { Button, Upload } from "antd";
import React, { memo, useCallback, useEffect, useState } from "react";
import { Meteor } from "meteor/meteor";

import processExcel from "../../../api/utils/processExcel";
import uploadRecords from "../../../api/utils/uploadRecords";
import normalizedRecords from "../../../api/utils/normalizeRecords";
import TimeFrameList from "../timeFrameList";

export default function TimeFrames({ frames, project, setReload, canCreate }) {
  const [timeFrames, setTimeFrames] = useState();
  const [file, setFile] = useState({ status: "wait", length: 0 });
  const [recordData, setRecordData] = useState({ uploads: 0 });
  const [percent, setPercent] = useState(0);

  const locality = Meteor.user().profile.locality;

  function loadFile(file_, id) {
    processExcel(file_, setFile);
    setFile({ ...file, currentFrame: id });
    return false;
  }

  const PromisedFrames = useCallback(
    (frames) => {
      Promise.resolve(frames)
        .then((_frames) => setTimeFrames(_frames.data))
        .catch((e) => console.warn("error getting frames: ", e));
    },
    [frames]
  );

  useEffect(() => PromisedFrames(frames), [frames]);

  useEffect(() => {
    if (file?.data) {
      setFile({ ...file, status: "uploading" });
      setRecordData({ uploads: 0 });
      const data = normalizedRecords(file.data);
      uploadRecords(data, setRecordData, file.currentFrame, project, locality);
      setFile({ ...file, data: null });
    }
  }, [file]);

  useEffect(() => {
    if (!file?.length || !recordData?.uploads) return;
    setPercent((recordData.uploads / file.length) * 100);
    if ((recordData.uploads / file.length) * 100 >= 100) {
      setFile({ ...file, status: "wait", length: 0 });
      setRecordData({ uploads: 0 });
      setPercent(0);
    }
  }, [recordData, file.data]);



  function FrameTable({ timeFrames, setCanCreate }) {
    return <TimeFrameList timeFrames={timeFrames} project={project} setReload={setReload} canCreate={canCreate} />;
  }
  const MemoizedFrames = memo(FrameTable);

  return <MemoizedFrames timeFrames={timeFrames} canCreate={canCreate} />;
}
