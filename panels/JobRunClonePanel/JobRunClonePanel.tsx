import apiClients from "apiClients";
import DialogLoader from "components/DialogLoader/DialogLoader";
import SelectCard from "components/SelectCard/SelectCard";
import { push } from "connected-react-router";
import { JobRuntime } from "constants/JobRuntime";
import { ResourceNames } from "constants/resourceNames";
import { useModalState } from "hooks/useModalState";
import { getRouteClient } from "loom-plugin-runtime";
import {
  DefaultJobConfigurationDetails,
  JobLogConfigurationDetails,
  JobRun,
} from "odsc-client/dist/odsc-client";
import {
  ErrorText,
  Field,
  FieldSet,
  Form,
  FormErrors,
  FormRef,
  FormValues,
  InfoBlockStatus,
  NumberInput,
  TextInput,
  ToastNotification,
} from "oui-react";
import {
  CompartmentSelect,
  DisclosureLink,
  FormRemoteSubmitButton,
  NormalError,
  Panel,
  PanelSize,
  SimpleBuilder,
  TagsSubForm,
  useConsoleState,
  useMutation,
  useQuery,
} from "oui-savant";
import { LoggingPanel } from "panels/LoggingPanel/LoggingPanel";
import * as React from "react";
import { useDispatch } from "redux-react-hook";
import { getDialogBoxHelpLink, MANAGE_JOB_RUNS } from "utils/docUtils";
import { trimDisplayName, validateField } from "utils/formUtils";
import * as Messages from "../../../codegen/Messages";

interface Props {
  originalJobRunId: string;
  refresh(): void;
  closeHandler(): void;
}

