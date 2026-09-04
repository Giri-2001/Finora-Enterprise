import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";

import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import type {
  FinoraCalendarProps,
  FinoraCalendarRangeValue,
} from "./FinoraCalendar.types";

import {
  buildCalendarDays,
  displayToIsoDate,
  formatDisplayDate,
  formatIsoDate,
  getMonthStart,
  getRangeDurationDays,
  getRelativeDayIndicator,
  isDateWithinBoundary,
  isSameDay,
  isSameMonth,
  isoToDisplayDate,
  normalizeTypedDate,
  parseIsoDate,
} from "./FinoraCalendar.helpers";

import "./FinoraCalendar.css";


const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAYS = [
  "SUN",
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
];


function formatRangeSummaryDate(
  value: string,
): string {

  const date =
    parseIsoDate(value);

  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(date);
}


function buildYears(
  min?: string,
  max?: string,
): number[] {

  const minimumYear =
    parseIsoDate(min ?? "")
      ?.getFullYear() ??
    1900;

  const maximumYear =
    parseIsoDate(max ?? "")
      ?.getFullYear() ??
    new Date().getFullYear() + 100;

  const start =
    Math.max(
      1,
      Math.min(
        minimumYear,
        maximumYear,
      ),
    );

  const end =
    Math.max(
      start,
      Math.max(
        minimumYear,
        maximumYear,
      ),
    );

  return Array.from(
    {
      length:
        end - start + 1,
    },
    (_, index) =>
      end - index,
  );
}


