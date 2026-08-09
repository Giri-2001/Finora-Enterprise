/* ===========================================================
   FINORA ENTERPRISE OS™

   ENTERPRISE CARD GRID™

   COMPONENT
=========================================================== */

import type {
  EnterpriseCardGridProps,
} from "./types";

import {
  resolveColumns,
  resolveGap,
} from "./helpers";

import {
  containerStyle,
  itemStyle,
} from "./styles";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function EnterpriseCardGrid({

  children,

  columns,

  gap,

  style,

}: EnterpriseCardGridProps) {

  const resolvedColumns =
    resolveColumns(columns);

  const resolvedGap =
    resolveGap(gap);

  return (

    <section

      style={{

        ...containerStyle,

        gridTemplateColumns:
          `repeat(${resolvedColumns}, minmax(0,1fr))`,

        gap:
          `${resolvedGap}px`,

        ...style,

      }}

    >

      {Array.isArray(children)

        ? children.map((child, index) => (

            <div

              key={index}

              style={itemStyle}

              onClick={(event) => {

                /*
                 * CUSTOMER CARD EVENT ISOLATION
                 *
                 * Prevent the parent empty-area
                 * click handler from clearing selection
                 * when a customer card is clicked.
                 */

                event.stopPropagation();

              }}

            >

              {child}

            </div>

          ))

        : (

          <div

            style={itemStyle}

            onClick={(event) => {

              event.stopPropagation();

            }}

          >

            {children}

          </div>

        )}

    </section>

  );

}
