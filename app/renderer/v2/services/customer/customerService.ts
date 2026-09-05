// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 CUSTOMER SERVICE
//
// MODULE  : Customer
// LAYER   : Service
// VERSION : 2.1
// STATUS  : Production
//
// RESPONSIBILITY:
//
// - Provide the application-level Customer service boundary
// - Delegate persistence operations to CustomerRepository
// - Keep storage implementation details outside UI code
// - Provide a stable async API for future Customer workflows
//
// IMPORTANT:
//
// - No localStorage access.
// - No filesystem access.
// - No Electron IPC.
// - No Customer UI logic.
// - No Customer business calculations.
// - No Loan / Collection / Payment logic.
//
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type { CustomerProfile } from "../../types/customers";

import { customerRepository } from "../../repositories/customer/customerRepository";

import {
  authorizeFinoraCommercialWrite,
} from "../activation/finoraCommercialWriteGuard";

import type {
  RepositoryQuery,
  RepositoryWriteOptions,
} from "../../repositories/repository.types";

import type { StorageResult } from "../../storage/storage.types";

// ============================================================
// CUSTOMER SERVICE QUERY
//
// CustomerRepository owns:
//
// entity: "CUSTOMER"
//
// Therefore the service does not require callers to provide
// the entity field.
//
// The remaining RepositoryQuery fields remain available for:
//
// - id
// - ownerId
// - demoId
// - limit
// - offset
//
// ============================================================

export type CustomerServiceQuery = Omit<RepositoryQuery, "entity">;

// ============================================================
// CUSTOMER SERVICE
// ============================================================

export class CustomerService {
  // ==========================================================
  // GET ALL CUSTOMERS
  // ==========================================================

  async getAll(
    query?: CustomerServiceQuery,
  ): Promise<StorageResult<CustomerProfile[]>> {
    return customerRepository.getAll(query);
  }

  // ==========================================================
  // GET CUSTOMER BY ID
  // ==========================================================

  async getById(
    customerId: string,
  ): Promise<StorageResult<CustomerProfile | undefined>> {
    return customerRepository.findById(customerId);
  }

  // ==========================================================
  // CREATE CUSTOMER
  // ==========================================================

  async create(
    customer: CustomerProfile,
    options?: RepositoryWriteOptions,
  ): Promise<StorageResult<CustomerProfile>> {

    const commercialWriteDecision =
      await authorizeFinoraCommercialWrite(
        "CREATE_CUSTOMER",
      );

    if (!commercialWriteDecision.allowed) {
      return {
        success:
          false,

        error:
          commercialWriteDecision.reason,
      };
    }

    return customerRepository.save(
      customer,
      options,
    );
  }

  // ==========================================================
  // UPDATE CUSTOMER
  // ==========================================================

  async update(
    customer: CustomerProfile,
    options?: RepositoryWriteOptions,
  ): Promise<StorageResult<CustomerProfile>> {
    return customerRepository.update(customer, options);
  }

  // ==========================================================
  // DELETE CUSTOMER
  // ==========================================================

  async delete(customerId: string): Promise<StorageResult<void>> {
    return customerRepository.delete(customerId);
  }

  // ==========================================================
  // REPLACE ALL CUSTOMERS
  // ==========================================================

  async replaceAll(
    customers: CustomerProfile[],
    options?: RepositoryWriteOptions,
  ): Promise<StorageResult<void>> {
    return customerRepository.replaceAll(customers, options);
  }

  // ==========================================================
  // CUSTOMER EXISTS
  // ==========================================================

  async exists(customerId: string): Promise<boolean> {
    return customerRepository.exists(customerId);
  }
}

// ============================================================
// SINGLETON
// ============================================================

export const customerService = new CustomerService();

// ============================================================
// END
// ============================================================
