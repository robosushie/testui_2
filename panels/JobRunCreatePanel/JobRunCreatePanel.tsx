import * as React from "react";
import {
  Field,
  TextInput,
  NumberInput,
  Form,
  FormValues,
  FormErrors,
  ErrorText,
  FormRef,
  FieldSet,
  ToastNotification,
  InfoBlockStatus,
} from "oui-react";
import {
  useMutation,
  CompartmentSelect,
  useConsoleState,
  TagsSubForm,
  Panel,
  FormRemoteSubmitButton,
  PanelSize,
  SimpleBuilder,
  DisclosureLink,
  NormalError,
} from "oui-savant";
import { push } from "connected-react-router";
import { useDispatch } from "redux-react-hook";
import { getRouteClient } from "loom-plugin-runtime";
import {
  JobLogConfigurationDetails,
  DefaultJobConfigurationDetails,
  Job,
  JobRun,
} from "odsc-client";

import { ResourceNames } from "../../constants/resourceNames";
import apiClients from "../../apiClients";
import DialogLoader from "components/DialogLoader/DialogLoader";
import { validateField, trimDisplayName } from "../../utils/formUtils";
import * as Messages from "../../../codegen/Messages";
import { JobRuntime } from "constants/JobRuntime";
import SelectCard from "components/SelectCard/SelectCard";
import { LoggingPanel } from "panels/LoggingPanel/LoggingPanel";
import { useModalState } from "hooks/useModalState";
import "./JobRunCreatePanel.css";
import { JobUtils } from "utils/JobUtils";
import { getHelpLink } from "utils/docUtils";

interface Props {
  onClose(): void;
  job: Job;
  projectId: string;
  isError: boolean;
}

export const JobRunCreatePanel: React.FC<Props> = ({ onClose, job, projectId, isError }) => {
  const dispatch = useDispatch();
  const { activeCompartment } = useConsoleState();
  // Select the current active compartment by default.
  const [compartmentId, setCompartmentId] = React.useState(
    activeCompartment ? activeCompartment.id : undefined
  );
  const [ref, setRef] = React.useState<FormRef>(undefined);
  const [areMutationsInFlight, setMutationsInFlight] = React.useState(false);
  const [error, setError] = React.useState<NormalError>(undefined);
  const [logSelectTitle, setLogSelectTitle] = React.useState(Messages.jobs.jobRunLoggingTitle());
  const [logSelectLabel, setLogSelectLabel] = React.useState(
    Messages.jobs.labels.jobRunLoggingSelect()
  );
  const [isLoggingOpen, openLogging, closeLogging] = useModalState();
  const [logDetails, setLogDetails] = React.useState<JobLogConfigurationDetails>(
    job.jobLogConfigurationDetails
  );
  const [logGroupName, setLogGroupName] = React.useState(undefined);
  const [logName, setLogName] = React.useState(undefined);

  const getFormRef = (formRef: FormRef): FormRef => {
    setRef(formRef);
    return formRef;
  };

  const getJobOverrideConfiguration = (
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

  const { invoke, result, reset } = useMutation({
    method: apiClients.odscApi.createJobRun,
    onSuccess: (results) => {
      const jobRun = results.response.data as JobRun;
      ToastNotification.create({
        title: Messages.jobRuns.createJobRunSuccess(jobRun.displayName),
        status: InfoBlockStatus.Success,
      });
      const url = getRouteClient().makePluginUrl(`/${ResourceNames.jobRuns}/${jobRun.id}`);
      dispatch(push(url));
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
    const jobConfigurationOverrideDetails = getJobOverrideConfiguration(createJobRunDetails);
    reset();
    invoke({
      createJobRunDetails: {
        projectId,
        jobConfigurationOverrideDetails,
        jobId: job.id,
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

  return (
    <>
      <Form validator={validate} onSubmit={onSubmit} formRef={getFormRef}>
        <Panel
          actions={[
            <FormRemoteSubmitButton formRef={ref} key={"form_btn_submit"} disabled={isError}>
              {Messages.actions.start()}
            </FormRemoteSubmitButton>,
          ]}
          onClose={onClose}
          title={Messages.jobRuns.actions.start()}
          size={PanelSize.Large}
          helpLink={getHelpLink("/job-runs.htm")}
        >
          {areMutationsInFlight && !jobRunMutationError && (
            <DialogLoader message={Messages.actions.starting()} />
          )}
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
            <TextInput testId="job-run-create-display-name-input" />
          </Field>
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
          <FieldSet legend={Messages.jobRuns.labels.jobConfigurationOverride()}>
            <div className="environment-variables">
              <SimpleBuilder
                fieldName="environmentVariables"
                addRowText={Messages.jobs.actions.addEnvironmentVariable()}
              >
                <Field
                  optional={true}
                  label={Messages.jobs.labels.environmentVariableKey()}
                  fieldName="environmentVariableKey"
                  tooltip={JobUtils.getEnvironmentVariableTooltipText()}
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
            </div>
            <Field
              label={Messages.jobs.labels.commandLineArguments()}
              fieldName="commandLineArguments"
              optional={true}
              tooltip={Messages.tooltips.commandlineArguments()}
            >
              <TextInput testId="job-create-command-line-args-input" />
            </Field>
            <Field
              label={Messages.jobs.labels.maxRuntimeInMinutes()}
              hint={Messages.jobs.hints.maxRuntimeInMinutes(JobRuntime.minSize, JobRuntime.maxSize)}
              optional={true}
              tooltip={Messages.tooltips.maximumRuntimeInMinutes()}
              fieldName="maximumRuntimeInMinutes"
            >
              <NumberInput testId="job-create-block-maximum-runtime-input" />
            </Field>
          </FieldSet>
          <DisclosureLink>
            <br />
            <TagsSubForm showLabel={true} compartmentId={compartmentId} />
          </DisclosureLink>
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
