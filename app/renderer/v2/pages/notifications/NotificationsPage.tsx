// ============================================================
// FINORA ENTERPRISE OS
//
// NOTIFICATIONS ENGINE
//
// NOTIFICATION CENTER PAGE
//
// RESPONSIBILITY:
//
// - Render Owner in-app Notifications.
// - Render Customer Delivery lifecycle records.
// - Show Owner unread state.
// - Mark Owner Notifications as read.
// - Mark all Owner Notifications as read.
// - Show delivery status / retry / failure metadata.
// - Request explicit manual resend.
// - Refresh from canonical Notification data-change signals.
// - Remain scoped to the authenticated Owner / Business / Branch.
//
// IMPORTANT:
//
// - No direct repository access.
// - No provider calls.
// - No provider secrets.
// - No localStorage.
// - No sessionStorage.
// - No filesystem access.
// - No direct Delivery execution.
// - Manual resend is orchestrated by NotificationCenterService.
// - A resend request is never presented as a successful send.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  startFinoraProcessing,
  stopFinoraProcessing,
} from "../../components/common/feedback/finoraProcessing.service";

import type {
  CSSProperties,
} from "react";

import {
  useResponsive,
} from "../../utils/responsive";

import {
  getNotificationsPageStyles,
} from "./NotificationsPage.styles";

import {
  notificationCenterService,
} from "../../services/notifications/center/notificationCenterService";

import type {
  NotificationCenterDeliveryRow,
  NotificationCenterScope,
  NotificationCenterSnapshot,
} from "../../services/notifications/center/notificationCenterService";

import {
  notificationDataChangeMatchesScope,
  subscribeNotificationDataChanged,
} from "../../services/notifications/notificationDataChangeSignal";

import type {
  NotificationDeliveryRecord,
  OwnerNotificationRecord,
} from "../../types/notifications/notification.types";

// ============================================================
// PROPS
// ============================================================

export interface NotificationsPageProps {
  scope:
    NotificationCenterScope;
}

// ============================================================
// FILTER
// ============================================================

type NotificationCenterFilter =
  | "ALL"
  | "UNREAD"
  | "FAILED";

// ============================================================
// HELPERS
// ============================================================

function normalizeString(
  value:
    unknown,
): string {
  return String(
    value ?? "",
  ).trim();
}

function formatDateTime(
  value?:
    string,
): string {
  const normalized =
    normalizeString(
      value,
    );

  if (!normalized) {
    return "--";
  }

  const date =
    new Date(
      normalized,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return normalized;
  }

  return date.toLocaleString();
}

function formatStructuredValue(
  value:
    unknown,
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "--";
  }

  if (
    typeof value ===
    "string"
  ) {
    return (
      normalizeString(
        value,
      ) || "--"
    );
  }

  if (
    typeof value ===
      "number" ||
    typeof value ===
      "boolean"
  ) {
    return String(
      value,
    );
  }

  try {
    const serialized =
      JSON.stringify(
        value,
      );

    return (
      normalizeString(
        serialized,
      ) || "--"
    );
  } catch {
    return "--";
  }
}

function formatRecipient(
  value:
    unknown,
): string {
  if (
    typeof value ===
    "string"
  ) {
    return (
      normalizeString(
        value,
      ) || "--"
    );
  }

  if (
    value &&
    typeof value ===
      "object"
  ) {
    const candidate =
      value as Record<
        string,
        unknown
      >;

    const preferredKeys = [
      "phoneNumber",
      "whatsappNumber",
      "emailAddress",
      "value",
      "mobile",
      "phone",
      "email",
      "address",
      "recipient",
    ];

    for (
      const key
      of preferredKeys
    ) {
      const resolved =
        normalizeString(
          candidate[key],
        );

      if (resolved) {
        return resolved;
      }
    }
  }

  return formatStructuredValue(
    value,
  );
}

function isPendingDelivery(
  delivery:
    NotificationDeliveryRecord,
): boolean {
  return (
    delivery.status ===
      "SCHEDULED" ||
    delivery.status ===
      "SENDING"
  );
}

