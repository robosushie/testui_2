import * as React from "react";

import {
  ErrorText,
  Modal,
  Form,
  Field,
  TextInput,
  InfoBlock,
  InfoBlockStatus,
  CheckBox,
  FormValues,
  FormErrors,
  ToastNotification,
  FormRef,
  ButtonStyle,
  Button,
  FormInterface,
  FormContextConsumer,
} from "oui-react";
import * as Messages from "../../../codegen/Messages";

import DialogLoader from "components/DialogLoader/DialogLoader";
import { FormattedString, useBulkMutation, useMutation, useQuery } from "oui-savant";
import apiClients from "../../apiClients";
import { getDialogBoxHelpLink, MANAGE_MODELS } from "../../utils/docUtils";
import { validateField } from "utils/formUtils";

interface Props {
  onClose(): void;
  refresh(): void;
  modelDeploymentId: string;
}

export const ModelDeploymentDeleteDialog: React.FC<Props> = ({
  modelDeploymentId,
  onClose,
  refresh,
}) => {
  const [logDetails, setLogDetails] = React.useState(undefined);
  const [checkboxChecked, setCheckboxChecked] = React.useState(false);
  const [error, setError] = React.useState(undefined);
  const [ref, setRef] = React.useState<FormRef>(undefined);

  const modelDeployment = useQuery({
    method: apiClients.odscApi.getModelDeployment,
    options: {
      args: { modelDeploymentId },
    },
  });

  const modelDeploymentReady =
    !modelDeployment.error && modelDeployment.response && modelDeployment.response.data;

  React.useEffect(() => {
    if (modelDeploymentReady && modelDeployment.response.data.categoryLogDetails) {
      setLogDetails(modelDeployment.response.data.categoryLogDetails);
    }
  }, [modelDeployment]);

  const { invoke, result, reset } = useMutation({
    method: apiClients.odscApi.deleteModelDeployment,
    onSuccess: () => {
      refresh();
      onClose();
    },
  });

  const deleteModelDeployment = () => {
    reset();
    invoke({ modelDeploymentId });
  };

  const deleteLogs = useBulkMutation({
    method: apiClients.asyncLoggingApi.deleteLog,
    onSuccess: () => {
      deleteModelDeployment();
    },
  });

  React.useEffect(() => {
    if (deleteLogs && deleteLogs.aggregatedResult) {
      if (deleteLogs.aggregatedResult.error && deleteLogs.results) {
        deleteLogs.results.forEach((result) => {
          if (result.error) {
            setError(result.error);
          }
        });
      }
    }
  }, [deleteLogs]);

  const onSubmit = (): void => {
    if (logDetails && checkboxChecked) {
      const deleteLogsArgs = Object.keys(logDetails).map((key) => {
        return {
          logGroupId: logDetails[key].logGroupId,
          logId: logDetails[key].logId,
        };
      });
      deleteLogs.reset();
      deleteLogs.invoke(deleteLogsArgs);
    } else deleteModelDeployment();
  };

  React.useEffect(() => {
    if (error) {
      ToastNotification.create({
        title: error.body.message,
        status: InfoBlockStatus.Warning,
      });
    }
  }, [error]);

  const aggregatedResultError =
    deleteLogs && deleteLogs.aggregatedResult && deleteLogs.aggregatedResult.error;

  const loading =
    (deleteLogs && deleteLogs.aggregatedResult && deleteLogs.aggregatedResult.loading) ||
    (modelDeployment && modelDeployment.loading) ||
    (result && result.loading);

  const validate = (values: FormValues): FormErrors => ({
    confirmedDelete: validateField({
      value: values.confirmedDelete,
      required: true,
      callback: (value: string) =>
        value.toLowerCase() === modelDeployment.response.data.displayName.toLowerCase(),
    }),
  });

  const getFormRef = (formRef: FormRef): FormRef => {
    setRef(formRef);
    return formRef;
  };

  return (
    <Form onSubmit={onSubmit} validator={validate} formRef={getFormRef}>
      <FormContextConsumer>
        {({ form }) => (
          <Modal
            isOpen={true}
            closeHandler={onClose}
            title={Messages.modelDeployments.deleteTitle()}
            helpLink={getDialogBoxHelpLink(MANAGE_MODELS, "delete-models")}
            footerContent={
              <Button
                onClick={() => {
                  (ref as FormInterface).submitForm(null);
                }}
                buttonStyle={ButtonStyle.Danger}
                disabled={
                  !form.getValue("confirmedDelete") ||
                  !form.isValid() ||
                  modelDeployment.error ||
                  (result && result.error) ||
                  error
                }
              >
                {Messages.modelDeployments.actions.delete()}
              </Button>
            }
          >
            {loading && <DialogLoader />}
            {modelDeploymentReady && (
              <>
                <FormattedString
                  inputText={Messages.modelDeployments.deleteConfirmation(
                    modelDeployment.response.data.displayName
                  )}
                />
                {logDetails && (
                  <>
                    <p>{Messages.modelDeployments.labels.deleteLogs()}</p>
                    <Field
                      label={
                        <FormattedString
                          inputText={Messages.modelDeployments.labels.deleteLogsCheckbox(
                            modelDeployment.response.data.displayName
                          )}
                        />
                      }
                      fieldName="deleteLogsCheckbox"
                    >
                      <CheckBox
                        checked={checkboxChecked}
                        onChange={() => setCheckboxChecked(!checkboxChecked)}
                      />
                    </Field>
                    {aggregatedResultError && (
                      <ErrorText>
                        {Messages.modelDeployments.errorMessages.errorDeletingLog()}
                      </ErrorText>
                    )}
                  </>
                )}
                <Field
                  label={
                    <FormattedString
                      inputText={Messages.modelDeployments.deleteAgreement(
                        modelDeployment.response.data.displayName
                      )}
                    />
                  }
                  fieldName="confirmedDelete"
                >
                  <TextInput autoFocus={true} required={true} />
                </Field>
                <InfoBlock
                  status={InfoBlockStatus.Warning}
                  title={Messages.modelDeployments.deleteWarningTitle()}
                />
              </>
            )}

            {modelDeployment.error && <ErrorText>{modelDeployment.error.body.message}</ErrorText>}
            {result && result.error && <ErrorText>{result.error.body.message}</ErrorText>}
          </Modal>
        )}
      </FormContextConsumer>
    </Form>
  );
};
