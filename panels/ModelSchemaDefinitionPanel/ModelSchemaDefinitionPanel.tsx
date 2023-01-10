import { FormRemoteSubmitButton, Panel, PanelSize, FormattedString } from "oui-savant";
import * as React from "react";
import * as Messages from "@codegen/Messages";
import { getHelpLink, MODELS_SAVING } from "utils/docUtils";
import { Field, Form, FormErrors, FormRef, TextInput } from "oui-react";
import { isJsonString, validateField } from "../../utils/formUtils";
import { SchemaFiles } from "../../constants/modelSchema";
import { ModelSchemaDefinitionCard } from "./ModelSchemaDefinitionCard";

interface Props {
  onClose: () => void;
  onModelSchemaSubmit: (selectedSchemaFiles: SchemaFiles) => void;
  preSelectedSchema: SchemaFiles;
}

export const ModelSchemaDefinitionPanel: React.FC<Props> = ({
  onClose,
  preSelectedSchema,
  onModelSchemaSubmit,
}) => {
  const [selectedInputSchemaFile, setSelectedInputSchemaFile] = React.useState<File>(
    preSelectedSchema ? preSelectedSchema.selectedInputSchemaFile : null
  );
  const [selectedOutputSchemaFile, setSelectedOutputSchemaFile] = React.useState<File>(
    preSelectedSchema ? preSelectedSchema.selectedOutputSchemaFile : null
  );

  const [inputSchemaBufferText, setInputSchemaBufferText] = React.useState<string>(
    preSelectedSchema ? preSelectedSchema.modelSchemaInputText : "{}"
  );
  const [outputSchemaBufferText, setOutputSchemaBufferText] = React.useState<string>(
    preSelectedSchema ? preSelectedSchema.modelSchemaOutputText : "{}"
  );
  const inputResourceType =
    Messages.models.selectPanes.modelSchemaSelect.labels.inputResourceType();
  const outputResourceType =
    Messages.models.selectPanes.modelSchemaSelect.labels.outputResourceType();

  const [ref, setRef] = React.useState<FormRef>(undefined);

  const getFormRef = (formRef: FormRef): FormRef => {
    setRef(formRef);
    return formRef;
  };

  const onSubmit = (): FormErrors | void => {
    const modelSchemaInputText = inputSchemaBufferText === "{}" ? null : inputSchemaBufferText;
    const modelSchemaOutputText = outputSchemaBufferText === "{}" ? null : outputSchemaBufferText;
    onModelSchemaSubmit({
      modelSchemaInputText,
      modelSchemaOutputText,
      selectedInputSchemaFile,
      selectedOutputSchemaFile,
    });
  };

  /**
   * Validate the form data.
   */
  const validate = (): FormErrors => ({
    modelSchemaInputFile: validateField({
      value: inputSchemaBufferText,
      callback: (value: string) => isJsonString(value, inputResourceType).isValid,
      callbackMessage: isJsonString(inputSchemaBufferText, inputResourceType).errorMessage,
    }),
    modelSchemaOutputFile: validateField({
      value: outputSchemaBufferText,
      callback: (value: string) => isJsonString(value, outputResourceType).isValid,
      callbackMessage: isJsonString(outputSchemaBufferText, outputResourceType).errorMessage,
    }),
  });

  return (
    <>
      <Form formRef={getFormRef} onSubmit={onSubmit} validator={validate}>
        <Panel
          size={PanelSize.Medium}
          title={Messages.models.selectPanes.modelSchemaSelect.title()}
          onClose={onClose}
          helpLink={getHelpLink(MODELS_SAVING)}
          actions={[
            <FormRemoteSubmitButton formRef={ref} key={"form_btn_submit"}>
              {Messages.actions.select()}
            </FormRemoteSubmitButton>,
          ]}
        >
          <p>
            <FormattedString
              inputText={Messages.models.selectPanes.modelSchemaSelect.message(
                getHelpLink(MODELS_SAVING)
              )}
            />
          </p>
          <br />
          <ModelSchemaDefinitionCard
            cardLabel={Messages.models.selectPanes.modelSchemaSelect.labels.uploadInputSchema()}
            cardDesc={Messages.models.selectPanes.modelSchemaSelect.labels.uploadInputSchemaDescription()}
            fileSelectorLabel={Messages.models.selectPanes.modelSchemaSelect.labels.inputSchemaUploadLabel()}
            selectedSchemaFile={selectedInputSchemaFile}
            onFileContentsChanged={setInputSchemaBufferText}
            onFileNameChanged={setSelectedInputSchemaFile}
            fieldClassName="modelSchemaInputFile"
          />
          <br />
          <ModelSchemaDefinitionCard
            cardLabel={Messages.models.selectPanes.modelSchemaSelect.labels.uploadOutputSchema()}
            cardDesc={Messages.models.selectPanes.modelSchemaSelect.labels.uploadOutputSchemaDescription()}
            fileSelectorLabel={Messages.models.selectPanes.modelSchemaSelect.labels.outputSchemaUploadLabel()}
            selectedSchemaFile={selectedOutputSchemaFile}
            onFileContentsChanged={setOutputSchemaBufferText}
            onFileNameChanged={setSelectedOutputSchemaFile}
            fieldClassName="modelSchemaOutputFile"
          />
          <div className="hidden">
            <Field fieldName="placeboElement">
              <TextInput value={inputSchemaBufferText + outputSchemaBufferText} />
            </Field>
          </div>
        </Panel>
      </Form>
    </>
  );
};