function isManualResendEligible(
  delivery:
    NotificationDeliveryRecord,
): boolean {
  return (
    delivery.status ===
      "FAILED" ||
    delivery.status ===
      "SENT" ||
    delivery.status ===
      "DELIVERED" ||
    delivery.status ===
      "SKIPPED" ||
    delivery.status ===
      "CANCELLED"
  );
}

function getDeliveryStatusStyle(
  delivery:
    NotificationDeliveryRecord,

  styles:
    Record<
      string,
      CSSProperties
    >,
): CSSProperties {
  switch (
    delivery.status
  ) {
    case "DELIVERED":
      return {
        ...styles.badge,
        ...styles.badgeSuccess,
      };

    case "FAILED":
      return {
        ...styles.badge,
        ...styles.badgeDanger,
      };

    case "SENDING":
      return {
        ...styles.badge,
        ...styles.badgeInfo,
      };

    case "SENT":
      return {
        ...styles.badge,
        ...styles.badgeBrand,
      };

    case "SCHEDULED":
      return {
        ...styles.badge,
        ...styles.badgeWarning,
      };

    case "SKIPPED":
    case "CANCELLED":
    default:
      return {
        ...styles.badge,
        ...styles.badgeNeutral,
      };
  }
}

function resolveLastSentAt(
  deliveryRows:
    NotificationCenterDeliveryRow[],
): string | undefined {
  let latestTimestamp =
    Number.NEGATIVE_INFINITY;

  let latestValue:
    string | undefined;

  for (
    const row
    of deliveryRows
  ) {
    const value =
      normalizeString(
        row.delivery.sentAt,
      );

    if (!value) {
      continue;
    }

    const timestamp =
      new Date(
        value,
      ).getTime();

    if (
      Number.isNaN(
        timestamp,
      )
    ) {
      continue;
    }

    if (
      timestamp >
      latestTimestamp
    ) {
      latestTimestamp =
        timestamp;

      latestValue =
        value;
    }
  }

  return latestValue;
}

// ============================================================
// COMPONENT
// ============================================================

