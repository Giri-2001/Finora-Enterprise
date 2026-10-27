/* FINORA_P1_745F_PREMIUM_DISCONNECT_MODAL
 * UI confirmation only. Existing secure server authorization remains unchanged.
 */
const PHRASE = "DISCONNECTNOW!!";
let modalOpen = false;

export function confirmFinoraServerDisconnect(): Promise<boolean> {
  if (modalOpen) return Promise.resolve(false);
  modalOpen = true;

  return new Promise<boolean>((resolve) => {
    const overlay = document.createElement("div");
    overlay.setAttribute("role", "presentation");

    Object.assign(overlay.style, {
      position: "fixed",
      inset: "0",
      zIndex: "2147483647",
      background: "rgba(2,6,23,.82)",
      backdropFilter: "blur(9px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      boxSizing: "border-box",
    });

    const panel = document.createElement("div");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-label", "FINORA Secure Disconnect Confirmation");

    Object.assign(panel.style, {
      width: "100%",
      maxWidth: "475px",
      borderRadius: "20px",
      border: "1px solid rgba(248,113,113,.45)",
      background: "linear-gradient(145deg,#17243d,#0b1425)",
      boxShadow: "0 24px 85px rgba(0,0,0,.65)",
      padding: "28px",
      boxSizing: "border-box",
      color: "#f8fafc",
      fontFamily: "Inter,ui-sans-serif,system-ui,sans-serif",
    });

    const heading = document.createElement("h2");
    heading.textContent = "Disconnect Production Server?";
    Object.assign(heading.style, {
      fontSize: "21px",
      margin: "0 0 12px",
      fontWeight: "800",
    });

    const description = document.createElement("p");
    description.textContent =
      "This disconnects FINORA Control Center administrator access. " +
      "Owner records, subscriptions and Wallet balances are not deleted.";
    Object.assign(description.style, {
      color: "#cbd5e1",
      lineHeight: "1.6",
      fontSize: "13px",
      margin: "0 0 20px",
    });

    const instruction = document.createElement("div");
    instruction.textContent = "Type these exact 15 characters:";
    Object.assign(instruction.style, {
      color: "#fda4af",
      fontSize: "13px",
      marginBottom: "8px",
      fontWeight: "700",
    });

    const phrase = document.createElement("div");
    phrase.textContent = PHRASE;
    Object.assign(phrase.style, {
      background: "rgba(127,29,29,.25)",
      border: "1px dashed rgba(248,113,113,.5)",
      borderRadius: "10px",
      padding: "12px",
      fontSize: "17px",
      fontWeight: "800",
      letterSpacing: "1px",
      marginBottom: "14px",
      textAlign: "center",
      userSelect: "none",
    });

    const input = document.createElement("input");
    input.type = "text";
    input.autocomplete = "off";
    input.spellcheck = false;
    input.maxLength = 15;
    input.placeholder = "Enter confirmation phrase";
    input.setAttribute("aria-label", "Exact disconnect confirmation phrase");

    Object.assign(input.style, {
      width: "100%",
      boxSizing: "border-box",
      padding: "13px",
      borderRadius: "10px",
      outline: "none",
      border: "1px solid #64748b",
      background: "#0b1425",
      color: "#fff",
      fontSize: "15px",
      marginBottom: "12px",
    });

    const note = document.createElement("div");
    note.textContent = "Spaces are not allowed. Exact match is required.";
    Object.assign(note.style, {
      fontSize: "12px",
      color: "#94a3b8",
      marginBottom: "18px",
    });

    const actions = document.createElement("div");
    Object.assign(actions.style, {
      display: "flex",
      justifyContent: "flex-end",
      gap: "10px",
      flexWrap: "wrap",
    });

    function makeButton(text: string, danger: boolean): HTMLButtonElement {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = text;
      Object.assign(button.style, {
        borderRadius: "10px",
        border: danger
          ? "1px solid rgba(248,113,113,.6)"
          : "1px solid rgba(148,163,184,.4)",
        background: danger ? "#991b1b" : "#233653",
        color: "#fff",
        padding: "12px 16px",
        minHeight: "43px",
        fontWeight: "750",
        cursor: "pointer",
      });
      return button;
    }

    const cancel = makeButton("Cancel", false);
    const continueButton = makeButton("Continue", true);
    continueButton.disabled = true;
    continueButton.style.opacity = ".4";
    continueButton.style.cursor = "not-allowed";

    actions.append(cancel, continueButton);
    panel.append(
      heading, description, instruction, phrase,
      input, note, actions
    );
    overlay.appendChild(panel);

    let finished = false;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        finish(false);
      } else if (event.key === "Tab") {
        const focusable = Array.from(
          panel.querySelectorAll<HTMLElement>(
            'button:not([disabled]), input:not([disabled])'
          )
        );
        if (focusable.length) {
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
      }
    };

    function finish(approved: boolean) {
      if (finished) return;
      finished = true;
      document.removeEventListener("keydown", onKeyDown, true);
      overlay.remove();
      modalOpen = false;
      resolve(approved);
    }

    input.addEventListener("input", () => {
      const valid =
        input.value === PHRASE &&
        /^\S{15}$/.test(input.value);

      continueButton.disabled = !valid;
      continueButton.style.opacity = valid ? "1" : ".4";
      continueButton.style.cursor = valid ? "pointer" : "not-allowed";
    });

    cancel.addEventListener("click", () => finish(false));

    continueButton.addEventListener("click", () => {
      if (input.value !== PHRASE || !/^\S{15}$/.test(input.value)) {
        return;
      }

      heading.textContent = "Final Disconnect Confirmation";
      description.textContent =
        "Are you certain you want to disconnect FINORA " +
        "Production Server administrator access?";
      instruction.remove();
      phrase.remove();
      input.remove();
      note.remove();

      continueButton.remove();
      const finalButton = makeButton("Final Disconnect", true);
      actions.appendChild(finalButton);

      finalButton.addEventListener("click", () => finish(true));
      finalButton.focus();
    });

    document.addEventListener("keydown", onKeyDown, true);
    document.body.appendChild(overlay);
    input.focus();
  });
}