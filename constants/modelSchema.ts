export enum SelectOptions {
  SelectModelInputSchema = "Upload input schema",
  SelectModelOutputSchema = "Upload output schema",
}

export interface SchemaFiles {
  modelSchemaInputText: string;
  modelSchemaOutputText: string;
  selectedInputSchemaFile: File;
  selectedOutputSchemaFile: File;
}
