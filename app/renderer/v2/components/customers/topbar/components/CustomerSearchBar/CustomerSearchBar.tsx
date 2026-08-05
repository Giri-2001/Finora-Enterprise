/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER SEARCH BAR™

   COMPONENT
=========================================================== */

import {

  containerStyle,
  iconStyle,
  inputStyle,

} from "./styles";


export default function CustomerSearchBar() {

  return (

    <div
      style={containerStyle}
    >

      <span
  style={{
    ...iconStyle,
    userSelect: "none",
    opacity: 0.85,
  }}
>
  🔍
</span>


  <input
  type="text"
  placeholder="Search Customers..."
  autoComplete="off"
  spellCheck={false}
  style={inputStyle}
  onFocus={(event) => {
    event.currentTarget.style.boxShadow =
      "0 0 0 3px rgba(200,154,69,.20), 0 10px 24px rgba(0,0,0,.16)";

    event.currentTarget.style.border =
      "2px solid #B8862D";
  }}
  onBlur={(event) => {
    event.currentTarget.style.boxShadow =
      "0 8px 22px rgba(0,0,0,.14), inset 0 1px 2px rgba(255,255,255,.75)";

    event.currentTarget.style.border =
      "2px solid #C89A45";
  }}
/>


    </div>

  );

}
