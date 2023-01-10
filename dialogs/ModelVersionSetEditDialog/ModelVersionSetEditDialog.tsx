import * as React from "react";
import { useMutation, useQuery, FormRemoteSubmitButton } from "oui-savant";
import {
  Field,
  Form,
  FormValues,
  FormErrors,
  ErrorText,
  Modal,
  FormRef,
  TextInput,
} from "oui-react";

import * as Messages from "@codegen/Messages";
import DialogLoader from "components/DialogLoader/DialogLoader";
import { validateField } from "../../utils/formUtils";
import apiClients from "../../apiClients";
import { getDialogBoxHelpLink, MANAGE_MODELS } from "../../utils/docUtils";

interface Props {
  closeHandler(): void;
  refresh(): void;
  modelVersionSetId: string;
}

export const ModelVersionSetEditDialog: React.FC<Props> = ({
  modelVersionSetId,
  closeHandler,
  refresh,
}) => {
  const [ref, setRef] = React.useState<FormRef>(undefined);

  const modelVersionSet = useQuery({
    method: apiClients.odscApi.getModelVersionSet,
    options: {
      args: { modelVersionSetId },
    },
  });
  const modelVersionSetReady =
    !modelVersionSet.error && modelVersionSet.response && modelVersionSet.response.data;

  const modelVersionSetMutation = useMutation({
    method: apiClients.odscApi.updateModelVersionSet,
    onSuccess: () => {
      refresh();
      closeHandler();
    },
  });

  /**
   * Handle the submit event from the form.
   */
  const onSubmit = (form: Form): void => {
    const values = form.getValues();
    modelVersionSetMutation.reset();
    modelVersionSetMutation.invoke({
      modelVersionSetId,
      updateModelVersionSetDetails: {
        description: values.description as string,
      },
    });
  };

  /**
   * Validate the form data on submit.
   */
  const validate = (values: FormValues): FormErrors => ({
    description: validateField({ value: values.description, maxLen: 400 }),
  });

  const defaultValues = {
    description: modelVersionSetReady ? modelVersionSetReady.description : undefined,
  };

  const getFormRef = (formRef: FormRef): FormRef => {
    setRef(formRef);
    return formRef;
  };

  return (
    <Modal
      testId="edit-model-version-set-dialog"
      isOpen={true}
      closeHandler={closeHandler}
      title={Messages.modelVersionSets.editTitle()}
      helpLink={getDialogBoxHelpLink(MANAGE_MODELS, "edit-models")}
      footerContent={
        <FormRemoteSubmitButton formRef={ref}>
          {Messages.actions.saveChanges()}
        </FormRemoteSubmitButton>
      }
    >
      {/* Loaders */}
      {modelVersionSet.loading && <DialogLoader />}
      {modelVersionSetMutation.result && modelVersionSetMutation.result.loading && <DialogLoader />}
      <Form
        validator={validate}
        onSubmit={onSubmit}
        defaultValues={defaultValues}
        formRef={getFormRef}
      >
        {modelVersionSetReady && (
          <>
            <Field
              label={Messages.modelVersionSets.labels.description()}
              fieldName="description"
              optional={true}
            >
              <TextInput />
            </Field>
          </>
        )}
        {/* Error messages */}
        {modelVersionSet.error && (
          <ErrorText testId="model-version-set-get-error">
            {modelVersionSet.error.body.message}
          </ErrorText>
        )}
        {modelVersionSetMutation.result && modelVersionSetMutation.result.error && (
          <ErrorText testId="model-version-set-edit-error">
            {modelVersionSetMutation.result.error.body.message}
          </ErrorText>
        )}
      </Form>
    </Modal>
  );
};
