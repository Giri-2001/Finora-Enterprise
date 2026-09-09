import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
} from "node:fs";

import {
  dirname,
  join,
  relative,
  resolve,
  sep,
} from "node:path";

import {
  fileURLToPath,
} from "node:url";

import {
  createHash,
} from "node:crypto";

/* ============================================================
   FINORA ENTERPRISE OS™

   ANDROID RECIPIENT WEB-ASSET SYNC

   RESPONSIBILITY

   - Copy current Vite recipient application assets to Android.
   - Preserve Capacitor-generated Cordova bridge assets.
   - Fail closed against desktop Control Center / Recipient Trust
     maintenance / Emergency Recovery renderer surfaces.
   - Replace Android public assets only after complete staging
     validation succeeds.

   IMPORTANT

   - This is build tooling only.
   - It does not mutate application data.
   - It does not provision recipient trust.
   - It does not expose signing authority.
   - It must not be replaced by an unrestricted full dist copy.
============================================================ */

const scriptDirectory =
  dirname(
    fileURLToPath(
      import.meta.url,
    ),
  );

const repositoryRoot =
  resolve(
    scriptDirectory,
    "..",
  );

const sourceRoot =
  join(
    repositoryRoot,
    "dist",
  );

const targetRoot =
  join(
    repositoryRoot,
    "android",
    "app",
    "src",
    "main",
    "assets",
    "public",
  );

const targetParent =
  dirname(
    targetRoot,
  );

const uniqueSuffix =
  `${process.pid}-${Date.now()}`;

const stagingRoot =
  join(
    targetParent,
    `public.finora-staging-${uniqueSuffix}`,
  );

const backupRoot =
  join(
    targetParent,
    `public.finora-backup-${uniqueSuffix}`,
  );

const preservedCapacitorFiles =
  Object.freeze([
    "cordova.js",
    "cordova_plugins.js",
  ]);

const forbiddenExactPaths =
  new Set([
    "control-center.html",
    "recipient-trust-maintenance.html",
    "recipient-trust-recovery.html",
  ]);

const forbiddenAssetPrefixes =
  Object.freeze([
    "assets/controlcenter-",
    "assets/recipienttrustmaintenance-",
    "assets/recipienttrustrecovery-",
  ]);

function normalizeRelativePath(
  value,
) {
  return value
    .split(
      sep,
    )
    .join(
      "/",
    );
}

function isForbiddenRecipientAsset(
  relativePath,
) {
  const normalized =
    normalizeRelativePath(
      relativePath,
    );

  const lower =
    normalized.toLowerCase();

  if (
    forbiddenExactPaths.has(
      lower,
    )
  ) {
    return true;
  }

  return forbiddenAssetPrefixes.some(
    (prefix) =>
      lower.startsWith(
        prefix,
      ),
  );
}

function listFiles(
  root,
) {
  const output =
    [];

  function visit(
    directory,
  ) {
    const entries =
      readdirSync(
        directory,
        {
          withFileTypes:
            true,
        },
      );

    for (const entry of entries) {
      const absolutePath =
        join(
          directory,
          entry.name,
        );

      if (
        entry.isDirectory()
      ) {
        visit(
          absolutePath,
        );

        continue;
      }

      if (
        !entry.isFile()
      ) {
        throw new Error(
          `Unsupported filesystem entry: ${absolutePath}`,
        );
      }

      output.push(
        normalizeRelativePath(
          relative(
            root,
            absolutePath,
          ),
        ),
      );
    }
  }

  visit(
    root,
  );

  return output.sort();
}

function copyRelativeFile(
  sourceBase,
  destinationBase,
  relativePath,
) {
  const sourcePath =
    join(
      sourceBase,
      ...relativePath.split(
        "/",
      ),
    );

  const destinationPath =
    join(
      destinationBase,
      ...relativePath.split(
        "/",
      ),
    );

  mkdirSync(
    dirname(
      destinationPath,
    ),
    {
      recursive:
        true,
    },
  );

  copyFileSync(
    sourcePath,
    destinationPath,
  );
}

function sha256(
  filePath,
) {
  return createHash(
    "sha256",
  )
    .update(
      readFileSync(
        filePath,
      ),
    )
    .digest(
      "hex",
    );
}

function assertMainIndexReferencesExist(
  stagedRoot,
) {
  const indexPath =
    join(
      stagedRoot,
      "index.html",
    );

  if (
    !existsSync(
      indexPath,
    )
  ) {
    throw new Error(
      "Recipient index.html is missing from staged Android assets.",
    );
  }

  const html =
    readFileSync(
      indexPath,
      "utf8",
    );

  const references =
    [
      ...html.matchAll(
        /(?:src|href)="\.\/([^"]+)"/g,
      ),
    ].map(
      (match) =>
        match[1],
    );

  for (const assetPath of references) {
    const resolvedPath =
      join(
        stagedRoot,
        ...assetPath.split(
          "/",
        ),
      );

    if (
      !existsSync(
        resolvedPath,
      )
    ) {
      throw new Error(
        `Recipient index references missing asset: ${assetPath}`,
      );
    }
  }
}

