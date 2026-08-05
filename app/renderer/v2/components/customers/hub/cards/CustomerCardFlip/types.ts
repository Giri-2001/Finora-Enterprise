/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER CARD FLIP
   -----------------------------------------------------------
   Module  : Customer Hub
   Layer   : Cards
   Version : 2.0
   Status  : Production
=========================================================== */

import type { ReactNode } from "react";

/* ===========================================================
   CUSTOMER CARD FLIP PROPS
=========================================================== */

export interface CustomerCardFlipProps {

  front: ReactNode;

  back: ReactNode;

  flipped?: boolean;

  animationDuration?: number;

  perspective?: number;

  onFlip?: () => void;

}
