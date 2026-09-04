/* ==========================================================
   FINORA ENTERPRISE OS™

   LOAN STUDIO — STEP 3
   DOCUMENTS STUDIO™

   RESPONSIBILITY:
   - Document Studio state and workflow controller.
   - Categorised upload flow.
   - Rename / delete / preview / gallery orchestration.
   - Persistent-ready document metadata preparation.
   - Customer + Loan ownership propagation.
   - All visual presentation is delegated to parts + styles.

   STORAGE CONTRACT:
   - This component does NOT directly access StorageManager.
   - Uploaded files are converted to a persistent-ready dataUrl.
   - storageKey is generated using the canonical FINORA document
     namespace.
   - Actual physical persistence is performed by the parent/service
     layer.
========================================================== */

import type { ChangeEvent, KeyboardEvent } from "react";

import { useMemo, useRef, useState } from "react";

import {
  CATEGORIES,
  createDocumentStorageKey,
  createId,
  getDisplayName,
  getItemType,
} from "./DocumentsStudio.types";

import type {
  CategoryId,
  DocumentsStudioItem,
  DocumentsStudioProps,
} from "./DocumentsStudio.types";

import {
  CategoryCard,
  CategoryGallery,
  DocumentViewer,
  EvidencePreview,
  RenameDialog,
} from "./DocumentsStudio.parts";

import {
  badgeStyle,
  categoryGridStyle,
  headerAccentStyle,
  headerBadgeWrapStyle,
  headerDescriptionStyle,
  headerStyle,
  headerTextStyle,
  headerTitleStyle,
  sectionStyle,
  sectionHintStyle,
  sectionTitleRowStyle,
  sectionTitleStyle,
  uploadInputStyle,
} from "./DocumentsStudio.styles";

/* ==========================================================
   CONSTANTS
========================================================== */

const ACCEPTED_TYPES =
  "image/jpeg,image/png,image/webp,image/gif,application/pdf";

/* ==========================================================
   PUBLIC TYPE RE-EXPORTS
========================================================== */

export type {
  CategoryId,
  DocumentsStudioItem,
  DocumentsStudioProps,
} from "./DocumentsStudio.types";

/* ==========================================================
   FILE -> DATA URL
   ----------------------------------------------------------
   Converts the selected browser File into a serializable
   representation.

   IMPORTANT:
   - This does NOT write to StorageManager.
   - It only prepares the document for the persistence layer.
========================================================== */

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Unable to read uploaded document."));
    };

    reader.onerror = () => {
      reject(reader.error ?? new Error("Unable to read uploaded document."));
    };

    reader.readAsDataURL(file);
  });
}

/* ==========================================================
   COMPONENT
========================================================== */

