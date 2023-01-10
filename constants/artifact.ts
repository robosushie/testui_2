export namespace ArtifactSize {
  // 100 MiB is allowed from UI.
  export const maxSizeBytes = 104857600;
  export const maxSizeMiB = 100;
  export const minSizeBytes = 0;
}

export interface Artifact {
  modelArtifact: File;
}
