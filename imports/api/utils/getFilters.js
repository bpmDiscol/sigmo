export default function getFilters(filters) {
  let filter = {};
  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      if (value && key !== "undefined") {
        if (key === "recordId" || key === "_id" || key === "manager") {
          filter[key] = { $in: Array.isArray(value) ? value : [value] };
        } else if (key === "date") {
          filter[value.field] = {
            $gte: value.searchDate.start,
            $lte: value.searchDate.end,
          };
        } else if (key === "exists") {
          filter[value] = { $exists: 1 };
        } else if (key === "not") {
          filter[value.field] = {
            $not: { $regex: value.value, $options: "i" },
          };
        } else {
          filter[key] = { $regex: value, $options: "i" };
        }
      }
    }
  }
  return filter;
}
