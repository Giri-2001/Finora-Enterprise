/* ===========================================================
   FINORA ENTERPRISE OS™
   ENTERPRISE TOOLBAR™

   COMPONENT
=========================================================== */

import type {
  EnterpriseToolbarProps,
} from "./types";

import {

  buildCounterLabel,

  normalizeSearchValue,

  hasAction,

} from "./helpers";

import {

  containerStyle,

  leftStyle,

  centerStyle,

  rightStyle,

  actionButtonStyle,

  counterStyle,

} from "./styles";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function EnterpriseToolbar({

  actionLabel,

  onActionClick,

  actionIcon,

  searchPlaceholder,

  searchValue,

  onSearchChange,

  searchComponent,

  counterLabel,

  counterValue,

}: EnterpriseToolbarProps) {

  return (

    <section style={containerStyle}>

      {/* ==========================================
          LEFT
      ========================================== */}

      <div style={leftStyle}>

        {hasAction(actionLabel) && (

          <button

            type="button"

            onClick={onActionClick}

            style={actionButtonStyle}

          >

            {actionIcon}

            {actionIcon ? " " : ""}

            {actionLabel}

          </button>

        )}

      </div>

      {/* ==========================================
          CENTER
      ========================================== */}

      <div style={centerStyle}>

        {searchComponent ?? (

          <input

            type="text"

            placeholder={searchPlaceholder}

            value={normalizeSearchValue(searchValue)}

            onChange={(event) =>

              onSearchChange?.(

                event.target.value,

              )

            }

            style={{

              width: "100%",

              maxWidth: "480px",

              height: "46px",

              borderRadius: "12px",

              border: "1px solid #D4AF37",

              padding: "0 16px",

              fontSize: "14px",

              outline: "none",

              background: "#FFFFFF",

            }}

          />

        )}

      </div>

      {/* ==========================================
          RIGHT
      ========================================== */}

      <div style={rightStyle}>

        <div style={counterStyle}>

          {

            buildCounterLabel(

              counterLabel,

              counterValue,

            )

          }

        </div>

      </div>

    </section>

  );

}
