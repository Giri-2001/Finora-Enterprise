/* ==========================================================
   FINORA ENTERPRISE OS™
   LOAN STUDIO — STEP 3
   DOCUMENTS STUDIO™

   RESPONSIBILITY:
   - Document Studio state and workflow controller.
   - Categorised upload flow.
   - Rename / delete / preview / gallery orchestration.
   - All visual presentation is delegated to parts + styles.
========================================================== */

import type {
  ChangeEvent,
  KeyboardEvent,
} from "react";

import {
  useMemo,
  useRef,
  useState,
} from "react";

import {
  CATEGORIES,
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
   ----------------------------------------------------------
   Preserve the original DocumentsStudio import contract for
   parent components that import these types from this file.
========================================================== */

export type {
  CategoryId,
  DocumentsStudioItem,
  DocumentsStudioProps,
} from "./DocumentsStudio.types";

/* ==========================================================
   COMPONENT
========================================================== */

export default function DocumentsStudio({
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

  const [
    localItems,
    setLocalItems,
  ] = useState<DocumentsStudioItem[]>(
    [],
  );

  const items =
    itemsProp ?? localItems;

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState<CategoryId | null>(
    null,
  );

  const [
    viewerItem,
    setViewerItem,
  ] = useState<DocumentsStudioItem | null>(
    null,
  );

  const [
    renamingItemId,
    setRenamingItemId,
  ] = useState<string | null>(
    null,
  );

  const [
    renameValue,
    setRenameValue,
  ] = useState("");

  const activeUploadRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  const [
    activeUploadCategory,
    setActiveUploadCategory,
  ] = useState<CategoryId | null>(
    null,
  );

  /* ========================================================
     DERIVED DATA
  ======================================================== */

  const allEvidence = useMemo(
    () => items,
    [items],
  );

  const categoryItemsMap =
    useMemo(() => {
      return CATEGORIES.reduce(
        (
          result,
          category,
        ) => {
          result[category.id] =
            items.filter(
              (item) =>
                item.categoryId ===
                category.id,
            );

          return result;
        },
        {} as Record<
          CategoryId,
          DocumentsStudioItem[]
        >,
      );
    }, [items]);

  const selectedCategoryConfig =
    CATEGORIES.find(
      (category) =>
        category.id ===
        selectedCategory,
    );

  const selectedItems =
    selectedCategory
      ? categoryItemsMap[
          selectedCategory
        ] ?? []
      : [];

  /* ========================================================
     DOCUMENT PUBLISH
  ======================================================== */

  function publishItems(
    nextItems: DocumentsStudioItem[],
  ): void {
    setLocalItems(nextItems);

    onDocumentsChange?.(
      nextItems,
    );
  }

  /* ========================================================
     UPLOAD
  ======================================================== */

  function openUpload(
    categoryId: CategoryId,
  ): void {
    setActiveUploadCategory(
      categoryId,
    );

    window.setTimeout(
      () =>
        activeUploadRef.current?.click(),
      0,
    );
  }

  function handleCategoryUpload(
    event: ChangeEvent<HTMLInputElement>,
  ): void {
    const files = Array.from(
      event.target.files ?? [],
    );

    const categoryId =
      activeUploadCategory;

    event.target.value = "";

    if (
      !categoryId ||
      files.length === 0
    ) {
      return;
    }

    const validFiles =
      files.filter(
        (file) =>
          getItemType(file) !== null,
      );

    if (
      validFiles.length === 0
    ) {
      return;
    }

    const created =
      validFiles.map(
        (file) => {
          const type =
            getItemType(file)!;

          return {
            id: createId("DOC"),
            categoryId,
            name: getDisplayName(
              file.name,
            ),
            originalName:
              file.name,
            type,
            mimeType:
              file.type ||
              (
                type === "pdf"
                  ? "application/pdf"
                  : "image/*"
              ),
            url:
              URL.createObjectURL(
                file,
              ),
            size: file.size,
            createdAt:
              new Date().toISOString(),
          };
        },
      );

    publishItems([
      ...items,
      ...created,
    ]);
  }

  /* ========================================================
     RENAME
  ======================================================== */

  function beginRename(
    item: DocumentsStudioItem,
  ): void {
    setRenamingItemId(item.id);
    setRenameValue(item.name);
  }

  function closeRename(): void {
    setRenamingItemId(null);
    setRenameValue("");
  }

  function saveRename(): void {
    const normalized =
      renameValue.trim();

    if (
      !renamingItemId ||
      !normalized
    ) {
      closeRename();
      return;
    }

    const nextItems =
      items.map(
        (item) =>
          item.id ===
          renamingItemId
            ? {
                ...item,
                name: normalized,
              }
            : item,
      );

    publishItems(nextItems);
    closeRename();
  }

  function handleRenameKeyDown(
    event: KeyboardEvent<HTMLInputElement>,
  ): void {
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

  function deleteItem(
    item: DocumentsStudioItem,
  ): void {
    const nextItems =
      items.filter(
        (current) =>
          current.id !== item.id,
      );

    URL.revokeObjectURL(
      item.url,
    );

    publishItems(nextItems);

    if (
      viewerItem?.id ===
      item.id
    ) {
      setViewerItem(null);
    }
  }

  /* ========================================================
     CATEGORY NAVIGATION
  ======================================================== */

  function openCategory(
    categoryId: CategoryId,
  ): void {
    setSelectedCategory(
      categoryId,
    );
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
        <div
          style={headerAccentStyle}
        />

        <div style={headerTextStyle}>
          <h2
            style={headerTitleStyle}
          >
            Documents Studio™
          </h2>

          <p
            style={
              headerDescriptionStyle
            }
          >
            Upload & manage customer,
            collateral and loan
            documents.
          </p>
        </div>

        <div
          style={headerBadgeWrapStyle}
        >
          <span style={badgeStyle}>
            {allEvidence.length}{" "}
            evidence
          </span>
        </div>
      </div>

      {/* ======================================================
         DOCUMENT CATEGORIES HEADER
      ====================================================== */}

      <div
        style={sectionTitleRowStyle}
      >
        <div style={sectionTitleStyle}>
          DOCUMENT CATEGORIES
        </div>

        <div
          style={sectionHintStyle}
        >
          Upload only what this loan
          actually requires.
        </div>
      </div>

      {/* ======================================================
         CATEGORY GRID
      ====================================================== */}

      <div style={categoryGridStyle}>
        {CATEGORIES.map(
          (category) => (
            <CategoryCard
              key={category.id}
              category={category}
              items={
                categoryItemsMap[
                  category.id
                ] ?? []
              }
              onOpenCategory={
                openCategory
              }
              onOpenItem={
                setViewerItem
              }
              onUpload={openUpload}
            />
          ),
        )}
      </div>

      {/* ======================================================
         ALL EVIDENCE GALLERY PREVIEW
      ====================================================== */}

      <EvidencePreview
        items={allEvidence}
        onOpen={setViewerItem}
      />

      {/* ======================================================
         HIDDEN CATEGORY UPLOAD INPUT
      ====================================================== */}

      <input
        ref={activeUploadRef}
        type="file"
        accept={ACCEPTED_TYPES}
        multiple
        onChange={
          handleCategoryUpload
        }
        style={uploadInputStyle}
      />

      {/* ======================================================
         FULL CATEGORY GALLERY
      ====================================================== */}

      {selectedCategory &&
        selectedCategoryConfig && (
          <CategoryGallery
            category={
              selectedCategoryConfig
            }
            items={selectedItems}
            onBack={closeCategory}
            onUpload={() =>
              openUpload(
                selectedCategory,
              )
            }
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
          onChange={(event) =>
            setRenameValue(
              event.target.value,
            )
          }
          onKeyDown={
            handleRenameKeyDown
          }
          onCancel={closeRename}
          onSave={saveRename}
        />
      )}

      {/* ======================================================
         FULL SCREEN VIEWER
      ====================================================== */}

      {viewerItem && (
        <DocumentViewer
          item={viewerItem}
          onClose={() =>
            setViewerItem(null)
          }
        />
      )}
    </section>
  );
}