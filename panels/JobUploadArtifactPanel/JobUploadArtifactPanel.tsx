import {
  FormValues,
  FormErrors,
  Form,
  FormRef,
  ToastNotification,
  InfoBlockStatus,
} from "oui-react";
import * as React from "react";
import * as Messages from "../../../codegen/Messages";

import { validateField } from "../../utils/formUtils";
import DialogLoader from "../../components/DialogLoader/DialogLoader";
import { eventEmitter, UPLOAD_EVENT } from "dialogs/ModelCreateDialog/ModelCreateDialog";
import { ArtifactSize } from "../../constants/artifact";
import { ArtifactError } from "models/ArtifactModels";
import { ResourceNames } from "constants/resourceNames";
import { FormRemoteSubmitButton, Panel, PanelSize } from "oui-savant";
import { JobArtifactUpload } from "components/JobArtifactUpload/JobArtifactUpload";
import { getHelpLink, MANAGE_JOBS } from "utils/docUtils";

interface Props {
  jobId: string;
  closeHandler: () => void;
  refresh: () => void;
}

export const JobUploadArtifactPanel: React.FC<Props> = ({ jobId, closeHandler, refresh }) => {
  const [selectedFile, setSelectedFile] = React.useState(undefined);
  const [areMutationsInFlight, setMutationsInFlight] = React.useState(false);
  const [formRef, setFormRef] = React.useState<FormRef>(undefined);

  const getFormRef = (newFormRef: FormRef) => {
    setFormRef(newFormRef);
    return newFormRef;
  };

  const onSubmit = () => {
    setMutationsInFlight(true);
    eventEmitter.emit(UPLOAD_EVENT, jobId, ResourceNames.jobs);
  };

  /**
   * Validate the form data on submit.
   */
  const validate = (values: FormValues): FormErrors => ({
    jobArtifact: validateField({
      value: values.jobArtifact,
      required: true,
      callback: (value: File) => value.size <= ArtifactSize.maxSizeBytes,
    }),
  });

  const onUploadFinished = async (err: ArtifactError) => {
    setMutationsInFlight(false);
    if (err) {
      ToastNotification.create({
        title: err.errorMessage,
        status: InfoBlockStatus.Critical,
      });
    } else {
      await refresh();
      closeHandler();
      ToastNotification.create({
        title: Messages.jobs.successfullyUploadedArtifact(),
        status: InfoBlockStatus.Success,
      });
    }
  };

  return (
    <Form formRef={getFormRef} onSubmit={onSubmit} validator={validate}>
      <Panel
        actions={[
          <FormRemoteSubmitButton formRef={formRef} key="form_btn_upload">
            {Messages.actions.upload()}
          </FormRemoteSubmitButton>,
        ]}
        size={PanelSize.Medium}
        title={Messages.jobs.labels.uploadJobArtifact()}
        onClose={closeHandler}
        helpLink={getHelpLink(MANAGE_JOBS)}
      >
        {areMutationsInFlight && <DialogLoader />}
        <JobArtifactUpload
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
          onUploadFinished={onUploadFinished}
        />
      </Panel>
    </Form>
  );
};
