// ============================================================
// FINORA ENTERPRISE V2
//
// DESIGN SYSTEM
// SELECT INPUT
//
// RESPONSIBILITY:
// - Shared enterprise select input
// - FINORA Theme Engine compatibility
// - Custom FINORA themed dropdown popup
// - Preserve existing SelectInput API
// - Support controlled values
// - Support disabled / required / name / id / aria attributes
// - Keyboard navigation
// - Outside-click close
// - Theme-aware colours
//
// IMPORTANT:
// - Native browser popup is NOT used.
// - FINORA theme controls the complete dropdown UI.
// - No white browser popup.
// - Existing SelectInput usage remains compatible.
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import { useCallback, useEffect, useRef, useState } from "react";

import type { CSSProperties, KeyboardEvent, SelectHTMLAttributes } from "react";

import { createPortal } from "react-dom";

import { useTheme } from "../../../themes/provider";

// ============================================================
// TYPES
// ============================================================

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
}

// ============================================================
// FINORA THEME TOKENS
// ============================================================
//
// All colours intentionally come from FINORA CSS variables.
//
// Fallback values are included so the component remains safe
// even if a particular theme token is temporarily unavailable.
// ============================================================

const THEME = {
  background:
    "var(--finora-theme-background-surface, var(--finora-theme-surface, #111827))",

  surface:
    "var(--finora-theme-surface, var(--finora-theme-background-surface, #172236))",

  surfaceHover:
    "color-mix(in srgb, var(--finora-theme-brand-accent) 6%, var(--finora-theme-surface, #172236))",

  border: "var(--finora-theme-border-default, #334155)",

  borderStrong:
    "var(--finora-theme-border-strong, var(--finora-theme-border-default, #475569))",

  text: "var(--finora-theme-text-primary, #f8fafc)",

  textSecondary: "var(--finora-theme-text-secondary, #94a3b8)",

  accent: "var(--finora-theme-brand-accent, #c99700)",

  accentSoft:
    "var(--finora-theme-brand-accent-soft, color-mix(in srgb, var(--finora-theme-brand-accent, #c99700) 14%, transparent))",

  shadow: "var(--finora-theme-overlay-shadow, 0 16px 40px rgba(0, 0, 0, 0.42))",
} as const;

// ============================================================
// HELPERS
// ============================================================

function getOptionIndex(
  options: SelectOption[],
  value: string | undefined,
): number {
  const index = options.findIndex((option) => option.value === value);

  return index >= 0 ? index : 0;
}

// ============================================================
// COMPONENT
// ============================================================