export const JobRunClonePanel: React.FC<Props> = ({ originalJobRunId, refresh, closeHandler }) => {
  const jobRunQuery = useQuery({
    method: apiClients.odscApi.getJobRun,
    options: {
      args: { jobRunId: originalJobRunId },
    },
  });
  const originalJobRun = !jobRunQuery.error && jobRunQuery.response && jobRunQuery.response.data;

  const dispatch = useDispatch();
  const { activeCompartment } = useConsoleState();
  // Select the current active compartment by default.
  const [compartmentId, setCompartmentId] = React.useState(
    originalJobRun ? originalJobRun.compartmentId : undefined
  );
  const [ref, setRef] = React.useState<FormRef>(undefined);
  const [areMutationsInFlight, setMutationsInFlight] = React.useState(false);
  const [error, setError] = React.useState<NormalError>(undefined);
  const [logSelectTitle, setLogSelectTitle] = React.useState(Messages.jobs.jobRunLoggingTitle());
  const [logSelectLabel, setLogSelectLabel] = React.useState(Messages.jobs.labels.loggingSelect());
  const [isLoggingOpen, openLogging, closeLogging] = useModalState();
  const [logDetails, setLogDetails] = React.useState<JobLogConfigurationDetails>(
    originalJobRun && originalJobRun.jobLogConfigurationOverrideDetails
  );
  const [logGroupName, setLogGroupName] = React.useState(undefined);
  const [logName, setLogName] = React.useState(undefined);

  const tags = originalJobRun && {
    freeformTags: originalJobRun.freeformTags,
    definedTags: originalJobRun.definedTags,
  };

  const getFormRef = (formRef: FormRef): FormRef => {
    setRef(formRef);
    return formRef;
  };

  React.useEffect(() => {
    if (originalJobRun && !compartmentId) {
      setCompartmentId(originalJobRun.compartmentId);
    }
  }, [originalJobRun]);

  const getJobOverrideConfigurationFromForm = (
    createJobRunDetails: any
  ): DefaultJobConfigurationDetails => {
    const { commandLineArguments, environmentVariables, maximumRuntimeInMinutes } =
      createJobRunDetails;
    // map environment variables into usable object form
    const envVars = Object.fromEntries(
      environmentVariables.map(
        (i: { environmentVariableKey: any; environmentVariableValue: any }) => [
          i.environmentVariableKey,
          i.environmentVariableValue,
        ]
      )
    );

    // make sure we don't override command line args with an empty object
    return environmentVariables.length > 0
      ? {
          commandLineArguments,
          maximumRuntimeInMinutes,
          environmentVariables: envVars,
          jobType: "DEFAULT",
        }
      : {
          commandLineArguments,
          maximumRuntimeInMinutes,
          jobType: "DEFAULT",
        };
  };

  // transform our job run config so we can prepopulate the form
  const getJobOverrideConfigurationFromJobRun = (configOverride: any) => {
    const { commandLineArguments, environmentVariables, maximumRuntimeInMinutes } = configOverride;
    const envVars = [];
    if (environmentVariables) {
      for (const [key, val] of Object.entries(environmentVariables)) {
        envVars.push({ environmentVariableKey: key, environmentVariableValue: val });
      }
    }
    return {
      commandLineArguments,
      maximumRuntimeInMinutes,
      envVars,
    };
  };

  const { invoke, result, reset } = useMutation({
    method: apiClients.odscApi.createJobRun,
    onSuccess: (results) => {
      const clonedJobRun = results.response.data as JobRun;
      ToastNotification.create({
        title: Messages.jobRuns.createJobRunSuccess(clonedJobRun.displayName),
        status: InfoBlockStatus.Success,
      });
      const url = getRouteClient().makePluginUrl(`/${ResourceNames.jobRuns}/${clonedJobRun.id}`);
      dispatch(push(url));
      refresh();
      closeHandler();
    },
  });

  React.useEffect(() => {
    if (result && result.error) {
      setError(result.error);
    }
  }, [result]);

  /**
   * Handle the submit event from the form.
   */
  const onSubmit = (form: Form): void => {
    setMutationsInFlight(true);
    const createJobRunDetails = form.getValues() as any;
    const jobConfigurationOverrideDetails =
      getJobOverrideConfigurationFromForm(createJobRunDetails);
    reset();
    invoke({
      createJobRunDetails: {
        jobConfigurationOverrideDetails,
        projectId: originalJobRun.projectId,
        jobId: originalJobRun.jobId,
        compartmentId: createJobRunDetails.compartmentId,
        displayName: trimDisplayName(createJobRunDetails.displayName),
        freeformTags: createJobRunDetails.tags.freeformTags,
        definedTags: createJobRunDetails.tags.definedTags,
        jobLogConfigurationOverrideDetails: logDetails,
      },
    });
  };

  React.useEffect(() => {
    if (error) {
      ToastNotification.create({
        title: `${error.body.message}`,
        status: InfoBlockStatus.Critical,
      });
    }
  }, [error]);

  const onLoggingSubmit = (newLogDetails: JobLogConfigurationDetails) => {
    setLogDetails(newLogDetails);
    setLogSelectTitle(
      newLogDetails.enableLogging
        ? Messages.loggingConfiguration.loggingEnabled()
        : Messages.loggingConfiguration.loggingDisabled()
    );
    if (newLogDetails.logGroupId) {
      if (newLogDetails.enableAutoLogCreation) {
        setLogSelectLabel(Messages.loggingConfiguration.defaultLogGroupAndAutoLog(logGroupName));
      } else if (newLogDetails.logId) {
        setLogSelectLabel(
          Messages.loggingConfiguration.defaultLogGroupAndLog(logGroupName, logName)
        );
      } else {
        setLogSelectLabel(Messages.loggingConfiguration.defaultLogGroup(logGroupName));
      }
    } else {
      setLogSelectLabel("");
    }
  };

  /**
   * Validate the form data on submit.
   */
  const validate = (values: FormValues): FormErrors => ({
    displayName: validateField({ value: values.displayName, required: false, maxLen: 255 }),
    commandLineArguments: validateField({
      value: values.commandLineArguments,
      required: false,
      maxLen: 4000,
    }),
    maximumRuntimeInMinutes: validateField({
      value: values.maximumRuntimeInMinutes,
      required: false,
      callback: (value: string) =>
        !value ||
        (parseInt(value, 10) &&
          parseInt(value, 10) >= JobRuntime.minSize &&
          parseInt(value, 10) <= JobRuntime.maxSize),
    }),
  });

  const jobRunMutationError = result && result.error;
  const jobRunConfig =
    originalJobRun &&
    getJobOverrideConfigurationFromJobRun(originalJobRun.jobConfigurationOverrideDetails);

  return (
    <>
      <Form validator={validate} onSubmit={onSubmit} formRef={getFormRef}>
        <Panel
          actions={[
            <FormRemoteSubmitButton
              formRef={ref}
              key={"form_btn_submit"}
              disabled={!originalJobRun}
            >
              {Messages.jobRuns.actions.cloneJobRun()}
            </FormRemoteSubmitButton>,
          ]}
          onClose={closeHandler}
          title={Messages.jobRuns.actions.cloneAJobRun()}
          size={PanelSize.Large}
          helpLink={getDialogBoxHelpLink(MANAGE_JOB_RUNS, "jobs-manage-runs__clone")}
        >
          {areMutationsInFlight && !jobRunMutationError && (
            <DialogLoader message={Messages.actions.starting()} />
          )}
          {originalJobRun ? (
            <>
              <CompartmentSelect
                value={compartmentId}
                onChange={(compartment) => setCompartmentId(compartment.id)}
                tooltip={Messages.tooltips.compartmentSelect()}
                label={Messages.jobs.labels.compartment()}
                fieldName="compartmentId"
                testId="job-run-create-compartment-select"
              />
              <Field
                label={Messages.jobs.labels.name()}
                fieldName="displayName"
                tooltip={Messages.tooltips.displayName()}
                optional={true}
              >
                <TextInput
                  testId="job-run-create-display-name-input"
                  defaultValue={originalJobRun && originalJobRun.displayName}
                />
              </Field>

              <FieldSet legend={Messages.jobRuns.labels.jobConfigurationOverride()}>
                <SimpleBuilder
                  fieldName="environmentVariables"
                  addRowText={Messages.jobs.actions.addEnvironmentVariable()}
                  initialBuilderState={jobRunConfig && jobRunConfig.envVars}
                >
                  <Field
                    optional={true}
                    label={Messages.jobs.labels.environmentVariableKey()}
                    fieldName="environmentVariableKey"
                  >
                    <TextInput testId="job-run-create-env-var-key-input" />
                  </Field>
                  <Field
                    optional={true}
                    label={Messages.jobs.labels.environmentVariableValue()}
                    fieldName="environmentVariableValue"
                  >
                    <TextInput testId="job-create-env-var-value-input" />
                  </Field>
                </SimpleBuilder>
                <Field
                  label={Messages.jobs.labels.commandLineArguments()}
                  fieldName="commandLineArguments"
                  optional={true}
                  tooltip={Messages.tooltips.commandlineArguments()}
                >
                  <TextInput
                    testId="job-create-command-line-args-input"
                    defaultValue={jobRunConfig && jobRunConfig.commandLineArguments}
                  />
                </Field>
                <Field
                  label={Messages.jobs.labels.maxRuntimeInMinutes()}
                  hint={Messages.jobs.hints.maxRuntimeInMinutes(
                    JobRuntime.minSize,
                    JobRuntime.maxSize
                  )}
                  optional={true}
                  tooltip={Messages.tooltips.maximumRuntimeInMinutes()}
                  fieldName="maximumRuntimeInMinutes"
                >
                  <NumberInput
                    testId="job-create-block-maximum-runtime-input"
                    defaultValue={jobRunConfig && jobRunConfig.maximumRuntimeInMinutes}
                  />
                </Field>
              </FieldSet>
              <SelectCard
                tooltip={Messages.tooltips.jobRunLogging()}
                fieldName="logging"
                fieldValue={""}
                header={logSelectTitle}
                label={logSelectLabel}
                buttonName={Messages.jobs.actions.select()}
                onButtonClick={openLogging}
                optional={true}
              />
              <DisclosureLink>
                <br />
                <TagsSubForm showLabel={true} compartmentId={compartmentId} defaultValues={tags} />
              </DisclosureLink>
            </>
          ) : (
            <DialogLoader />
          )}
          {result && result.error && <ErrorText>{result.error.body.message}</ErrorText>}
        </Panel>
      </Form>
      {isLoggingOpen && (
        <LoggingPanel
          activeCompartment={activeCompartment}
          onClose={closeLogging}
          onLoggingSubmit={onLoggingSubmit}
          defaultValues={
            logDetails && {
              enableLogging: logDetails.enableLogging,
              enableAutoLogCreation: logDetails.enableAutoLogCreation,
              logGroupId: logDetails.logGroupId,
              logId: logDetails.logId,
            }
          }
          setLogGroupName={setLogGroupName}
          setLogName={setLogName}
        />
      )}
    </>
  );
};
