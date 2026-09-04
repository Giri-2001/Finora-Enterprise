/* ===========================================================
   FINORA ENTERPRISE OS™

   GOLD LOAN ENGINE™

   GOLD ITEMS

   MODULE  : Gold Loan
   LAYER   : Presentation Component
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Manage pledged Gold Item cards
   - Add / remove multiple Gold items
   - Capture item type and description
   - Capture gross / deduction weights
   - Capture purity / hallmark
   - Capture reference market rate
   - Recalculate derived Gold values
   - Display item-level valuation
   - Display complete Gold Items summary
   - Preserve premium FINORA controls
   - Preserve four-device responsive layout
   - Preserve FINORA theme inheritance

   IMPORTANT:

   - No persistence.
   - No StorageManager access.
   - No repository access.
   - No native select controls.
   - No business formulas inside JSX.
   - Gold calculations come from goldCalculations.ts.
   - Browser-default number controls are not used.
   - Parent remains authoritative owner of GoldLoanItem[].
   - No inline JSX style objects.

=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import {
  BadgeCheck,
  Calculator,
  Check,
  ChevronDown,
  FileText,
  Gem,
  Hash,
  Plus,
  Scale,
  Trash2,
  Weight,
} from "lucide-react";

import { useMemo, useState } from "react";

import type { ChangeEvent } from "react";

import {
  GOLD_PURITY_OPTIONS,
  calculateGoldLoanItemTotals,
  getGoldPurityPercentage,
  recalculateGoldLoanItem,
} from "../../services/gold-loan/goldCalculations";

import type {
  GoldHallmarkStatus,
  GoldItemType,
  GoldItemTypeOption,
  GoldLoanItem,
  GoldPurityKarat,
} from "../../types/gold-loan/goldLoan.types";

import { formatCurrency } from "../../utils/currency/formatCurrency";

import {
  getGoldLoanModuleTokens,
  useGoldLoanResponsive,
} from "../../utils/responsive/goldloan/goldLoan.index";

import {
  getGoldItemDropdownOptionStateStyle,
  getGoldItemFieldStateStyle,
  getGoldItemMoneyValueStyle,
  getGoldItemPositiveValueStyle,
  getGoldItemRemoveButtonStateStyle,
  getGoldItemsStyles,
} from "./GoldItems.styles";

/* ===========================================================
   PROPS
=========================================================== */

export interface GoldItemsProps {
  items: GoldLoanItem[];

  defaultMarketRatePerGram: number;

  onItemsChange: (items: GoldLoanItem[]) => void;

  readOnly?: boolean;
}

/* ===========================================================
   ITEM TYPE OPTIONS
=========================================================== */

const GOLD_ITEM_TYPE_OPTIONS: GoldItemTypeOption[] = [
  {
    value: "CHAIN",

    label: "Chain",
  },

  {
    value: "NECKLACE",

    label: "Necklace",
  },

  {
    value: "BANGLES",

    label: "Bangles",
  },

  {
    value: "BRACELET",

    label: "Bracelet",
  },

  {
    value: "RING",

    label: "Ring",
  },

  {
    value: "EARRINGS",

    label: "Earrings",
  },

  {
    value: "PENDANT",

    label: "Pendant",
  },

  {
    value: "ANKLET",

    label: "Anklet",
  },

  {
    value: "COIN",

    label: "Gold Coin",
  },

  {
    value: "BISCUIT",

    label: "Gold Biscuit",
  },

  {
    value: "BAR",

    label: "Gold Bar",
  },

  {
    value: "MANGALSUTRA",

    label: "Mangalsutra",
  },

  {
    value: "WAIST_BELT",

    label: "Waist Belt",
  },

  {
    value: "NOSE_PIN",

    label: "Nose Pin",
  },

  {
    value: "OTHER",

    label: "Other Gold Item",
  },
];

/* ===========================================================
   HALLMARK OPTION
=========================================================== */

interface HallmarkOption {
  value: GoldHallmarkStatus;

  label: string;

  description: string;
}

/* ===========================================================
   HALLMARK OPTIONS
=========================================================== */

const HALLMARK_OPTIONS: HallmarkOption[] = [
  {
    value: "HALLMARKED",

    label: "Hallmarked",

    description: "Hallmark / HUID available",
  },

  {
    value: "NOT_HALLMARKED",

    label: "Not Hallmarked",

    description: "No hallmark available",
  },

  {
    value: "UNKNOWN",

    label: "Unknown",

    description: "Not verified during entry",
  },
];

/* ===========================================================
   DROPDOWN FIELD
=========================================================== */

type GoldItemDropdownField = "itemType" | "purity" | "hallmark";

/* ===========================================================
   ACTIVE DROPDOWN
=========================================================== */

interface ActiveGoldItemDropdown {
  itemId: string;

  field: GoldItemDropdownField;
}

/* ===========================================================
   GOLD FIELD KEY
=========================================================== */

type GoldItemFocusedField =
  | "itemName"
  | "description"
  | "quantity"
  | "grossWeight"
  | "stoneWeight"
  | "otherDeduction"
  | "marketRate"
  | "hallmarkReference"
  | "remarks";

/* ===========================================================
   FOCUSED FIELD
=========================================================== */

interface ActiveGoldItemField {
  itemId: string;

  field: GoldItemFocusedField;
}

/* ===========================================================
   NUMERIC INPUT DRAFT FIELD
=========================================================== */

type GoldItemNumericDraftField =
  | "quantity"
  | "grossWeightGrams"
  | "stoneWeightGrams"
  | "otherDeductionWeightGrams";

