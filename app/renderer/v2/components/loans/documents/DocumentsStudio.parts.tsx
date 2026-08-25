/* ==========================================================
   FINORA ENTERPRISE OS™
   DOCUMENTS STUDIO™ — PRESENTATION PARTS
   RESPONSIBILITY:
   - Keep JSX presentation out of the controller.
   - Reuse the central Documents Studio styles.
   - Keep every visual style definition outside JSX.
========================================================== */
import type {
  ChangeEvent,
  KeyboardEvent,
} from "react";

/* ==========================================================
   LUCIDE ICON SYSTEM
   ----------------------------------------------------------
   Reuse the same FINORA-wide Lucide React icon system
   already used throughout Customer Hub and other modules.
========================================================== */

import {
  BriefcaseBusiness,
  CarFront,
  FileSignature,
  Files,
  IdCard,
  Images,
  MapPinHouse,
  ShieldCheck,
} from "lucide-react";

/* ==========================================================
   CATEGORY ICON PRESENTATION
========================================================== */

const CATEGORY_ICON_SIZE = 18;
const CATEGORY_ICON_STROKE = 1.9;

import {
  formatCount,
} from "./DocumentsStudio.types";

import type {
  CategoryConfig,
  DocumentsStudioItem,
} from "./DocumentsStudio.types";
import {
  addButtonStyle,
  backButtonStyle,
  badgeStyle,
  categoryCardStyle,
  categoryGalleryBackdropStyle,
  categoryHeaderLeftStyle,
  categoryHeaderStyle,
  categoryIconStyle,
  categoryMetaStyle,
  categoryPreviewButtonStyle,
  categoryPreviewStyle,
  categoryPreviewThumbStyle,
  pdfCompactStyle,
  pdfTileStyle,
  categoryTitleStyle,
  categoryTitleWrapStyle,
  documentTileButtonStyle,
  documentTileFooterStyle,
  documentTileImageStyle,
  documentTileNameStyle,
  documentTileStyle,
  documentTileTypeStyle,
  documentTileActionsStyle,
  emptyStateStyle,
  evidencePreviewButtonStyle,
  evidencePreviewHeaderStyle,
  evidencePreviewMetaStyle,
  evidencePreviewSectionStyle,
  evidencePreviewStripStyle,
  evidencePreviewTextStyle,
  evidencePreviewTitleStyle,
  galleryGridStyle,
  galleryHeaderLeftStyle,
  galleryHeaderStyle,
  galleryMetaStyle,
  galleryOverflowNoteStyle,
  galleryTitleStyle,
  galleryTitleWrapStyle,
  galleryViewportStyle,
  itemMenuStyle,
  renameActionsStyle,
  renameButtonStyle,
  renameDialogStyle,
  renameDialogTitleStyle,
  renameInputStyle,
  viewerBackdropStyle,
  viewerCloseStyle,
  viewerContentStyle,
  viewerFrameStyle,
  viewerImageStyle,
  viewerTitleStyle,
  viewAllButtonStyle,
} from "./DocumentsStudio.styles";
/* ==========================================================
   DOCUMENT THUMB
========================================================== */
interface DocumentThumbProps {
  item: DocumentsStudioItem;
  compact?: boolean;
}
export function DocumentThumb({
  item,
  compact = false,
}: DocumentThumbProps) {
  if (item.type === "image") {
    return (
      <img
        src={item.url}
        alt={item.name}
        style={
          compact
            ? categoryPreviewThumbStyle
            : documentTileImageStyle
        }
      />
    );
  }
  return (
    <div
      style={
        compact
          ? pdfCompactStyle
          : pdfTileStyle
      }
    >
      PDF
    </div>
  );
}
/* ==========================================================
   DOCUMENT TILE
========================================================== */
interface DocumentTileProps {
  item: DocumentsStudioItem;
  onOpen: (item: DocumentsStudioItem) => void;
  onRename: (item: DocumentsStudioItem) => void;
  onDelete: (item: DocumentsStudioItem) => void;
}
export function DocumentTile({
  item,
  onOpen,
  onRename,
  onDelete,
}: DocumentTileProps) {
  return (
    <article
      key={item.id}
      style={documentTileStyle}
    >
      <button
        type="button"
        onClick={() => onOpen(item)}
        style={documentTileButtonStyle}
        aria-label={`View ${item.name}`}
      >
        <DocumentThumb item={item} />
      </button>
      <div style={documentTileFooterStyle}>
        <div
          style={documentTileNameStyle}
          title={item.name}
        >
          {item.name}
        </div>
        <div style={documentTileTypeStyle}>
          {item.type === "pdf"
            ? "PDF"
            : "Photo"}
        </div>
        <div
          style={documentTileActionsStyle}
        >
          <button
            type="button"
            style={renameButtonStyle}
            onClick={() => onRename(item)}
          >
            Rename
          </button>
          <button
            type="button"
            style={itemMenuStyle}
            onClick={() => onDelete(item)}
            title="Remove"
            aria-label={`Remove ${item.name}`}
          >
            ×
          </button>
        </div>
      </div>
    </article>
  );
}
/* ==========================================================
   CATEGORY CARD
========================================================== */
interface CategoryCardProps {
  category: CategoryConfig;
  items: DocumentsStudioItem[];
  onOpenCategory: (
    categoryId: CategoryConfig["id"],
  ) => void;
  onOpenItem: (
    item: DocumentsStudioItem,
  ) => void;
  onUpload: (
    categoryId: CategoryConfig["id"],
  ) => void;
}
export function CategoryCard({
  category,
  items,
  onOpenCategory,
  onOpenItem,
  onUpload,
}: CategoryCardProps) {
  return (
    <section
      key={category.id}
      style={categoryCardStyle}
    >
      <div style={categoryHeaderStyle}>
        <div
          style={categoryHeaderLeftStyle}
        >
         
        <div
  style={categoryIconStyle}
  aria-hidden="true"
>
  {category.icon === "id-card" && (
    <IdCard
      size={CATEGORY_ICON_SIZE}
      strokeWidth={CATEGORY_ICON_STROKE}
    />
  )}

  {category.icon === "map-pin-house" && (
    <MapPinHouse
      size={CATEGORY_ICON_SIZE}
      strokeWidth={CATEGORY_ICON_STROKE}
    />
  )}

  {category.icon === "briefcase-business" && (
    <BriefcaseBusiness
      size={CATEGORY_ICON_SIZE}
      strokeWidth={CATEGORY_ICON_STROKE}
    />
  )}

  {category.icon === "car-front" && (
    <CarFront
      size={CATEGORY_ICON_SIZE}
      strokeWidth={CATEGORY_ICON_STROKE}
    />
  )}

  {category.icon === "file-signature" && (
    <FileSignature
      size={CATEGORY_ICON_SIZE}
      strokeWidth={CATEGORY_ICON_STROKE}
    />
  )}

  {category.icon === "shield-check" && (
    <ShieldCheck
      size={CATEGORY_ICON_SIZE}
      strokeWidth={CATEGORY_ICON_STROKE}
    />
  )}

  {category.icon === "files" && (
    <Files
      size={CATEGORY_ICON_SIZE}
      strokeWidth={CATEGORY_ICON_STROKE}
    />
  )}

  {category.icon === "images" && (
    <Images
      size={CATEGORY_ICON_SIZE}
      strokeWidth={CATEGORY_ICON_STROKE}
    />
  )}
</div>

          <div
            style={categoryTitleWrapStyle}
          >
            <div style={categoryTitleStyle}>
              {category.title}
            </div>
            <div style={categoryMetaStyle}>
              {formatCount(items.length)}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() =>
            onOpenCategory(category.id)
          }
          style={viewAllButtonStyle}
        >
          View All
        </button>
      </div>
      <div style={categoryPreviewStyle}>
        {items
          .slice(0, 10)
          .map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                onOpenItem(item)
              }
              style={categoryPreviewButtonStyle}
              title={item.name}
            >
              <DocumentThumb
                item={item}
                compact
              />
            </button>
          ))}
        {items.length === 0 && (
          <div style={emptyStateStyle}>
            No uploads yet
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => onUpload(category.id)}
        style={addButtonStyle}
      >
        + Add Document
      </button>
    </section>
  );
}
/* ==========================================================
   EVIDENCE PREVIEW
========================================================== */
interface EvidencePreviewProps {
  items: DocumentsStudioItem[];
  onOpen: (item: DocumentsStudioItem) => void;
}
export function EvidencePreview({
  items,
  onOpen,
}: EvidencePreviewProps) {
  return (
    <section
      style={evidencePreviewSectionStyle}
    >
      <div
        style={evidencePreviewHeaderStyle}
      >
        <div
          style={evidencePreviewTextStyle}
        >
          <div
            style={evidencePreviewTitleStyle}
          >
            All Evidence Gallery
          </div>
          <div
            style={evidencePreviewMetaStyle}
          >
            {formatCount(items.length)}{" "}
            across document categories.
          </div>
        </div>
        <span style={badgeStyle}>
          Preview
        </span>
      </div>
      <div
        style={evidencePreviewStripStyle}
      >
        {items
          .slice(0, 10)
          .map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onOpen(item)}
              style={evidencePreviewButtonStyle}
            >
              <DocumentThumb
                item={item}
                compact
              />
            </button>
          ))}
        {items.length === 0 && (
          <div style={emptyStateStyle}>
            Your evidence preview will
            appear here after uploads.
          </div>
        )}
      </div>
    </section>
  );
}
/* ==========================================================
   CATEGORY GALLERY
========================================================== */
interface CategoryGalleryProps {
  category: CategoryConfig;
  items: DocumentsStudioItem[];
  onBack: () => void;
  onUpload: () => void;
  onOpen: (item: DocumentsStudioItem) => void;
  onRename: (item: DocumentsStudioItem) => void;
  onDelete: (item: DocumentsStudioItem) => void;
}
export function CategoryGallery({
  category,
  items,
  onBack,
  onUpload,
  onOpen,
  onRename,
  onDelete,
}: CategoryGalleryProps) {
  return (
    <div style={categoryGalleryBackdropStyle}>
      <div style={galleryHeaderStyle}>
        <div
          style={galleryHeaderLeftStyle}
        >
          <button
            type="button"
            onClick={onBack}
            style={backButtonStyle}
          >
            ← Back
          </button>
          <div style={galleryTitleWrapStyle}>
            <div style={galleryTitleStyle}>
              {category.title}
            </div>
            <div style={galleryMetaStyle}>
              {formatCount(items.length)}
              {" · "}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onUpload}
          style={addButtonStyle}
        >
          + Add Document
        </button>
      </div>
      <div style={galleryViewportStyle}>
        <div style={galleryGridStyle}>
          {items.map((item) => (
            <DocumentTile
              key={item.id}
              item={item}
              onOpen={onOpen}
              onRename={onRename}
              onDelete={onDelete}
            />
          ))}
          {items.length === 0 && (
            <div style={emptyStateStyle}>
              No documents in this category
              yet. Use{" "}
              <strong>
                + Add Document
              </strong>{" "}
              to upload the first item.
            </div>
          )}
        </div>
        {items.length > 15 && (
          <div style={galleryOverflowNoteStyle}>
            Showing 15 items per viewport
            (5 × 3). Scroll to continue
            browsing the remaining uploads.
          </div>
        )}
      </div>
    </div>
  );
}
/* ==========================================================
   RENAME DIALOG
========================================================== */
interface RenameDialogProps {
  value: string;
  onChange: (
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
  onKeyDown: (
    event: KeyboardEvent<HTMLInputElement>,
  ) => void;
  onCancel: () => void;
  onSave: () => void;
}
export function RenameDialog({
  value,
  onChange,
  onKeyDown,
  onCancel,
  onSave,
}: RenameDialogProps) {
  return (
    <div style={viewerBackdropStyle}>
      <div style={renameDialogStyle}>
        <div
          style={renameDialogTitleStyle}
        >
          Rename Upload
        </div>
        <input
          autoFocus
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          style={renameInputStyle}
        />
        <div style={renameActionsStyle}>
          <button
            type="button"
            onClick={onCancel}
            style={backButtonStyle}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            style={addButtonStyle}
          >
            Save Name
          </button>
        </div>
      </div>
    </div>
  );
}
/* ==========================================================
   FULL SCREEN VIEWER
========================================================== */
interface DocumentViewerProps {
  item: DocumentsStudioItem;
  onClose: () => void;
}
export function DocumentViewer({
  item,
  onClose,
}: DocumentViewerProps) {
  return (
    <div
      style={viewerBackdropStyle}
      onClick={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <button
        type="button"
        onClick={onClose}
        style={viewerCloseStyle}
        aria-label="Close viewer"
      >
        ×
      </button>
      <div style={viewerContentStyle}>
        <div style={viewerTitleStyle}>
          {item.name}
        </div>
        {item.type === "image" ? (
          <img
            src={item.url}
            alt={item.name}
            style={viewerImageStyle}
          />
        ) : (
          <iframe
            title={item.name}
            src={item.url}
            style={viewerFrameStyle}
          />
        )}
      </div>
    </div>
  );
}
