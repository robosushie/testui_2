import * as React from "react";

import { ErrorText, Modal, Button, ButtonStyle } from "oui-react";
import { useQuery, useMutation } from "oui-savant";
import * as Messages from "../../../codegen/Messages";

import DialogLoader from "components/DialogLoader/DialogLoader";
import apiClients from "../../apiClients";
import { FormattedString } from "loom-formatted-string-react";
import { getDataScienceHelpHome } from "../../utils/docUtils";

interface Props {
  closeHandler(): void;
  refresh(): void;
  jobRunId: string;
}

export const JobRunDeleteDialog: React.FC<Props> = ({ jobRunId, closeHandler, refresh }) => {
  const jobRun = useQuery({
    method: apiClients.odscApi.getJobRun,
    options: {
      args: { jobRunId },
    },
  });
  const jobRunReady = !jobRun.error && jobRun.response && jobRun.response.data;

  const { invoke, result, reset } = useMutation({
    method: apiClients.odscApi.deleteJobRun,
    onSuccess: () => {
      refresh();
      closeHandler();
    },
  });

  const onSubmit = (): void => {
    reset();
    invoke({ jobRunId });
  };

  return (
    <Modal
      isOpen={true}
      closeHandler={closeHandler}
      title={Messages.jobRuns.deleteTitle()}
      footerContent={
        <Button onClick={onSubmit} buttonStyle={ButtonStyle.Danger}>
          {Messages.jobRuns.actions.delete()}
        </Button>
      }
      // TODO fill in once docs are created
      helpLink={getDataScienceHelpHome()}
    >
      {jobRun.loading && <DialogLoader />}
      {result && result.loading && <DialogLoader />}
      {jobRunReady && (
        <>
          <FormattedString
            inputText={Messages.jobRuns.deleteConfirmation(jobRunReady.displayName)}
          />
        </>
      )}
      {jobRun.error && <ErrorText>{jobRun.error.body.message}</ErrorText>}
      {result && result.error && <ErrorText>{result.error.body.message}</ErrorText>}
    </Modal>
  );
};
