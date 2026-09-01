/* ===========================================================
   FINORA ENTERPRISE OS™

   GLOBAL HEADER™

   TYPES
=========================================================== */

export interface GlobalHeaderProps {

  department: string;

  onBack: () => void;

  canGoBack: boolean;

  onLogout: () => void;

  notificationUnreadCount?: number;

  onNotificationsClick?: () => void;

}