export default function DocumentsStudio({
  customerId,
  loanId,
  customerName: _customerName,
  customerPhoto: _customerPhoto,
  items: itemsProp,
  onDocumentsChange,
}: DocumentsStudioProps) {
  void _customerName;
  void _customerPhoto;

  /* ========================================================
     STATE
  ======================================================== */

  const [localItems, setLocalItems] = useState<DocumentsStudioItem[]>([]);

  const items = itemsProp ?? localItems;

  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(
    null,
  );

  const [viewerItem, setViewerItem] = useState<DocumentsStudioItem | null>(
    null,
  );

  const [renamingItemId, setRenamingItemId] = useState<string | null>(null);

  const [renameValue, setRenameValue] = useState("");

  const activeUploadRef = useRef<HTMLInputElement | null>(null);

  const [activeUploadCategory, setActiveUploadCategory] =
    useState<CategoryId | null>(null);

  /* ========================================================
     DERIVED DATA
  ======================================================== */

  const allEvidence = useMemo(() => items, [items]);

  const categoryItemsMap = useMemo(() => {
    return CATEGORIES.reduce(
      (result, category) => {
        result[category.id] = items.filter(
          (item) => item.categoryId === category.id,
        );

        return result;
      },
      {} as Record<CategoryId, DocumentsStudioItem[]>,
    );
  }, [items]);

  const selectedCategoryConfig = CATEGORIES.find(
    (category) => category.id === selectedCategory,
  );

  const selectedItems = selectedCategory
    ? (categoryItemsMap[selectedCategory] ?? [])
    : [];

  /* ========================================================
     DOCUMENT PUBLISH
  ======================================================== */

  function publishItems(nextItems: DocumentsStudioItem[]): void {
    setLocalItems(nextItems);

    onDocumentsChange?.(nextItems);
  }

  /* ========================================================
     UPLOAD DIALOG
  ======================================================== */

  function openUpload(categoryId: CategoryId): void {
    setActiveUploadCategory(categoryId);

    window.setTimeout(() => activeUploadRef.current?.click(), 0);
  }

  /* ========================================================
     UPLOAD
     --------------------------------------------------------
     Flow:

       Browser File
            ↓
       FileReader
            ↓
       dataUrl
            ↓
       DocumentsStudioItem
            ↓
       onDocumentsChange
            ↓
       Parent / persistence layer
========================================================== */

  async function handleCategoryUpload(
    event: ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    const files = Array.from(event.target.files ?? []);

    const categoryId = activeUploadCategory;

    event.target.value = "";

    if (!categoryId || files.length === 0) {
      return;
    }

    const validFiles = files.filter((file) => getItemType(file) !== null);

    if (validFiles.length === 0) {
      return;
    }

    try {
      const created: DocumentsStudioItem[] = [];

      for (const file of validFiles) {
        const type = getItemType(file);

        if (!type) {
          continue;
        }

        const documentId = createId("DOC");

        /*
         * Keep the browser object URL for immediate preview.
         *
         * This URL is presentation-only and is NOT treated as
         * the permanent storage location.
         */
        const previewUrl = URL.createObjectURL(file);

        /*
         * Convert the file into a serializable representation
         * for the persistence layer.
         */
        const dataUrl = await readFileAsDataUrl(file);

        /*
         * Generate the canonical FINORA logical document key.
         *
         * If a loan exists:
         *
         * FINORA/loans/<loanId>/documents/<documentId>
         *
         * Otherwise:
         *
         * FINORA/customers/<customerId>/documents/<documentId>
         */
        const storageKey = customerId?.trim()
          ? createDocumentStorageKey(customerId, documentId, loanId)
          : undefined;

        created.push({
          id: documentId,

          categoryId,

          name: getDisplayName(file.name),

          originalName: file.name,

          type,

          mimeType:
            file.type || (type === "pdf" ? "application/pdf" : "image/*"),

          url: previewUrl,

          size: file.size,

          createdAt: new Date().toISOString(),

          /*
           * Persistent-ready content.
           */
          dataUrl,

          /*
           * Logical FINORA storage namespace.
           */
          storageKey,

          /*
           * The actual storage operation has not happened yet.
           *
           * Parent/service layer will change this to:
           *
           * persisted: true
           *
           * persistenceMode: "local" | "usb" | "cloud"
           */
          persistenceMode: storageKey ? "pending" : "pending",

          persisted: false,

          /*
           * Ownership links.
           */
          customerId: customerId?.trim() || undefined,

          loanId: loanId?.trim() || undefined,
        });
      }

      if (created.length === 0) {
        return;
      }

      publishItems([...items, ...created]);
    } catch (error) {
      /*
       * Do not silently mark a failed conversion as persisted.
       *
       * The browser preview remains untouched for successfully
       * created items. The parent persistence layer remains the
       * authoritative storage owner.
       */
      console.error(
        "FINORA Documents Studio: document preparation failed.",
        error,
      );
    }
  }

  /* ========================================================
     RENAME
  ======================================================== */

  function beginRename(item: DocumentsStudioItem): void {
    setRenamingItemId(item.id);

    setRenameValue(item.name);
  }

  function closeRename(): void {
    setRenamingItemId(null);

    setRenameValue("");
  }

  function saveRename(): void {
    const normalized = renameValue.trim();

    if (!renamingItemId || !normalized) {
      closeRename();

      return;
    }

    const nextItems = items.map((item) =>
      item.id === renamingItemId
        ? {
            ...item,

            name: normalized,
          }
        : item,
    );

    publishItems(nextItems);

    closeRename();
  }

  function handleRenameKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "Enter") {
      saveRename();
    }

    if (event.key === "Escape") {
      closeRename();
    }
  }

  /* ========================================================
     DELETE
  ======================================================== */

  function deleteItem(item: DocumentsStudioItem): void {
    const nextItems = items.filter((current) => current.id !== item.id);

    /*
     * Release browser memory for the temporary preview URL.
     *
     * Persistent storage deletion will be handled separately
     * by the persistence/service layer once the document
     * contract is connected there.
     */
    if (item.url.startsWith("blob:")) {
      URL.revokeObjectURL(item.url);
    }

    publishItems(nextItems);

    if (viewerItem?.id === item.id) {
      setViewerItem(null);
    }

    if (renamingItemId === item.id) {
      closeRename();
    }
  }

  /* ========================================================
     CATEGORY NAVIGATION
  ======================================================== */

  function openCategory(categoryId: CategoryId): void {
    setSelectedCategory(categoryId);
  }

  function closeCategory(): void {
    setSelectedCategory(null);
  }

  /* ========================================================
     RENDER
  ======================================================== */

  return (
    <section style={sectionStyle}>
      {/* ======================================================
         HEADER
      ====================================================== */}

      <div style={headerStyle}>
        <div style={headerAccentStyle} />

        <div style={headerTextStyle}>
          <h2 style={headerTitleStyle}>Documents Studio</h2>

          <p style={headerDescriptionStyle}>
            Upload & manage customer, collateral and loan documents.
          </p>
        </div>

        <div style={headerBadgeWrapStyle}>
          <span style={badgeStyle}>{allEvidence.length} evidence</span>
        </div>
      </div>

      {/* ======================================================
         DOCUMENT CATEGORIES HEADER
      ====================================================== */}

      <div style={sectionTitleRowStyle}>
        <div style={sectionTitleStyle}>DOCUMENT CATEGORIES</div>

        <div style={sectionHintStyle}>
          Upload only what this loan actually requires.
        </div>
      </div>

      {/* ======================================================
         CATEGORY GRID
      ====================================================== */}

      <div style={categoryGridStyle}>
        {CATEGORIES.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            items={categoryItemsMap[category.id] ?? []}
            onOpenCategory={openCategory}
            onOpenItem={setViewerItem}
            onUpload={openUpload}
          />
        ))}
      </div>

      {/* ======================================================
         ALL EVIDENCE GALLERY PREVIEW
      ====================================================== */}

      <EvidencePreview items={allEvidence} onOpen={setViewerItem} />

      {/* ======================================================
         HIDDEN CATEGORY UPLOAD INPUT
      ====================================================== */}

      <input
        ref={activeUploadRef}
        type="file"
        accept={ACCEPTED_TYPES}
        multiple
        onChange={handleCategoryUpload}
        style={uploadInputStyle}
      />

      {/* ======================================================
         FULL CATEGORY GALLERY
      ====================================================== */}

      {selectedCategory && selectedCategoryConfig && (
        <CategoryGallery
          category={selectedCategoryConfig}
          items={selectedItems}
          onBack={closeCategory}
          onUpload={() => openUpload(selectedCategory)}
          onOpen={setViewerItem}
          onRename={beginRename}
          onDelete={deleteItem}
        />
      )}

      {/* ======================================================
         RENAME DIALOG
      ====================================================== */}

      {renamingItemId && (
        <RenameDialog
          value={renameValue}
          onChange={(event) => setRenameValue(event.target.value)}
          onKeyDown={handleRenameKeyDown}
          onCancel={closeRename}
          onSave={saveRename}
        />
      )}

      {/* ======================================================
         FULL SCREEN VIEWER
      ====================================================== */}

      {viewerItem && (
        <DocumentViewer item={viewerItem} onClose={() => setViewerItem(null)} />
      )}
    </section>
  );
}

/* ==========================================================
   END
========================================================== */
