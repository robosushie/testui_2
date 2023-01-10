import * as React from "react";
import { FormDialog, DropFileSelector, Field, ErrorText, FormValues, FormErrors } from "oui-react";

import * as Messages from "../../../codegen/Messages";

import { SelectedFile } from "../../components/uploads/SelectedFile";
import { eventEmitter, UPLOAD_EVENT } from "../ModelCreateDialog/ModelCreateDialog";
import { ArtifactError } from "models/ArtifactModels";
import { validateField } from "../../utils/formUtils";
import DialogLoader from "../../components/DialogLoader/DialogLoader";
import { ArtifactSize } from "../../constants/artifact";
import { BackendResourceNames } from "../../constants/backendResourceNames";

interface Props {
  modelId: string;
  closeHandler: () => void;
  refresh: () => Promise<void>;
}

export const ModelUploadArtifactDialog: React.FC<Props> = ({ modelId, closeHandler, refresh }) => {
  const [selectedFile, setSelectedFile] = React.useState(undefined);
  const [errorText, setErrorText] = React.useState(undefined);
  const [areMutationsInFlight, setMutationsInFlight] = React.useState(false);

  const onSubmit = () => {
    setMutationsInFlight(true);
    eventEmitter.emit(UPLOAD_EVENT, modelId, BackendResourceNames.models);
  };

  /**
   * Validate the form data on submit.
   */
  const validate = (values: FormValues): FormErrors => ({
    modelArtifact: validateField({
      value: values.modelArtifact,
      required: true,
      callback: (value: File) => value.size <= ArtifactSize.maxSizeBytes,
    }),
  });

  const onUploadFinished = async (err: ArtifactError) => {
    setMutationsInFlight(false);
    if (err) {
      setErrorText(err.errorMessage);
    } else {
      await refresh();
      closeHandler();
    }
  };

  return (
    <FormDialog
      testId="upload-artifact-dialog"
      isOpen={true}
      title={Messages.models.uploadArtifact()}
      closeHandler={closeHandler}
      onSubmit={onSubmit}
      validator={validate}
      submitText={Messages.models.actions.uploadArtifact()}
    >
      {areMutationsInFlight && <DialogLoader />}
      <Field
        label={Messages.models.labels.modelArtifact()}
        tooltip={Messages.tooltips.modelArtifact()}
        fieldName="modelArtifact"
        hint={Messages.models.hints.modelArtifact(ArtifactSize.maxSizeMiB)}
      >
        <DropFileSelector
          testId="uploadFileSelector"
          text={Messages.models.labels.fileSelectorText()}
          browseLinkText={Messages.models.labels.fileSelectorBrowseLinkText()}
          onFilesSelected={setSelectedFile}
        />
      </Field>
      {selectedFile && (
        <SelectedFile selectedFile={selectedFile} onUploadFinished={onUploadFinished} />
      )}
      {errorText && <ErrorText>{errorText}</ErrorText>}
    </FormDialog>
  );
};
