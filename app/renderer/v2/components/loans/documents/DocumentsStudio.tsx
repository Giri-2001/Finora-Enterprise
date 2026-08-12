/* ==========================================================
   FINORA ENTERPRISE OS™
   LOAN STUDIO — STEP 3
   DOCUMENTS STUDIO™

   RESPONSIBILITY:
   - Customer / family / nominee quick photos
   - Categorised document upload
   - Image + PDF support
   - Rename uploaded items
   - Category preview strip
   - Category full-page gallery
   - 15-item first-page grid (5 x 3)
   - Scroll for additional items
   - Full-screen image / PDF viewer
   - No dummy uploads
   - Add More workflow
========================================================== */

import {
  ChangeEvent,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  addButtonStyle,
  badgeStyle,
  backButtonStyle,
  categoryCardStyle,
  categoryGridStyle,
  categoryHeaderStyle,
  categoryIconStyle,
  categoryMetaStyle,
  categoryPreviewStyle,
  categoryPreviewThumbStyle,
  categorySectionTitleStyle,
  documentTileStyle,
  documentTileImageStyle,
  documentTileFooterStyle,
  documentTileNameStyle,
  documentTileTypeStyle,
  emptyStateStyle,
  fullPageStyle,
  galleryGridStyle,
  galleryHeaderStyle,
  galleryHeaderLeftStyle,
  galleryTitleStyle,
  galleryViewportStyle,
  headerStyle,
  headerAccentStyle,
  headerTextStyle,
  headerTitleStyle,
  infoBarStyle,
  infoTextStyle,
  itemMenuStyle,
  quickCardStyle,
  quickGridStyle,
  quickMediaStyle,
  quickTitleStyle,
  renameButtonStyle,
  sectionStyle,
  sectionTitleRowStyle,
  sectionTitleStyle,
  uploadCardStyle,
  uploadInputStyle,
  uploadLabelStyle,
  uploadPlaceholderStyle,
  viewAllButtonStyle,
  viewerBackdropStyle,
  viewerContentStyle,
  viewerCloseStyle,
  viewerFrameStyle,
  viewerImageStyle,
  viewerTitleStyle,
} from "./DocumentsStudio.styles";

/* ==========================================================
   TYPES
========================================================== */

export type DocumentsStudioItemType =
  | "image"
  | "pdf";

export interface DocumentsStudioItem {
  id: string;
  categoryId: string;
  name: string;
  originalName: string;
  type: DocumentsStudioItemType;
  mimeType: string;
  url: string;
  size: number;
  createdAt: string;
  quickRole?: "family" | "nominee";
}

interface DocumentsStudioProps {
  customerName?: string;
  customerPhoto?: string;
  items?: DocumentsStudioItem[];
  onDocumentsChange?: (
    items: DocumentsStudioItem[],
  ) => void;
}

/* ==========================================================
   CONSTANTS
========================================================== */

const MAX_ITEMS_PER_PAGE = 15;

const PREVIEW_LIMIT = 10;

const ACCEPTED_TYPES =
  "image/jpeg,image/png,image/webp,image/gif,application/pdf";

const CATEGORIES = [
  {
    id: "identity",
    title: "Identity Documents",
    shortTitle: "Identity",
    icon: "ID",
  },
  {
    id: "address",
    title: "Address Proof",
    shortTitle: "Address",
    icon: "⌂",
  },
  {
    id: "income",
    title: "Income / Business Proof",
    shortTitle: "Income",
    icon: "₹",
  },
  {
    id: "vehicle",
    title: "Vehicle Documents",
    shortTitle: "Vehicle",
    icon: "▣",
  },
  {
    id: "loan",
    title: "Loan Agreements / Promissory Notes",
    shortTitle: "Agreements",
    icon: "▤",
  },
  {
    id: "collateral",
    title: "Collateral / Security Documents",
    shortTitle: "Collateral",
    icon: "◆",
  },
  {
    id: "other",
    title: "Other Documents",
    shortTitle: "Other",
    icon: "•••",
  },
  {
    id: "personal",
    title: "Personal Photos",
    shortTitle: "Personal",
    icon: "◉",
  },
] as const;