function assertNoAuthorityReferences(
  stagedRoot,
) {
  const stagedFiles =
    listFiles(
      stagedRoot,
    );

  const forbiddenTokens =
    [
      "control-center.html",
      "recipient-trust-maintenance.html",
      "recipient-trust-recovery.html",
      "controlCenter-",
      "recipientTrustMaintenance-",
      "recipientTrustRecovery-",
    ];

  for (const relativePath of stagedFiles) {
    if (
      isForbiddenRecipientAsset(
        relativePath,
      )
    ) {
      throw new Error(
        `Forbidden authority asset reached Android staging: ${relativePath}`,
      );
    }

    if (
      !/\.(?:html|js|css)$/i.test(
        relativePath,
      )
    ) {
      continue;
    }

    const absolutePath =
      join(
        stagedRoot,
        ...relativePath.split(
          "/",
        ),
      );

    const text =
      readFileSync(
        absolutePath,
        "utf8",
      );

    for (const token of forbiddenTokens) {
      if (
        text.includes(
          token,
        )
      ) {
        throw new Error(
          `Forbidden authority reference "${token}" found in ${relativePath}`,
        );
      }
    }
  }
}

function replaceTargetAtomically() {
  let backupCreated =
    false;

  let replacementInstalled =
    false;

  try {
    renameSync(
      targetRoot,
      backupRoot,
    );

    backupCreated =
      true;

    renameSync(
      stagingRoot,
      targetRoot,
    );

    replacementInstalled =
      true;

    rmSync(
      backupRoot,
      {
        recursive:
          true,
        force:
          true,
      },
    );

    backupCreated =
      false;
  } catch (error) {
    if (
      replacementInstalled &&
      existsSync(
        targetRoot,
      )
    ) {
      rmSync(
        targetRoot,
        {
          recursive:
            true,
          force:
            true,
        },
      );
    }

    if (
      backupCreated &&
      existsSync(
        backupRoot,
      )
    ) {
      renameSync(
        backupRoot,
        targetRoot,
      );
    }

    throw error;
  } finally {
    if (
      existsSync(
        stagingRoot,
      )
    ) {
      rmSync(
        stagingRoot,
        {
          recursive:
            true,
          force:
            true,
        },
      );
    }

    if (
      existsSync(
        backupRoot,
      ) &&
      existsSync(
        targetRoot,
      )
    ) {
      rmSync(
        backupRoot,
        {
          recursive:
            true,
          force:
            true,
        },
      );
    }
  }
}

if (
  !existsSync(
    sourceRoot,
  )
) {
  throw new Error(
    "Current Vite dist directory does not exist.",
  );
}

if (
  !existsSync(
    targetRoot,
  )
) {
  throw new Error(
    "Existing Android Capacitor public directory does not exist.",
  );
}

if (
  existsSync(
    stagingRoot,
  ) ||
  existsSync(
    backupRoot,
  )
) {
  throw new Error(
    "Unexpected recipient-sync temporary directory already exists.",
  );
}

const sourceFiles =
  listFiles(
    sourceRoot,
  );

const forbiddenSourceFiles =
  sourceFiles.filter(
    isForbiddenRecipientAsset,
  );

if (
  forbiddenSourceFiles.length ===
    0
) {
  throw new Error(
    "Expected desktop authority surfaces were not found in dist; filter proof is unavailable.",
  );
}

mkdirSync(
  stagingRoot,
  {
    recursive:
      true,
  },
);

let copiedRecipientFiles =
  0;

for (const relativePath of sourceFiles) {
  if (
    isForbiddenRecipientAsset(
      relativePath,
    )
  ) {
    continue;
  }

  copyRelativeFile(
    sourceRoot,
    stagingRoot,
    relativePath,
  );

  copiedRecipientFiles +=
    1;
}

let preservedFiles =
  0;

for (
  const relativePath
  of preservedCapacitorFiles
) {
  const existingPath =
    join(
      targetRoot,
      relativePath,
    );

  if (
    !existsSync(
      existingPath,
    )
  ) {
    throw new Error(
      `Required Capacitor bridge asset is missing: ${relativePath}`,
    );
  }

  copyRelativeFile(
    targetRoot,
    stagingRoot,
    relativePath,
  );

  preservedFiles +=
    1;
}

assertMainIndexReferencesExist(
  stagingRoot,
);

assertNoAuthorityReferences(
  stagingRoot,
);

const sourceIndex =
  join(
    sourceRoot,
    "index.html",
  );

const stagedIndex =
  join(
    stagingRoot,
    "index.html",
  );

if (
  sha256(
    sourceIndex,
  ) !==
  sha256(
    stagedIndex,
  )
) {
  throw new Error(
    "Staged Android recipient index does not match current dist index.",
  );
}

const stagedFiles =
  listFiles(
    stagingRoot,
  );

replaceTargetAtomically();

const finalFiles =
  listFiles(
    targetRoot,
  );

console.log(
  "FINORA Android recipient web assets synchronized.",
);

console.log(
  `Source dist files                 : ${sourceFiles.length}`,
);

console.log(
  `Authority files excluded          : ${forbiddenSourceFiles.length}`,
);

console.log(
  `Recipient dist files copied       : ${copiedRecipientFiles}`,
);

console.log(
  `Capacitor bridge files preserved  : ${preservedFiles}`,
);

console.log(
  `Staged files validated            : ${stagedFiles.length}`,
);

console.log(
  `Final Android public files        : ${finalFiles.length}`,
);

console.log(
  "Recipient authority surface       : 0",
);
