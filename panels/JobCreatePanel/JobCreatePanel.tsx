import * as React from "react";
import {
  Field,
  TextInput,
  NumberInput,
  Form,
  FormValues,
  FormErrors,
  ErrorText,
  Textarea,
  FormRef,
  FormContextConsumer,
  ToastNotification,
  InfoBlockStatus,
  FieldSet,
  CheckBox,
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
  NormalError,
  DisclosureLink,
  useQuery,
  useWhitelist,
} from "oui-savant";
import { push } from "connected-react-router";
import { useDispatch } from "redux-react-hook";
import { getRouteClient } from "loom-plugin-runtime";
import {
  DefaultJobConfigurationDetails,
  FastLaunchJobConfigSummary,
  Job,
  JobLogConfigurationDetails,
  JobShapeConfigDetails,
  JobShapeSummary,
  ManagedEgressStandaloneJobInfrastructureConfigurationDetails,
  StandaloneJobInfrastructureConfigurationDetails,
} from "odsc-client";
import { ResourceNames } from "../../constants/resourceNames";
import apiClients from "../../apiClients";
import DialogLoader from "components/DialogLoader/DialogLoader";
import { validateField, trimDisplayName, isValidShape } from "../../utils/formUtils";
import * as Messages from "../../../codegen/Messages";
import { JobsBlockStorageSize } from "../../constants/blockStorage";
import { JobRuntime } from "constants/JobRuntime";
import { ArtifactSize } from "../../constants/artifact";
import { eventEmitter, UPLOAD_EVENT } from "dialogs/ModelCreateDialog/ModelCreateDialog";
import SelectCard from "components/SelectCard/SelectCard";
import { useModalState } from "hooks/useModalState";
import { JobComputePanel } from "panels/JobComputePanel/JobComputePanel";
import {
  JobInfrastructureConfigurationDetailsJobInfrastructureTypeEnum,
  JobUtils,
} from "utils/JobUtils";
import { LoggingPanel } from "panels/LoggingPanel/LoggingPanel";
import { JobArtifactUpload } from "components/JobArtifactUpload/JobArtifactUpload";
import "./JobCreatePanel.css";
import { getHelpLink } from "../../utils/docUtils";
import { ComputeShapeConfigEnum } from "constants/computeShapeConfig";
import {
  JOBS_FAST_LAUNCH_ENABLED_WHITELIST,
  JOBS_FLEX_A1_ENABLED_WHITELIST,
  JOBS_MANAGED_EGRESS_ENABLED_WHITELIST,
} from "../../pluginConstants";
import { NetworkingTypeEnum } from "constants/networkingTypeEnum";
import NetworkingResources from "components/NetworkingResources/NetworkingResources";
import JobComputeShape from "components/JobComputeShape/JobComputeShape";
import { defaultFlexShapeDetails } from "utils/flexShapeUtil";
import { getDefaultComputeWhitelists } from "utils/shapeUtils";

interface Props {
  onClose(): void;
  projectId: string;
  isError: boolean;
}

