// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 CUSTOMER REPOSITORY
//
// RESPONSIBILITY:
//
// - Persist CustomerProfile records through StorageManager
// - Keep CustomerProfile model unchanged
// - Use FINORA customerId as persistent storage identity
// - Keep storage implementation outside Customer domain logic
// - Prepare Customer persistence for LOCAL / USB / CLOUD
//
// IMPORTANT:
//
// - No direct localStorage access.
// - No direct filesystem access.
// - No Electron IPC.
// - No Customer UI logic.
// - No Customer business calculations.
// - Storage access goes only through StorageManager.
//
// VERSION : 2.0
// STATUS  : Production Foundation
// ============================================================


// ============================================================
// IMPORTS
// ============================================================

import type {
  CustomerProfile,
} from "../../types/customers/customer.profile.types";

import {
  storageManager,
} from "../../storage/storageManager";

import type {
  StorageQuery,
  StorageResult,
} from "../../storage/storage.types";

import type {
  RepositoryQuery,
  RepositoryWriteOptions,
} from "../repository.types";


// ============================================================
// CONSTANTS
// ============================================================

const CUSTOMER_ENTITY =
  "CUSTOMER";


// ============================================================
// STORAGE RECORD
//
// StorageManager requires a stable top-level string ID.
//
// Customer business/UI code continues using:
//
// customer.identity.customerId
//
// The top-level `id` exists only inside the storage layer.
// ============================================================

interface CustomerStorageRecord
  extends CustomerProfile {

  id: string;
}


// ============================================================
// STORAGE RECORD BUILDER
// ============================================================

function toStorageRecord(
  customer: CustomerProfile,
): CustomerStorageRecord {

  const customerId =
    customer.identity.customerId;


  return {
    ...customer,

    id:
      customerId,
  };
}


// ============================================================
// CUSTOMER RECORD MAPPER
// ============================================================

function fromStorageRecord(
  record: CustomerStorageRecord,
): CustomerProfile {

  const {
    id: _storageId,
    ...customer
  } = record;


  return customer;
}


// ============================================================
// QUERY BUILDER
// ============================================================

function buildCustomerQuery(
  query?: Partial<RepositoryQuery>,
): StorageQuery {

  return {
    entity:
      CUSTOMER_ENTITY,

    id:
      query?.id,

    ownerId:
      query?.ownerId,

    demoId:
      query?.demoId,

    limit:
      query?.limit,

    offset:
      query?.offset,
  };
}


// ============================================================
// REPOSITORY
// ============================================================

export class CustomerRepository {

  // ==========================================================
  // GET ALL
  // ==========================================================

  async getAll(
    query?: Partial<RepositoryQuery>,
  ): Promise<
    StorageResult<CustomerProfile[]>
  > {

    const result =
      await storageManager.getAll<CustomerStorageRecord>(
        buildCustomerQuery(
          query,
        ),
      );


    if (!result.success) {

      return {
        success: false,

        error:
          result.error ??
          "Unable to load customers.",
      };
    }


    const records =
      result.data ?? [];


    return {
      success: true,

      data:
        records.map(
          fromStorageRecord,
        ),
    };
  }


  // ==========================================================
  // FIND BY ID
  // ==========================================================

  async findById(
    customerId: string,
  ): Promise<
    StorageResult<CustomerProfile | undefined>
  > {

    if (!customerId) {

      return {
        success: false,

        error:
          "Customer ID is required.",
      };
    }


    const result =
      await storageManager.get<CustomerStorageRecord>(
        {
          entity:
            CUSTOMER_ENTITY,

          id:
            customerId,
        },
      );


    if (!result.success) {

      return {
        success: false,

        error:
          result.error ??
          "Unable to load customer.",
      };
    }


    if (!result.data) {

      return {
        success: true,

        data:
          undefined,
      };
    }


    return {
      success: true,

      data:
        fromStorageRecord(
          result.data,
        ),
    };
  }


  // ==========================================================
  // SAVE
  // ==========================================================

  async save(
    customer: CustomerProfile,
    options?: RepositoryWriteOptions,
  ): Promise<
    StorageResult<CustomerProfile>
  > {

    const customerId =
      customer.identity.customerId;


    if (!customerId) {

      return {
        success: false,

        error:
          "Customer ID is required before saving a customer.",
      };
    }


    const storageRecord =
      toStorageRecord(
        customer,
      );


    const result =
      await storageManager.save<CustomerStorageRecord>(
        storageRecord,
        options,
      );


    if (!result.success) {

      return {
        success: false,

        error:
          result.error ??
          "Unable to save customer.",
      };
    }


    return {
      success: true,

      data:
        customer,
    };
  }


  // ==========================================================
  // UPDATE
  // ==========================================================

  async update(
    customer: CustomerProfile,
    options?: RepositoryWriteOptions,
  ): Promise<
    StorageResult<CustomerProfile>
  > {

    const customerId =
      customer.identity.customerId;


    if (!customerId) {

      return {
        success: false,

        error:
          "Customer ID is required before updating a customer.",
      };
    }


    const storageRecord =
      toStorageRecord(
        customer,
      );


    const result =
      await storageManager.update<CustomerStorageRecord>(
        storageRecord,
        options,
      );


    if (!result.success) {

      return {
        success: false,

        error:
          result.error ??
          "Unable to update customer.",
      };
    }


    return {
      success: true,

      data:
        customer,
    };
  }


  // ==========================================================
  // DELETE
  // ==========================================================

  async delete(
    customerId: string,
  ): Promise<
    StorageResult<void>
  > {

    if (!customerId) {

      return {
        success: false,

        error:
          "Customer ID is required before deleting a customer.",
      };
    }


    const result =
      await storageManager.delete(
        {
          entity:
            CUSTOMER_ENTITY,

          id:
            customerId,
        },
      );


    if (!result.success) {

      return {
        success: false,

        error:
          result.error ??
          "Unable to delete customer.",
      };
    }


    return {
      success: true,
    };
  }


  // ==========================================================
  // REPLACE ALL
  //
  // Empty arrays are valid.
  //
  // This deliberately calls StorageManager even when the
  // supplied Customer list is empty so the storage state is
  // truly replaced by an empty collection.
  // ==========================================================

  async replaceAll(
    customers: CustomerProfile[],
    options?: RepositoryWriteOptions,
  ): Promise<
    StorageResult<void>
  > {

    const records =
      customers.map(
        toStorageRecord,
      );


    const result =
      await storageManager.replaceAll(
        records,
        options,
      );


    if (!result.success) {

      return {
        success: false,

        error:
          result.error ??
          "Unable to replace customer records.",
      };
    }


    return {
      success: true,
    };
  }


  // ==========================================================
  // EXISTS
  // ==========================================================

  async exists(
    customerId: string,
  ): Promise<boolean> {

    if (!customerId) {

      return false;
    }


    const result =
      await this.findById(
        customerId,
      );


    return (
      result.success &&
      result.data !== undefined
    );
  }
}


// ============================================================
// SINGLETON
// ============================================================

export const customerRepository =
  new CustomerRepository();


// ============================================================
// END
// ============================================================
