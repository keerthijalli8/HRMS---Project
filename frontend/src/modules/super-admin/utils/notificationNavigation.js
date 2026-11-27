const NOTIFICATION_DESTINATIONS = {
  subscriptionRenewal: {
    path: "/super-admin/subscriptions",
    params: { focus: "expiring" },
    searchParam: "search",
  },
  organizationReview: {
    path: "/super-admin/tenants",
    params: { status: "pending" },
    searchParam: "search",
  },
  monitoringResolved: {
    path: "/super-admin/monitoring",
    params: { tab: "incidents", filter: "resolved" },
    searchParam: "search",
  },
  supportTicket: {
    path: "/super-admin/support",
    params: { tab: "tickets", status: "Open" },
    searchParam: "search",
  },
  invoiceOverdue: {
    path: "/super-admin/billing",
    params: { status: "overdue" },
    searchParam: "search",
  },
  paymentReceived: {
    path: "/super-admin/billing",
    params: { status: "paid" },
    searchParam: "search",
  },
  securityAlert: {
    path: "/super-admin/security-audit-logs",
    params: { tab: "alerts" },
    searchParam: "search",
  },
  platformUserCreated: {
    path: "/super-admin/platform-users",
    params: { status: "active", sort: "recent" },
    searchParam: "search",
  },
  licenseActivationPending: {
    path: "/super-admin/tenants",
    params: { view: "activation", status: "Awaiting Activation" },
    searchParam: "search",
  },
  moduleAccessChanged: {
    path: "/super-admin/modules",
    params: { tab: "history", action: "Tenant Access Enabled" },
    searchParam: "search",
  },
};

export function getNotificationDestination(notification) {
  const destination =
    NOTIFICATION_DESTINATIONS[notification?.type] ||
    NOTIFICATION_DESTINATIONS[notification?.target];

  if (!destination) return "/super-admin/dashboard";

  const params = new URLSearchParams(destination.params);
  const recordQuery = notification?.recordQuery || notification?.relatedRecordId;
  if (recordQuery && destination.searchParam) {
    params.set(destination.searchParam, recordQuery);
  }

  const query = params.toString();
  return query ? `${destination.path}?${query}` : destination.path;
}