/* ===========================================================
   CREATE ITEM ID
=========================================================== */

function createGoldItemId(): string {
  const randomPart = Math.random().toString(36).slice(2, 10);

  return `gold-item-${Date.now()}-${randomPart}`;
}

/* ===========================================================
   SAFE NUMBER INPUT
=========================================================== */

function parseGoldNumberInput(value: string): number {
  const normalized = value.replace(/,/g, "").trim();

  if (normalized.length === 0) {
    return 0;
  }

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, parsed);
}

/* ===========================================================
   SAFE QUANTITY
=========================================================== */

function parseGoldQuantity(value: string): number {
  const parsed = Math.trunc(parseGoldNumberInput(value));

  return Math.max(1, parsed);
}

/* ===========================================================
   ITEM TYPE LABEL
=========================================================== */

function getGoldItemTypeLabel(itemType: GoldItemType): string {
  return (
    GOLD_ITEM_TYPE_OPTIONS.find((option) => option.value === itemType)?.label ??
    "Gold Item"
  );
}

/* ===========================================================
   HALLMARK LABEL
=========================================================== */

function getHallmarkLabel(status: GoldHallmarkStatus): string {
  return (
    HALLMARK_OPTIONS.find((option) => option.value === status)?.label ??
    "Unknown"
  );
}

/* ===========================================================
   FORMAT WEIGHT
=========================================================== */

function formatGoldWeight(value: number): string {
  return Number(value || 0).toFixed(3);
}

/* ===========================================================
   FORMAT PERCENTAGE
=========================================================== */

function formatGoldPercentage(value: number): string {
  return `${Number(value || 0).toFixed(2)}%`;
}

/* ===========================================================
   FORMAT MONEY
=========================================================== */

const GOLD_MONEY_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",

  currency: "INR",

  minimumFractionDigits: 0,

  maximumFractionDigits: 2,
});

function formatGoldMoney(value: number): string {
  return GOLD_MONEY_FORMATTER
    .format(Number.isFinite(value) ? value : 0)
    .replace("₹", "₹ ");
}

/* ===========================================================
   CREATE EMPTY GOLD ITEM
=========================================================== */

function createEmptyGoldItem(marketRatePerGram: number): GoldLoanItem {
  const item: GoldLoanItem = {
    id: createGoldItemId(),

    itemType: "CHAIN",

    itemName: "",

    description: "",

    quantity: 1,

    grossWeightGrams: 0,

    stoneWeightGrams: 0,

    otherDeductionWeightGrams: 0,

    netWeightGrams: 0,

    purityKarat: 22,

    purityPercentage: getGoldPurityPercentage(22),

    fineGoldWeightGrams: 0,

    hallmarkStatus: "UNKNOWN",

    hallmarkReference: "",

    marketRatePerGram: Math.max(0, marketRatePerGram),

    assessedValue: 0,

    remarks: "",
  };

  return recalculateGoldLoanItem(item);
}

/* ===========================================================
   ITEM DISPLAY TITLE
=========================================================== */

function getGoldItemDisplayTitle(item: GoldLoanItem): string {
  const itemName = String(item.itemName ?? "").trim();

  if (itemName.length > 0) {
    return itemName;
  }

  return getGoldItemTypeLabel(item.itemType);
}

/* ===========================================================
   ITEM DISPLAY SUBTITLE
=========================================================== */

