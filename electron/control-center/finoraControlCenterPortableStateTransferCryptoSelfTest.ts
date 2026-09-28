// ============================================================
// FINORA ENTERPRISE
// PORTABLE STATE TRANSFER CRYPTO SELF TEST
// ============================================================

import {
  Buffer,
} from "node:buffer";

import {
  createFinoraControlCenterPortableStateTransferBundleV1,
  decryptFinoraControlCenterPortableStateTransferBundleV1,
  parseFinoraControlCenterPortableStateTransferBundleV1,
  serializeFinoraControlCenterPortableStateTransferBundleV1,
} from "./finoraControlCenterPortableStateTransferCrypto.js";


function assert(
  condition:
    unknown,
  message:
    string,
): asserts condition {

  if (!condition) {

    throw new Error(
      message,
    );
  }
}


async function expectAuthenticationFailure(
  operation:
    () => Promise<unknown>,
  label:
    string,
): Promise<void> {

  let rejected =
    false;

  try {

    await operation();
  } catch (
    error
  ) {

    rejected =
      error instanceof Error &&
      error.message.includes(
        "authentication failed",
      );
  }

  assert(
    rejected,
    `${label} was not rejected by AES-GCM authentication.`,
  );
}


async function run():
  Promise<void> {

  const transferCode =
    "FINORA-TRANSFER-2026-TEST-CODE";

  const wrongTransferCode =
    "FINORA-TRANSFER-2026-WRONG-CODE";

  const secretOperationalMarker =
    "GGB-PRIVATE-WALLET-HISTORY-MARKER";

  const signedEnvelopeSerialization =
    JSON.stringify({
      format:
        "FINORA_CONTROL_CENTER_PORTABLE_STATE",

      schemaVersion:
        1,

      payload: {
        issuerId:
          "FINORA-CC-SELFTEST",

        stateGeneration:
          7,

        walletHistory: [
          secretOperationalMarker,
        ],
      },

      payloadSha256:
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",

      signatureBase64:
        "SELFTEST-SIGNATURE",
    });


  // ----------------------------------------------------------
  // ENCRYPT
  // ----------------------------------------------------------

  const first =
    await createFinoraControlCenterPortableStateTransferBundleV1(
      signedEnvelopeSerialization,
      transferCode,
    );

  const serializedFirst =
    serializeFinoraControlCenterPortableStateTransferBundleV1(
      first,
    );

  assert(
    !serializedFirst.includes(
      transferCode,
    ),
    "Portable State Transfer serialization leaked the Transfer Code.",
  );

  assert(
    !serializedFirst.includes(
      secretOperationalMarker,
    ),
    "Portable State Transfer serialization leaked operational plaintext.",
  );

  assert(
    first.kdf.algorithm ===
      "SCRYPT" &&
    first.kdf.N ===
      32768 &&
    first.kdf.r ===
      8 &&
    first.kdf.p ===
      1 &&
    first.kdf.derivedKeyBytes ===
      32,
    "Portable State Transfer SCRYPT parameters are incorrect.",
  );

  assert(
    first.encryption.algorithm ===
      "AES-256-GCM",
    "Portable State Transfer encryption algorithm is incorrect.",
  );

  assert(
    Buffer.from(
      first.kdf.salt,
      "base64",
    ).length ===
      16,
    "Portable State Transfer salt length is incorrect.",
  );

  assert(
    Buffer.from(
      first.encryption.iv,
      "base64",
    ).length ===
      12,
    "Portable State Transfer IV length is incorrect.",
  );

  assert(
    Buffer.from(
      first.encryption.authTag,
      "base64",
    ).length ===
      16,
    "Portable State Transfer auth-tag length is incorrect.",
  );

  console.log(
    "PASS: dedicated Transfer Code SCRYPT encryption created",
  );

  console.log(
    "PASS: encrypted serialization contains no Transfer Code",
  );

  console.log(
    "PASS: encrypted serialization contains no operational plaintext",
  );


  // ----------------------------------------------------------
  // SERIALIZE / PARSE / DECRYPT
  // ----------------------------------------------------------

  const parsedFirst =
    parseFinoraControlCenterPortableStateTransferBundleV1(
      serializedFirst,
    );

  const decryptedFirst =
    await decryptFinoraControlCenterPortableStateTransferBundleV1(
      parsedFirst,
      transferCode,
    );

  assert(
    decryptedFirst ===
      signedEnvelopeSerialization,
    "Portable State Transfer decrypt did not round-trip exact signed serialization.",
  );

  console.log(
    "PASS: serialize -> parse -> decrypt exact round-trip",
  );


  // ----------------------------------------------------------
  // RANDOMIZATION
  // ----------------------------------------------------------

  const second =
    await createFinoraControlCenterPortableStateTransferBundleV1(
      signedEnvelopeSerialization,
      transferCode,
    );

  assert(
    second.kdf.salt !==
      first.kdf.salt,
    "Portable State Transfer reused the SCRYPT salt.",
  );

  assert(
    second.encryption.iv !==
      first.encryption.iv,
    "Portable State Transfer reused the AES-GCM IV.",
  );

  assert(
    second.ciphertext !==
      first.ciphertext,
    "Portable State Transfer produced identical randomized ciphertext.",
  );

  console.log(
    "PASS: repeated encryption uses fresh salt and IV",
  );


  // ----------------------------------------------------------
  // WRONG CODE
  // ----------------------------------------------------------

  await expectAuthenticationFailure(
    () =>
      decryptFinoraControlCenterPortableStateTransferBundleV1(
        first,
        wrongTransferCode,
      ),
    "Wrong Transfer Code",
  );

  console.log(
    "PASS: wrong Transfer Code rejected",
  );


  // ----------------------------------------------------------
  // CIPHERTEXT TAMPER
  // ----------------------------------------------------------

  const tamperedCiphertextBytes =
    Buffer.from(
      first.ciphertext,
      "base64",
    );

  tamperedCiphertextBytes[0] ^=
    0x01;

  const tamperedCiphertextBundle = {
    ...first,

    ciphertext:
      tamperedCiphertextBytes.toString(
        "base64",
      ),
  };

  await expectAuthenticationFailure(
    () =>
      decryptFinoraControlCenterPortableStateTransferBundleV1(
        tamperedCiphertextBundle,
        transferCode,
      ),
    "Tampered ciphertext",
  );

  console.log(
    "PASS: ciphertext tamper rejected",
  );


  // ----------------------------------------------------------
  // IV / AAD TAMPER
  // ----------------------------------------------------------

  const tamperedIvBytes =
    Buffer.from(
      first.encryption.iv,
      "base64",
    );

  tamperedIvBytes[0] ^=
    0x01;

  const tamperedIvBundle = {
    ...first,

    encryption: {
      ...first.encryption,

      iv:
        tamperedIvBytes.toString(
          "base64",
        ),
    },
  };

  await expectAuthenticationFailure(
    () =>
      decryptFinoraControlCenterPortableStateTransferBundleV1(
        tamperedIvBundle,
        transferCode,
      ),
    "Tampered IV/AAD",
  );

  console.log(
    "PASS: IV/AAD tamper rejected",
  );


  // ----------------------------------------------------------
  // SHORT CODE POLICY
  // ----------------------------------------------------------

  let shortCodeRejected =
    false;

  try {

    await createFinoraControlCenterPortableStateTransferBundleV1(
      signedEnvelopeSerialization,
      "too-short",
    );
  } catch (
    error
  ) {

    shortCodeRejected =
      error instanceof Error &&
      error.message.includes(
        "Transfer Code is invalid",
      );
  }

  assert(
    shortCodeRejected,
    "Short Portable State Transfer Code was accepted.",
  );

  console.log(
    "PASS: short Transfer Code rejected",
  );


  // ----------------------------------------------------------
  // UNSUPPORTED FIELD / STRICT SCHEMA
  // ----------------------------------------------------------

  let unsupportedFieldRejected =
    false;

  try {

    parseFinoraControlCenterPortableStateTransferBundleV1(
      JSON.stringify({
        ...first,

        unexpected:
          true,
      }),
    );
  } catch (
    error
  ) {

    unsupportedFieldRejected =
      error instanceof Error &&
      error.message.includes(
        "unsupported fields",
      );
  }

  assert(
    unsupportedFieldRejected,
    "Portable State Transfer strict schema accepted an unsupported field.",
  );

  console.log(
    "PASS: unsupported transfer field rejected",
  );


  console.log(
    "PASS: PORTABLE STATE TRANSFER CRYPTO SELFTEST",
  );
}


void run()
  .then(
    () => {
      process.exit(
        0,
      );
    },
    (
      error,
    ) => {

      console.error(
        "FAIL: PORTABLE STATE TRANSFER CRYPTO SELFTEST",
        error,
      );

      process.exit(
        1,
      );
    },
  );