type CategoryId =
  (typeof CATEGORIES)[number]["id"];

/* ==========================================================
   HELPERS
========================================================== */

function createId(
  prefix: string,
): string {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

function getItemType(
  file: File,
): DocumentsStudioItemType | null {
  if (file.type === "application/pdf") {
    return "pdf";
  }

  if (file.type.startsWith("image/")) {
    return "image";
  }

  return null;
}

function getDisplayName(
  fileName: string,
): string {
  const withoutExtension =
    fileName.replace(/\.[^/.]+$/, "");

  return withoutExtension.trim() ||
    "Uploaded Document";
}

function formatCount(
  count: number,
): string {
  return `${count} ${
    count === 1 ? "item" : "items"
  }`;
}

/* ==========================================================
   COMPONENT
========================================================== */

export default function DocumentsStudio({
  customerName = "Customer",
  customerPhoto,
  items: itemsProp,
  onDocumentsChange,
}: DocumentsStudioProps) {

  const [
    localItems,
    setLocalItems,
  ] = useState<
    DocumentsStudioItem[]
  >([]);

  const items = (
    itemsProp ??
    localItems
  ).filter(
    (item) =>
      item.quickRole ===
      undefined,
  );

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState<CategoryId | null>(
    null,
  );

  const [
    viewerItem,
    setViewerItem,
  ] = useState<
    DocumentsStudioItem | null
  >(null);

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

  const [
    localQuickPhotos,
    setLocalQuickPhotos,
  ] = useState<
    Record<
      "family" | "nominee",
      DocumentsStudioItem[]
    >
  >(() => ({
    family:
      (itemsProp ?? []).filter(
        (item) =>
          item.quickRole ===
          "family",
      ),
    nominee:
      (itemsProp ?? []).filter(
        (item) =>
          item.quickRole ===
          "nominee",
      ),
  }));

  const quickPhotos =
    localQuickPhotos;

  const activeUploadRef =
    useRef<HTMLInputElement | null>(null);

  const [
    activeUploadCategory,
    setActiveUploadCategory,
  ] = useState<CategoryId | null>(
    null,
  );

  const allEvidence = useMemo(
    () => {
      const quick =
        [
          ...quickPhotos.family,
          ...quickPhotos.nominee,
        ];

      return [
        ...quick,
        ...items,
      ];
    },
    [
      items,
      quickPhotos,
    ],
  );

  const categoryCounts =
    useMemo(
      () =>
        CATEGORIES.reduce(
          (
            result,
            category,
          ) => {
            result[category.id] =
              items.filter(
                (item) =>
                  item.categoryId ===
                  category.id,
              ).length;

            return result;
          },
          {} as Record<
            CategoryId,
            number
          >,
        ),
      [items],
    );

  const selectedCategoryConfig =
    CATEGORIES.find(
      (category) =>
        category.id ===
        selectedCategory,
    );

  const selectedItems =
    selectedCategory
      ? allEvidence.filter(
          (item) =>
            item.categoryId ===
            selectedCategory,
        )
      : [];

  function publishItems(
    nextItems: DocumentsStudioItem[],
  ): void {
    setLocalItems(nextItems);
    onDocumentsChange?.(
      [
        ...quickPhotos.family,
        ...quickPhotos.nominee,
        ...nextItems,
      ],
    );
  }

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
    const files =
      Array.from(
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
            size:
              file.size,
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

  function handleQuickPhotoUpload(
    kind: "family" | "nominee",
    event: ChangeEvent<HTMLInputElement>,
  ): void {
    const files =
      Array.from(
        event.target.files ?? [],
      );

    event.target.value = "";

    const images =
      files.filter(
        (file) =>
          getItemType(file) ===
          "image",
      );

    if (
      images.length === 0
    ) {
      return;
    }

    const created =
      images.map(
        (file) => ({
          id: createId(
            kind.toUpperCase(),
          ),
          categoryId: "personal",
          name: getDisplayName(
            file.name,
          ),
          originalName:
            file.name,
          type: "image" as const,
          mimeType:
            file.type,
          url:
            URL.createObjectURL(
              file,
            ),
          size:
            file.size,
          createdAt:
            new Date().toISOString(),
          quickRole:
            kind,
        }),
      );

    const nextQuick = {
      ...quickPhotos,
      [kind]: [
        ...quickPhotos[kind],
        ...created,
      ],
    };

    setLocalQuickPhotos(
      nextQuick,
    );

    onDocumentsChange?.([
      ...nextQuick.family,
      ...nextQuick.nominee,
      ...items,
    ]);
  }

  function beginRename(
    item: DocumentsStudioItem,
  ): void {
    setRenamingItemId(
      item.id,
    );
    setRenameValue(
      item.name,
    );
  }

  function saveRename(): void {
    const normalized =
      renameValue.trim();

    if (
      !renamingItemId ||
      !normalized
    ) {
      setRenamingItemId(null);
      setRenameValue("");
      return;
    }

    const nextItems =
      items.map(
        (item) =>
          item.id ===
          renamingItemId
            ? {
                ...item,
                name:
                  normalized,
              }
            : item,
      );

    const nextQuick = {
      family:
        quickPhotos.family.map(
          (item) =>
            item.id ===
            renamingItemId
              ? {
                  ...item,
                  name:
                    normalized,
                }
              : item,
        ),
      nominee:
        quickPhotos.nominee.map(
          (item) =>
            item.id ===
            renamingItemId
              ? {
                  ...item,
                  name:
                    normalized,
                }
              : item,
        ),
    };

    setLocalItems(
      nextItems,
    );
    setLocalQuickPhotos(
      nextQuick,
    );

    onDocumentsChange?.([
      ...nextQuick.family,
      ...nextQuick.nominee,
      ...nextItems,
    ]);

    setRenamingItemId(null);
    setRenameValue("");
  }

  function deleteItem(
    item: DocumentsStudioItem,
  ): void {
    const nextItems =
      items.filter(
        (current) =>
          current.id !==
          item.id,
      );

    const nextQuick = {
      family:
        quickPhotos.family.filter(
          (current) =>
            current.id !==
            item.id,
        ),
      nominee:
        quickPhotos.nominee.filter(
          (current) =>
            current.id !==
            item.id,
        ),
    };

    URL.revokeObjectURL(
      item.url,
    );

    setLocalItems(
      nextItems,
    );
    setLocalQuickPhotos(
      nextQuick,
    );

    onDocumentsChange?.([
      ...nextQuick.family,
      ...nextQuick.nominee,
      ...nextItems,
    ]);

    if (
      viewerItem?.id ===
      item.id
    ) {
      setViewerItem(null);
    }
  }

  function openCategory(
    categoryId: CategoryId,
  ): void {
    setSelectedCategory(
      categoryId,
    );
  }

  function closeCategory(): void {
    setSelectedCategory(
      null,
    );
  }

  function renderThumb(
    item: DocumentsStudioItem,
    compact = false,
  ) {
    if (
      item.type === "image"
    ) {
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
        style={{
          ...(
            compact
              ? categoryPreviewThumbStyle
              : documentTileImageStyle
          ),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "#0A1425",
          color: "#60A5FA",
          fontWeight: 800,
          fontSize:
            compact
              ? "11px"
              : "20px",
        }}
      >
        PDF
      </div>
    );
  }

  function renderDocumentTile(
    item: DocumentsStudioItem,
  ) {
    return (
      <article
        key={item.id}
        style={documentTileStyle}
      >
        <button
          type="button"
          onClick={() =>
            setViewerItem(
              item,
            )
          }
          style={{
            border: 0,
            padding: 0,
            margin: 0,
            width: "100%",
            background:
              "transparent",
            cursor: "pointer",
          }}
          aria-label={`View ${item.name}`}
        >
          {renderThumb(
            item,
          )}
        </button>

        <div
          style={
            documentTileFooterStyle
          }
        >
          <div
            style={
              documentTileNameStyle
            }
            title={item.name}
          >
            {item.name}
          </div>

          <div
            style={
              documentTileTypeStyle
            }
          >
            {item.type ===
            "pdf"
              ? "PDF"
              : "Photo"}
          </div>

          <div
            style={{
              display:
                "flex",
              gap: "6px",
              marginTop:
                "7px",
            }}
          >
            <button
              type="button"
              style={
                renameButtonStyle
              }
              onClick={() =>
                beginRename(
                  item,
                )
              }
            >
              Rename
            </button>

            <button
              type="button"
              style={
                itemMenuStyle
              }
              onClick={() =>
                deleteItem(
                  item,
                )
              }
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

  function renderQuickCard(
    title: string,
    kind: "family" | "nominee",
    description: string,
  ) {
    const first =
      quickPhotos[kind][0];

    return (
      <section
        style={
          quickCardStyle
        }
      >
        <div
          style={
            quickTitleStyle
          }
        >
          <span>
            {title}
          </span>

          {quickPhotos[kind]
            .length > 0 && (
            <span
              style={
                badgeStyle
              }
            >
              {
                quickPhotos[
                  kind
                ].length
              }
            </span>
          )}
        </div>

        <div
          style={
            quickMediaStyle
          }
        >
          {first ? (
            <button
              type="button"
              onClick={() =>
                setViewerItem(
                  first,
                )
              }
              style={{
                width:
                  "100%",
                height:
                  "100%",
                border: 0,
                padding: 0,
                background:
                  "transparent",
                cursor:
                  "pointer",
              }}
            >
              {renderThumb(
                first,
              )}
            </button>
          ) : (
            <div
              style={
                uploadPlaceholderStyle
              }
            >
              <span
                style={{
                  fontSize:
                    "22px",
                  color:
                    "#60A5FA",
                }}
              >
                +
              </span>
              <span>
                {description}
              </span>
            </div>
          )}
        </div>

        <label
          style={
            uploadLabelStyle
          }
        >
          {first
            ? "Add More"
            : "Add Photo"}

          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(
              event,
            ) =>
              handleQuickPhotoUpload(
                kind,
                event,
              )
            }
            style={
              uploadInputStyle
            }
          />
        </label>
      </section>
    );
  }

  function renderCustomerPhotoCard() {
    return (
      <section
        style={
          quickCardStyle
        }
      >
        <div
          style={
            quickTitleStyle
          }
        >
          <span>
            CUSTOMER PHOTO
          </span>

          <span
            style={{
              ...badgeStyle,
              background:
                "rgba(34,197,94,0.12)",
              color:
                "#86EFAC",
              borderColor:
                "rgba(34,197,94,0.28)",
            }}
          >
            Linked
          </span>
        </div>

        <div
          style={
            quickMediaStyle
          }
        >
          {customerPhoto ? (
            <button
              type="button"
              onClick={() =>
                setViewerItem({
                  id:
                    "CUSTOMER-PHOTO",
                  categoryId:
                    "personal",
                  name:
                    customerName,
                  originalName:
                    customerName,
                  type:
                    "image",
                  mimeType:
                    "image/*",
                  url:
                    customerPhoto,
                  size: 0,
                  createdAt:
                    new Date().toISOString(),
                })
              }
              style={{
                width:
                  "100%",
                height:
                  "100%",
                border: 0,
                padding: 0,
                background:
                  "transparent",
                cursor:
                  "pointer",
              }}
            >
              <img
                src={
                  customerPhoto
                }
                alt={
                  customerName
                }
                style={
                  documentTileImageStyle
                }
              />
            </button>
          ) : (
            <div
              style={
                emptyStateStyle
              }
            >
              Customer photo already
              linked from Step 1.
            </div>
          )}
        </div>
      </section>
    );
  }

  function renderCategoryCard(
    category:
      (typeof CATEGORIES)[number],
  ) {
    const categoryItems =
      allEvidence.filter(
        (item) =>
          item.categoryId ===
          category.id,
      );

    return (
      <section
        key={
          category.id
        }
        style={
          categoryCardStyle
        }
      >
        <div
          style={
            categoryHeaderStyle
          }
        >
          <div
            style={{
              display:
                "flex",
              alignItems:
                "center",
              gap:
                "10px",
              minWidth: 0,
            }}
          >
            <div
              style={
                categoryIconStyle
              }
            >
              {
                category.icon
              }
            </div>

            <div
                style={{
                    minWidth: 0,
                    flex: 1,
                    overflow: "hidden",
                }}
                >
              <div
                style={{
                  color:
                    "#F8FAFC",
                  fontSize:
                    "13px",
                  fontWeight:
                    750,
                  overflow:
                    "visible",
                  textOverflow:
                    "clip",
                  whiteSpace:
                    "normal",
                  wordBreak:
                    "break-word",
                }}
              >
                {
                  category.title
                }
              </div>

              <div
                style={
                  categoryMetaStyle
                }
              >
                {
                  formatCount(
                    categoryItems.length,
                  )
                }
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              openCategory(
                category.id,
              )
            }
            style={
              viewAllButtonStyle
            }
          >
            View All
          </button>
        </div>

        <div
          style={
            categoryPreviewStyle
          }
        >
          {categoryItems
            .slice(
              0,
              PREVIEW_LIMIT,
            )
            .map(
              (
                item,
              ) => (
                <button
                  key={
                    item.id
                  }
                  type="button"
                  onClick={() =>
                    setViewerItem(
                      item,
                    )
                  }
                  style={{
                    border:
                      "1px solid rgba(148,163,184,0.14)",
                    borderRadius:
                      "7px",
                    padding:
                      0,
                    overflow:
                      "hidden",
                    background:
                      "#0A1425",
                    cursor:
                      "pointer",
                    flex:
                      "0 0 64px",
                  }}
                  title={
                    item.name
                  }
                >
                  {renderThumb(
                    item,
                    true,
                  )}
                </button>
              ),
            )}

          {categoryItems.length ===
            0 && (
            <div
              style={
                emptyStateStyle
              }
            >
              No uploads yet
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() =>
            openUpload(
              category.id,
            )
          }
          style={
            addButtonStyle
          }
        >
          + Add Document
        </button>
      </section>
    );
  }

  return (
    <section
      style={
        sectionStyle
      }
    >

      <div
        style={
          headerStyle
        }
      >
        <div
          style={
            headerAccentStyle
          }
        />

        <div
          style={
            headerTextStyle
          }
        >
          <h2
            style={
              headerTitleStyle
            }
          >
            Documents Studio™
          </h2>

          <p
            style={{
              margin: 0,
              color:
                "#94A3B8",
              fontSize:
                "12px",
              fontWeight:
                500,
            }}
          >
            Upload & manage customer,
            nominee, collateral and loan
            documents.
          </p>
        </div>

        <div
          style={{
            marginLeft:
              "auto",
            display:
              "flex",
            alignItems:
              "center",
            gap:
              "8px",
          }}
        >
          <span
            style={
              badgeStyle
            }
          >
            {
              allEvidence.length
            } evidence
          </span>
        </div>
      </div>

      <div
        style={
          categorySectionTitleStyle
        }
      >
        QUICK PHOTOS
      </div>

      <div
        style={
          quickGridStyle
        }
      >
        {renderCustomerPhotoCard()}

        {renderQuickCard(
          "Family Photo",
          "family",
          "Add family photo",
        )}

        {renderQuickCard(
          "Nominee Photo",
          "nominee",
          "Add nominee photo",
        )}
      </div>

      <div
        style={
          sectionTitleRowStyle
        }
      >
        <div
          style={
            sectionTitleStyle
          }
        >
          DOCUMENT CATEGORIES
        </div>

        <div
          style={{
            color:
              "#64748B",
            fontSize:
              "11px",
          }}
        >
          Upload only what this loan
          actually requires.
        </div>
      </div>

      <div
        style={
          categoryGridStyle
        }
      >
        {CATEGORIES.map(
          (
            category,
          ) =>
            renderCategoryCard(
              category,
            ),
        )}
      </div>

      <section
        style={{
          marginTop:
            "10px",
          padding:
            "12px",
          border:
            "1px solid rgba(37,99,235,0.22)",
          borderRadius:
            "10px",
          background:
            "rgba(15,23,42,0.70)",
        }}
      >
        <div
          style={{
            display:
              "flex",
            alignItems:
              "center",
            justifyContent:
              "space-between",
            gap:
              "10px",
          }}
        >
          <div>
            <div
              style={{
                color:
                  "#F8FAFC",
                fontSize:
                  "13px",
                fontWeight:
                  750,
              }}
            >
              All Evidence Gallery
            </div>

            <div
              style={{
                marginTop:
                  "3px",
                color:
                  "#94A3B8",
                fontSize:
                  "11px",
              }}
            >
              {
                formatCount(
                  allEvidence.length,
                )
              }{" "}
              across quick photos and
              document categories.
            </div>
          </div>

          <span
            style={
              badgeStyle
            }
          >
            Preview
          </span>
        </div>

        <div
          style={{
            display:
              "flex",
            gap:
              "7px",
            overflowX:
              "auto",
            paddingTop:
              "10px",
            paddingBottom:
              "2px",
          }}
        >
          {allEvidence
            .slice(
              0,
              PREVIEW_LIMIT,
            )
            .map(
              (
                item,
              ) => (
                <button
                  key={
                    item.id
                  }
                  type="button"
                  onClick={() =>
                    setViewerItem(
                      item,
                    )
                  }
                  style={{
                    flex:
                      "0 0 70px",
                    height:
                      "52px",
                    padding:
                      0,
                    border:
                      "1px solid rgba(148,163,184,0.14)",
                    borderRadius:
                      "7px",
                    overflow:
                      "hidden",
                    background:
                      "#0A1425",
                    cursor:
                      "pointer",
                  }}
                >
                  {renderThumb(
                    item,
                    true,
                  )}
                </button>
              ),
            )}

          {allEvidence.length ===
            0 && (
            <div
              style={
                emptyStateStyle
              }
            >
              Your evidence preview will
              appear here after uploads.
            </div>
          )}
        </div>
      </section>

      <div
        style={
          infoBarStyle
        }
      >
        <span
          style={{
            color:
              "#60A5FA",
            fontWeight:
              800,
          }}
        >
          i
        </span>

        <div
          style={
            infoTextStyle
          }
        >
          Upload Images (JPG, PNG, WEBP)
          or Documents (PDF). Each category
          can contain unlimited evidence;
          the full gallery shows 15 items per
          page (5 × 3) and scrolls for more.
          Uploaded files can be renamed to
          your own business language.
        </div>
      </div>

      <input
        ref={
          activeUploadRef
        }
        type="file"
        accept={
          ACCEPTED_TYPES
        }
        multiple
        onChange={
          handleCategoryUpload
        }
        style={{
          display:
            "none",
        }}
      />

      {selectedCategory &&
        selectedCategoryConfig && (
        <div
          style={
            fullPageStyle
          }
        >
          <div
            style={
              galleryHeaderStyle
            }
          >
            <div
              style={
                galleryHeaderLeftStyle
              }
            >
              <button
                type="button"
                onClick={
                  closeCategory
                }
                style={
                  backButtonStyle
                }
              >
                ← Back
              </button>

              <div
                style={{
                  minWidth:
                    0,
                }}
              >
                <div
                  style={
                    galleryTitleStyle
                  }
                >
                  {
                    selectedCategoryConfig.title
                  }
                </div>

                <div
                  style={{
                    color:
                      "#94A3B8",
                    fontSize:
                      "11px",
                    marginTop:
                      "3px",
                  }}
                >
                  {
                    formatCount(
                      selectedItems.length,
                    )
                  }{" "}
                  · 15 visible before
                  scrolling
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                openUpload(
                  selectedCategory,
                )
              }
              style={
                addButtonStyle
              }
            >
              + Add Document
            </button>
          </div>

          <div
            style={
              galleryViewportStyle
            }
          >
            <div
              style={
                galleryGridStyle
              }
            >
              {selectedItems.map(
                  (
                    item,
                  ) =>
                    renderDocumentTile(
                      item,
                    ),
                )}

              {selectedItems.length ===
                0 && (
                <div
                  style={
                    emptyStateStyle
                  }
                >
                  No documents in this
                  category yet. Use{" "}
                  <strong>
                    + Add Document
                  </strong>{" "}
                  to upload the first
                  item.
                </div>
              )}
            </div>

            {selectedItems.length >
              MAX_ITEMS_PER_PAGE && (
              <div
                style={{
                  marginTop:
                    "10px",
                  color:
                    "#64748B",
                  fontSize:
                    "11px",
                }}
              >
                Showing 15 items per viewport
                (5 × 3). Scroll to continue
                browsing the remaining
                uploads.
              </div>
            )}
          </div>
        </div>
      )}

      {renamingItemId && (
        <div
          style={
            viewerBackdropStyle
          }
        >
          <div
            style={{
              width:
                "min(420px, 92vw)",
              padding:
                "18px",
              border:
                "1px solid rgba(37,99,235,0.35)",
              borderRadius:
                "12px",
              background:
                "#111C2E",
              boxShadow:
                "0 24px 80px rgba(0,0,0,0.45)",
            }}
          >
            <div
              style={{
                color:
                  "#F8FAFC",
                fontSize:
                  "15px",
                fontWeight:
                  800,
                marginBottom:
                  "10px",
              }}
            >
              Rename Upload
            </div>

            <input
              autoFocus
              value={
                renameValue
              }
              onChange={(
                event,
              ) =>
                setRenameValue(
                  event.target.value,
                )
              }
              onKeyDown={(
                event,
              ) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  saveRename();
                }

                if (
                  event.key ===
                  "Escape"
                ) {
                  setRenamingItemId(
                    null,
                  );
                }
              }}
              style={{
                width:
                  "100%",
                boxSizing:
                  "border-box",
                padding:
                  "10px 11px",
                border:
                  "1px solid rgba(148,163,184,0.22)",
                borderRadius:
                  "8px",
                background:
                  "#0A1425",
                color:
                  "#FFFFFF",
                outline:
                  "none",
              }}
            />

            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "flex-end",
                gap:
                  "8px",
                marginTop:
                  "12px",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setRenamingItemId(
                    null,
                  );
                  setRenameValue("");
                }}
                style={
                  backButtonStyle
                }
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  saveRename
                }
                style={
                  addButtonStyle
                }
              >
                Save Name
              </button>
            </div>
          </div>
        </div>
      )}

      {viewerItem && (
        <div
          style={
            viewerBackdropStyle
          }
          onClick={(
            event,
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setViewerItem(
                null,
              );
            }
          }}
        >
          <button
            type="button"
            onClick={() =>
              setViewerItem(
                null,
              )
            }
            style={
              viewerCloseStyle
            }
            aria-label="Close viewer"
          >
            ×
          </button>

          <div
            style={
              viewerContentStyle
            }
          >
            <div
              style={
                viewerTitleStyle
              }
            >
              {
                viewerItem.name
              }
            </div>

            {viewerItem.type ===
            "image" ? (
              <img
                src={
                  viewerItem.url
                }
                alt={
                  viewerItem.name
                }
                style={
                  viewerImageStyle
                }
              />
            ) : (
              <iframe
                title={
                  viewerItem.name
                }
                src={
                  viewerItem.url
                }
                style={
                  viewerFrameStyle
                }
              />
            )}
          </div>
        </div>
      )}
    </section>
  );
}
