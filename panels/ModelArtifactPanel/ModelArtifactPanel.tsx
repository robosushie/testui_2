import { FormRemoteSubmitButton, Panel, PanelSize, FormattedString } from "oui-savant";
import * as React from "react";
import * as Messages from "@codegen/Messages";
import { getHelpLink, MODELS_SAVING, PREPARE_MODEL_ARTIFACT } from "utils/docUtils";
import {
  Form,
  DropFileSelector,
  Field,
  FormErrors,
  FormRef,
  InfoBlock,
  InfoBlockStatus,
  Button,
  ButtonStyle,
  ButtonSize,
  FormContextConsumer,
  TextInput,
} from "oui-react";
import { validateField } from "../../utils/formUtils";
import { ArtifactSize } from "../../constants/artifact";
import { SelectedFile } from "../../components/uploads/SelectedFile";
import "./ModelArtifactPanel.less";
import { BoilerplateArtifact } from "../../constants/boilerplateArtifact";

interface Props {
  onClose: () => void;
  onArtifactDataSubmit: (selectedArtifact: File) => void;
  preSelectedArtifact: File;
}

export const ModelArtifactPanel: React.FC<Props> = ({
  onClose,
  onArtifactDataSubmit,
  preSelectedArtifact,
}) => {
  const [selectedFile, setSelectedFile] = React.useState<any>(preSelectedArtifact);
  const [ref, setRef] = React.useState<FormRef>(undefined);
  const getFormRef = (formRef: FormRef): FormRef => {
    setRef(formRef);
    return formRef;
  };

  const downloadSampleArtifact = () => {
    window.open(BoilerplateArtifact.TEMPLATE_URL);
  };

  const DownloadSampleArtifactAction = (
    <Button
      buttonStyle={ButtonStyle.Default}
      buttonSize={ButtonSize.Default}
      onClick={downloadSampleArtifact}
    >
      {Messages.models.actions.downloadSampleArtifact()}
    </Button>
  );

  const onSubmit = (): void => {
    onArtifactDataSubmit(selectedFile);
  };

  /**
   * Validate the form data on submit.
   */
  const validate = (): FormErrors => ({
    modelArtifact: validateField({
      value: selectedFile,
      required: true,
      callback: (value: File) =>
        value.size < ArtifactSize.maxSizeBytes && value.size > ArtifactSize.minSizeBytes,
      callbackMessage:
        selectedFile && selectedFile.size > ArtifactSize.maxSizeBytes
          ? Messages.validation.maxSize(Messages.uploadModelArtifact.resourceType())
          : Messages.validation.minSize(Messages.uploadModelArtifact.resourceType()),
    }),
  });

  return (
    <>
      <Form formRef={getFormRef} onSubmit={onSubmit} validator={validate}>
        <FormContextConsumer>
          {() => (
            <>
              <Panel
                size={PanelSize.Medium}
                title={Messages.models.selectPanes.artifactSelect.title()}
                onClose={onClose}
                helpLink={getHelpLink(MODELS_SAVING)}
                actions={[
                  <FormRemoteSubmitButton formRef={ref} key={"form_btn_submit"}>
                    {Messages.models.actions.upload()}
                  </FormRemoteSubmitButton>,
                ]}
              >
                <div className="uploadArtifact">
                  <InfoBlock status={InfoBlockStatus.Info}>
                    <div>
                      <FormattedString
                        inputText={Messages.uploadModelArtifact.information.modelArtifactInfo(
                          getHelpLink(PREPARE_MODEL_ARTIFACT)
                        )}
                      />
                      <br />
                      <ul className={"upload-artifact-ul"}>
                        <li>{Messages.uploadModelArtifact.information.line1()}</li>
                        <li>{Messages.uploadModelArtifact.information.line2()}</li>
                      </ul>
                      {DownloadSampleArtifactAction}
                    </div>
                  </InfoBlock>
                  <br />
                  <Field
                    label={Messages.models.labels.uploadLabel()}
                    fieldName="modelArtifact"
                    hint={Messages.models.hints.modelArtifact(ArtifactSize.maxSizeMiB)}
                    testId="modelArtifact"
                  >
                    <div className="upload-file-selector">
                      <DropFileSelector
                        testId="uploadFileSelector"
                        label="uploadFile"
                        text={Messages.models.labels.fileSelectorText()}
                        browseLinkText={Messages.models.labels.fileSelectorBrowseLinkText()}
                        onFilesSelected={setSelectedFile}
                      />
                    </div>
                  </Field>
                  {selectedFile && (
                    <SelectedFile
                      selectedFile={selectedFile}
                      onClearSelection={() => {
                        setSelectedFile(null);
                      }}
                      onUploadFinished={() => {}}
                    />
                  )}
                  {/*This placebo element is created so that the validate function gets
                  called when the selected file is set*/}
                  <div className="hidden">
                    <Field fieldName="placeboElement">
                      <TextInput value={selectedFile && selectedFile.size} />
                    </Field>
                  </div>
                </div>
              </Panel>
            </>
          )}
        </FormContextConsumer>
      </Form>
    </>
  );
};
