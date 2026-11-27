export function getEmployeeAssets(employee, assets) {
  return assets.filter(asset => {
    const assignedUserId = asset.assignedToId || asset.assignedTo;
    if (assignedUserId) return Boolean(employee.id) && assignedUserId === employee.id;

    const assignedEmployeeId = asset.assignedEmployeeId || asset.employeeId;
    return Boolean(employee.employeeId) && assignedEmployeeId === employee.employeeId;
  });
}

export function getEmployeeDocuments(employee, documents) {
  return documents.filter(doc => {
    const linkedUserId = doc.ownerId || doc.linkedEntities?.user?.id;
    if (linkedUserId) return Boolean(employee.id) && linkedUserId === employee.id;

    const linkedEmployeeId = doc.ownerEmployeeId ||
      doc.employeeId ||
      doc.linkedEntities?.user?.employeeId;
    return Boolean(employee.employeeId) && linkedEmployeeId === employee.employeeId;
  });
}

export function getEmployeeLicenses(employee, software, accessMatrix) {
  const userAccess = employee.id ? accessMatrix[employee.id] || {} : {};

  return software.filter(item => {
    if (item.assignedUserIds?.length) {
      return Boolean(employee.id) && item.assignedUserIds.includes(employee.id);
    }

    if (item.assignedEmployeeIds?.length) {
      return Boolean(employee.employeeId) && item.assignedEmployeeIds.includes(employee.employeeId);
    }

    return Boolean(item.accessApp && userAccess[item.accessApp] === 'granted');
  });
}