function getGoldItemDisplaySubtitle(item: GoldLoanItem): string {
  const description = String(item.description ?? "").trim();

  if (description.length > 0) {
    return description;
  }

  return `${item.purityKarat}K • ${formatGoldWeight(
    item.netWeightGrams,
  )} g net`;
}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function GoldItems(props: GoldItemsProps) {
  const {
    items,
    defaultMarketRatePerGram,
    onItemsChange,
    readOnly = false,
  } = props;

  /* =========================================================
     LOCAL PRESENTATION STATE
  ========================================================= */

  const [activeDropdown, setActiveDropdown] =
    useState<ActiveGoldItemDropdown | null>(null);

  const [activeField, setActiveField] = useState<ActiveGoldItemField | null>(
    null,
  );

  const [numericDrafts, setNumericDrafts] = useState<Record<string, string>>({});

  /* =========================================================
     RESPONSIVE
  ========================================================= */

  const responsive = useGoldLoanResponsive();

  const moduleTokens = getGoldLoanModuleTokens(responsive.device);

  const styles = getGoldItemsStyles({
    moduleTokens,

    itemsLayout: responsive.layout.items,

    formFieldColumns: responsive.layout.form.fieldColumns,

    isMobile: responsive.isMobile,

    isTablet: responsive.isTablet,
  });

  /* =========================================================
     TOTALS
  ========================================================= */

  const totals = useMemo(() => calculateGoldLoanItemTotals(items), [items]);

  /* =========================================================
     SHARED PRESENTATION STYLES

     Calculated here instead of using JSX inline style objects.
  ========================================================= */

  const summaryMoneyValueStyle = useMemo(
    () => ({
      ...styles.summaryMetricValue,
      ...getGoldItemMoneyValueStyle(),
    }),
    [styles.summaryMetricValue],
  );

  /* =========================================================
     FOCUS CHECK
  ========================================================= */

  function isFieldFocused(
    itemId: string,

    field: GoldItemFocusedField,
  ): boolean {
    return activeField?.itemId === itemId && activeField.field === field;
  }

  /* =========================================================
     SET FIELD FOCUS
  ========================================================= */

  function handleFieldFocus(
    itemId: string,

    field: GoldItemFocusedField,
  ): void {
    setActiveField({
      itemId,
      field,
    });
  }

  /* =========================================================
     CLEAR FIELD FOCUS
  ========================================================= */

  function handleFieldBlur(): void {
    setActiveField(null);
  }

  /* =========================================================
     DROPDOWN CHECK
  ========================================================= */

  function isDropdownOpen(
    itemId: string,

    field: GoldItemDropdownField,
  ): boolean {
    return activeDropdown?.itemId === itemId && activeDropdown.field === field;
  }

  /* =========================================================
     TOGGLE DROPDOWN
  ========================================================= */

  function toggleDropdown(
    itemId: string,

    field: GoldItemDropdownField,
  ): void {
    if (readOnly) {
      return;
    }

    setActiveDropdown((current) => {
      if (current?.itemId === itemId && current.field === field) {
        return null;
      }

      return {
        itemId,
        field,
      };
    });
  }

  /* =========================================================
     CLOSE DROPDOWN
  ========================================================= */

  function closeDropdown(): void {
    setActiveDropdown(null);
  }

  /* =========================================================
     NUMERIC DRAFT KEY
  ========================================================= */

  function getNumericDraftKey(
    itemId: string,
    field: GoldItemNumericDraftField,
  ): string {
    return `${itemId}:${field}`;
  }

  /* =========================================================
     NUMERIC INPUT DISPLAY VALUE
  ========================================================= */

  function getNumericInputValue(
    itemId: string,
    field: GoldItemNumericDraftField,
    numericValue: number,
  ): string {
    const key = getNumericDraftKey(itemId, field);

    if (Object.prototype.hasOwnProperty.call(numericDrafts, key)) {
      return numericDrafts[key] ?? "";
    }

    if (field === "quantity") {
      return numericValue === 1 ? "" : String(numericValue);
    }

    return numericValue === 0 ? "" : String(numericValue);
  }

  /* =========================================================
     SET NUMERIC DRAFT
  ========================================================= */

  function setNumericDraft(
    itemId: string,
    field: GoldItemNumericDraftField,
    value: string,
  ): void {
    const key = getNumericDraftKey(itemId, field);

    setNumericDrafts((current) => ({
      ...current,
      [key]: value,
    }));
  }

  /* =========================================================
     UPDATE ITEM
  ========================================================= */

  function updateGoldItem(
    itemId: string,

    patch: Partial<GoldLoanItem>,
  ): void {
    const nextItems = items.map((item) => {
      if (item.id !== itemId) {
        return item;
      }

      return recalculateGoldLoanItem({
        ...item,
        ...patch,
      });
    });

    onItemsChange(nextItems);
  }

  /* =========================================================
     ADD ITEM
  ========================================================= */

  function handleAddItem(): void {
    if (readOnly) {
      return;
    }

    const nextItem = createEmptyGoldItem(defaultMarketRatePerGram);

    onItemsChange([...items, nextItem]);
  }

  /* =========================================================
     REMOVE ITEM
  ========================================================= */

  function handleRemoveItem(itemId: string): void {
    if (readOnly) {
      return;
    }

    const nextItems = items.filter((item) => item.id !== itemId);

    closeDropdown();

    onItemsChange(nextItems);
  }

  /* =========================================================
     TEXT CHANGE
  ========================================================= */

  function handleTextChange(
    event: ChangeEvent<HTMLInputElement>,

    itemId: string,

    field: "itemName" | "description" | "hallmarkReference",
  ): void {
    updateGoldItem(itemId, {
      [field]: event.target.value,
    });
  }

  /* =========================================================
     REMARKS CHANGE
  ========================================================= */

  function handleRemarksChange(
    event: ChangeEvent<HTMLTextAreaElement>,

    itemId: string,
  ): void {
    updateGoldItem(itemId, {
      remarks: event.target.value,
    });
  }

  /* =========================================================
     NUMERIC CHANGE
  ========================================================= */

  function handleNumericChange(
    event: ChangeEvent<HTMLInputElement>,

    itemId: string,

    field:
      | "grossWeightGrams"
      | "stoneWeightGrams"
      | "otherDeductionWeightGrams"
      | "marketRatePerGram",
  ): void {
    const rawValue = event.target.value.replace(/,/g, "");

    if (field === "marketRatePerGram") {
      updateGoldItem(itemId, {
        [field]: parseGoldNumberInput(rawValue),
      });

      return;
    }

    if (!/^\d*(?:\.\d{0,3})?$/.test(rawValue)) {
      return;
    }

    setNumericDraft(itemId, field, rawValue);

    updateGoldItem(itemId, {
      [field]: parseGoldNumberInput(rawValue),
    });
  }

  /* =========================================================
     QUANTITY CHANGE
  ========================================================= */

  function handleQuantityChange(
    event: ChangeEvent<HTMLInputElement>,

    itemId: string,
  ): void {
    const rawValue = event.target.value;

    if (!/^\d*$/.test(rawValue)) {
      return;
    }

    setNumericDraft(itemId, "quantity", rawValue);

    updateGoldItem(itemId, {
      quantity:
        rawValue.length === 0
          ? 1
          : parseGoldQuantity(rawValue),
    });
  }

  /* =========================================================
     SELECT ITEM TYPE
  ========================================================= */

  function handleSelectItemType(
    itemId: string,

    itemType: GoldItemType,
  ): void {
    updateGoldItem(itemId, {
      itemType,
    });

    closeDropdown();
  }

  /* =========================================================
     SELECT PURITY
  ========================================================= */

  function handleSelectPurity(
    itemId: string,

    purityKarat: GoldPurityKarat,
  ): void {
    updateGoldItem(itemId, {
      purityKarat,
    });

    closeDropdown();
  }

  /* =========================================================
     SELECT HALLMARK
  ========================================================= */

  function handleSelectHallmark(
    itemId: string,

    hallmarkStatus: GoldHallmarkStatus,
  ): void {
    updateGoldItem(itemId, {
      hallmarkStatus,
    });

    closeDropdown();
  }

  /* =========================================================
     EMPTY STATE
  ========================================================= */

  if (items.length === 0) {
    return (
      <section style={styles.root}>
        <header style={styles.header}>
          <div style={styles.headingGroup}>
            <span style={styles.headingIcon}>
              <Gem size={moduleTokens.item.itemIconSize} strokeWidth={1.9} />
            </span>

            <div style={styles.headingTextGroup}>
              <h2 style={styles.title}>Pledged Gold Items</h2>

              <p style={styles.subtitle}>
                Record every pledged ornament or gold article separately.
              </p>
            </div>
          </div>
        </header>

        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>
            <Gem size={22} strokeWidth={1.8} />
          </span>

          <h3 style={styles.emptyTitle}>No Gold Items Added</h3>

          <p style={styles.emptyDescription}>
            Add the customer&apos;s chain, bangles, rings, necklace or other
            pledged gold items.
          </p>

          {!readOnly ? (
            <button
              type="button"
              onClick={handleAddItem}
              style={styles.emptyAddButton}
            >
              <Plus
                size={moduleTokens.control.buttonIconSize}
                strokeWidth={2}
              />
              Add Gold Item
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <section style={styles.root}>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <header style={styles.header}>
        <div style={styles.headingGroup}>
          <span style={styles.headingIcon}>
            <Gem size={moduleTokens.item.itemIconSize} strokeWidth={1.9} />
          </span>

          <div style={styles.headingTextGroup}>
            <h2 style={styles.title}>Pledged Gold Items</h2>

            <p style={styles.subtitle}>
              Enter each pledged item separately for accurate weight, purity and
              valuation.
            </p>
          </div>
        </div>

        <div style={styles.headerActions}>
          <span style={styles.itemCountBadge}>
            {items.length} {items.length === 1 ? "Item" : "Items"}
          </span>

          {!readOnly ? (
            <button
              type="button"
              onClick={handleAddItem}
              style={styles.addItemButton}
            >
              <Plus
                size={moduleTokens.control.buttonIconSize}
                strokeWidth={2}
              />
              Add Gold Item
            </button>
          ) : null}
        </div>
      </header>

      {/* =====================================================
          ITEMS GRID
      ===================================================== */}

      <div style={styles.itemsGrid}>
        {items.map((item, itemIndex) => {
          const itemTypeDropdownOpen = isDropdownOpen(item.id, "itemType");

          const purityDropdownOpen = isDropdownOpen(item.id, "purity");

          const hallmarkDropdownOpen = isDropdownOpen(item.id, "hallmark");

          const grossInvalid = item.grossWeightGrams <= 0;

          const marketRateInvalid = item.marketRatePerGram <= 0;

          const deductionsInvalid =
            item.stoneWeightGrams + item.otherDeductionWeightGrams >
            item.grossWeightGrams;

          const grossControlStyle = {
            ...styles.controlShell,
            ...getGoldItemFieldStateStyle({
              focused: isFieldFocused(item.id, "grossWeight"),

              invalid: grossInvalid,

              readOnly,
            }),
          };

          const stoneControlStyle = {
            ...styles.controlShell,
            ...getGoldItemFieldStateStyle({
              focused: isFieldFocused(item.id, "stoneWeight"),

              invalid: deductionsInvalid,

              readOnly,
            }),
          };

          const deductionControlStyle = {
            ...styles.controlShell,
            ...getGoldItemFieldStateStyle({
              focused: isFieldFocused(item.id, "otherDeduction"),

              invalid: deductionsInvalid,

              readOnly,
            }),
          };

          const marketRateControlStyle = {
            ...styles.controlShell,
            ...getGoldItemFieldStateStyle({
              focused: isFieldFocused(item.id, "marketRate"),

              invalid: marketRateInvalid,

              readOnly,
            }),
          };

          const quantityControlStyle = {
            ...styles.controlShell,
            ...getGoldItemFieldStateStyle({
              focused: isFieldFocused(item.id, "quantity"),

              invalid: item.quantity < 1,

              readOnly,
            }),
          };

          const itemNameControlStyle = {
            ...styles.controlShell,
            ...getGoldItemFieldStateStyle({
              focused: isFieldFocused(item.id, "itemName"),

              invalid: false,

              readOnly,
            }),
          };

          const descriptionControlStyle = {
            ...styles.controlShell,
            ...getGoldItemFieldStateStyle({
              focused: isFieldFocused(item.id, "description"),

              invalid: false,

              readOnly,
            }),
          };

          const hallmarkReferenceControlStyle = {
            ...styles.controlShell,
            ...getGoldItemFieldStateStyle({
              focused: isFieldFocused(item.id, "hallmarkReference"),

              invalid: false,

              readOnly,
            }),
          };

          const removeButtonStyle = {
            ...styles.removeButton,
            ...getGoldItemRemoveButtonStateStyle({
              disabled: readOnly,
            }),
          };

          const assessedMoneyStyle = {
            ...styles.derivedMetricValue,
            ...getGoldItemMoneyValueStyle(),
          };

          const netWeightStyle = {
            ...styles.derivedMetricValue,
            ...getGoldItemPositiveValueStyle(),
          };

          return (
            <article key={item.id} style={styles.itemCard}>
              {/* ==========================================
                    ITEM HEADER
                ========================================== */}

              <header style={styles.itemHeader}>
                <div style={styles.itemIdentity}>
                  <span style={styles.itemIcon}>
                    <Gem
                      size={moduleTokens.item.itemIconSize}
                      strokeWidth={1.9}
                    />
                  </span>

                  <div style={styles.itemTitleGroup}>
                    <h3 style={styles.itemTitle}>
                      {getGoldItemDisplayTitle(item)}
                    </h3>

                    <p style={styles.itemSubtitle}>
                      {getGoldItemDisplaySubtitle(item)}
                    </p>
                  </div>
                </div>

                <div style={styles.itemHeaderActions}>
                  <span style={styles.itemNumberBadge}>#{itemIndex + 1}</span>

                  {!readOnly ? (
                    <button
                      type="button"
                      onClick={() => {
                        handleRemoveItem(item.id);
                      }}
                      style={removeButtonStyle}
                      aria-label={`Remove gold item ${itemIndex + 1}`}
                    >
                      <Trash2
                        size={moduleTokens.control.buttonIconSize}
                        strokeWidth={1.9}
                      />
                    </button>
                  ) : null}
                </div>
              </header>

              {/* ==========================================
                    MAIN FIELDS
                ========================================== */}

              <div style={styles.fieldsGrid}>
                {/* ITEM TYPE */}

                <div style={styles.field}>
                  <div style={styles.fieldLabelRow}>
                    <span style={styles.fieldLabel}>Item Type</span>

                    <span style={styles.fieldRequired}>*</span>
                  </div>

                  <div style={styles.selectControl}>
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => {
                        toggleDropdown(item.id, "itemType");
                      }}
                      style={styles.selectButton}
                      aria-expanded={itemTypeDropdownOpen}
                    >
                      <span style={styles.selectButtonContent}>
                        <Gem
                          size={moduleTokens.control.inputIconSize}
                          strokeWidth={1.8}
                        />

                        <span style={styles.selectValueGroup}>
                          <span style={styles.selectPrimary}>
                            {getGoldItemTypeLabel(item.itemType)}
                          </span>

                          <span style={styles.selectSecondary}>
                            Gold article category
                          </span>
                        </span>
                      </span>

                      <span style={styles.selectChevron}>
                        <ChevronDown size={16} strokeWidth={1.9} />
                      </span>
                    </button>

                    {itemTypeDropdownOpen ? (
                      <div style={styles.dropdown} role="listbox">
                        {GOLD_ITEM_TYPE_OPTIONS.map((option) => {
                          const selected = option.value === item.itemType;

                          const optionStyle = {
                            ...styles.dropdownOption,
                            ...getGoldItemDropdownOptionStateStyle({
                              selected,
                              disabled: false,
                            }),
                          };

                          return (
                            <button
                              key={option.value}
                              type="button"
                              role="option"
                              aria-selected={selected}
                              onClick={() => {
                                handleSelectItemType(item.id, option.value);
                              }}
                              style={optionStyle}
                            >
                              <span style={styles.dropdownOptionIdentity}>
                                <Gem size={15} strokeWidth={1.8} />

                                <span style={styles.dropdownOptionTextGroup}>
                                  <span style={styles.dropdownOptionPrimary}>
                                    {option.label}
                                  </span>
                                </span>
                              </span>

                              {selected ? (
                                <span style={styles.dropdownOptionCheck}>
                                  <Check size={15} strokeWidth={2} />
                                </span>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* ITEM NAME */}

                <div style={styles.field}>
                  <div style={styles.fieldLabelRow}>
                    <span style={styles.fieldLabel}>Item Name</span>
                  </div>

                  <div style={itemNameControlStyle}>
                    <span style={styles.controlIcon}>
                      <Gem
                        size={moduleTokens.control.inputIconSize}
                        strokeWidth={1.8}
                      />
                    </span>

                    <input
                      type="text"
                      value={item.itemName}
                      readOnly={readOnly}
                      placeholder="Ex: Lakshmi Chain"
                      onFocus={() => {
                        handleFieldFocus(item.id, "itemName");
                      }}
                      onBlur={handleFieldBlur}
                      onChange={(event) => {
                        handleTextChange(event, item.id, "itemName");
                      }}
                      style={styles.inputWithIcon}
                    />
                  </div>
                </div>

                {/* QUANTITY */}

                <div style={styles.field}>
                  <div style={styles.fieldLabelRow}>
                    <span style={styles.fieldLabel}>Quantity</span>
                  </div>

                  <div style={quantityControlStyle}>
                    <span style={styles.controlIcon}>
                      <Hash
                        size={moduleTokens.control.inputIconSize}
                        strokeWidth={1.8}
                      />
                    </span>

                    <input
                      type="text"
                      inputMode="numeric"
                      value={getNumericInputValue(
                        item.id,
                        "quantity",
                        item.quantity,
                      )}
                      placeholder="0"
                      readOnly={readOnly}
                      onFocus={() => {
                        handleFieldFocus(item.id, "quantity");
                      }}
                      onBlur={handleFieldBlur}
                      onChange={(event) => {
                        handleQuantityChange(event, item.id);
                      }}
                      style={styles.inputWithIcon}
                    />
                  </div>
                </div>

                {/* DESCRIPTION */}

                <div style={styles.fieldWide}>
                  <div style={styles.fieldLabelRow}>
                    <span style={styles.fieldLabel}>Description</span>
                  </div>

                  <div style={descriptionControlStyle}>
                    <span style={styles.controlIcon}>
                      <FileText
                        size={moduleTokens.control.inputIconSize}
                        strokeWidth={1.8}
                      />
                    </span>

                    <input
                      type="text"
                      value={item.description}
                      readOnly={readOnly}
                      placeholder="Design, stones, identifying details..."
                      onFocus={() => {
                        handleFieldFocus(item.id, "description");
                      }}
                      onBlur={handleFieldBlur}
                      onChange={(event) => {
                        handleTextChange(event, item.id, "description");
                      }}
                      style={styles.inputWithIcon}
                    />
                  </div>
                </div>

                {/* GROSS WEIGHT */}

                <div style={styles.field}>
                  <div style={styles.fieldLabelRow}>
                    <span style={styles.fieldLabel}>Gross Weight</span>

                    <span style={styles.fieldRequired}>*</span>
                  </div>

                  <div style={grossControlStyle}>
                    <span style={styles.controlIcon}>
                      <Weight
                        size={moduleTokens.control.inputIconSize}
                        strokeWidth={1.8}
                      />
                    </span>

                    <input
                      type="text"
                      inputMode="decimal"
                      value={getNumericInputValue(
                        item.id,
                        "grossWeightGrams",
                        item.grossWeightGrams,
                      )}
                      readOnly={readOnly}
                      placeholder="0.000"
                      onFocus={() => {
                        handleFieldFocus(item.id, "grossWeight");
                      }}
                      onBlur={handleFieldBlur}
                      onChange={(event) => {
                        handleNumericChange(event, item.id, "grossWeightGrams");
                      }}
                      style={styles.inputWithIcon}
                    />

                    <span style={styles.inputSuffix}>gm</span>
                  </div>
                </div>

                {/* STONE WEIGHT */}

                <div style={styles.field}>
                  <div style={styles.fieldLabelRow}>
                    <span style={styles.fieldLabel}>Stone Weight</span>
                  </div>

                  <div style={stoneControlStyle}>
                    <span style={styles.controlIcon}>
                      <Scale
                        size={moduleTokens.control.inputIconSize}
                        strokeWidth={1.8}
                      />
                    </span>

                    <input
                      type="text"
                      inputMode="decimal"
                      value={getNumericInputValue(
                        item.id,
                        "stoneWeightGrams",
                        item.stoneWeightGrams,
                      )}
                      readOnly={readOnly}
                      placeholder="0.000"
                      onFocus={() => {
                        handleFieldFocus(item.id, "stoneWeight");
                      }}
                      onBlur={handleFieldBlur}
                      onChange={(event) => {
                        handleNumericChange(event, item.id, "stoneWeightGrams");
                      }}
                      style={styles.inputWithIcon}
                    />

                    <span style={styles.inputSuffix}>gm</span>
                  </div>
                </div>

                {/* OTHER DEDUCTION */}

                <div style={styles.field}>
                  <div style={styles.fieldLabelRow}>
                    <span style={styles.fieldLabel}>Other Deduction</span>
                  </div>

                  <div style={deductionControlStyle}>
                    <span style={styles.controlIcon}>
                      <Scale
                        size={moduleTokens.control.inputIconSize}
                        strokeWidth={1.8}
                      />
                    </span>

                    <input
                      type="text"
                      inputMode="decimal"
                      value={getNumericInputValue(
                        item.id,
                        "otherDeductionWeightGrams",
                        item.otherDeductionWeightGrams,
                      )}
                      readOnly={readOnly}
                      placeholder="0.000"
                      onFocus={() => {
                        handleFieldFocus(item.id, "otherDeduction");
                      }}
                      onBlur={handleFieldBlur}
                      onChange={(event) => {
                        handleNumericChange(
                          event,
                          item.id,
                          "otherDeductionWeightGrams",
                        );
                      }}
                      style={styles.inputWithIcon}
                    />

                    <span style={styles.inputSuffix}>gm</span>
                  </div>

                  {deductionsInvalid ? (
                    <span style={styles.fieldHelper}>
                      Total deductions cannot exceed gross weight.
                    </span>
                  ) : null}
                </div>

                {/* PURITY */}

                <div style={styles.field}>
                  <div style={styles.fieldLabelRow}>
                    <span style={styles.fieldLabel}>Purity / Karat</span>

                    <span style={styles.fieldRequired}>*</span>
                  </div>

                  <div style={styles.selectControl}>
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => {
                        toggleDropdown(item.id, "purity");
                      }}
                      style={styles.selectButton}
                      aria-expanded={purityDropdownOpen}
                    >
                      <span style={styles.selectButtonContent}>
                        <BadgeCheck
                          size={moduleTokens.control.inputIconSize}
                          strokeWidth={1.8}
                        />

                        <span style={styles.selectValueGroup}>
                          <span style={styles.selectPrimary}>
                            {item.purityKarat}K Gold
                          </span>

                          <span style={styles.selectSecondary}>
                            {formatGoldPercentage(item.purityPercentage)} purity
                          </span>
                        </span>
                      </span>

                      <span style={styles.selectChevron}>
                        <ChevronDown size={16} strokeWidth={1.9} />
                      </span>
                    </button>

                    {purityDropdownOpen ? (
                      <div style={styles.dropdown} role="listbox">
                        {GOLD_PURITY_OPTIONS.map((option) => {
                          const selected = option.karat === item.purityKarat;

                          const optionStyle = {
                            ...styles.dropdownOption,
                            ...getGoldItemDropdownOptionStateStyle({
                              selected,
                              disabled: false,
                            }),
                          };

                          return (
                            <button
                              key={option.karat}
                              type="button"
                              role="option"
                              aria-selected={selected}
                              onClick={() => {
                                handleSelectPurity(item.id, option.karat);
                              }}
                              style={optionStyle}
                            >
                              <span style={styles.dropdownOptionIdentity}>
                                <BadgeCheck size={15} strokeWidth={1.8} />

                                <span style={styles.dropdownOptionTextGroup}>
                                  <span style={styles.dropdownOptionPrimary}>
                                    {option.label}
                                  </span>

                                  <span style={styles.dropdownOptionSecondary}>
                                    {formatGoldPercentage(
                                      option.purityPercentage,
                                    )}
                                  </span>
                                </span>
                              </span>

                              {selected ? (
                                <span style={styles.dropdownOptionCheck}>
                                  <Check size={15} strokeWidth={2} />
                                </span>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* MARKET RATE */}

                <div style={styles.field}>
                  <div style={styles.fieldLabelRow}>
                    <span style={styles.fieldLabel}>Gold Rate / Fine Gram</span>

                    <span style={styles.fieldRequired}>*</span>
                  </div>

                  <div style={marketRateControlStyle}>
                    <span style={styles.controlIcon}>
                      <Calculator
                        size={moduleTokens.control.inputIconSize}
                        strokeWidth={1.8}
                      />
                    </span>

                    <input
                      type="text"
                      inputMode="decimal"
                      value={
                        item.marketRatePerGram > 0
                          ? formatCurrency(item.marketRatePerGram)
                          : ""
                      }
                      readOnly={readOnly}
                      placeholder="0"
                      onFocus={() => {
                        handleFieldFocus(item.id, "marketRate");
                      }}
                      onBlur={handleFieldBlur}
                      onChange={(event) => {
                        handleNumericChange(
                          event,
                          item.id,
                          "marketRatePerGram",
                        );
                      }}
                      style={styles.inputWithIcon}
                    />

                    <span style={styles.inputSuffix}>INR/gm</span>
                  </div>
                </div>

                {/* HALLMARK STATUS */}

                <div style={styles.field}>
                  <div style={styles.fieldLabelRow}>
                    <span style={styles.fieldLabel}>Hallmark Status</span>
                  </div>

                  <div style={styles.selectControl}>
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => {
                        toggleDropdown(item.id, "hallmark");
                      }}
                      style={styles.selectButton}
                      aria-expanded={hallmarkDropdownOpen}
                    >
                      <span style={styles.selectButtonContent}>
                        <BadgeCheck
                          size={moduleTokens.control.inputIconSize}
                          strokeWidth={1.8}
                        />

                        <span style={styles.selectValueGroup}>
                          <span style={styles.selectPrimary}>
                            {getHallmarkLabel(item.hallmarkStatus)}
                          </span>

                          <span style={styles.selectSecondary}>
                            Hallmark verification
                          </span>
                        </span>
                      </span>

                      <span style={styles.selectChevron}>
                        <ChevronDown size={16} strokeWidth={1.9} />
                      </span>
                    </button>

                    {hallmarkDropdownOpen ? (
                      <div style={styles.dropdown} role="listbox">
                        {HALLMARK_OPTIONS.map((option) => {
                          const selected = option.value === item.hallmarkStatus;

                          const optionStyle = {
                            ...styles.dropdownOption,
                            ...getGoldItemDropdownOptionStateStyle({
                              selected,
                              disabled: false,
                            }),
                          };

                          return (
                            <button
                              key={option.value}
                              type="button"
                              role="option"
                              aria-selected={selected}
                              onClick={() => {
                                handleSelectHallmark(item.id, option.value);
                              }}
                              style={optionStyle}
                            >
                              <span style={styles.dropdownOptionIdentity}>
                                <BadgeCheck size={15} strokeWidth={1.8} />

                                <span style={styles.dropdownOptionTextGroup}>
                                  <span style={styles.dropdownOptionPrimary}>
                                    {option.label}
                                  </span>

                                  <span style={styles.dropdownOptionSecondary}>
                                    {option.description}
                                  </span>
                                </span>
                              </span>

                              {selected ? (
                                <span style={styles.dropdownOptionCheck}>
                                  <Check size={15} strokeWidth={2} />
                                </span>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* HALLMARK REFERENCE */}

                <div style={styles.field}>
                  <div style={styles.fieldLabelRow}>
                    <span style={styles.fieldLabel}>
                      Hallmark / HUID Reference
                    </span>
                  </div>

                  <div style={hallmarkReferenceControlStyle}>
                    <span style={styles.controlIcon}>
                      <Hash
                        size={moduleTokens.control.inputIconSize}
                        strokeWidth={1.8}
                      />
                    </span>

                    <input
                      type="text"
                      value={item.hallmarkReference}
                      readOnly={readOnly}
                      placeholder="Optional reference"
                      onFocus={() => {
                        handleFieldFocus(item.id, "hallmarkReference");
                      }}
                      onBlur={handleFieldBlur}
                      onChange={(event) => {
                        handleTextChange(event, item.id, "hallmarkReference");
                      }}
                      style={styles.inputWithIcon}
                    />
                  </div>
                </div>
              </div>

              {/* ==========================================
                    CALCULATED VALUES
                ========================================== */}

              <section style={styles.derivedSection}>
                <header style={styles.derivedHeader}>
                  <div style={styles.derivedHeadingGroup}>
                    <span style={styles.derivedIcon}>
                      <Calculator size={15} strokeWidth={1.9} />
                    </span>

                    <div>
                      <h4 style={styles.derivedTitle}>Item Valuation</h4>

                      <p style={styles.derivedSubtitle}>
                        Automatically derived from entered weight and purity.
                      </p>
                    </div>
                  </div>
                </header>

                <div style={styles.derivedGrid}>
                  <article style={styles.derivedMetric}>
                    <span style={styles.derivedMetricLabel}>Net Weight</span>

                    <strong style={netWeightStyle}>
                      {formatGoldWeight(item.netWeightGrams)}
                    </strong>

                    <span style={styles.derivedMetricUnit}>Grams</span>
                  </article>

                  <article style={styles.derivedMetric}>
                    <span style={styles.derivedMetricLabel}>Purity</span>

                    <strong style={styles.derivedMetricValue}>
                      {formatGoldPercentage(item.purityPercentage)}
                    </strong>

                    <span style={styles.derivedMetricUnit}>
                      {item.purityKarat}K
                    </span>
                  </article>

                  <article style={styles.derivedMetric}>
                    <span style={styles.derivedMetricLabel}>Fine Gold</span>

                    <strong style={styles.derivedMetricValue}>
                      {formatGoldWeight(item.fineGoldWeightGrams)}
                    </strong>

                    <span style={styles.derivedMetricUnit}>Grams</span>
                  </article>

                  <article style={styles.derivedMetric}>
                    <span style={styles.derivedMetricLabel}>
                      Assessed Value
                    </span>

                    <strong style={assessedMoneyStyle}>
                      {formatGoldMoney(item.assessedValue)}
                    </strong>

                    <span style={styles.derivedMetricUnit}>Item valuation</span>
                  </article>
                </div>
              </section>

              {/* ==========================================
                    REMARKS
                ========================================== */}

              <div style={styles.field}>
                <div style={styles.fieldLabelRow}>
                  <span style={styles.fieldLabel}>Item Remarks</span>
                </div>

                <textarea
                  value={item.remarks}
                  readOnly={readOnly}
                  placeholder="Condition, design, identifying notes or internal remarks..."
                  onFocus={() => {
                    handleFieldFocus(item.id, "remarks");
                  }}
                  onBlur={handleFieldBlur}
                  onChange={(event) => {
                    handleRemarksChange(event, item.id);
                  }}
                  style={styles.remarksArea}
                />
              </div>
            </article>
          );
        })}
      </div>

      {/* =====================================================
          TOTAL SUMMARY
      ===================================================== */}

      <section style={styles.summary}>
        <header style={styles.summaryHeader}>
          <div style={styles.summaryHeadingGroup}>
            <span style={styles.summaryIcon}>
              <Scale size={moduleTokens.item.itemIconSize} strokeWidth={1.9} />
            </span>

            <div>
              <h3 style={styles.summaryTitle}>Gold Items Summary</h3>

              <p style={styles.summarySubtitle}>
                Consolidated pledged-gold totals for this loan.
              </p>
            </div>
          </div>
        </header>

        <div style={styles.summaryGrid}>
          <article style={styles.summaryMetric}>
            <span style={styles.summaryMetricLabel}>Gold Items</span>

            <strong style={styles.summaryMetricValue}>
              {totals.itemCount}
            </strong>

            <span style={styles.summaryMetricUnit}>
              {totals.totalQuantity} Total quantity
            </span>
          </article>

          <article style={styles.summaryMetric}>
            <span style={styles.summaryMetricLabel}>Gross Weight</span>

            <strong style={styles.summaryMetricValue}>
              {formatGoldWeight(totals.totalGrossWeightGrams)}
            </strong>

            <span style={styles.summaryMetricUnit}>Grams</span>
          </article>

          <article style={styles.summaryMetric}>
            <span style={styles.summaryMetricLabel}>Net Weight</span>

            <strong style={styles.summaryMetricValue}>
              {formatGoldWeight(totals.totalNetWeightGrams)}
            </strong>

            <span style={styles.summaryMetricUnit}>Grams after deductions</span>
          </article>

          <article style={styles.summaryMetric}>
            <span style={styles.summaryMetricLabel}>Fine Gold</span>

            <strong style={styles.summaryMetricValue}>
              {formatGoldWeight(totals.totalFineGoldWeightGrams)}
            </strong>

            <span style={styles.summaryMetricUnit}>Purity-adjusted grams</span>
          </article>

          <article style={styles.summaryMetric}>
            <span style={styles.summaryMetricLabel}>Stone Weight</span>

            <strong style={styles.summaryMetricValue}>
              {formatGoldWeight(totals.totalStoneWeightGrams)}
            </strong>

            <span style={styles.summaryMetricUnit}>Grams</span>
          </article>

          <article style={styles.summaryMetric}>
            <span style={styles.summaryMetricLabel}>Other Deduction</span>

            <strong style={styles.summaryMetricValue}>
              {formatGoldWeight(totals.totalOtherDeductionWeightGrams)}
            </strong>

            <span style={styles.summaryMetricUnit}>Grams</span>
          </article>

          <article style={styles.summaryMetric}>
            <span style={styles.summaryMetricLabel}>Assessed Gold Value</span>

            <strong style={summaryMoneyValueStyle}>
              {formatGoldMoney(totals.totalAssessedValue)}
            </strong>

            <span style={styles.summaryMetricUnit}>
              Combined item valuation
            </span>
          </article>
        </div>
      </section>
    </section>
  );
}

/* ===========================================================
   END
=========================================================== */
