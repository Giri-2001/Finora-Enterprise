// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 REPOSITORY FOUNDATION
// COMMON REPOSITORY CONTRACT
//
// RESPONSIBILITY:
//
// - Define the common repository contract for FINORA V2
// - Keep domain repositories independent from storage details
// - Provide a standard CRUD abstraction
// - Allow Customer / Loan / Collection / Payment / Report
//   repositories to use the common StorageManager later
//
// IMPORTANT:
//
// - TYPES / CONTRACTS ONLY.
// - No localStorage.
// - No filesystem.
// - No Electron IPC.
// - No business calculations.
// - No Customer business logic.
// - No Loan business logic.
// - No Collection business logic.
// - No Payment business logic.
// - No Report calculations.
//
// VERSION : 2.0
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type {
  StorageQuery,
  StorageResult,
  StorageWriteOptions,
} from "../storage/storage.types";

// ============================================================
// REPOSITORY ENTITY
// ============================================================

/**
 * Common minimum identity contract.
 *
 * Domain models may contain many additional fields.
 * The repository layer only requires a stable identifier.
 */
export interface RepositoryEntity {
  id: string;
}

// ============================================================
// REPOSITORY QUERY
// ============================================================

/**
 * Repository query extends the common storage query.
 *
 * Repositories may add domain-specific filtering later,
 * without exposing storage implementation details.
 */
export interface RepositoryQuery
  extends StorageQuery {}

// ============================================================
// REPOSITORY WRITE OPTIONS
// ============================================================

/**
 * Common repository write metadata.
 *
 * Owner / Demo isolation remains controlled by the
 * StorageManager and storage layer.
 */
export interface RepositoryWriteOptions
  extends StorageWriteOptions {}

// ============================================================
// REPOSITORY CONTRACT
// ============================================================

/**
 * Generic repository contract.
 *
 * TEntity:
 *
 * - Domain entity type.
 *
 * TCreate:
 *
 * - Type accepted when creating a record.
 *
 * - Defaults to TEntity.
 *
 * TUpdate:
 *
 * - Type accepted when updating a record.
 *
 * - Defaults to TEntity.
 *
 * The repository does not know where the data is stored.
 */
export interface Repository<
  TEntity extends RepositoryEntity,
  TCreate = TEntity,
  TUpdate = TEntity,
> {

  // ----------------------------------------------------------
  // GET ALL
  // ----------------------------------------------------------

  getAll(
    query?: Partial<RepositoryQuery>,
  ): Promise<
    RepositoryListResult<TEntity>
  >;

  // ----------------------------------------------------------
  // FIND BY ID
  // ----------------------------------------------------------

  findById(
    id: string,
  ): Promise<
    RepositoryResult<TEntity | undefined>
  >;

  // ----------------------------------------------------------
  // SAVE
  // ----------------------------------------------------------

  save(
    record: TCreate,
    options?: RepositoryWriteOptions,
  ): Promise<
    RepositoryResult<TEntity>
  >;

  // ----------------------------------------------------------
  // UPDATE
  // ----------------------------------------------------------

  update(
    record: TUpdate,
    options?: RepositoryWriteOptions,
  ): Promise<
    RepositoryResult<TEntity>
  >;

  // ----------------------------------------------------------
  // DELETE
  // ----------------------------------------------------------

  delete(
    id: string,
  ): Promise<
    RepositoryResult<void>
  >;
}

// ============================================================
// REPOSITORY READ CONTRACT
// ============================================================

/**
 * Read-only repository capability.
 *
 * Useful for services that should not be allowed to mutate
 * persisted domain records.
 */
export interface ReadRepository<
  TEntity extends RepositoryEntity,
> {

  getAll(
    query?: Partial<RepositoryQuery>,
  ): Promise<
    RepositoryListResult<TEntity>
  >;

  findById(
    id: string,
  ): Promise<
    RepositoryResult<TEntity | undefined>
  >;
}

// ============================================================
// REPOSITORY WRITE CONTRACT
// ============================================================

/**
 * Write-only repository capability.
 *
 * Useful when a service should only persist changes.
 */
export interface WriteRepository<
  TEntity extends RepositoryEntity,
  TCreate = TEntity,
  TUpdate = TEntity,
> {

  save(
    record: TCreate,
    options?: RepositoryWriteOptions,
  ): Promise<
    RepositoryResult<TEntity>
  >;

  update(
    record: TUpdate,
    options?: RepositoryWriteOptions,
  ): Promise<
    RepositoryResult<TEntity>
  >;

  delete(
    id: string,
  ): Promise<
    RepositoryResult<void>
  >;
}

// ============================================================
// PAGINATED RESULT
// ============================================================

/**
 * Standard pagination result for future repositories.
 *
 * Existing V2 repositories do not need to adopt this yet.
 */
export interface RepositoryPage<
  TEntity,
> {

  items: TEntity[];

  total: number;

  limit: number;

  offset: number;
}

// ============================================================
// PAGINATED REPOSITORY CONTRACT
// ============================================================

/**
 * Optional pagination capability.
 *
 * This is deliberately separate from the base Repository
 * so existing domain repositories are not forced to change.
 */
export interface PaginatedRepository<
  TEntity extends RepositoryEntity,
> {

  getPage(
    query?: Partial<RepositoryQuery>,
  ): Promise<
    RepositoryResult<
      RepositoryPage<TEntity>
    >
  >;
}

// ============================================================
// REPOSITORY RESULT ALIASES
// ============================================================

/**
 * Standard typed repository result.
 *
 * IMPORTANT:
 *
 * The generic T MUST be forwarded to StorageResult<T>.
 *
 * This preserves the concrete payload type across:
 *
 * Storage
 *   ↓
 * Repository
 *   ↓
 * Service
 */
export type RepositoryResult<
  T = unknown,
> = StorageResult<T>;

/**
 * Standard typed repository list result.
 */
export type RepositoryListResult<
  T,
> = StorageResult<T[]>;

// ============================================================
// REPOSITORY ENTITY IDENTIFIER
// ============================================================

/**
 * Safe helper contract for entities whose identifier is
 * generated by the repository or service.
 *
 * This is only a type-level shape.
 */
export interface RepositoryIdentifiable {
  id?: string;
}

// ============================================================
// REPOSITORY MODULE NAMES
// ============================================================

/**
 * Canonical V2 repository names.
 *
 * These are architectural identifiers only.
 */
export enum RepositoryName {

  CUSTOMER =
    "CUSTOMER",

  LOAN =
    "LOAN",

  COLLECTION =
    "COLLECTION",

  PAYMENT =
    "PAYMENT",

  REPORT =
    "REPORT",
}

// ============================================================
// END
// ============================================================