export default function NotificationsPage({
  scope,
}: NotificationsPageProps) {
  // ==========================================================
  // RESPONSIVE ENGINE
  // ==========================================================

  const {
    tokens,
    isMobile,
    isTablet,
    isLaptop,
    isDesktop,
  } = useResponsive();

  const styles =
    getNotificationsPageStyles({
      tokens,
      isMobile,
      isTablet,
      isLaptop,
      isDesktop,
    });

  // ==========================================================
  // AUTHORITATIVE SCOPE
  // ==========================================================

  const notificationScope =
    useMemo<
      NotificationCenterScope
    >(
      () => ({
        ownerId:
          normalizeString(
            scope.ownerId,
          ),

        businessId:
          normalizeString(
            scope.businessId,
          ),

        branchId:
          normalizeString(
            scope.branchId,
          ),
      }),
      [
        scope.ownerId,
        scope.businessId,
        scope.branchId,
      ],
    );

  const scopeReady =
    Boolean(
      notificationScope.ownerId &&
      notificationScope.businessId &&
      notificationScope.branchId,
    );

  // ==========================================================
  // STATE
  // ==========================================================

  const [
    snapshot,
    setSnapshot,
  ] =
    useState<
      NotificationCenterSnapshot | null
    >(
      null,
    );

  const [
    loading,
    setLoading,
  ] =
    useState<boolean>(
      true,
    );

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    feedback,
    setFeedback,
  ] =
    useState<string | null>(
      null,
    );

  const [
    activeFilter,
    setActiveFilter,
  ] =
    useState<
      NotificationCenterFilter
    >(
      "ALL",
    );

  const [
    markingNotificationId,
    setMarkingNotificationId,
  ] =
    useState<string | null>(
      null,
    );

  const [
    markingAll,
    setMarkingAll,
  ] =
    useState<boolean>(
      false,
    );

  const [
    resendingDeliveryId,
    setResendingDeliveryId,
  ] =
    useState<string | null>(
      null,
    );

  const loadGenerationRef =
    useRef<number>(
      0,
    );

  // ==========================================================
  // LOAD SNAPSHOT
  // ==========================================================

  const refreshSnapshot =
    useCallback(
      async (
        showLoading:
          boolean = false,
      ): Promise<void> => {
        const generation =
          ++loadGenerationRef.current;

        if (!scopeReady) {
          if (
            generation ===
            loadGenerationRef.current
          ) {
            setSnapshot(
              null,
            );

            setLoading(
              false,
            );

            setError(
              "Notification Center scope is unavailable.",
            );
          }

          return;
        }

        if (showLoading) {
          setLoading(
            true,
          );
        }

        const result =
          await notificationCenterService
            .loadSnapshot(
              notificationScope,
            );

        if (
          generation !==
          loadGenerationRef.current
        ) {
          return;
        }

        if (!result.success) {
          setError(
            result.error,
          );

          setLoading(
            false,
          );

          return;
        }

        setSnapshot(
          result.snapshot,
        );

        setError(
          null,
        );

        setLoading(
          false,
        );
      },
      [
        notificationScope,
        scopeReady,
      ],
    );

  // ==========================================================
  // INITIAL LOAD + LIVE DATA SIGNAL
  // ==========================================================

  useEffect(() => {
    loadGenerationRef.current +=
      1;

    setSnapshot(
      null,
    );

    setError(
      null,
    );

    setFeedback(
      null,
    );

    const unsubscribe =
      subscribeNotificationDataChanged(
        (detail) => {
          if (
            !notificationDataChangeMatchesScope(
              detail,
              notificationScope,
            )
          ) {
            return;
          }

          void refreshSnapshot(
            false,
          );
        },
      );

    void refreshSnapshot(
      true,
    );

    return () => {
      loadGenerationRef.current +=
        1;

      unsubscribe();
    };
  }, [
    notificationScope,
    refreshSnapshot,
  ]);

  // ==========================================================
  // DERIVED DATA
  // ==========================================================

  const ownerNotifications =
    snapshot?.ownerNotifications ??
    [];

  const deliveryRows =
    snapshot?.deliveryRows ??
    [];

  const unreadOwnerNotifications =
    ownerNotifications.filter(
      (notification) =>
        notification.readState ===
        "UNREAD",
    );

  const failedDeliveryRows =
    deliveryRows.filter(
      (row) =>
        row.delivery.status ===
        "FAILED",
    );

  const deliveredCount =
    deliveryRows.filter(
      (row) =>
        row.delivery.status ===
        "DELIVERED",
    ).length;

  const pendingCount =
    deliveryRows.filter(
      (row) =>
        isPendingDelivery(
          row.delivery,
        ),
    ).length;

  const lastSentAt =
    resolveLastSentAt(
      deliveryRows,
    );

  const visibleOwnerNotifications =
    activeFilter ===
      "FAILED"
      ? []
      : activeFilter ===
          "UNREAD"
        ? unreadOwnerNotifications
        : ownerNotifications;

  const visibleDeliveryRows =
    activeFilter ===
      "UNREAD"
      ? []
      : activeFilter ===
          "FAILED"
        ? failedDeliveryRows
        : deliveryRows;

  // ==========================================================
  // MARK SINGLE READ
  // ==========================================================

  async function handleMarkRead(
    notification:
      OwnerNotificationRecord,
  ): Promise<void> {
    if (
      markingNotificationId ||
      markingAll
    ) {
      return;
    }

    setFeedback(
      null,
    );

    setError(
      null,
    );

    setMarkingNotificationId(
      notification.id,
    );

    const processingId =
      startFinoraProcessing(
        "Marking Notification as Read...",
      );

    try {
      const result =
        await notificationCenterService
          .markOwnerNotificationRead(
            notificationScope,
            notification.id,
          );

      if (!result.success) {
        setError(
          result.error,
        );

        return;
      }

      if (
        result.disposition ===
        "UPDATED"
      ) {
        setFeedback(
          "Notification marked as read.",
        );
      }

      await refreshSnapshot(
        false,
      );
    } finally {
      stopFinoraProcessing(
        processingId,
      );

      setMarkingNotificationId(
        null,
      );
    }
  }

  // ==========================================================
  // MARK ALL READ
  // ==========================================================

  async function handleMarkAllRead():
    Promise<void> {
    if (
      markingAll ||
      unreadOwnerNotifications.length ===
        0
    ) {
      return;
    }

    setFeedback(
      null,
    );

    setError(
      null,
    );

    setMarkingAll(
      true,
    );

    const processingId =
      startFinoraProcessing(
        "Marking All Notifications as Read...",
      );

    try {
      const result =
        await notificationCenterService
          .markAllOwnerNotificationsRead(
            notificationScope,
          );

      if (!result.success) {
        setError(
          result.error,
        );

        await refreshSnapshot(
          false,
        );

        return;
      }

      setFeedback(
        result.report.updated > 0
          ? `${result.report.updated} notification(s) marked as read.`
          : "No unread notifications required an update.",
      );

      await refreshSnapshot(
        false,
      );
    } finally {
      stopFinoraProcessing(
        processingId,
      );

      setMarkingAll(
        false,
      );
    }
  }

  // ==========================================================
  // MANUAL RESEND
  // ==========================================================

  async function handleManualResend(
    delivery:
      NotificationDeliveryRecord,
  ): Promise<void> {
    if (
      resendingDeliveryId ||
      !isManualResendEligible(
        delivery,
      )
    ) {
      return;
    }

    setFeedback(
      null,
    );

    setError(
      null,
    );

    setResendingDeliveryId(
      delivery.id,
    );

    const processingId =
      startFinoraProcessing(
        "Scheduling Notification Resend...",
      );

    try {
      const result =
        await notificationCenterService
          .requestManualResend(
            notificationScope,
            delivery.id,
          );

      if (!result.success) {
        setError(
          result.error,
        );

        return;
      }

      setFeedback(
        result.disposition ===
          "CREATED"
          ? "Resend scheduled. Delivery status will update independently."
          : "Existing resend request retained. Delivery status will update independently.",
      );

      await refreshSnapshot(
        false,
      );
    } finally {
      stopFinoraProcessing(
        processingId,
      );

      setResendingDeliveryId(
        null,
      );
    }
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <section style={styles.page}>
      <div style={styles.pageInner}>
        {/* ===================================================
            HEADER
        =================================================== */}

        <header style={styles.header}>
          <div style={styles.headerContent}>
            <span style={styles.eyebrow}>
              Notifications Engine
            </span>

            <h1 style={styles.title}>
              Notification Center
            </h1>

            <p style={styles.subtitle}>
              Review owner alerts, customer delivery status,
              retry information, failures and explicit resend requests.
            </p>
          </div>

          <div style={styles.headerActions}>
            <button
              type="button"
              style={{
                ...styles.secondaryButton,
                ...(
                  loading
                    ? styles.disabledButton
                    : {}
                ),
              }}
              disabled={loading}
              onClick={() => {
                setFeedback(
                  null,
                );

                void refreshSnapshot(
                  true,
                );
              }}
            >
              {loading
                ? "Refreshing..."
                : "Refresh"}
            </button>

            <button
              type="button"
              style={{
                ...styles.primaryButton,
                ...(
                  markingAll ||
                  unreadOwnerNotifications.length ===
                    0
                    ? styles.disabledButton
                    : {}
                ),
              }}
              disabled={
                markingAll ||
                unreadOwnerNotifications.length ===
                  0
              }
              onClick={() => {
                void handleMarkAllRead();
              }}
            >
              {markingAll
                ? "Marking..."
                : "Mark All Read"}
            </button>
          </div>
        </header>

        {/* ===================================================
            FEEDBACK
        =================================================== */}

        {error && (
          <div style={styles.errorBox}>
            {error}
          </div>
        )}

        {feedback && (
          <div style={styles.successBox}>
            {feedback}
          </div>
        )}

        {/* ===================================================
            METRICS
        =================================================== */}

        <div style={styles.metricGrid}>
          <div
            style={{
              ...styles.metricCard,
              ...styles.metricUnread,
            }}
          >
            <span style={styles.metricLabel}>
              Owner Unread
            </span>

            <strong style={styles.metricValue}>
              {snapshot?.unreadCount ?? 0}
            </strong>
          </div>

          <div style={styles.metricCard}>
            <span style={styles.metricLabel}>
              Deliveries
            </span>

            <strong style={styles.metricValue}>
              {deliveryRows.length}
            </strong>
          </div>

          <div
            style={{
              ...styles.metricCard,
              ...styles.metricDelivered,
            }}
          >
            <span style={styles.metricLabel}>
              Delivered
            </span>

            <strong style={styles.metricValue}>
              {deliveredCount}
            </strong>
          </div>

          <div
            style={{
              ...styles.metricCard,
              ...styles.metricFailed,
            }}
          >
            <span style={styles.metricLabel}>
              Failed
            </span>

            <strong style={styles.metricValue}>
              {failedDeliveryRows.length}
            </strong>
          </div>
        </div>

        {/* ===================================================
            FILTER TOOLBAR
        =================================================== */}

        <div style={styles.toolbar}>
          <div style={styles.filterGroup}>
            {(
              [
                [
                  "ALL",
                  "All",
                ],
                [
                  "UNREAD",
                  "Unread Owner",
                ],
                [
                  "FAILED",
                  "Failed Delivery",
                ],
              ] as const
            ).map(
              ([
                value,
                label,
              ]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={
                    activeFilter ===
                    value
                  }
                  style={{
                    ...styles.filterButton,
                    ...(
                      activeFilter ===
                        value
                        ? styles.filterButtonActive
                        : {}
                    ),
                  }}
                  onClick={() => {
                    setActiveFilter(
                      value,
                    );
                  }}
                >
                  {label}
                </button>
              ),
            )}
          </div>

          <div style={styles.toolbarMeta}>
            Pending: {pendingCount}
            {" | "}
            Last sent: {formatDateTime(lastSentAt)}
          </div>
        </div>

        {/* ===================================================
            LOADING
        =================================================== */}

        {loading && !snapshot && (
          <div style={styles.panel}>
            <div style={styles.stateBox}>
              <h2 style={styles.stateTitle}>
                Loading Notification Center
              </h2>

              <p style={styles.stateText}>
                Reading persisted owner notifications and
                customer delivery lifecycle records.
              </p>
            </div>
          </div>
        )}

        {/* ===================================================
            WORKSPACE
        =================================================== */}

        {!loading && snapshot && (
          <div style={styles.workspace}>
            {/* =================================================
                OWNER NOTIFICATIONS
            ================================================= */}

            {activeFilter !==
              "FAILED" && (
              <section style={styles.panel}>
                <div style={styles.panelHeader}>
                  <div style={styles.panelHeading}>
                    <h2 style={styles.panelTitle}>
                      Owner Notifications
                    </h2>

                    <p style={styles.panelSubtitle}>
                      In-app alerts. Unread state drives the global bell badge.
                    </p>
                  </div>

                  <span style={styles.countBadge}>
                    {visibleOwnerNotifications.length}
                  </span>
                </div>

                {visibleOwnerNotifications.length ===
                0 ? (
                  <div style={styles.stateBox}>
                    <h3 style={styles.stateTitle}>
                      No owner notifications
                    </h3>

                    <p style={styles.stateText}>
                      No notifications match the current filter.
                    </p>
                  </div>
                ) : (
                  <div style={styles.list}>
                    {visibleOwnerNotifications.map(
                      (
                        notification,
                      ) => {
                        const isUnread =
                          notification.readState ===
                          "UNREAD";

                        const isMarking =
                          markingNotificationId ===
                          notification.id;

                        return (
                          <article
                            key={notification.id}
                            style={{
                              ...styles.listItem,
                              ...(
                                isUnread
                                  ? styles.unreadListItem
                                  : {}
                              ),
                            }}
                          >
                            <div style={styles.listItemTop}>
                              <div style={styles.listItemContent}>
                                <div style={styles.filterGroup}>
                                  <span
                                    style={{
                                      ...styles.badge,
                                      ...(
                                        isUnread
                                          ? styles.badgeBrand
                                          : styles.badgeNeutral
                                      ),
                                    }}
                                  >
                                    {notification.readState}
                                  </span>

                                  <span
                                    style={{
                                      ...styles.badge,
                                      ...styles.badgeNeutral,
                                    }}
                                  >
                                    {notification.eventType}
                                  </span>

                                  <span
                                    style={{
                                      ...styles.badge,
                                      ...styles.badgeNeutral,
                                    }}
                                  >
                                    {notification.priority}
                                  </span>
                                </div>

                                <h3 style={styles.listItemTitle}>
                                  {notification.title}
                                </h3>

                                <p style={styles.listItemMessage}>
                                  {notification.message}
                                </p>
                              </div>

                              {isUnread && (
                                <div style={styles.listItemActions}>
                                  <button
                                    type="button"
                                    style={{
                                      ...styles.compactActionButton,
                                      ...(
                                        isMarking
                                          ? styles.disabledButton
                                          : {}
                                      ),
                                    }}
                                    disabled={isMarking}
                                    onClick={() => {
                                      void handleMarkRead(
                                        notification,
                                      );
                                    }}
                                  >
                                    {isMarking
                                      ? "Marking..."
                                      : "Mark Read"}
                                  </button>
                                </div>
                              )}
                            </div>

                            <div style={styles.metadataGrid}>
                              <div style={styles.metadataItem}>
                                <span style={styles.metadataLabel}>
                                  Created
                                </span>

                                <span style={styles.metadataValue}>
                                  {formatDateTime(
                                    notification.createdAt,
                                  )}
                                </span>
                              </div>

                              <div style={styles.metadataItem}>
                                <span style={styles.metadataLabel}>
                                  Scheduled
                                </span>

                                <span style={styles.metadataValue}>
                                  {formatDateTime(
                                    notification.scheduledFor,
                                  )}
                                </span>
                              </div>

                              <div style={styles.metadataItem}>
                                <span style={styles.metadataLabel}>
                                  Source
                                </span>

                                <span style={styles.metadataValue}>
                                  {formatStructuredValue(
                                    notification.source,
                                  )}
                                </span>
                              </div>

                              <div style={styles.metadataItem}>
                                <span style={styles.metadataLabel}>
                                  Read At
                                </span>

                                <span style={styles.metadataValue}>
                                  {formatDateTime(
                                    notification.readAt,
                                  )}
                                </span>
                              </div>
                            </div>
                          </article>
                        );
                      },
                    )}
                  </div>
                )}
              </section>
            )}

            {/* =================================================
                CUSTOMER DELIVERIES
            ================================================= */}

            {activeFilter !==
              "UNREAD" && (
              <section style={styles.panel}>
                <div style={styles.panelHeader}>
                  <div style={styles.panelHeading}>
                    <h2 style={styles.panelTitle}>
                      Customer Deliveries
                    </h2>

                    <p style={styles.panelSubtitle}>
                      SMS, WhatsApp and Email delivery lifecycle,
                      retry state and failure details.
                    </p>
                  </div>

                  <span style={styles.countBadge}>
                    {visibleDeliveryRows.length}
                  </span>
                </div>

                {visibleDeliveryRows.length ===
                0 ? (
                  <div style={styles.stateBox}>
                    <h3 style={styles.stateTitle}>
                      No delivery records
                    </h3>

                    <p style={styles.stateText}>
                      No customer deliveries match the current filter.
                    </p>
                  </div>
                ) : (
                  <div style={styles.list}>
                    {visibleDeliveryRows.map(
                      (
                        row,
                      ) => {
                        const {
                          delivery,
                          notification,
                        } = row;

                        const resendEligible =
                          isManualResendEligible(
                            delivery,
                          );

                        const isResending =
                          resendingDeliveryId ===
                          delivery.id;

                        return (
                          <article
                            key={delivery.id}
                            style={styles.listItem}
                          >
                            <div style={styles.listItemTop}>
                              <div style={styles.listItemContent}>
                                <div style={styles.filterGroup}>
                                  <span
                                    style={{
                                      ...styles.badge,
                                      ...styles.badgeNeutral,
                                    }}
                                  >
                                    {delivery.channel}
                                  </span>

                                  <span
                                    style={getDeliveryStatusStyle(
                                      delivery,
                                      styles,
                                    )}
                                  >
                                    {delivery.status}
                                  </span>

                                  {notification?.eventType && (
                                    <span
                                      style={{
                                        ...styles.badge,
                                        ...styles.badgeNeutral,
                                      }}
                                    >
                                      {notification.eventType}
                                    </span>
                                  )}
                                </div>

                                <h3 style={styles.listItemTitle}>
                                  {notification?.title ??
                                    "Customer Notification"}
                                </h3>

                                {notification?.message && (
                                  <p style={styles.listItemMessage}>
                                    {notification.message}
                                  </p>
                                )}
                              </div>

                              {resendEligible && (
                                <div style={styles.listItemActions}>
                                  <button
                                    type="button"
                                    style={{
                                      ...styles.compactActionButton,
                                      ...(
                                        isResending
                                          ? styles.disabledButton
                                          : {}
                                      ),
                                    }}
                                    disabled={isResending}
                                    onClick={() => {
                                      void handleManualResend(
                                        delivery,
                                      );
                                    }}
                                  >
                                    {isResending
                                      ? "Scheduling..."
                                      : "Resend"}
                                  </button>
                                </div>
                              )}
                            </div>

                            <div style={styles.metadataGrid}>
                              <div style={styles.metadataItem}>
                                <span style={styles.metadataLabel}>
                                  Recipient
                                </span>

                                <span style={styles.metadataValue}>
                                  {formatRecipient(
                                    delivery.recipient,
                                  )}
                                </span>
                              </div>

                              <div style={styles.metadataItem}>
                                <span style={styles.metadataLabel}>
                                  Attempts
                                </span>

                                <span style={styles.metadataValue}>
                                  {delivery.attemptCount}
                                </span>
                              </div>

                              <div style={styles.metadataItem}>
                                <span style={styles.metadataLabel}>
                                  Last Attempt
                                </span>

                                <span style={styles.metadataValue}>
                                  {formatDateTime(
                                    delivery.lastAttemptAt,
                                  )}
                                </span>
                              </div>

                              <div style={styles.metadataItem}>
                                <span style={styles.metadataLabel}>
                                  Last Sent
                                </span>

                                <span style={styles.metadataValue}>
                                  {formatDateTime(
                                    delivery.sentAt,
                                  )}
                                </span>
                              </div>

                              <div style={styles.metadataItem}>
                                <span style={styles.metadataLabel}>
                                  Delivered
                                </span>

                                <span style={styles.metadataValue}>
                                  {formatDateTime(
                                    delivery.deliveredAt,
                                  )}
                                </span>
                              </div>

                              <div style={styles.metadataItem}>
                                <span style={styles.metadataLabel}>
                                  Next Retry
                                </span>

                                <span style={styles.metadataValue}>
                                  {formatDateTime(
                                    delivery.nextRetryAt,
                                  )}
                                </span>
                              </div>

                              <div style={styles.metadataItem}>
                                <span style={styles.metadataLabel}>
                                  Resend Requested
                                </span>

                                <span style={styles.metadataValue}>
                                  {formatDateTime(
                                    delivery.resendRequestedAt,
                                  )}
                                </span>
                              </div>

                              <div style={styles.metadataItem}>
                                <span style={styles.metadataLabel}>
                                  Provider Message
                                </span>

                                <span style={styles.metadataValue}>
                                  {normalizeString(
                                    delivery.providerMessageId,
                                  ) || "--"}
                                </span>
                              </div>
                            </div>

                            {(
                              delivery.failureCode ||
                              delivery.failureMessage
                            ) && (
                              <p style={styles.failureText}>
                                {normalizeString(
                                  delivery.failureCode,
                                ) || "DELIVERY_FAILURE"}

                                {delivery.failureMessage
                                  ? `: ${delivery.failureMessage}`
                                  : ""}
                              </p>
                            )}
                          </article>
                        );
                      },
                    )}
                  </div>
                )}
              </section>
            )}
          </div>
        )}


        <div
          aria-hidden="true"
          style={styles.responsiveMeta}
        />
      </div>
    </section>
  );
}

// ============================================================
// END
// ============================================================
