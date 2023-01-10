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
} from "oui-react";
import * as Messages from "../../../codegen/Messages";

import DialogLoader from "components/DialogLoader/DialogLoader";
import { useMutation, useQuery } from "oui-savant";
import apiClients from "../../apiClients";
import { validateField } from "../../utils/formUtils";
import { FormattedString } from "loom-formatted-string-react";
import { getDialogBoxHelpLink, MANAGE_MODELS } from "../../utils/docUtils";

interface Props {
  closeHandler(): void;

  refresh(): void;

  modelId: string;
}

export const ModelDeleteDialog: React.FC<Props> = ({ modelId, closeHandler, refresh }) => {
  const [ref, setRef] = React.useState<FormRef>(undefined);
  const model = useQuery({
    method: apiClients.odscApi.getModel,
    options: {
      args: { modelId },
    },
  });
  const modelReady = !model.error && model.response && model.response.data;
  const DELETE_CONFIRMATION_TEXT = modelReady ? modelReady.displayName : "delete";

  const { invoke, result, reset } = useMutation({
    method: apiClients.odscApi.deleteModel,
    onSuccess: () => {
      refresh();
      closeHandler();
    },
  });

  const onSubmit = (): void => {
    reset();
    invoke({ modelId });
  };

  /**
   * Validate the form data on submit.
   */
  const validate = (values: FormValues): FormErrors => ({
    confirmedDelete: validateField({
      value: values.confirmedDelete,
      required: true,
      callback: (value: string) => value.toLowerCase() === DELETE_CONFIRMATION_TEXT.toLowerCase(),
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
              testId="delete-model-dialog"
              isOpen={true}
              closeHandler={closeHandler}
              title={Messages.models.deleteTitle()}
              helpLink={getDialogBoxHelpLink(MANAGE_MODELS, "delete-models")}
              footerContent={
                <Button
                  onClick={() => {
                    (ref as FormInterface).submitForm(null);
                  }}
                  buttonStyle={ButtonStyle.Danger}
                  disabled={form.getValue("confirmedDelete") === undefined || !form.isValid()}
                >
                  {Messages.models.actions.delete()}
                </Button>
              }
            >
              {model.loading && <DialogLoader />}
              {result && result.loading && <DialogLoader />}

              {modelReady && (
                <>
                  <FormattedString
                    inputText={Messages.models.deleteConfirmation(modelReady.displayName)}
                  />
                  <p />
                  <Field
                    label={
                      <FormattedString
                        inputText={Messages.models.deleteAgreement(DELETE_CONFIRMATION_TEXT)}
                      />
                    }
                    fieldName="confirmedDelete"
                  >
                    <TextInput autoFocus={true} required={true} />
                  </Field>
                  <InfoBlock
                    status={InfoBlockStatus.Warning}
                    title={Messages.models.deleteWarningTitle()}
                  />
                </>
              )}

              {model.error && <ErrorText>{model.error.body.message}</ErrorText>}
              {result && result.error && <ErrorText>{result.error.body.message}</ErrorText>}
            </Modal>
          </>
        )}
      </FormContextConsumer>
    </Form>
  );
};
