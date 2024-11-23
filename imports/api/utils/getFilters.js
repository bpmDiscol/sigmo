export default function getFilters(filters) {
  let filter = {};
  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      if (value) {
        if (key === "GESTOR") {
          filter[key] = value == 0 ? { $eq: null } : { $eq: value };
        } else if (key === "recordId") {
          filter[key] = { $in: Array.isArray(value) ? value : [value] };
        } else if (key === "_id") {
          filter[key] = { $in: Array.isArray(value) ? value : [value] };
        } else if (key === "exists") {
          filter[value] = { $exists: 1 };
        } else {
          filter[key] = { $regex: value, $options: "i" };
        }
      }
    }
  }
  return filter;
}
