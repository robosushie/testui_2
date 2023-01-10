import * as React from "react";

import {
  TextInput,
  Field,
  ErrorText,
  InfoBlock,
  InfoBlockStatus,
  FormValues,
  FormErrors,
  Modal,
  Form,
  ButtonStyle,
  Button,
  FormRef,
  FormInterface,
  FormContextConsumer,
  CheckBox,
} from "oui-react";
import * as Messages from "../../../codegen/Messages";

import DialogLoader from "components/DialogLoader/DialogLoader";
import { useMutation } from "oui-savant";
import apiClients from "../../apiClients";
import { validateField } from "../../utils/formUtils";
import { FormattedString } from "loom-formatted-string-react";
import { getDialogBoxHelpLink, MANAGE_MODEL_VERSION_SETS } from "../../utils/docUtils";
import { useGetModelVersionSet } from "../../hooks/useGetModelVersionSet";

interface Props {
  closeHandler(): void;

  refresh(): void;

  modelVersionSetId: string;
}

export const ModelVersionSetDeleteDialog: React.FC<Props> = ({
  modelVersionSetId,
  closeHandler,
  refresh,
}) => {
  const [ref, setRef] = React.useState<FormRef>(undefined);
  const [deleteRelatedModels, setDeleteRelatedModels] = React.useState(false);

  const { invoke, result, reset } = useMutation({
    method: apiClients.odscApi.deleteModelVersionSet,
    onSuccess: () => {
      refresh();
      closeHandler();
    },
  });
  const modelVersionSet = useGetModelVersionSet(modelVersionSetId);

  const modelVersionSetReady =
    !modelVersionSet.error && modelVersionSet.response && modelVersionSet.response.data;
  const deleteConfirmationText = modelVersionSetReady ? modelVersionSetReady.name : "delete";

  const onSubmit = (): void => {
    reset();
    invoke({ modelVersionSetId, isDeleteRelatedModels: deleteRelatedModels });
  };

  /**
   * Validate the form data on submit.
   */
  const validate = (values: FormValues): FormErrors => ({
    confirmedDelete: validateField({
      value: values.confirmedDelete,
      required: true,
      callback: (value: string) => value.toLowerCase() === deleteConfirmationText.toLowerCase(),
    }),
  });

  const getFormRef = (formRef: FormRef): FormRef => {
    setRef(formRef);
    return formRef;
  };

  return (
    <Form validator={validate} onSubmit={onSubmit} formRef={getFormRef}>
      <FormContextConsumer>
        {({ form }) => (
          <>
            <Modal
              testId="delete-model-version-set-dialog"
              isOpen={true}
              closeHandler={closeHandler}
              title={Messages.modelVersionSets.deleteTitle()}
              helpLink={getDialogBoxHelpLink(MANAGE_MODEL_VERSION_SETS, "delete-models")}
              footerContent={
                <Button
                  onClick={() => {
                    (ref as FormInterface).submitForm(null);
                  }}
                  buttonStyle={ButtonStyle.Danger}
                  disabled={form.getValue("confirmedDelete") === undefined || !form.isValid()}
                >
                  {Messages.actions.delete()}
                </Button>
              }
            >
              {modelVersionSet.loading && <DialogLoader />}
              {result && result.loading && <DialogLoader />}

              {modelVersionSetReady && (
                <>
                  <FormattedString inputText={Messages.modelVersionSets.deleteConfirmation()} />
                  <Field
                    label={
                      <FormattedString
                        inputText={Messages.modelVersionSets.deleteAgreement(
                          deleteConfirmationText
                        )}
                      />
                    }
                    fieldName="confirmedDelete"
                  >
                    <TextInput autoFocus={true} required={true} />
                  </Field>
                  <Field
                    label={Messages.modelVersionSets.labels.isDeleteRelatedModels()}
                    fieldName="isDeleteRelatedModels"
                  >
                    <CheckBox
                      checked={deleteRelatedModels}
                      onChange={() => setDeleteRelatedModels(!deleteRelatedModels)}
                    />
                  </Field>
                  {deleteRelatedModels && (
                    <InfoBlock
                      status={InfoBlockStatus.Warning}
                      title={Messages.models.deleteWarningTitle()}
                    />
                  )}
                </>
              )}

              {modelVersionSet.error && <ErrorText>{modelVersionSet.error.body.message}</ErrorText>}
              {result && result.error && <ErrorText>{result.error.body.message}</ErrorText>}
            </Modal>
          </>
        )}
      </FormContextConsumer>
    </Form>
  );
};
