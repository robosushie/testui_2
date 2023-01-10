import * as React from "react";
import {
  useQuery,
  useMutation,
  DisclosureLink,
  TagsSubForm,
  useConsoleState,
  Panel,
  FormRemoteSubmitButton,
  PanelSize,
} from "oui-savant";
import {
  ErrorText,
  Field,
  TextInput,
  Form,
  FormValues,
  FormErrors,
  FormContextConsumer,
  ToastNotification,
  InfoBlockStatus,
  FormRef,
} from "oui-react";

import * as Messages from "../../../codegen/Messages";
import apiClients from "../../apiClients";
import { validateField, trimDisplayName } from "../../utils/formUtils";
import DialogLoader from "components/DialogLoader/DialogLoader";
import { getHelpLink, MANAGE_JOB_RUNS } from "utils/docUtils";

interface Props {
  closeHandler(): void;
  refresh(): void;
  jobRunId: string;
}

export const JobRunEditPanel: React.FC<Props> = ({ closeHandler, refresh, jobRunId }) => {
  const { activeCompartment } = useConsoleState();
  // Select the current active compartment by default.
  const compartmentId = activeCompartment ? activeCompartment.id : undefined;
  const [ref, setRef] = React.useState<FormRef>(undefined);
  const jobRunQuery = useQuery({
    method: apiClients.odscApi.getJobRun,
    options: { args: { jobRunId } },
  });
  const jobRunReady = !jobRunQuery.error && jobRunQuery.response && jobRunQuery.response.data;
  const jobRun = jobRunReady && jobRunQuery.response.data;
  const tags = jobRun && {
    freeformTags: jobRun.freeformTags,
    definedTags: jobRun.definedTags,
  };
  const getFormRef = (formRef: FormRef): FormRef => {
    setRef(formRef);
    return formRef;
  };

  const { invoke, result, reset } = useMutation({
    method: apiClients.odscApi.updateJobRun,
    onSuccess: () => {
      refresh();
      closeHandler();
      ToastNotification.create({
        title: Messages.jobs.editJobSuccess(result.response.data.displayName),
        status: InfoBlockStatus.Success,
      });
    },
  });

  const onSubmit = (form: Form): void => {
    const values = form.getValues();
    reset();
    invoke({
      jobRunId,
      updateJobRunDetails: {
        displayName: trimDisplayName(values.displayName),
        freeformTags: values.tags.freeformTags,
        definedTags: values.tags.definedTags,
      },
    });
  };

  const validate = (values: FormValues): FormErrors => ({
    displayName: validateField({ value: values.displayName, required: true, maxLen: 255 }),
  });

  return (
    <Form validator={validate} onSubmit={onSubmit} formRef={getFormRef}>
      <FormContextConsumer>
        {() => (
          <>
            {jobRunReady && (
              <Panel
                actions={[
                  <FormRemoteSubmitButton formRef={ref} key={"form_btn_submit"}>
                    {Messages.actions.saveChanges()}
                  </FormRemoteSubmitButton>,
                ]}
                onClose={closeHandler}
                title={Messages.jobRuns.editTitle()}
                size={PanelSize.Large}
                testId="job-run-edit-panel"
                helpLink={getHelpLink(MANAGE_JOB_RUNS)}
              >
                {jobRunQuery.loading && <DialogLoader />}
                {result && result.loading && <DialogLoader />}
                <Field
                  label={Messages.jobRuns.labels.name()}
                  tooltip={Messages.tooltips.editDisplayName()}
                  fieldName="displayName"
                >
                  <TextInput
                    testId="job-run-edit-panel-displayname-input"
                    defaultValue={jobRunReady ? jobRunReady.displayName : undefined}
                  />
                </Field>
                <DisclosureLink>
                  <br />
                  <TagsSubForm
                    defaultValues={tags}
                    showLabel={true}
                    compartmentId={compartmentId}
                  />
                </DisclosureLink>
              </Panel>
            )}
            {jobRunQuery.error && <ErrorText>{jobRunQuery.error.body.message}</ErrorText>}
            {result && result.error && <ErrorText>{result.error.body.message}</ErrorText>}
          </>
        )}
      </FormContextConsumer>
    </Form>
  );
};