export default function FinoraCalendar(
  props: FinoraCalendarProps,
) {

  const {
    min,
    max,
    disabled = false,
    allowClear = true,
    allowToday = true,
    placeholder = "DD/MM/YYYY",
    ariaLabel = "Date",
    showRelativeDay = true,
    themeOverride,
  } = props;

  const rangeMode =
    props.mode === "range";
  const scopedThemeStyle =
    useMemo<CSSProperties | undefined>(
      () => {

        if (!themeOverride) {
          return undefined;
        }

        return {
          "--finora-theme-page":
            themeOverride.page,

          "--finora-theme-background-page":
            themeOverride.page,

          "--finora-theme-surface":
            themeOverride.surface,

          "--finora-theme-background-surface":
            themeOverride.surface,

          "--finora-theme-surface-elevated":
            themeOverride.surface,

          "--finora-theme-background-surface-elevated":
            themeOverride.surface,

          "--finora-theme-surface-muted":
            themeOverride.surfaceMuted,

          "--finora-theme-background-surface-muted":
            themeOverride.surfaceMuted,

          "--finora-theme-surface-strong":
            themeOverride.surfaceMuted,

          "--finora-theme-text-primary":
            themeOverride.textPrimary,

          "--finora-theme-text-secondary":
            themeOverride.textSecondary,

          "--finora-theme-text-body":
            themeOverride.textSecondary,

          "--finora-theme-text-muted":
            themeOverride.textMuted,

          "--finora-theme-brand-primary":
            themeOverride.brand,

          "--finora-theme-brand-secondary":
            themeOverride.brand,

          "--finora-theme-brand-accent":
            themeOverride.brand,

          "--finora-theme-brand-accent-soft":
            themeOverride.surfaceMuted,

          "--finora-theme-border-default":
            themeOverride.border,

          "--finora-theme-border-subtle":
            themeOverride.border,

          "--finora-theme-border-strong":
            themeOverride.borderStrong,

          "--finora-theme-border-focus":
            themeOverride.brand,

          "--finora-theme-focus":
            themeOverride.brand,

          "--finora-theme-interactive-hover":
            themeOverride.surfaceMuted,

          "--finora-theme-interactive-active":
            themeOverride.surfaceMuted,

          "--finora-theme-interactive-selected":
            themeOverride.brand,

          "--finora-theme-interactive-focus":
            themeOverride.brand,

          "--finora-theme-overlay-shadow":
            themeOverride.shadow,

          "--finora-theme-card-background":
            themeOverride.surface,

          "--finora-theme-card-border":
            themeOverride.border,

          "--finora-theme-card-shadow":
            themeOverride.shadow,

          "--finora-theme-input-background":
            themeOverride.surfaceMuted,

          "--finora-theme-input-border":
            themeOverride.border,

          "--finora-theme-input-text":
            themeOverride.textPrimary,

          "--finora-theme-input-placeholder":
            themeOverride.textMuted,

          "--finora-theme-input-focus-border":
            themeOverride.brand,

          "--finora-theme-input-focus-background":
            themeOverride.surfaceMuted,
        } as CSSProperties;
      },
      [
        themeOverride,
      ],
    );

  const rootRef =
    useRef<HTMLDivElement | null>(null);

  const popupRef =
    useRef<HTMLDivElement | null>(null);

  const monthListRef =
    useRef<HTMLDivElement | null>(null);

  const yearListRef =
    useRef<HTMLDivElement | null>(null);

  const selectedSingleValue =
    rangeMode
      ? ""
      : props.value;

  const rangeValue:
    FinoraCalendarRangeValue =
      rangeMode
        ? props.value
        : {
            from: "",
            to: "",
          };

  const initialDate =
    parseIsoDate(
      rangeMode
        ? rangeValue.from ||
            rangeValue.to
        : selectedSingleValue,
    ) ??
    parseIsoDate(max ?? "") ??
    new Date();

  const [
    isOpen,
    setIsOpen,
  ] =
    useState(false);

  const [
    isMonthOpen,
    setIsMonthOpen,
  ] =
    useState(false);

  const [
    isYearOpen,
    setIsYearOpen,
  ] =
    useState(false);

  const [
    visibleMonth,
    setVisibleMonth,
  ] =
    useState(
      getMonthStart(
        initialDate,
      ),
    );

  const [
    activeRangeEdge,
    setActiveRangeEdge,
  ] =
    useState<"from" | "to">(
      "from",
    );

  const [
    singleDraft,
    setSingleDraft,
  ] =
    useState(
      isoToDisplayDate(
        selectedSingleValue,
      ),
    );

  const [
    fromDraft,
    setFromDraft,
  ] =
    useState(
      isoToDisplayDate(
        rangeValue.from,
      ),
    );

  const [
    toDraft,
    setToDraft,
  ] =
    useState(
      isoToDisplayDate(
        rangeValue.to,
      ),
    );

  useEffect(() => {
    if (!rangeMode) {
      setSingleDraft(
        isoToDisplayDate(
          props.value,
        ),
      );
    }
  }, [
    props,
    rangeMode,
  ]);

  useEffect(() => {
    if (!rangeMode) {
      return;
    }

    setFromDraft(
      isoToDisplayDate(
        props.value.from,
      ),
    );

    setToDraft(
      isoToDisplayDate(
        props.value.to,
      ),
    );
  }, [
    props,
    rangeMode,
  ]);

  const selectedDate =
    useMemo(
      () =>
        parseIsoDate(
          selectedSingleValue,
        ),
      [
        selectedSingleValue,
      ],
    );

  const relativeDayIndicator =
    !rangeMode &&
    showRelativeDay
      ? getRelativeDayIndicator(
          selectedSingleValue,
        )
      : null;

  const fromDate =
    useMemo(
      () =>
        parseIsoDate(
          rangeValue.from,
        ),
      [
        rangeValue.from,
      ],
    );

  const toDate =
    useMemo(
      () =>
        parseIsoDate(
          rangeValue.to,
        ),
      [
        rangeValue.to,
      ],
    );

  const calendarDays =
    useMemo(
      () =>
        buildCalendarDays(
          visibleMonth,
        ),
      [
        visibleMonth,
      ],
    );

  const years =
    useMemo(
      () =>
        buildYears(
          min,
          max,
        ),
      [
        min,
        max,
      ],
    );

  const durationDays =
    useMemo(
      () =>
        rangeMode
          ? getRangeDurationDays(
              rangeValue.from,
              rangeValue.to,
            )
          : null,
      [
        rangeMode,
        rangeValue.from,
        rangeValue.to,
      ],
    );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(
      event: MouseEvent,
    ): void {

      const target =
        event.target as Node;

      if (
        rootRef.current?.contains(
          target,
        ) ||
        popupRef.current?.contains(
          target,
        )
      ) {
        return;
      }

      setIsOpen(false);
      setIsMonthOpen(false);
      setIsYearOpen(false);
    }

    document.addEventListener(
      "mousedown",
      handlePointerDown,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handlePointerDown,
      );
    };
  }, [
    isOpen,
  ]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const updatePopupPosition =
      () => {

        const inputWrap =
          rootRef.current
            ?.querySelector<HTMLElement>(
              ".finora-calendar-input-wrap",
            );

        const popup =
          popupRef.current;

        if (
          !inputWrap ||
          !popup
        ) {
          return;
        }

        const rect =
          inputWrap.getBoundingClientRect();

        const gap =
          6;

        const viewportPadding =
          10;

        const preferredPopupWidth =
          290;

        const maximumPopupWidth =
          Math.max(
            0,
            window.innerWidth -
              viewportPadding * 2,
          );

        const popupWidth =
          Math.min(
            maximumPopupWidth,
            Math.max(
              rect.width,
              preferredPopupWidth,
            ),
          );

        popup.style.width =
          `${popupWidth}px`;

        popup.style.left =
          `${Math.max(
            viewportPadding,
            Math.min(
              rect.left,
              window.innerWidth -
                popupWidth -
                viewportPadding,
            ),
          )}px`;

        const popupHeight =
          popup.offsetHeight;

        const spaceBelow =
          window.innerHeight -
          rect.bottom;

        const openAbove =
          spaceBelow <
            popupHeight +
              gap +
              viewportPadding &&
          rect.top >
            popupHeight +
              gap +
              viewportPadding;

        popup.style.top =
          openAbove
            ? `${Math.max(
                viewportPadding,
                rect.top -
                  popupHeight -
                  gap,
              )}px`
            : `${Math.min(
                window.innerHeight -
                  popupHeight -
                  viewportPadding,
                rect.bottom +
                  gap,
              )}px`;
      };

    updatePopupPosition();

    window.addEventListener(
      "resize",
      updatePopupPosition,
    );

    window.addEventListener(
      "scroll",
      updatePopupPosition,
      true,
    );

    return () => {
      window.removeEventListener(
        "resize",
        updatePopupPosition,
      );

      window.removeEventListener(
        "scroll",
        updatePopupPosition,
        true,
      );
    };
  }, [
    isOpen,
    visibleMonth,
  ]);

  function closeCalendar(): void {
    setIsOpen(false);
    setIsMonthOpen(false);
    setIsYearOpen(false);
  }

  function openCalendar(
    edge?: "from" | "to",
  ): void {

    if (disabled) {
      return;
    }

    if (edge) {
      setActiveRangeEdge(edge);
    }

    const target =
      edge === "to"
        ? toDate
        : edge === "from"
          ? fromDate
          : selectedDate;

    if (target) {
      setVisibleMonth(
        getMonthStart(
          target,
        ),
      );
    }

    setIsOpen(true);
  }

  function changeMonth(
    offset: number,
  ): void {

    setVisibleMonth(
      current =>
        new Date(
          current.getFullYear(),
          current.getMonth() +
            offset,
          1,
        ),
    );
  }

  function handleMonthChange(
    monthIndex: number,
  ): void {

    setVisibleMonth(
      current =>
        new Date(
          current.getFullYear(),
          monthIndex,
          1,
        ),
    );

    setIsMonthOpen(false);
  }

  function handleYearChange(
    year: number,
  ): void {

    setVisibleMonth(
      current =>
        new Date(
          year,
          current.getMonth(),
          1,
        ),
    );

    setIsYearOpen(false);
  }

  function commitSingleDraft(
    value: string,
  ): void {

    if (rangeMode) {
      return;
    }

    if (!value) {
      if (allowClear) {
        props.onChange("");
      }

      return;
    }

    const iso =
      displayToIsoDate(
        value,
      );

    if (!iso) {
      setSingleDraft(
        isoToDisplayDate(
          props.value,
        ),
      );

      return;
    }

    const date =
      parseIsoDate(
        iso,
      );

    if (
      !date ||
      !isDateWithinBoundary(
        date,
        min,
        max,
      )
    ) {
      setSingleDraft(
        isoToDisplayDate(
          props.value,
        ),
      );

      return;
    }

    props.onChange(
      iso,
    );
  }

  function commitRangeDraft(
    edge: "from" | "to",
    value: string,
  ): void {

    if (!rangeMode) {
      return;
    }

    if (!value) {
      if (!allowClear) {
        return;
      }

      props.onChange({
        ...props.value,
        [edge]:
          "",
      });

      return;
    }

    const iso =
      displayToIsoDate(
        value,
      );

    const date =
      iso
        ? parseIsoDate(iso)
        : null;

    if (
      !iso ||
      !date ||
      !isDateWithinBoundary(
        date,
        min,
        max,
      )
    ) {
      if (edge === "from") {
        setFromDraft(
          isoToDisplayDate(
            props.value.from,
          ),
        );
      } else {
        setToDraft(
          isoToDisplayDate(
            props.value.to,
          ),
        );
      }

      return;
    }

    let nextValue = {
      ...props.value,
      [edge]:
        iso,
    };

    if (
      nextValue.from &&
      nextValue.to &&
      nextValue.to <
        nextValue.from
    ) {
      if (edge === "from") {
        nextValue = {
          from:
            iso,
          to:
            "",
        };
      } else {
        nextValue = {
          from:
            iso,
          to:
            iso,
        };
      }
    }

    props.onChange(
      nextValue,
    );
  }

  function handleSingleInputChange(
    event:
      ChangeEvent<HTMLInputElement>,
  ): void {

    if (rangeMode) {
      return;
    }

    const next =
      normalizeTypedDate(
        event.target.value,
      );

    setSingleDraft(
      next,
    );

    if (next.length === 10) {
      commitSingleDraft(
        next,
      );
    }
  }

  function handleRangeInputChange(
    edge: "from" | "to",
    event:
      ChangeEvent<HTMLInputElement>,
  ): void {

    if (!rangeMode) {
      return;
    }

    const next =
      normalizeTypedDate(
        event.target.value,
      );

    if (edge === "from") {
      setFromDraft(next);
    } else {
      setToDraft(next);
    }

    if (next.length === 10) {
      commitRangeDraft(
        edge,
        next,
      );
    }
  }

  function handleInputKeyDown(
    event:
      KeyboardEvent<HTMLInputElement>,
  ): void {

    if (
      event.key === "Escape"
    ) {
      closeCalendar();
    }
  }

  function selectDate(
    date: Date,
  ): void {

    if (
      !isDateWithinBoundary(
        date,
        min,
        max,
      )
    ) {
      return;
    }

    const iso =
      formatIsoDate(
        date,
      );

    if (!rangeMode) {
      props.onChange(
        iso,
      );

      setSingleDraft(
        formatDisplayDate(
          date,
        ),
      );

      closeCalendar();

      return;
    }

    if (
      activeRangeEdge === "from"
    ) {
      props.onChange({
        from:
          iso,
        to:
          props.value.to &&
          props.value.to >= iso
            ? props.value.to
            : "",
      });

      setActiveRangeEdge(
        "to",
      );

      return;
    }

    const from =
      props.value.from;

    if (
      !from ||
      iso < from
    ) {
      props.onChange({
        from:
          iso,
        to:
          "",
      });

      setActiveRangeEdge(
        "to",
      );

      return;
    }

    props.onChange({
      from,
      to:
        iso,
    });

    closeCalendar();
  }

  function selectToday(): void {

    const now =
      new Date();

    const today =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );

    if (
      !isDateWithinBoundary(
        today,
        min,
        max,
      )
    ) {
      return;
    }

    selectDate(
      today,
    );
  }

  function clearDate(): void {

    if (!allowClear) {
      return;
    }

    if (rangeMode) {
      props.onChange({
        from:
          "",
        to:
          "",
      });

      setFromDraft("");
      setToDraft("");
      setActiveRangeEdge(
        "from",
      );
    } else {
      props.onChange("");
      setSingleDraft("");
    }

    closeCalendar();
  }

  function renderInput(
    edge?: "from" | "to",
  ) {

    const rangeEdge =
      edge ?? "from";

    const value =
      rangeMode
        ? rangeEdge === "from"
          ? fromDraft
          : toDraft
        : singleDraft;

    return (
      <div className="finora-calendar-input-wrap">
        <input
          className={[
            "finora-calendar-input",
            !rangeMode &&
            relativeDayIndicator
              ? "has-relative-day"
              : "",
          ].filter(Boolean).join(" ")}
          type="text"
          inputMode="numeric"
          value={value}
          maxLength={10}
          disabled={disabled}
          placeholder={placeholder}
          aria-label={
            rangeMode
              ? `${ariaLabel} ${rangeEdge}`
              : ariaLabel
          }
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          autoComplete="off"
          spellCheck={false}
          onChange={
            event => {
              if (rangeMode) {
                handleRangeInputChange(
                  rangeEdge,
                  event,
                );
              } else {
                handleSingleInputChange(
                  event,
                );
              }
            }
          }
          onBlur={() => {
            if (rangeMode) {
              commitRangeDraft(
                rangeEdge,
                value,
              );
            } else {
              commitSingleDraft(
                value,
              );
            }
          }}
          onKeyDown={
            handleInputKeyDown
          }
        />

        {!rangeMode &&
          relativeDayIndicator && (
            <span
              className="finora-calendar-relative-day"
              title={relativeDayIndicator.title}
              aria-label={relativeDayIndicator.title}
            >
              {relativeDayIndicator.label}
            </span>
          )}

        <button
          className="finora-calendar-icon-button"
          type="button"
          disabled={disabled}
          aria-label={
            rangeMode
              ? `Open ${rangeEdge} calendar`
              : "Open calendar"
          }
          title="Open FINORA Calendar"
          onMouseDown={
            event => {
              event.preventDefault();
            }
          }
          onClick={() => {
            openCalendar(
              rangeMode
                ? rangeEdge
                : undefined,
            );
          }}
        >
          <CalendarDays
            className="finora-calendar-icon"
            strokeWidth={2.2}
            aria-hidden="true"
          />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className="finora-calendar-root"
      style={scopedThemeStyle}
    >
      {rangeMode ? (
        <div className="finora-calendar-range-fields">
          <div className="finora-calendar-range-field">
            <span className="finora-calendar-range-label">
              {props.fromLabel ?? "From"}
            </span>

            {renderInput("from")}
          </div>

          <div className="finora-calendar-range-field">
            <span className="finora-calendar-range-label">
              {props.toLabel ?? "To"}
            </span>

            {renderInput("to")}
          </div>
        </div>
      ) : (
        renderInput()
      )}

      {isOpen && (
        <div
          ref={popupRef}
          className="finora-calendar-popup"
          role="dialog"
          aria-label="FINORA Calendar"
        >
          <div className="finora-calendar-title">
            FINORA CALENDAR
          </div>

          <div className="finora-calendar-header">
            <button
              className="finora-calendar-nav"
              type="button"
              aria-label="Previous month"
              onClick={() => {
                changeMonth(-1);
              }}
            >
              <ChevronLeft
                size={15}
                strokeWidth={2.4}
              />
            </button>

            <div className="finora-calendar-dropdown-wrap">
              <button
                className="finora-calendar-select"
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isMonthOpen}
                onClick={() => {
                  setIsMonthOpen(
                    current =>
                      !current,
                  );

                  setIsYearOpen(
                    false,
                  );
                }}
              >
                <span>
                  {MONTHS[
                    visibleMonth.getMonth()
                  ]}
                </span>

                <ChevronDown
                  size={13}
                />
              </button>

              {isMonthOpen && (
                <div
                  ref={monthListRef}
                  className="finora-calendar-dropdown finora-calendar-month-list"
                  role="listbox"
                  aria-label="Select month"
                >
                  {MONTHS.map(
                    (
                      month,
                      index,
                    ) => {

                      const selected =
                        index ===
                        visibleMonth.getMonth();

                      return (
                        <button
                          key={month}
                          type="button"
                          role="option"
                          aria-selected={
                            selected
                          }
                          className={
                            `finora-calendar-option${
                              selected
                                ? " is-selected"
                                : ""
                            }`
                          }
                          onClick={() => {
                            handleMonthChange(
                              index,
                            );
                          }}
                        >
                          {month}
                        </button>
                      );
                    },
                  )}
                </div>
              )}
            </div>

            <div className="finora-calendar-dropdown-wrap finora-calendar-year-wrap">
              <button
                className="finora-calendar-select finora-calendar-year-select"
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isYearOpen}
                onClick={() => {
                  setIsYearOpen(
                    current =>
                      !current,
                  );

                  setIsMonthOpen(
                    false,
                  );
                }}
              >
                <span>
                  {visibleMonth.getFullYear()}
                </span>

                <ChevronDown
                  size={13}
                />
              </button>

              {isYearOpen && (
                <div
                  ref={yearListRef}
                  className="finora-calendar-dropdown finora-calendar-year-list"
                  role="listbox"
                  aria-label="Select year"
                >
                  {years.map(
                    year => {

                      const selected =
                        visibleMonth.getFullYear() ===
                        year;

                      return (
                        <button
                          key={year}
                          type="button"
                          role="option"
                          data-year={year}
                          aria-selected={
                            selected
                          }
                          className={
                            `finora-calendar-option${
                              selected
                                ? " is-selected"
                                : ""
                            }`
                          }
                          onClick={() => {
                            handleYearChange(
                              year,
                            );
                          }}
                        >
                          {year}
                        </button>
                      );
                    },
                  )}
                </div>
              )}
            </div>

            <button
              className="finora-calendar-nav"
              type="button"
              aria-label="Next month"
              onClick={() => {
                changeMonth(1);
              }}
            >
              <ChevronRight
                size={15}
                strokeWidth={2.4}
              />
            </button>
          </div>

          <div
            className="finora-calendar-weekdays"
            aria-hidden="true"
          >
            {WEEKDAYS.map(
              day => (
                <span key={day}>
                  {day}
                </span>
              ),
            )}
          </div>

          <div className="finora-calendar-days">
            {calendarDays.map(
              date => {

                const currentMonth =
                  isSameMonth(
                    date,
                    visibleMonth,
                  );

                const today =
                  isSameDay(
                    date,
                    new Date(),
                  );

                const selected =
                  selectedDate
                    ? isSameDay(
                        date,
                        selectedDate,
                      )
                    : false;

                const rangeStart =
                  fromDate
                    ? isSameDay(
                        date,
                        fromDate,
                      )
                    : false;

                const rangeEnd =
                  toDate
                    ? isSameDay(
                        date,
                        toDate,
                      )
                    : false;

                const iso =
                  formatIsoDate(
                    date,
                  );

                const inRange =
                  Boolean(
                    rangeValue.from &&
                    rangeValue.to &&
                    iso >
                      rangeValue.from &&
                    iso <
                      rangeValue.to,
                  );

                const unavailable =
                  !isDateWithinBoundary(
                    date,
                    min,
                    max,
                  );

                const className = [
                  "finora-calendar-day",
                  selected
                    ? "is-selected"
                    : "",
                  today &&
                  !selected &&
                  !rangeStart &&
                  !rangeEnd
                    ? "is-today"
                    : "",
                  !currentMonth
                    ? "is-outside"
                    : "",
                  rangeStart
                    ? "is-range-start is-selected"
                    : "",
                  rangeEnd
                    ? "is-range-end is-selected"
                    : "",
                  inRange
                    ? "is-in-range"
                    : "",
                  unavailable
                    ? "is-future"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <button
                    key={iso}
                    className={
                      className
                    }
                    type="button"
                    disabled={
                      unavailable
                    }
                    onClick={() => {
                      selectDate(
                        date,
                      );
                    }}
                    aria-label={
                      new Intl.DateTimeFormat(
                        "en-US",
                        {
                          dateStyle:
                            "full",
                        },
                      ).format(
                        date,
                      )
                    }
                    aria-current={
                      today
                        ? "date"
                        : undefined
                    }
                  >
                    {date.getDate()}
                  </button>
                );
              },
            )}
          </div>

          {rangeMode &&
            props.showDuration !== false &&
            rangeValue.from &&
            rangeValue.to &&
            durationDays !== null && (
              <div className="finora-calendar-range-summary">
                <span>
                  {formatRangeSummaryDate(
                    rangeValue.from,
                  )}
                  {" → "}
                  {formatRangeSummaryDate(
                    rangeValue.to,
                  )}
                </span>

                <strong>
                  {durationDays}{" "}
                  {durationDays === 1
                    ? "day"
                    : "days"}
                </strong>
              </div>
            )}

          <div className="finora-calendar-footer">
            {allowClear && (
              <button
                className="finora-calendar-footer-btn"
                type="button"
                onClick={
                  clearDate
                }
              >
                Clear
              </button>
            )}

            {allowToday && (
              <button
                className="finora-calendar-footer-btn is-today-action"
                type="button"
                onClick={
                  selectToday
                }
              >
                Today
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
