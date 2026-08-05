/* ===========================================================
   FINORA ENTERPRISE OS™
   SMART WALL MAPPER™
=========================================================== */

import type {
  OfficeCustomer,
} from "../../CustomerOffice/types";

import type {
  SmartWallItem,
} from "../../../smartwall/CustomerSmartWall/types";

export default function smartWallMapper(
  customers: OfficeCustomer[],
): SmartWallItem[] {

  return customers.map((customer) => ({

    id: customer.id,

    customerName: customer.name,

    active: customer.active,

  }));

}
