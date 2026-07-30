import type {
  CollectionReportRow,
  CustomerReportRow,
  GoldReportRow,
  LoanReportRow,
  LockerReportRow,
  PaymentReportRow,
} from "../components/reports/types";

import { getLoans } from "../store/loanStore";

import { getCustomers } from "../store/customerStore";

import { getCollections } from "../store/collectionStore";

import { getPayments } from "../store/paymentStore";

import { getOrnaments } from "../store/goldOrnamentStore";

import { getLockers } from "../store/goldLockerStore";

import { getBags } from "../store/goldBagStore";

export function generateLoanReport(): LoanReportRow[] {
  const loans = getLoans();

  const customers = getCustomers();

  return loans.map((loan) => {
    const customer = customers.find(
      (item) => item.customerId === loan.customerId,
    );

    return {
      loanId: loan.finoraLoanId,

      customerId: loan.customerId,

      customerName: customer?.name ?? loan.customerId,

      approvedAmount: loan.approvedLoanAmount,

      collectedAmount: loan.totalCollectedAmount,

      outstandingAmount: loan.outstandingAmount,

      status: loan.status,

      startDate: loan.startDate,
    };
  });
}

export function generateCollectionReport(): CollectionReportRow[] {
  const collections = getCollections();

  const customers = getCustomers();

  return collections.map((item) => {
    const customer = customers.find(
      (customer) => customer.customerId === item.customerId,
    );

    return {
      receiptNumber: item.receiptNumber,

      loanId: item.loanId,

      customerId: item.customerId,

      customerName: customer?.name ?? item.customerId,

      collectionDate: item.collectionDate,

      amount: item.totalAmount,

      paymentMode: item.paymentMode,
    };
  });
}

export function generatePaymentReport(): PaymentReportRow[] {
  const payments = getPayments();

  return payments.map((payment) => ({
    paymentId: payment.id,

    loanId: payment.loanId,

    customerId: payment.customerId,

    amount: payment.amount,

    paymentType: payment.paymentType,

    paymentMode: payment.paymentMode,

    paymentDate: payment.paymentDate,
  }));
}

export function generateCustomerReport(): CustomerReportRow[] {
  const customers = getCustomers();

  const loans = getLoans();

  return customers.map((customer) => {
    const customerLoans = loans.filter(
      (loan) => loan.customerId === customer.customerId,
    );

    const totalBorrowed = customerLoans.reduce(
      (sum, loan) => sum + loan.approvedLoanAmount,

      0,
    );

    const totalPaid = customerLoans.reduce(
      (sum, loan) => sum + loan.totalCollectedAmount,

      0,
    );

    return {
      customerId: customer.customerId,

      customerName: customer.name,

      phone: customer.phone,

      totalLoans: customerLoans.length,

      totalBorrowed,

      totalPaid,

      outstandingAmount: Math.max(totalBorrowed - totalPaid, 0),

      status: customerLoans.length > 0 ? "Active" : "Inactive",
    };
  });
}

export function generateGoldReport(): GoldReportRow[] {
  const ornaments = getOrnaments();

  const lockers = getLockers();

  const bags = getBags();

  const result: GoldReportRow[] = [];

  lockers.forEach((locker) => {
    const bag = bags.find((item) => item.lockerNumber === locker.lockerNumber);

    if (bag) {
      const count = ornaments.filter(
        (item) => item.loanId === bag.loanId,
      ).length;

      result.push({
        loanId: bag.loanId,

        customerId: "",

        lockerNumber: locker.lockerNumber,

        bagNumber: bag.bagNumber,

        ornamentCount: count,

        status: bag.status === "RELEASED" ? "RELEASED" : "ACTIVE",
      });
    }
  });

  return result;
}

export function generateLockerReport(): LockerReportRow[] {
  const lockers = getLockers();

  const bags = getBags();

  return lockers.map((locker) => {
    const bag = bags.find((item) => item.lockerNumber === locker.lockerNumber);

    return {
      lockerNumber: locker.lockerNumber,

      status: locker.status,

      loanId: bag?.loanId,

      bagNumber: bag?.bagNumber,
    };
  });
}
