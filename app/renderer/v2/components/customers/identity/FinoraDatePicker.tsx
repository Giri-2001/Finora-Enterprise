/* ===========================================================
   FINORA ENTERPRISE OS™
   FINORA DATE PICKER™

   - Compact browser-like input height
   - Compact popup, same width as input
   - No FINORA DATE PICKER title
   - Custom month/year dropdowns
   - No inline CSS
   - Popup does not create page scrollbars
   - Future DOB dates disabled
   - Today / Clear / age calculation retained
=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import "./FinoraDatePicker.css";


/* ===========================================================
   TYPES
=========================================================== */

interface FinoraDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  placeholder?: string;
}

/* ===========================================================
   CONSTANTS
=========================================================== */

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/* ===========================================================
   DATE HELPERS
=========================================================== */

function parseDateValue(value: string): Date | null {
  if (!value) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);

  return date.getFullYear() === year &&
    date.getMonth() === month &&
    date.getDate() === day
    ? date
    : null;
}

function formatDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getDisplayDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function calculateAge(dateOfBirth: Date | null): number | null {
  if (!dateOfBirth) return null;

  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDifference = today.getMonth() - dateOfBirth.getMonth();
  const dayDifference = today.getDate() - dateOfBirth.getDate();

  if (monthDifference < 0 ||
      (monthDifference === 0 && dayDifference < 0)) {
    age -= 1;
  }

  return age >= 0 && age <= 150 ? age : null;
}

function isSameDay(first: Date, second: Date): boolean {
  return first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate();
}

function isSameMonth(first: Date, second: Date): boolean {
  return first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth();
}

function buildCalendarDays(month: Date): Date[] {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1);
  const totalDays = new Date(year, monthIndex + 1, 0).getDate();
  const firstWeekday = firstDay.getDay();
  const totalCells = Math.ceil((firstWeekday + totalDays) / 7) * 7;

  return Array.from({ length: totalCells }, (_, index) =>
    new Date(year, monthIndex, index - firstWeekday + 1),
  );
}