export const JobCreatePanel: React.FC<Props> = ({ onClose, projectId, isError }) => {
  const dispatch = useDispatch();
  const { activeCompartment } = useConsoleState();
  // Select the current active compartment by default.
  const [compartmentId, setCompartmentId] = React.useState(
    activeCompartment ? activeCompartment.id : undefined
  );
  const [selectedFile, setSelectedFile] = React.useState(undefined);
  const [isArtifactMutationComplete, setArtifactMutationComplete] = React.useState(false);
  const [ref, setRef] = React.useState<FormRef>(undefined);
  const [areMutationsInFlight, setMutationsInFlight] = React.useState(false);
  const [error, setError] = React.useState<NormalError>(undefined);
  const [defaultVmShape, setDefaultVmShape] = React.useState<JobShapeSummary>(undefined);
  const [defaultFastLaunchShape, setDefaultFastLaunchShape] =
    React.useState<JobShapeSummary>(undefined);
  const [defaultCustomConfigShape, setDefaultCustomConfigShape] =
    React.useState<JobShapeSummary>(undefined);
  const [defaultFastLaunchConfig, setDefaultFastLaunchConfig] =
    React.useState<FastLaunchJobConfigSummary>(undefined);
  const [vmShapes, setVmShapes] = React.useState<JobShapeSummary[]>(undefined);
  const [fastLaunchVmShapes, setFastLaunchVmShapes] = React.useState<JobShapeSummary[]>(undefined);
  const [isComputePanelOpen, openComputePanel, closeComputePanel] = useModalState();
  const [shapeConfigurationDetails, setShapeConfigurationDetails] =
    React.useState<JobShapeConfigDetails>(defaultFlexShapeDetails);
  const [logSelectTitle, setLogSelectTitle] = React.useState(
    Messages.loggingConfiguration.loggingTitle()
  );
  const [logSelectLabel, setLogSelectLabel] = React.useState(Messages.jobs.labels.loggingSelect());
  const [isLoggingOpen, openLogging, closeLogging] = useModalState();
  const [logDetails, setLogDetails] = React.useState<JobLogConfigurationDetails>(undefined);
  const [logGroupName, setLogGroupName] = React.useState(undefined);
  const [logName, setLogName] = React.useState(undefined);
  const [shapeConfigValue, setShapeConfigValue] = React.useState<ComputeShapeConfigEnum>(
    ComputeShapeConfigEnum.CUSTOM_CONFIGURATION
  );
  const isFastLaunch = shapeConfigValue === ComputeShapeConfigEnum.FAST_LAUNCH;
  const [isFastLaunchEnabled] = useWhitelist(JOBS_FAST_LAUNCH_ENABLED_WHITELIST);
  const [isManagedEgressEnabled] = useWhitelist(JOBS_MANAGED_EGRESS_ENABLED_WHITELIST);
  const [isFlexA1Enabled] = useWhitelist(JOBS_FLEX_A1_ENABLED_WHITELIST);
  const whitelist = getDefaultComputeWhitelists(!!isFlexA1Enabled);
  const [networkType, setNetworkType] = React.useState<NetworkingTypeEnum>(
    NetworkingTypeEnum.CUSTOM_NETWORKING
  );
  const [byocEnabled, setByocEnabled] = React.useState(false);
  const isManagedEgress = networkType === NetworkingTypeEnum.DEFAULT_NETWORKING;
  const getFormRef = (formRef: FormRef): FormRef => {
    setRef(formRef);
    return formRef;
  };
  const managedEgressRadioGroupOptions = () => JobUtils.getManagedEgressRadioButtonOptions();
  // currently, we only support default job configuration
  const getJobConfiguration = (createJobDetails: any): DefaultJobConfigurationDetails => {
    const {
      commandLineArguments,
      environmentVariables,
      byocEnvironmentVariableKey,
      byocEnvironmentVariableValue,
      maximumRuntimeInMinutes,
    } = createJobDetails;
    const byocEnvironmentVariables: { [key: string]: string } = {};
    byocEnvironmentVariables[byocEnvironmentVariableKey] = byocEnvironmentVariableValue;
    const envVars = Object.fromEntries(
      environmentVariables.map(
        (i: { environmentVariableKey: any; environmentVariableValue: any }) => [
          i.environmentVariableKey,
          i.environmentVariableValue,
        ]
      )
    );
    const combinedEnvars = { ...byocEnvironmentVariables, ...envVars };
    return {
      commandLineArguments,
      maximumRuntimeInMinutes,
      environmentVariables: combinedEnvars,
      jobType: "DEFAULT",
    };
  };

  // currently, we only support standalone job infrastructure configuration
  const getJobInfrastructureConfiguration = (
    createJobDetails: any
  ):
    | StandaloneJobInfrastructureConfigurationDetails
    | ManagedEgressStandaloneJobInfrastructureConfigurationDetails => {
    if (isManagedEgress) {
      return {
        jobInfrastructureType:
          JobInfrastructureConfigurationDetailsJobInfrastructureTypeEnum.ME_STANDALONE,
        shapeName: createJobDetails.shape,
        blockStorageSizeInGBs: createJobDetails.blockStorageSize,
        jobShapeConfigDetails: JobUtils.getJobShapeConfigDetails(
          defaultVmShape,
          shapeConfigurationDetails
        ),
      } as ManagedEgressStandaloneJobInfrastructureConfigurationDetails;
    } else {
      return {
        jobInfrastructureType:
          JobInfrastructureConfigurationDetailsJobInfrastructureTypeEnum.STANDALONE,
        shapeName: createJobDetails.shape,
        subnetId: createJobDetails.subnetId,
        blockStorageSizeInGBs: createJobDetails.blockStorageSize,
        jobShapeConfigDetails: JobUtils.getJobShapeConfigDetails(
          defaultVmShape,
          shapeConfigurationDetails
        ),
      } as StandaloneJobInfrastructureConfigurationDetails;
    }
  };

  /**
   * The first mutation.
   */
  const jobMutation = useMutation({
    method: apiClients.odscApi.createJob,
    onSuccess: (result) => {
      callCreateArtifact(result.response.data.id);
    },
  });
  const { result } = jobMutation;
  /**
   * The second mutation.
   */
  const callCreateArtifact = (jobId: string): void => {
    // using the event emitter already defined and exported in model create
    eventEmitter.emit(UPLOAD_EVENT, jobId, ResourceNames.jobs);
  };

  React.useEffect(() => {
    if (result && result.error) {
      setError(result.error);
    } else if ((byocEnabled && result?.response) || (result && isArtifactMutationComplete)) {
      setMutationsInFlight(false);
      const job = result && (result.response.data as Job);
      const url = getRouteClient().makePluginUrl(`/${ResourceNames.jobs}/${job.id}`);
      dispatch(push(url));
    }
  }, [result, isArtifactMutationComplete, byocEnabled]);

  /**
   * Handle the submit event from the form.
   */
  const onSubmit = (form: Form): void => {
    setMutationsInFlight(true);
    const createJobDetails = form.getValues() as any;
    const jobConfigurationDetails = getJobConfiguration(createJobDetails);
    const jobInfrastructureConfigurationDetails =
      getJobInfrastructureConfiguration(createJobDetails);
    jobMutation.reset();
    jobMutation.invoke({
      createJobDetails: {
        projectId,
        jobConfigurationDetails,
        jobInfrastructureConfigurationDetails,
        compartmentId: createJobDetails.compartmentId,
        displayName: trimDisplayName(createJobDetails.displayName),
        description: createJobDetails.description,
        freeformTags: createJobDetails.tags.freeformTags,
        definedTags: createJobDetails.tags.definedTags,
        jobLogConfigurationDetails: logDetails,
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

  // Set default to default networking IF managed egress is enabled
  // Set default to fast launch IF fast launch is enabled
  React.useEffect(() => {
    if (isManagedEgressEnabled) {
      setNetworkType(NetworkingTypeEnum.DEFAULT_NETWORKING);
    }
    if (isFastLaunchEnabled && fastLaunchVmShapes) {
      setShapeConfigValue(ComputeShapeConfigEnum.FAST_LAUNCH);
    }
  }, [isManagedEgressEnabled, isFastLaunchEnabled, fastLaunchVmShapes]);

  const validate = React.useCallback(
    (values: FormValues): FormErrors => ({
      displayName: validateField({ value: values.displayName, required: false, maxLen: 255 }),
      description: validateField({ value: values.description, required: false, maxLen: 400 }),
      ...(byocEnabled
        ? {}
        : {
            jobArtifact: validateField({
              value: values.jobArtifact,
              required: true,
              callback: (value: File) => value.size <= ArtifactSize.maxSizeBytes,
            }),
          }),
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
      blockStorageSize: validateField({
        value: values.blockStorageSize,
        required: true,
        callback: (value: string) =>
          parseInt(value, 10) &&
          parseInt(value, 10) >= JobsBlockStorageSize.minSize &&
          parseInt(value, 10) <= JobsBlockStorageSize.maxSize,
      }),
      compute: validateField({
        value: values.shape,
        callback: (value: string) => isValidShape(value).isValid,
        callbackMessage: isValidShape(values.shape).errorMessage,
      }),
      vcnId: validateField({ value: values.vcnId, required: !isManagedEgressEnabled }),
      subnetId: validateField({ value: values.subnetId, required: !isManagedEgressEnabled }),
      byocEnvironmentVariableValue: validateField({
        value: values.byocEnvironmentVariableValue,
        required: byocEnabled,
      }),
    }),
    [byocEnabled]
  );

  const onComputeSubmit = (
    shape: JobShapeSummary,
    newShapeConfigurationDetails: JobShapeConfigDetails
  ) => {
    setDefaultVmShape(shape);
    setShapeConfigurationDetails(newShapeConfigurationDetails);
    closeComputePanel();
  };

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

  const jobMutationError = jobMutation.result && jobMutation.result.error;

  // get compute shapes to fill in default shape value
  const shapeQuery = useQuery({
    method: apiClients.odscApi.listJobShapes,
    options: {
      args: {
        compartmentId,
      },
    },
  });
  // get compute shapes to fill in default fast launch shape value
  const fastLaunchJobConfigsQuery = useQuery({
    method: apiClients.odscApi.listFastLaunchJobConfigs,
    options: {
      args: {
        compartmentId,
      },
    },
  });
  // set shape to the first result that comes back
  React.useEffect(() => {
    const shapes =
      shapeQuery && !shapeQuery.error && !shapeQuery.loading ? shapeQuery.response.data : [];
    if (shapes.length > 0 && !defaultVmShape) {
      setDefaultVmShape(shapes[0]);
      setDefaultCustomConfigShape(shapes[0]);
      setVmShapes(shapes);
    }
    if (isFastLaunchEnabled) {
      const fastLaunchConfigs =
        fastLaunchJobConfigsQuery &&
        !fastLaunchJobConfigsQuery.error &&
        !fastLaunchJobConfigsQuery.loading
          ? fastLaunchJobConfigsQuery.response.data
          : [];
      if (fastLaunchConfigs.length > 0 && !defaultFastLaunchConfig) {
        const fastLaunchConfig = fastLaunchConfigs[0];
        setDefaultFastLaunchConfig(fastLaunchConfig);
        const shapeSummary = {
          name: fastLaunchConfig.shapeName,
          coreCount: fastLaunchConfig.coreCount,
          memoryInGBs: fastLaunchConfig.memoryInGBs,
          shapeSeries: fastLaunchConfig.shapeSeries,
        };
        setDefaultFastLaunchShape(shapeSummary);
        const fastLaunchShapes = fastLaunchConfigs.map((config): JobShapeSummary => {
          return {
            name: config.shapeName,
            coreCount: config.coreCount,
            memoryInGBs: config.memoryInGBs,
            shapeSeries: config.shapeSeries,
          };
        });
        setFastLaunchVmShapes(fastLaunchShapes);
      }
    }
  }, [shapeQuery, fastLaunchJobConfigsQuery]);

  return (
    <>
      <Form validator={validate} onSubmit={onSubmit} formRef={getFormRef}>
        <FormContextConsumer>
          {() => (
            <Panel
              actions={[
                <FormRemoteSubmitButton formRef={ref} key={"form_btn_submit"} disabled={isError}>
                  {Messages.actions.create()}
                </FormRemoteSubmitButton>,
              ]}
              onClose={onClose}
              title={Messages.jobs.createTitle()}
              size={PanelSize.Large}
              helpLink={getHelpLink("/jobs-create.htm")}
            >
              {areMutationsInFlight && !jobMutationError && (
                <DialogLoader message={Messages.actions.creating()} />
              )}
              <CompartmentSelect
                value={compartmentId}
                onChange={(compartment) => setCompartmentId(compartment.id)}
                tooltip={Messages.tooltips.compartmentSelect()}
                label={Messages.jobs.labels.compartment()}
                fieldName="compartmentId"
                testId="job-create-compartment-select"
              />
              <Field
                label={Messages.jobs.labels.name()}
                fieldName="displayName"
                tooltip={Messages.tooltips.displayName()}
                optional={true}
              >
                <TextInput testId="job-create-display-name-input" />
              </Field>
              <Field
                label={Messages.jobs.labels.description()}
                optional={true}
                fieldName="description"
              >
                <Textarea rows={4} />
              </Field>
              <FieldSet legend={Messages.jobs.labels.defaultConfiguration()}>
                <Field
                  label={Messages.jobs.bringYourOwnContainer()}
                  fieldName="jobConfigurationDetails"
                  tooltip={Messages.tooltips.jobsBYOCEnvVar()}
                >
                  <CheckBox
                    checked={byocEnabled}
                    onChange={() => {
                      setByocEnabled(!byocEnabled);
                    }}
                  />
                </Field>

                <div className="environment-variables">
                  {byocEnabled && (
                    <div className="byoc-variable">
                      <div className="byoc-variable-child">
                        <Field
                          optional={false}
                          label={Messages.jobs.labels.byocVariableKey()}
                          fieldName="byocEnvironmentVariableKey"
                          tooltip={JobUtils.getJobTooltipText()}
                        >
                          <TextInput
                            testId="job-create-env-var-key-input"
                            value="CONTAINER_CUSTOM_IMAGE"
                            required={true}
                          />
                        </Field>
                      </div>
                      <div className="byoc-variable-child">
                        <Field
                          optional={false}
                          label={Messages.jobs.labels.environmentVariableValue()}
                          fieldName="byocEnvironmentVariableValue"
                        >
                          <TextInput testId="job-create-env-var-value-input" required={true} />
                        </Field>
                      </div>
                    </div>
                  )}
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
                      <TextInput testId="job-create-env-var-key-input" />
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
                  hint={Messages.jobs.hints.maxRuntimeInMinutes(
                    JobRuntime.minSize,
                    JobRuntime.maxSize
                  )}
                  optional={true}
                  tooltip={Messages.tooltips.maximumRuntimeInMinutes()}
                  fieldName="maximumRuntimeInMinutes"
                >
                  <NumberInput testId="job-create-maximum-runtime-input" />
                </Field>
              </FieldSet>
              <div className={`${byocEnabled && "disable-artifact-upload"}`}>
                <JobArtifactUpload
                  selectedFile={selectedFile}
                  setSelectedFile={setSelectedFile}
                  onUploadFinished={() => setArtifactMutationComplete(true)}
                />
              </div>

              <JobComputeShape
                defaultVmShape={defaultVmShape}
                openCompute={openComputePanel}
                isFastLaunch={isFastLaunch}
                setDefaultVmShape={setDefaultVmShape}
                defaultFastLaunchShape={defaultFastLaunchShape}
                defaultCustomConfigShape={defaultCustomConfigShape}
                shapeConfigValue={shapeConfigValue}
                setShapeConfigValue={setShapeConfigValue}
                shapeConfigurationDetails={shapeConfigurationDetails}
              />
              <SelectCard
                fieldName="logging"
                fieldValue={""}
                header={logSelectTitle}
                label={logSelectLabel}
                buttonName={Messages.jobs.actions.select()}
                onButtonClick={openLogging}
                optional={true}
              />
              <Field
                label={Messages.jobs.labels.additionalStorage()}
                hint={Messages.jobs.hints.storageHint(
                  JobsBlockStorageSize.minSize,
                  JobsBlockStorageSize.maxSize
                )}
                fieldName="blockStorageSize"
              >
                <NumberInput testId="job-create-block-storage-size-input" required={true} />
              </Field>
              <NetworkingResources
                activeCompartment={activeCompartment}
                networkType={networkType}
                setNetworkType={setNetworkType}
                isManagedEgressEnabled={isManagedEgressEnabled}
                managedEgressRadioGroupOptions={managedEgressRadioGroupOptions}
              />
              <DisclosureLink>
                <br />
                <TagsSubForm showLabel={true} compartmentId={compartmentId} />
              </DisclosureLink>
              {result && result.error && <ErrorText>{result.error.body.message}</ErrorText>}
            </Panel>
          )}
        </FormContextConsumer>
      </Form>
      {isComputePanelOpen && (
        <JobComputePanel
          preselectedVmShape={defaultVmShape}
          shapes={isFastLaunch ? fastLaunchVmShapes : vmShapes}
          defaultShapeConfigurationDetails={shapeConfigurationDetails}
          onComputeDataSubmit={onComputeSubmit}
          onClose={closeComputePanel}
          shapeUseQuery={shapeQuery}
          whitelistOverride={whitelist}
        />
      )}
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
