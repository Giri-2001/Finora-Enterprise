/* ============================================================
   FINORA ENTERPRISE OS
   LOAN STUDIO EXTRACTED LAYOUT STYLES
   ============================================================ */

import type {
  CSSProperties,
} from "react";

import {
  step1WorkspaceStyle,
  step1BottomStyle,
  step1FormStyle,
  step1PreviewStyle,
} from "./LoanStudio.styles";

const THEME = {
  surfaceStrong:
    "var(--finora-theme-surface-strong, #111C2E)",
  surfaceStrongAlt:
    "var(--finora-theme-surface, #142238)",
  textPrimary:
    "var(--finora-theme-text-inverse, #FFFFFF)",
  textSecondary:
    "var(--finora-theme-text-secondary, #CBD5E1)",
  brand:
    "var(--finora-theme-brand-primary, #2563EB)",
  warningSoft:
    "var(--finora-theme-warning-soft, rgba(245, 158, 11, 0.14))",
  warning:
    "var(--finora-theme-warning, #FCD34D)",
  warningBorder:
    "var(--finora-theme-warning-border, rgba(245, 158, 11, 0.30))",
  border:
    "var(--finora-theme-border-default, rgba(148, 163, 184, 0.20))",
  shadow:
    "var(--finora-theme-overlay-shadow, rgba(0, 0, 0, 0.14))",
} as const;

/* ============================================================
   STEP2WORKSPACESTYLE
============================================================ */

export const step2WorkspaceStyle: CSSProperties = {

              width: "100%",
              minWidth: 0,
              minHeight: 0,
              boxSizing: "border-box",
              overflow: "auto",
              paddingRight: "2px",
              paddingBottom: "4px",
            
};

/* ============================================================
   STEP2GRIDSTYLE
============================================================ */

export const step2GridStyle: CSSProperties = {

                width: "100%",
                minWidth: 0,
                display: "grid",
                gridTemplateColumns:
                  "minmax(0, 55%) minmax(0, 45%)",
                gap: "8px",
                alignItems: "start",
                boxSizing: "border-box",
              
};

/* ============================================================
   STEP2LEFTCOLUMNSTYLE
============================================================ */

export const step2LeftColumnStyle: CSSProperties = {

                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                
};

/* ============================================================
   STEP2SUMMARYWRAPPERSTYLE
============================================================ */

export const step2SummaryWrapperStyle: CSSProperties = {

                    width: "100%",
                    minWidth: 0,
                  
};

/* ============================================================
   STEP2PREVIEWDRAFTSTACKSTYLE
============================================================ */

export const step2PreviewDraftStackStyle: CSSProperties = {

                    width: "100%",
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    alignItems: "stretch",
                    boxSizing: "border-box",
                  
};

/* ============================================================
   STEP2PREVIEWWRAPPERSTYLE
============================================================ */

export const step2PreviewWrapperStyle: CSSProperties = {

                      minWidth: 0,
                      width: "100%",
                      boxSizing: "border-box",
                    
};

/* ============================================================
   REPAYMENTDRAFTSTYLE
============================================================ */

export const repaymentDraftStyle: CSSProperties = {

                      width: "100%",
                      minWidth: 0,
                      height: "92px",
                      minHeight: "92px",
                      boxSizing: "border-box",
                      padding: "12px 14px",
                      border:
                        `1px solid ${THEME.border}`,
                      borderRadius: "16px",
                      background:
                        `linear-gradient(180deg, ${THEME.surfaceStrong}, ${THEME.surfaceStrongAlt})`,
                      color: THEME.textPrimary,
                      boxShadow:
                        THEME.shadow,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      overflow: "hidden",
                    
};

/* ============================================================
   REPAYMENTDRAFTHEADERSTYLE
============================================================ */

export const repaymentDraftHeaderStyle: CSSProperties = {

                        width: "100%",
                        minWidth: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "10px",
                      
};

/* ============================================================
   REPAYMENTDRAFTTITLESTYLE
============================================================ */

export const repaymentDraftTitleStyle: CSSProperties = {

                          minWidth: 0,
                          paddingLeft: "10px",
                          borderLeft:
                            "3px solid #2563EB",
                          fontSize: "16px",
                          fontWeight: 700,
                          lineHeight: 1.25,
                          color: THEME.textPrimary,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        
};

/* ============================================================
   REPAYMENTDRAFTBADGESTYLE
============================================================ */

export const repaymentDraftBadgeStyle: CSSProperties = {

                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          padding: "5px 11px",
                          borderRadius: "999px",
                          fontSize: "12px",
                          fontWeight: 700,
                          lineHeight: 1,
                          background:
                            THEME.warningSoft,
                          color: THEME.warning,
                          border:
                            `1px solid ${THEME.warningBorder}`,
                        
};

/* ============================================================
   REPAYMENTDRAFTUPDATEDSTYLE
============================================================ */

export const repaymentDraftUpdatedStyle: CSSProperties = {

                        paddingLeft: "13px",
                        color: THEME.textSecondary,
                        fontSize: "12px",
                        fontWeight: 500,
                        lineHeight: 1.3,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      
};

/* ============================================================
   STEP2SCHEDULEWRAPPERSTYLE
============================================================ */

export const step2ScheduleWrapperStyle: CSSProperties = {

                  minWidth: 0,
                  width: "100%",
                  boxSizing: "border-box",
                
};

/* ============================================================
   STEP5WORKSPACESTYLE
============================================================ */

export const step5WorkspaceStyle: CSSProperties = {

              ...step1WorkspaceStyle,
              overflow: "visible",
            
};

/* ============================================================
   STEP5BOTTOMSTYLE
============================================================ */

export const step5BottomStyle: CSSProperties = {

                ...step1BottomStyle,
                height: "auto",
                overflow: "visible",
                alignItems: "start",
              
};

/* ============================================================
   STEP5CHECKLISTCOLUMNSTYLE
============================================================ */

export const step5ChecklistColumnStyle: CSSProperties = {

                  ...step1FormStyle,
                  height: "auto",
                  minHeight: 0,
                  overflow: "visible",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                
};

/* ============================================================
   STEP5PREVIEWCOLUMNSTYLE
============================================================ */

export const step5PreviewColumnStyle: CSSProperties = {

                  ...step1PreviewStyle,
                  height: "auto",
                  minHeight: 0,
                  overflow: "visible",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                
};

/* ============================================================
   STEP6WORKSPACESTYLE
============================================================ */

export const step6WorkspaceStyle: CSSProperties = {

              ...step1WorkspaceStyle,
              overflow: "visible",
            
};

/* ============================================================
   STEP6BOTTOMSTYLE
============================================================ */

export const step6BottomStyle: CSSProperties = {

                ...step1BottomStyle,
                height: "auto",
                minHeight: 0,
                overflow: "visible",
                alignItems: "start",
                alignContent: "start",
              
};

/* ============================================================
   STEP6PAYMENTMODEWRAPPERSTYLE
============================================================ */

export const step6PaymentModeWrapperStyle: CSSProperties = {

    width: "100%",
    minWidth: 0,
    margin: 0,
    padding: 0,
    boxSizing: "border-box",
  
};

/* ============================================================
   STEP6PREVIEWCOLUMNSTYLE
============================================================ */

export const step6PreviewColumnStyle: CSSProperties = {

                  ...step1PreviewStyle,
                  height: "auto",
                  minHeight: 0,
                  overflow: "visible",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                
};

/* ============================================================
   END
============================================================ */