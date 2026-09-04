/* ===========================================================
   FINORA ENTERPRISE OS™

   GLOBAL HEADER™

   TYPES
=========================================================== */

export interface GlobalHeaderProps {

  department: string;

  onBack: () => void;

  canGoBack: boolean;

  onRefreshCurrentPage?: () => void;

  onLogout: () => void;

  notificationUnreadCount?: number;

  onNotificationsClick?: () => void;

  onWalletClick?: () => void;
}
