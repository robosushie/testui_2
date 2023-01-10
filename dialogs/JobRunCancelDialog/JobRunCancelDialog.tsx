import * as React from "react";

import {
  ErrorText,
  Modal,
  Button,
  ButtonStyle,
  FormValues,
  FormErrors,
  Form,
  FormContextConsumer,
  Field,
  TextInput,
} from "oui-react";
import { useQuery, useMutation } from "oui-savant";
import * as Messages from "../../../codegen/Messages";

import DialogLoader from "components/DialogLoader/DialogLoader";
import apiClients from "../../apiClients";
import { FormattedString } from "loom-formatted-string-react";
import { getDialogBoxHelpLink, MANAGE_JOB_RUNS } from "../../utils/docUtils";
import { validateField } from "utils/formUtils";

interface Props {
  closeHandler(): void;
  refresh(): void;
  jobRunId: string;
}

const CONFIRM_CANCEL = "confirmedCancel";

export const JobRunCancelDialog: React.FC<Props> = ({ jobRunId, closeHandler, refresh }) => {
  const jobRun = useQuery({
    method: apiClients.odscApi.getJobRun,
    options: {
      args: { jobRunId },
    },
  });
  const jobRunReady = !jobRun.error && jobRun.response && jobRun.response.data;

  const { invoke, result, reset } = useMutation({
    method: apiClients.odscApi.cancelJobRun,
    onSuccess: () => {
      refresh();
      closeHandler();
    },
  });

  const onSubmit = (): void => {
    reset();
    invoke({ jobRunId });
  };

  /**
   * Validate the form data on submit.
   */
  const validate = (values: FormValues): FormErrors => ({
    confirmedCancel: validateField({
      value: values.confirmedCancel,
      required: true,
      callback: (value: string) => value.toLowerCase() === jobRunReady.displayName.toLowerCase(),
    }),
  });

  return (
    <Form validator={validate} onSubmit={onSubmit}>
      <FormContextConsumer>
        {({ form }) => (
          <Modal
            isOpen={true}
            closeHandler={closeHandler}
            title={Messages.jobRuns.cancelTitle()}
            footerContent={
              <Button
                disabled={!form.getValue(CONFIRM_CANCEL) || !form.isValid()}
                onClick={() => {
                  form.submitForm(null);
                }}
                buttonStyle={ButtonStyle.Primary}
              >
                {Messages.jobRuns.actions.confirm()}
              </Button>
            }
            helpLink={getDialogBoxHelpLink(MANAGE_JOB_RUNS, "jobs-manage-runs__cancel")}
          >
            {jobRun.loading && <DialogLoader />}
            {result && result.loading && <DialogLoader />}
            {jobRunReady && (
              <>
                <FormattedString
                  inputText={Messages.jobRuns.cancelConfirmation(jobRunReady.displayName)}
                />
                <br />
                <br />
                <Field
                  label={
                    <FormattedString
                      inputText={Messages.jobRuns.cancelAgreement(jobRunReady.displayName)}
                    />
                  }
                  fieldName={CONFIRM_CANCEL}
                >
                  <TextInput autoFocus={true} required={true} />
                </Field>
              </>
            )}
            {jobRun.error && <ErrorText>{jobRun.error.body.message}</ErrorText>}
            {result && result.error && <ErrorText>{result.error.body.message}</ErrorText>}
          </Modal>
        )}
      </FormContextConsumer>
    </Form>
  );
};
