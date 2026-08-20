/* ===========================================================
   FINORA ENTERPRISE OS™

   NOTIFICATION BELL™

   HELPERS

   RESPONSIBILITY:
   - Normalize notification count
   - Never invent notification data
   - Keep notification state controlled by the caller

   IMPORTANT:
   - No dummy/default unread count.
   - No local notification state.
=========================================================== */


/* ===========================================================
   HELPERS
=========================================================== */

export function buildUnreadCount(
  count?: number,
): number {

  if (
    typeof count !== "number" ||
    !Number.isFinite(count) ||
    count <= 0
  ) {

    return 0;

  }

  return Math.floor(
    count,
  );

}


/* ===========================================================
   END
=========================================================== */