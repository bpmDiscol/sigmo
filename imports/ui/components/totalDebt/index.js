import React, { useEffect, useState } from "react";
import formatCurrency from "../../../api/utils/formatCurrency";
import { Typography } from "antd";

export default function TotalDebts({ timeFrame }) {
  const [total, setTotal] = useState(0);
  const locality = Meteor.user({ profile: 1 })?.profile?.locality;

  async function getTotal() {
    const fetchedTotal = await Meteor.callAsync("record.totalDebt", {
      timeFrame,
      locality,
    });
    setTotal(fetchedTotal);
  }
  useEffect(() => {
    getTotal();
  }, []);

  return (
    <div>
      <Typography.Text strong>
        Total deuda asignada {formatCurrency(total)}
      </Typography.Text>
    </div>
  );
}
