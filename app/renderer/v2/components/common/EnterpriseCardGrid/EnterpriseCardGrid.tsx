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

        gap: `${resolvedGap}px`,

        ...style,

      }}

    >

      {Array.isArray(children)

        ? children.map((child, index) => (

            <div

              key={index}

              style={itemStyle}

            >

              {child}

            </div>

          ))

        : (

          <div style={itemStyle}>

            {children}

          </div>

        )}

    </section>

  );

}
