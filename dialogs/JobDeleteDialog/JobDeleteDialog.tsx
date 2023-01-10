import * as React from "react";

import {
  TextInput,
  Field,
  ErrorText,
  InfoBlock,
  InfoBlockStatus,
  FormValues,
  FormContextConsumer,
  FormErrors,
  Modal,
  Form,
  ButtonStyle,
  Button,
} from "oui-react";
import * as Messages from "../../../codegen/Messages";

import DialogLoader from "components/DialogLoader/DialogLoader";
import { TimeInterval, useMutation, useQuery } from "oui-savant";
import apiClients from "../../apiClients";
import { validateField } from "../../utils/formUtils";
import { FormattedString } from "loom-formatted-string-react";
import { getDialogBoxHelpLink, MANAGE_JOBS } from "../../utils/docUtils";
import { LifecycleState } from "constants/lifecycleStates";

interface Props {
  closeHandler(): void;
  refresh(): void;
  jobId: string;
}

const CONFIRM_DELETE = "confirmedDelete";

export const JobDeleteDialog: React.FC<Props> = ({ jobId, closeHandler, refresh }) => {
  const [jobDeleteErrorMessage, setJobDeleteErrorMessage] = React.useState("");

  const job = useQuery({
    method: apiClients.odscApi.getJob,
    options: {
      args: { jobId },
      caching: {
        type: "polling",
        pollingInterval: TimeInterval.sm,
      },
    },
  });
  const jobReady = !job.error && job.response && job.response.data;

  const { invoke, result, reset } = useMutation({
    method: apiClients.odscApi.deleteJob,
    onSuccess: () => {
      refresh();
    },
  });

  const lifecycleState = jobReady && jobReady.lifecycleState;

  React.useEffect(() => {
    if (lifecycleState === LifecycleState.DELETED) {
      refresh();
      closeHandler();
    }
    if (result && result.response && lifecycleState === LifecycleState.ACTIVE) {
      refresh();
      setJobDeleteErrorMessage(Messages.jobs.deleteFailed());
    }
  }, [lifecycleState]);

  const onSubmit = (): void => {
    reset();
    setJobDeleteErrorMessage("");
    invoke({ jobId, deleteRelatedJobRuns: true });
  };

  /**
   * Validate the form data on submit.
   */
  const validate = (values: FormValues): FormErrors => ({
    confirmedDelete: validateField({
      value: values.confirmedDelete,
      required: true,
      callback: (value: string) => value.toLowerCase() === jobReady.displayName.toLowerCase(),
    }),
  });

  if (job.loading) {
    return <DialogLoader />;
  }

  return (
    <Form validator={validate} onSubmit={onSubmit}>
      <FormContextConsumer>
        {({ form }) => (
          <Modal
            testId="delete-job-dialog"
            isOpen={true}
            closeHandler={closeHandler}
            title={Messages.jobs.deleteTitle()}
            helpLink={getDialogBoxHelpLink(MANAGE_JOBS, "jobs-delete")}
            footerContent={
              <Button
                disabled={!form.getValue(CONFIRM_DELETE) || !form.isValid()}
                onClick={() => {
                  form.submitForm(null);
                }}
                buttonStyle={ButtonStyle.Danger}
              >
                {Messages.jobs.actions.delete()}
              </Button>
            }
          >
            {jobReady && (
              <>
                <FormattedString
                  inputText={Messages.jobs.deleteConfirmation(jobReady.displayName)}
                />
                <br />
                <br />
                <Field
                  label={
                    <FormattedString
                      inputText={Messages.jobs.deleteAgreement(jobReady.displayName)}
                    />
                  }
                  fieldName={CONFIRM_DELETE}
                >
                  <TextInput autoFocus={true} required={true} />
                </Field>
                <InfoBlock
                  status={InfoBlockStatus.Warning}
                  title={Messages.jobs.deleteWarningTitle()}
                />
              </>
            )}
            {lifecycleState === LifecycleState.DELETING && (
              <DialogLoader message={Messages.jobs.deleteInProgress()} />
            )}
            {job.error && <ErrorText>{job.error.body.message}</ErrorText>}
            {jobDeleteErrorMessage && <ErrorText>{jobDeleteErrorMessage}</ErrorText>}
          </Modal>
        )}
      </FormContextConsumer>
    </Form>
  );
};
