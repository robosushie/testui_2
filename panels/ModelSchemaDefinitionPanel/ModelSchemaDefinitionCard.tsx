import { FieldSet, DropFileSelector, Field } from "oui-react";
import * as React from "react";
import * as Messages from "@codegen/Messages";
import { SelectedFile } from "../../components/uploads/SelectedFile";

interface Props {
  cardLabel: string;
  cardDesc: string;
  fileSelectorLabel: string;
  fieldClassName: string;
  selectedSchemaFile: File;
  onFileContentsChanged: (values: string) => void;
  onFileNameChanged: (values: File) => void;
}

export const ModelSchemaDefinitionCard: React.FC<Props> = ({
  cardLabel,
  cardDesc,
  fileSelectorLabel,
  fieldClassName,
  selectedSchemaFile,
  onFileContentsChanged,
  onFileNameChanged,
}) => {
  const handleSelectionChange = async (file: File) => {
    if (file) {
      onFileNameChanged(file);
      const fileReader = new FileReader();
      fileReader.onloadend = () => {
        onFileContentsChanged(String(fileReader.result));
      };
      fileReader.readAsText(file);
    } else {
      onFileNameChanged(null);
      onFileContentsChanged("{}");
    }
  };

  return (
    <FieldSet legend={cardLabel}>
      <span>{cardDesc}</span>
      <br />
      <br />
      <Field label={fileSelectorLabel} fieldName={fieldClassName}>
        <DropFileSelector
          text={Messages.models.labels.fileSelectorText()}
          browseLinkText={Messages.models.labels.fileSelectorBrowseLinkText()}
          onFilesSelected={handleSelectionChange}
          fileTypes={{
            extensions: [".json"],
            requirementsText:
              Messages.models.selectPanes.modelSchemaSelect.labels.uploadFileTypeRequirementText(
                "JSON"
              ),
            errorText: Messages.models.selectPanes.modelSchemaSelect.labels.uploadFileTypeError(),
          }}
        />
      </Field>
      {selectedSchemaFile && (
        <SelectedFile
          selectedFile={selectedSchemaFile}
          onUploadFinished={() => {}}
          onClearSelection={() => handleSelectionChange(null)}
          marginModifier={false}
        />
      )}
    </FieldSet>
  );
};
