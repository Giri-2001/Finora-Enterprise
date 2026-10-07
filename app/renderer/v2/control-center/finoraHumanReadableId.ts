/**
 * FINORA human-facing system ID generator.
 *
 * Human-facing automatically generated IDs must stay compact:
 * - digits only
 * - minimum 8 digits
 * - maximum 12 digits
 * - default 10 digits
 *
 * Cryptographic identifiers such as installation IDs,
 * binding IDs, fingerprints and signing-key IDs must NOT use
 * this helper.
 */
export function generateFinoraHumanId(
  length = 10,
): string {
  if (
    !Number.isInteger(length) ||
    length < 8 ||
    length > 12
  ) {
    throw new Error(
      "FINORA human-facing ID length must be between 8 and 12 digits.",
    );
  }

  const randomValues =
    new Uint32Array(length);

  crypto.getRandomValues(
    randomValues,
  );

  let value =
    String(
      1 +
        (
          randomValues[0] %
          9
        ),
    );

  for (
    let index = 1;
    index < length;
    index += 1
  ) {
    value +=
      String(
        randomValues[index] %
          10,
      );
  }

  return value;
}