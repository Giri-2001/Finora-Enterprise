// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 APPLICATION CONTEXT
// BUSINESS CONTEXT PROVIDER
//
// RESPONSIBILITY:
//
// - Expose the active FINORA Business Access Context to V2 UI
// - Coordinate React state with BusinessContextService
// - Provide explicit context set / replace / clear operations
// - Keep authentication implementation outside React context
// - Keep storage implementation outside React context
//
// IMPORTANT:
//
// - Does NOT call getSession().
// - Does NOT call authStore.
// - Does NOT initialize storage.
// - Does NOT access localStorage.
// - Does NOT access filesystem.
// - Does NOT use Electron IPC.
// - Does NOT load BusinessIdentity automatically.
// - CollectionContext remains separate.
// - BusinessIdentity remains a persisted domain model.
//
// ARCHITECTURE:
//
// Auth / Application Lifecycle
//          ↓
// BusinessContextProvider
//          ↓
// BusinessContextService
//          ↓
// StorageManager
//
// VERSION : 2.0
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type {
  BusinessAccessContext,
} from "../components/auth/types";

import {
  clearBusinessContext,
  getBusinessContext,
  hasBusinessContext,
  replaceBusinessContext,
  setBusinessContext,
} from "../services/business/businessContextService";

import type {
  StorageResult,
} from "../storage/storage.types";

// ============================================================
// TYPES
// ============================================================

export interface BusinessContextValue {

  context:
    BusinessAccessContext | null;

  isActive:
    boolean;

  setContext(
    context: BusinessAccessContext,
  ): Promise<StorageResult>;

  replaceContext(
    context: BusinessAccessContext,
  ): Promise<StorageResult>;

  clearContext():
    void;
}

// ============================================================
// CONTEXT
// ============================================================

const BusinessContext =
  createContext<
    BusinessContextValue | null
  >(null);

// ============================================================
// PROVIDER
// ============================================================

export interface BusinessContextProviderProps {

  children:
    ReactNode;
}

export function BusinessContextProvider({
  children,
}: BusinessContextProviderProps) {

  // ----------------------------------------------------------
  // INITIAL CONTEXT
  //
  // The service is the runtime source of truth.
  //
  // We read it once during provider initialization and then
  // keep React state synchronized through explicit mutations.
  // ----------------------------------------------------------

  const [
    context,
    setReactContext,
  ] = useState<
    BusinessAccessContext | null
  >(
    () =>
      getBusinessContext(),
  );

  // ==========================================================
  // SET CONTEXT
  // ==========================================================

  const handleSetContext =
    useCallback(
      async (
        nextContext:
          BusinessAccessContext,
      ): Promise<StorageResult> => {

        const result =
          await setBusinessContext(
            nextContext,
          );

        if (
          result.success
        ) {

          setReactContext({
            ...nextContext,
          });
        }

        return result;
      },
      [],
    );

  // ==========================================================
  // REPLACE CONTEXT
  // ==========================================================

  const handleReplaceContext =
    useCallback(
      async (
        nextContext:
          BusinessAccessContext,
      ): Promise<StorageResult> => {

        const result =
          await replaceBusinessContext(
            nextContext,
          );

        if (
          result.success
        ) {

          setReactContext({
            ...nextContext,
          });
        }

        return result;
      },
      [],
    );

  // ==========================================================
  // CLEAR CONTEXT
  // ==========================================================

  const handleClearContext =
    useCallback(
      (): void => {

        clearBusinessContext();

        setReactContext(
          null,
        );
      },
      [],
    );

  // ==========================================================
  // CONTEXT VALUE
  // ==========================================================

  const value =
    useMemo<BusinessContextValue>(
      () => ({

        context,

        isActive:
          hasBusinessContext(),

        setContext:
          handleSetContext,

        replaceContext:
          handleReplaceContext,

        clearContext:
          handleClearContext,

      }),
      [
        context,
        handleSetContext,
        handleReplaceContext,
        handleClearContext,
      ],
    );

  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <BusinessContext.Provider
      value={value}
    >

      {children}

    </BusinessContext.Provider>
  );
}

// ============================================================
// HOOK
// ============================================================

export function useBusinessContext():
  BusinessContextValue {

  const context =
    useContext(
      BusinessContext,
    );

  if (!context) {

    throw new Error(
      "useBusinessContext must be used inside BusinessContextProvider.",
    );
  }

  return context;
}

// ============================================================
// END
// ============================================================
