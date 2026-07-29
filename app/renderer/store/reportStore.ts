import type {
  CollectionReportRow,
  CustomerReportRow,
  LoanReportRow,
} from "../components/reports/types";

import { getCustomers } from "./customerStore";

import { getLoans } from "./loanStore";

import { getCollections } from "./collectionStore";

export function getLoanReport(): LoanReportRow[] {
  const loans = getLoans();

  const customers = getCustomers();

  return loans.map((loan) => {
    const customer = customers.find(
      (item) => item.customerId === loan.customerId,
    );

    return {
      loanId: loan.finoraLoanId,

      customerId: loan.customerId,

      customerName: customer?.name ?? "Unknown",

      approvedAmount: loan.approvedLoanAmount,

      collectedAmount: loan.totalCollectedAmount,

      outstandingAmount: loan.outstandingAmount,

      status: loan.status,

      startDate: loan.startDate,
    };
  });
}

export function getCollectionReport(): CollectionReportRow[] {
  const collections = getCollections();

  const customers = getCustomers();

  return collections.map((collection) => {
    const customer = customers.find(
      (item) => item.customerId === collection.customerId,
    );

    return {
      receiptNumber: collection.receiptNumber,

      loanId: collection.loanId,

      customerId: collection.customerId,

      customerName: customer?.name ?? "Unknown",

      collectionDate: collection.collectionDate,

      amount: collection.totalAmount,

      paymentMode: collection.paymentMode,
    };
  });
}

export function getCustomerReport(): CustomerReportRow[] {
  const customers = getCustomers();

  const loans = getLoans();

  const collections = getCollections();

  return customers.map((customer) => {
    const customerLoans = loans.filter(
      (loan) => loan.customerId === customer.customerId,
    );

    const customerCollections = collections.filter(
      (collection) => collection.customerId === customer.customerId,
    );

    return {
      customerId: customer.customerId,

      customerName: customer.name,

      phone: customer.phone,

      totalLoans: customerLoans.length,

      totalBorrowed: customerLoans.reduce(
        (sum, loan) => sum + loan.approvedLoanAmount,
        0,
      ),

      totalPaid: customerCollections.reduce(
        (sum, collection) => sum + collection.totalAmount,
        0,
      ),

      outstandingAmount: customerLoans.reduce(
        (sum, loan) => sum + loan.outstandingAmount,
        0,
      ),

      status: customer.status,
    };
  });
}