function buildYears(): number[] {
  const currentYear = new Date().getFullYear();
  return Array.from(
    { length: 121 },
    (_, index) => currentYear - index,
  );
}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function FinoraDatePicker({
  value,
  onChange,
  ariaLabel = "Date of Birth",
  placeholder = "DD-MM-YYYY",
}: FinoraDatePickerProps) {

  /* =========================================================
     REFS / STATE
  ========================================================= */

  const rootRef = useRef<HTMLDivElement | null>(null);
  const monthListRef = useRef<HTMLDivElement | null>(null);
  const yearListRef = useRef<HTMLDivElement | null>(null);

  const initialDate = parseDateValue(value) ?? new Date();

  const [isOpen, setIsOpen] = useState(false);
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(
    getMonthStart(initialDate),
  );

  /* =========================================================
     DERIVED VALUES
  ========================================================= */

  const selectedDate = useMemo(
    () => parseDateValue(value),
    [value],
  );

  const today = useMemo(() => new Date(), []);

  const calculatedAge = useMemo(
    () => calculateAge(selectedDate),
    [selectedDate],
  );

  const calendarDays = useMemo(
    () => buildCalendarDays(visibleMonth),
    [visibleMonth],
  );

  const years = useMemo(() => buildYears(), []);

  const displayValue = selectedDate
    ? getDisplayDate(selectedDate)
    : "";

  /* =========================================================
     VALUE SYNC
  ========================================================= */

  useEffect(() => {
    const nextDate = parseDateValue(value);
    if (nextDate) setVisibleMonth(getMonthStart(nextDate));
  }, [value]);

  /* =========================================================
     OUTSIDE CLICK
  ========================================================= */

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;

      if (rootRef.current && !rootRef.current.contains(target)) {
        setIsOpen(false);
        setIsMonthOpen(false);
        setIsYearOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  /* =========================================================
     DROPDOWN SCROLL POSITION
  ========================================================= */

  useEffect(() => {
    if (!isYearOpen) return;

    const selected = yearListRef.current?.querySelector<HTMLElement>(
      `[data-year="${visibleMonth.getFullYear()}"]`,
    );

    if (selected && yearListRef.current) {
      yearListRef.current.scrollTop = Math.max(
        0,
        selected.offsetTop - yearListRef.current.clientHeight / 2,
      );
    }
  }, [isYearOpen, visibleMonth]);

  /* =========================================================
     OPEN / CLOSE
  ========================================================= */

  function toggleCalendar() {
    setIsOpen((current) => !current);
    setIsMonthOpen(false);
    setIsYearOpen(false);
  }

  /* =========================================================
     MONTH / YEAR NAVIGATION
  ========================================================= */

  function changeMonth(amount: number) {
    setVisibleMonth((current) =>
      new Date(current.getFullYear(), current.getMonth() + amount, 1),
    );
    setIsMonthOpen(false);
    setIsYearOpen(false);
  }

  function handleMonthChange(monthIndex: number) {
    setVisibleMonth((current) =>
      new Date(current.getFullYear(), monthIndex, 1),
    );
    setIsMonthOpen(false);
  }

  function handleYearChange(year: number) {
    setVisibleMonth((current) =>
      new Date(year, current.getMonth(), 1),
    );
    setIsYearOpen(false);
  }

  /* =========================================================
     DATE ACTIONS
  ========================================================= */

  function selectDate(date: Date) {
    if (date.getTime() > today.getTime()) return;

    onChange(formatDateValue(date));
    setVisibleMonth(getMonthStart(date));
    setIsOpen(false);
    setIsMonthOpen(false);
    setIsYearOpen(false);
  }

  function selectToday() {
  const now = new Date();

  const todayDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  onChange(formatDateValue(todayDate));
  setVisibleMonth(getMonthStart(todayDate));
  setIsOpen(false);
  setIsMonthOpen(false);
  setIsYearOpen(false);
}

function clearDate() {
  onChange("");
  setIsOpen(false);
  setIsMonthOpen(false);
  setIsYearOpen(false);
}
  /* =========================================================
     KEYBOARD
  ========================================================= */

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleCalendar();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      setIsMonthOpen(false);
      setIsYearOpen(false);
    }
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div ref={rootRef} className="finora-date-picker-root">
      <div className="finora-date-picker-input-wrap">
        <input
          className="finora-date-picker-input"
          type="text"
          value={displayValue}
          readOnly
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          onClick={toggleCalendar}
          onKeyDown={handleInputKeyDown}
        />

        {calculatedAge !== null && (
          <span className="finora-date-picker-age">
            Age {calculatedAge}
          </span>
        )}

        <CalendarDays
          className="finora-date-picker-icon"
          strokeWidth={2.2}
          aria-hidden="true"
        />
      </div>

      {isOpen && (
        <div
          className="finora-date-picker-popup"
          role="dialog"
          aria-label="Date picker"
        >

<div className="finora-date-picker-title">
  FINORA DATE PICKER
</div>
          <div className="finora-date-picker-header">
            <button
              className="finora-date-picker-nav"
              type="button"
              aria-label="Previous month"
              onClick={() => changeMonth(-1)}
            >
              <ChevronLeft size={15} strokeWidth={2.4} />
            </button>

            <div className="finora-date-picker-dropdown-wrap">
              <button
                className="finora-date-picker-select"
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isMonthOpen}
                onClick={() => {
                  setIsMonthOpen((current) => !current);
                  setIsYearOpen(false);
                }}
              >
                <span>{MONTHS[visibleMonth.getMonth()]}</span>
                <ChevronDown size={13} />
              </button>

              {isMonthOpen && (
                <div
                  ref={monthListRef}
                  className="finora-date-picker-dropdown finora-date-picker-month-list"
                  role="listbox"
                  aria-label="Select month"
                >
                  {MONTHS.map((month, index) => {
                    const selected = index === visibleMonth.getMonth();
                    return (
                      <button
                        key={month}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        className={`finora-date-picker-option${selected ? " is-selected" : ""}`}
                        onClick={() => handleMonthChange(index)}
                      >
                        {month}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="finora-date-picker-dropdown-wrap finora-date-picker-year-wrap">
              <button
                className="finora-date-picker-select finora-date-picker-year-select"
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isYearOpen}
                onClick={() => {
                  setIsYearOpen((current) => !current);
                  setIsMonthOpen(false);
                }}
              >
                <span>{visibleMonth.getFullYear()}</span>
                <ChevronDown size={13} />
              </button>

              {isYearOpen && (
                <div
                  ref={yearListRef}
                  className="finora-date-picker-dropdown finora-date-picker-year-list"
                  role="listbox"
                  aria-label="Select year"
                >
                  {years.map((year) => {
                    const selected = visibleMonth.getFullYear() === year;
                    return (
                      <button
                        key={year}
                        type="button"
                        role="option"
                        data-year={year}
                        aria-selected={selected}
                        className={`finora-date-picker-option${selected ? " is-selected" : ""}`}
                        onClick={() => handleYearChange(year)}
                      >
                        {year}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              className="finora-date-picker-nav"
              type="button"
              aria-label="Next month"
              onClick={() => changeMonth(1)}
            >
              <ChevronRight size={15} strokeWidth={2.4} />
            </button>
          </div>

          <div className="finora-date-picker-weekdays" aria-hidden="true">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="finora-date-picker-days">
            {calendarDays.map((date) => {
              const selected = selectedDate ? isSameDay(date, selectedDate) : false;
              const todayDate = isSameDay(date, today);
              const currentMonth = isSameMonth(date, visibleMonth);
              const futureDate = date.getTime() > today.getTime();

              const className = [
                "finora-date-picker-day",
                selected ? "is-selected" : "",
                todayDate && !selected ? "is-today" : "",
                !currentMonth ? "is-outside" : "",
                futureDate ? "is-future" : "",
              ].filter(Boolean).join(" ");

              return (
                <button
                  key={formatDateValue(date)}
                  className={className}
                  type="button"
                  disabled={futureDate}
                  onClick={() => selectDate(date)}
                  aria-label={new Intl.DateTimeFormat("en-US", {
                    dateStyle: "full",
                  }).format(date)}
                  aria-current={todayDate ? "date" : undefined}
                  aria-pressed={selected}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="finora-date-picker-footer">
            <button
              className="finora-date-picker-footer-btn"
              type="button"
              onClick={clearDate}
            >
              Clear
            </button>
            <button
              className="finora-date-picker-footer-btn is-today-action"
              type="button"
              onClick={selectToday}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}