export default function SelectInput({
  options,
  value,
  defaultValue,
  onChange,
  onBlur,
  onFocus,
  onKeyDown,
  disabled = false,
  required = false,
  name,
  id,
  className,
  style,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  ...restProps
}: SelectInputProps) {
  // ==========================================================
  // REFS
  // ==========================================================

  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const listRef = useRef<HTMLDivElement | null>(null);

  const { theme } = useTheme();

  // ==========================================================
  // INITIAL VALUE
  // ==========================================================

  const initialValue =
    value !== undefined
      ? String(value)
      : defaultValue !== undefined
        ? String(defaultValue)
        : (options[0]?.value ?? "");

  // ==========================================================
  // STATE
  // ==========================================================

  const [isOpen, setIsOpen] = useState(false);

  const [highlightedIndex, setHighlightedIndex] = useState(
    getOptionIndex(options, initialValue),
  );

  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
    openAbove: boolean;
  }>({
    top: 0,
    left: 0,
    width: 0,
    openAbove: false,
  });

  // ==========================================================
  // CURRENT VALUE
  // ==========================================================

  const currentValue = value !== undefined ? String(value) : initialValue;

  const selectedIndex = getOptionIndex(options, currentValue);

  const selectedOption = options[selectedIndex] ?? options[0];

  // ==========================================================
  // POSITION CALCULATION
  // ==========================================================

  const updateDropdownPosition = useCallback(() => {
    if (!buttonRef.current) {
      return;
    }

    const rect = buttonRef.current.getBoundingClientRect();

    const viewportHeight = window.innerHeight;

    const viewportWidth = window.innerWidth;

    const estimatedDropdownHeight = Math.min(
      Math.max(options.length * 38 + 8, 46),
      280,
    );

    const spaceBelow = viewportHeight - rect.bottom;

    const spaceAbove = rect.top;

    const shouldOpenAbove =
      spaceBelow < estimatedDropdownHeight && spaceAbove > spaceBelow;

    const dropdownHeight = Math.min(
      estimatedDropdownHeight,
      shouldOpenAbove ? spaceAbove - 12 : spaceBelow - 12,
    );

    let left = rect.left;

    const width = rect.width;

    if (left + width > viewportWidth - 8) {
      left = Math.max(8, viewportWidth - width - 8);
    }

    const top = shouldOpenAbove
      ? Math.max(8, rect.top - Math.max(dropdownHeight, 46))
      : Math.min(viewportHeight - 8, rect.bottom + 4);

    setDropdownPosition({
      top,
      left,
      width,
      openAbove: shouldOpenAbove,
    });
  }, [options.length]);

  // ==========================================================
  // OPEN DROPDOWN
  // ==========================================================

  const openDropdown = useCallback(() => {
    if (disabled) {
      return;
    }

    const index = getOptionIndex(options, currentValue);

    setHighlightedIndex(index);

    updateDropdownPosition();

    setIsOpen(true);
  }, [disabled, options, currentValue, updateDropdownPosition]);

  // ==========================================================
  // CLOSE DROPDOWN
  // ==========================================================

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
  }, []);

  // ==========================================================
  // VALUE CHANGE
  // ==========================================================

  const selectOption = useCallback(
    (option: SelectOption) => {
      /*
       * Preserve the existing SelectInput API.
       *
       * Existing consumers expect:
       *
       * event.target.value
       *
       * Therefore a compatible change event is created
       * without changing PaymentModeCard or other forms.
       */

      if (onChange) {
        const changeEvent = {
          target: {
            value: option.value,
            name: name ?? "",
          },

          currentTarget: {
            value: option.value,
            name: name ?? "",
          },
        } as unknown as React.ChangeEvent<HTMLSelectElement>;

        onChange(changeEvent);
      }

      setHighlightedIndex(
        options.findIndex((item) => item.value === option.value),
      );

      setIsOpen(false);

      requestAnimationFrame(() => {
        buttonRef.current?.focus();
      });
    },
    [onChange, name, options],
  );

  // ==========================================================
  // OUTSIDE CLICK
  // ==========================================================

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;

      if (wrapperRef.current && wrapperRef.current.contains(target)) {
        return;
      }

      const dropdownElement = document.getElementById("finora-select-dropdown");

      if (dropdownElement && dropdownElement.contains(target)) {
        return;
      }

      closeDropdown();
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen, closeDropdown]);

  // ==========================================================
  // SCROLL / RESIZE
  // ==========================================================

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleReposition = () => {
      updateDropdownPosition();
    };

    window.addEventListener("resize", handleReposition);

    window.addEventListener("scroll", handleReposition, true);

    return () => {
      window.removeEventListener("resize", handleReposition);

      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [isOpen, updateDropdownPosition]);

  // ==========================================================
  // HIGHLIGHTED OPTION SCROLL
  // ==========================================================

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const optionElement = listRef.current?.querySelector(
      `[data-index="${highlightedIndex}"]`,
    ) as HTMLElement | null;

    optionElement?.scrollIntoView({
      block: "nearest",
    });
  }, [isOpen, highlightedIndex]);

  // ==========================================================
  // KEYBOARD NAVIGATION
  // ==========================================================

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    /*
     * Preserve consumer keyboard handler first.
     */

    onKeyDown?.(event as unknown as React.KeyboardEvent<HTMLSelectElement>);

    if (event.defaultPrevented) {
      return;
    }

    if (disabled) {
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();

        if (!isOpen) {
          openDropdown();
          return;
        }

        setHighlightedIndex((previous) =>
          Math.min(previous + 1, options.length - 1),
        );

        break;

      case "ArrowUp":
        event.preventDefault();

        if (!isOpen) {
          openDropdown();
          return;
        }

        setHighlightedIndex((previous) => Math.max(previous - 1, 0));

        break;

      case "Home":
        if (isOpen) {
          event.preventDefault();

          setHighlightedIndex(0);
        }

        break;

      case "End":
        if (isOpen) {
          event.preventDefault();

          setHighlightedIndex(Math.max(options.length - 1, 0));
        }

        break;

      case "Enter":

      case " ":
        event.preventDefault();

        if (!isOpen) {
          openDropdown();
          return;
        }

        if (options[highlightedIndex]) {
          selectOption(options[highlightedIndex]);
        }

        break;

      case "Escape":
        if (isOpen) {
          event.preventDefault();

          closeDropdown();
        }

        break;

      case "Tab":
        if (isOpen) {
          closeDropdown();
        }

        break;

      default:
        break;
    }
  };

  // ==========================================================
  // BUTTON BLUR / FOCUS
  // ==========================================================

  const handleFocus = (event: React.FocusEvent<HTMLButtonElement>) => {
    if (onFocus) {
      onFocus(event as unknown as React.FocusEvent<HTMLSelectElement>);
    }
  };

  const handleBlur = (event: React.FocusEvent<HTMLButtonElement>) => {
    /*
     * Delay blur notification slightly so clicking a dropdown
     * option does not prematurely interfere with selection.
     */

    if (onBlur) {
      onBlur(event as unknown as React.FocusEvent<HTMLSelectElement>);
    }
  };

  // ==========================================================
  // BUTTON STYLE
  // ==========================================================

  const buttonStyle: CSSProperties = {
    width: "100%",

    minWidth: 0,

    height: "38px",

    padding: "8px 34px 8px 11px",

    borderRadius: "8px",

    border: `1px solid ${theme.colors.border.default}`,

    background: theme.colors.background.surfaceMuted,
    color: theme.colors.text.primary,

    fontSize: "12px",

    fontWeight: 500,

    lineHeight: 1.2,

    fontFamily: "inherit",

    textAlign: "left",

    boxSizing: "border-box",

    cursor: disabled ? "not-allowed" : "pointer",

    opacity: disabled ? 0.55 : 1,

    outline: "none",

    position: "relative",

    transition:
      "border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease",

    ...style,
  };

  // ==========================================================
  // WRAPPER STYLE
  // ==========================================================

  const wrapperStyle: CSSProperties = {
    position: "relative",

    width: "100%",

    minWidth: 0,

    boxSizing: "border-box",
  };

  // ==========================================================
  // ARROW STYLE
  // ==========================================================

  const arrowStyle: CSSProperties = {
    position: "absolute",

    top: "50%",

    right: "12px",

    width: 0,

    height: 0,

    transform: isOpen ? "translateY(-25%) rotate(180deg)" : "translateY(-25%)",

    borderLeft: "5px solid transparent",

    borderRight: "5px solid transparent",

    border: `1px solid ${theme.colors.border.default}`,

    pointerEvents: "none",

    transition: "transform 0.15s ease",
  };

  // ==========================================================
  // DROPDOWN STYLE
  // ==========================================================

  const dropdownStyle: CSSProperties = {
    position: "fixed",

    top: `${dropdownPosition.top}px`,

    left: `${dropdownPosition.left}px`,

    width: `${dropdownPosition.width}px`,

    maxHeight: "280px",

    overflowY: "auto",

    overflowX: "hidden",

    padding: "4px",

    boxSizing: "border-box",

    borderRadius: "9px",

    border: `1px solid ${theme.colors.border.strong}`,

    background: theme.colors.background.surface,

    boxShadow: theme.colors.overlay.shadow,

    zIndex: 999999,

    color: theme.colors.brand.accent,

    fontFamily: "inherit",

    isolation: "isolate",

    /*
     * Prevent the browser from introducing a light native
     * appearance anywhere inside the custom dropdown.
     */
    colorScheme: "dark",
  };

  // ==========================================================
  // DROPDOWN OPTION STYLE
  // ==========================================================

  const getOptionStyle = (
    index: number,
    isSelected: boolean,
    isHighlighted: boolean,
  ): CSSProperties => {
    return {
      width: "100%",

      minHeight: "34px",

      padding: "8px 10px",

      borderRadius: "6px",

      boxSizing: "border-box",

      display: "flex",

      alignItems: "center",

      background: isSelected
        ? theme.colors.brand.accentSoft
        : isHighlighted
          ? theme.colors.background.surfaceStrong
          : "transparent",

      color: isSelected ? theme.colors.brand.accent : theme.colors.text.primary,

      fontSize: "12px",

      fontWeight: isSelected ? 600 : 500,

      cursor: "pointer",

      userSelect: "none",

      transition: "background 0.12s ease, color 0.12s ease",

      outline: isHighlighted
        ? `1px solid ${THEME.borderStrong}`
        : "1px solid transparent",

      outlineOffset: "-1px",

      marginBottom: index === options.length - 1 ? 0 : "2px",
    };
  };

  // ==========================================================
  // DROPDOWN
  // ==========================================================

  const dropdown =
    isOpen && typeof document !== "undefined"
      ? createPortal(
          <div
            id="finora-select-dropdown"
            ref={listRef}
            role="listbox"
            aria-label={ariaLabel ?? "Select option"}
            style={dropdownStyle}
          >
            {options.map((option, index) => {
              const isSelected = option.value === currentValue;

              const isHighlighted = index === highlightedIndex;

              return (
                <div
                  key={option.value}
                  data-index={index}
                  role="option"
                  aria-selected={isSelected}
                  style={getOptionStyle(index, isSelected, isHighlighted)}
                  onMouseEnter={() => {
                    setHighlightedIndex(index);
                  }}
                  onMouseDown={(event) => {
                    /*
                     * Prevent the trigger button from
                     * receiving a blur before selection.
                     */
                    event.preventDefault();

                    selectOption(option);
                  }}
                >
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {option.label}
                  </span>

                  {isSelected && (
                    <span
                      aria-hidden="true"
                      style={{
                        marginLeft: "8px",

                        color: theme.colors.brand.accent,

                        fontSize: "13px",

                        fontWeight: 700,

                        lineHeight: 1,
                      }}
                    >
                      ✓
                    </span>
                  )}
                </div>
              );
            })}
          </div>,
          document.body,
        )
      : null;

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      <div ref={wrapperRef} className={className} style={wrapperStyle}>
        {/* ====================================================
            ACCESSIBILITY / FORM VALUE
        ==================================================== */}

        {/*
         * Keep a real native select in the DOM but visually
         * hidden.
         *
         * This preserves form semantics, name, required and
         * browser accessibility behaviour without allowing the
         * browser's white native popup to appear.
         */}

        <select
          {...restProps}
          id={id}
          name={name}
          value={currentValue}
          required={required}
          disabled={disabled}
          aria-hidden="true"
          tabIndex={-1}
          onChange={() => {
            /*
             * The visible custom dropdown owns value changes.
             */
          }}
          style={{
            position: "absolute",

            width: "1px",

            height: "1px",

            padding: 0,

            margin: "-1px",

            overflow: "hidden",

            clip: "rect(0, 0, 0, 0)",

            whiteSpace: "nowrap",

            border: 0,

            opacity: 0,

            pointerEvents: "none",
          }}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* ====================================================
            CUSTOM TRIGGER
        ==================================================== */}

        <button
          ref={buttonRef}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
          style={buttonStyle}
          onClick={() => {
            if (isOpen) {
              closeDropdown();
            } else {
              openDropdown();
            }
          }}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
        >
          <span
            style={{
              display: "block",

              minWidth: 0,

              overflow: "hidden",

              textOverflow: "ellipsis",

              whiteSpace: "nowrap",
            }}
          >
            {selectedOption?.label ?? ""}
          </span>

          <span aria-hidden="true" style={arrowStyle} />
        </button>
      </div>

      {dropdown}
    </>
  );
}

// ============================================================
// END
// ============================================================
