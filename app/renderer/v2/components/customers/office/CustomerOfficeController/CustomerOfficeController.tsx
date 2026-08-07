/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER OFFICE CONTROLLER™

   RECEPTION / WORKSPACE ASSEMBLY
=========================================================== */


import {
  useState,
} from "react";


import SmartWallPanel
from "./components/SmartWallPanel";


import WorkDeskPanel
from "./components/WorkDeskPanel";


import useCustomerOfficeController
from "./hooks/useCustomerOfficeController";


import type {
  CustomerRailItem,
} from "../../hub/sections/CustomerHangerRail/types";


import type {
  CustomerOfficeControllerProps,
} from "./types";



/* ===========================================================
   VIEW MODE
=========================================================== */


type CustomerOfficeView =
  | "wall"
  | "workspace";



/* ===========================================================
   COMPONENT
=========================================================== */


export default function CustomerOfficeController({

customers,

}: CustomerOfficeControllerProps) {


const controller =
useCustomerOfficeController(
  customers,
);



const [
view,
setView,
] = useState<CustomerOfficeView>(
  "wall",
);



return (


<div

style={{

width:"100%",

height:"100%",

flex:1,

display:"flex",

flexDirection:"column",

overflow:"hidden",

minHeight:0,

}}

>


{

view === "wall"


?


/* =====================================================
   CUSTOMER RECEPTION WALL
===================================================== */


<div

style={{

flex:1,

minHeight:0,

overflow:"hidden",

}}

>


<SmartWallPanel


title="FINORA Smart Customers Hub™"



smartWallCustomers={

controller.smartWallCustomers

}



railCustomers={

controller.paginatedCustomers

}



selectedCustomerId={

controller.selectedCustomer?.id

}



selectedCustomer={

controller.selectedCustomer

}



onCustomerSelect={

(customer: CustomerRailItem)=>{


controller.selectCustomer({

...customer,

phone:"",

});


setView(
  "workspace",
);


}

}



currentPage={

controller.currentPage

}



totalCustomers={

controller.filteredCustomers.length

}



customersPerPage={

controller.customersPerPage

}



onPrevious={

controller.previousPage

}



onNext={

controller.nextPage

}


/>


</div>



:


/* =====================================================
   CUSTOMER WORKSPACE
===================================================== */


<div

style={{

flex:1,

minHeight:0,

overflow:"hidden",

}}

>


<WorkDeskPanel

selectedCustomer={

controller.selectedCustomer

}

/>


</div>


}


</div>


);

}
