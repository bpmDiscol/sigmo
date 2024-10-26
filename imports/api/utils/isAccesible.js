export default async function isAccesible(activity, membership, role) {
  const file = await Meteor.callAsync("getTextAssets", "permissions.json");

  const permissions = JSON.parse(file);

  const userRolePermission = permissions[activity].userRole;
  const membershipPermission = permissions[activity].membership;

  const rolePermission = userRolePermission
    ? userRolePermission.includes(role)
    : true;
  const memberPermission = membershipPermission
  ? membershipPermission.includes(membership)
  : true;
  
  return rolePermission && memberPermission;
}
