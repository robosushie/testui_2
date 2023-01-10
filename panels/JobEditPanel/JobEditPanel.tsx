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
} from "oui-react";
import {
  useMutation,
  useConsoleState,
  TagsSubForm,
  Panel,
  FormRemoteSubmitButton,
  PanelSize,
  useQuery,
  DisclosureLink,
  NormalError,
  useWhitelist,
  FormattedString,
} from "oui-savant";
import {
  Job,
  JobShapeSummary,
  StandaloneJobInfrastructureConfigurationDetails,
  FastLaunchJobConfigSummary,
  ManagedEgressStandaloneJobInfrastructureConfigurationDetails,
  JobShapeConfigDetails,
} from "odsc-client";

import apiClients from "../../apiClients";
import DialogLoader from "components/DialogLoader/DialogLoader";
import { validateField, trimDisplayName, isValidShape } from "../../utils/formUtils";
import * as Messages from "../../../codegen/Messages";
import { VcnSubnetFields } from "components/VcnSubnetFields/VcnSubnetFields";
import { JobsBlockStorageSize } from "../../constants/blockStorage";
import { useModalState } from "hooks/useModalState";
import { JobComputePanel } from "panels/JobComputePanel/JobComputePanel";
import {
  JobInfrastructureConfigurationDetailsJobInfrastructureTypeEnum,
  JobUtils,
} from "utils/JobUtils";
import { getDialogBoxHelpLink, MANAGE_JOBS } from "utils/docUtils";
import { ComputeShapeConfigEnum } from "constants/computeShapeConfig";
import {
  JOBS_FAST_LAUNCH_ENABLED_WHITELIST,
  JOBS_FLEX_A1_ENABLED_WHITELIST,
  JOBS_MANAGED_EGRESS_ENABLED_WHITELIST,
} from "../../pluginConstants";
import JobComputeShape from "components/JobComputeShape/JobComputeShape";
import { isFlexShape } from "utils/flexShapeUtil";
import { getDefaultComputeWhitelists } from "utils/shapeUtils";

interface Props {
  onClose(): void;
  jobId: string;
  refresh(): void;
  isError: boolean;
}

export const JobEditPanel: React.FC<Props> = ({ onClose, jobId, refresh, isError }) => {
  const { activeCompartment, compartments } = useConsoleState();
  // Select the current active compartment by default.
  const compartmentId = activeCompartment ? activeCompartment.id : undefined;
  const [ref, setRef] = React.useState<FormRef>(undefined);
  const [areMutationsInFlight, setMutationsInFlight] = React.useState(false);
  const [error, setError] = React.useState<NormalError>(undefined);
  const [job, setJob] = React.useState<Job>(undefined);
  const [defaultVmShape, setDefaultVmShape] = React.useState<JobShapeSummary>(undefined);
  const [defaultFastLaunchShape, setDefaultFastLaunchShape] =
    React.useState<JobShapeSummary>(undefined);
  const [defaultCustomConfigShape, setDefaultCustomConfigShape] =
    React.useState<JobShapeSummary>(undefined);
  const [defaultFastLaunchConfig, setDefaultFastLaunchConfig] =
    React.useState<FastLaunchJobConfigSummary>(undefined);
  const [shapeConfigurationDetails, setShapeConfigurationDetails] =
    React.useState<JobShapeConfigDetails>(undefined);
  const [vmShapes, setVmShapes] = React.useState<JobShapeSummary[]>(undefined);
  const [fastLaunchVmShapes, setFastLaunchVmShapes] = React.useState<JobShapeSummary[]>(undefined);
  const [isComputeOpen, openCompute, closeCompute] = useModalState();
  const [shapeConfigValue, setShapeConfigValue] = React.useState<ComputeShapeConfigEnum>(
    ComputeShapeConfigEnum.CUSTOM_CONFIGURATION
  );
  const isFastLaunch = shapeConfigValue === ComputeShapeConfigEnum.FAST_LAUNCH;
  const [isFastLaunchEnabled] = useWhitelist(JOBS_FAST_LAUNCH_ENABLED_WHITELIST);
  const [isManagedEgressEnabled] = useWhitelist(JOBS_MANAGED_EGRESS_ENABLED_WHITELIST);
  const [isFlexA1Enabled] = useWhitelist(JOBS_FLEX_A1_ENABLED_WHITELIST);
  const whitelist = getDefaultComputeWhitelists(!!isFlexA1Enabled);

  const jobQuery = useQuery({
    method: apiClients.odscApi.getJob,
    options: {
      args: { jobId },
    },
  });

  React.useEffect(() => {
    const jobResult =
      jobQuery && !jobQuery.error && !jobQuery.loading ? jobQuery.response.data : undefined;
    if (jobQuery && jobQuery.error) {
      setError(jobQuery.error);
    }
    if (!job) {
      setJob(jobResult);
    }
  }, [jobQuery]);

  const getFormRef = (formRef: FormRef): FormRef => {
    setRef(formRef);
    return formRef;
  };

  const isManagedEgress =
    jobQuery &&
    !jobQuery.error &&
    !jobQuery.loading &&
    jobQuery.response.data.jobInfrastructureConfigurationDetails.jobInfrastructureType ===
      JobInfrastructureConfigurationDetailsJobInfrastructureTypeEnum.ME_STANDALONE;
  const getJobInfrastructureConfigurationFromForm = (
    updateJobDetails: any
  ):
    | StandaloneJobInfrastructureConfigurationDetails
    | ManagedEgressStandaloneJobInfrastructureConfigurationDetails => {
    if (isManagedEgress) {
      return {
        jobInfrastructureType:
          JobInfrastructureConfigurationDetailsJobInfrastructureTypeEnum.ME_STANDALONE,
        shapeName: updateJobDetails.shape,
        blockStorageSizeInGBs: updateJobDetails.blockStorageSize,
        jobShapeConfigDetails: JobUtils.getJobShapeConfigDetails(
          defaultVmShape,
          shapeConfigurationDetails
        ),
      } as ManagedEgressStandaloneJobInfrastructureConfigurationDetails;
    } else {
      return {
        jobInfrastructureType:
          JobInfrastructureConfigurationDetailsJobInfrastructureTypeEnum.STANDALONE,
        shapeName: updateJobDetails.shape,
        subnetId: updateJobDetails.subnetId,
        blockStorageSizeInGBs: updateJobDetails.blockStorageSize,
        jobShapeConfigDetails: JobUtils.getJobShapeConfigDetails(
          defaultVmShape,
          shapeConfigurationDetails
        ),
      } as StandaloneJobInfrastructureConfigurationDetails;
    }
  };

  const getJobInfrastructureConfigurationFromJob = (
    jobInfraConfiguration: any
  ):
    | StandaloneJobInfrastructureConfigurationDetails
    | ManagedEgressStandaloneJobInfrastructureConfigurationDetails => {
    if (isManagedEgress) {
      return {
        jobInfrastructureType:
          JobInfrastructureConfigurationDetailsJobInfrastructureTypeEnum.ME_STANDALONE,
        shapeName: jobInfraConfiguration.shapeName,
        blockStorageSizeInGBs: jobInfraConfiguration.blockStorageSizeInGBs,
        jobShapeConfigDetails: jobInfraConfiguration.jobShapeConfigDetails,
      } as ManagedEgressStandaloneJobInfrastructureConfigurationDetails;
    } else {
      return {
        jobInfrastructureType:
          JobInfrastructureConfigurationDetailsJobInfrastructureTypeEnum.STANDALONE,
        shapeName: jobInfraConfiguration.shapeName,
        subnetId: jobInfraConfiguration.subnetId,
        blockStorageSizeInGBs: jobInfraConfiguration.blockStorageSizeInGBs,
        jobShapeConfigDetails: jobInfraConfiguration.jobShapeConfigDetails,
      } as StandaloneJobInfrastructureConfigurationDetails;
    }
  };

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
    if (!defaultVmShape && job) {
      const shape = getShape(jobInfraConfiguration.shapeName);
      setDefaultVmShape(shape);
      setDefaultCustomConfigShape(shape);
    }
    const shapes =
      shapeQuery && !shapeQuery.error && !shapeQuery.loading ? shapeQuery.response.data : [];
    if (shapes.length > 0 && !vmShapes) {
      setVmShapes(shapes);
    }
    if (!shapeConfigurationDetails && job) {
      if (isFlexShape(jobInfraConfiguration.shapeName)) {
        const flexConfig: JobShapeConfigDetails = {
          ocpus: JobUtils.getOcpus(jobInfraConfiguration),
          memoryInGBs: JobUtils.getMemoryInGBs(jobInfraConfiguration),
        };
        setShapeConfigurationDetails(flexConfig);
      }
    }
  }, [shapeQuery, job]);

  // set the fast launch radio value and default shape
  React.useEffect(() => {
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
        if (jobQuery && jobQuery.response.data) {
          const infraDetails: StandaloneJobInfrastructureConfigurationDetails = jobQuery.response
            .data
            .jobInfrastructureConfigurationDetails as StandaloneJobInfrastructureConfigurationDetails;
          fastLaunchConfigs.forEach((config) => {
            if (infraDetails.shapeName === config.shapeName) {
              setShapeConfigValue(ComputeShapeConfigEnum.FAST_LAUNCH);
            }
          });
        }
      }
    }
  }, [jobQuery, fastLaunchJobConfigsQuery]);

  /**
   * The first mutation.
   */
  const jobMutation = useMutation({
    method: apiClients.odscApi.updateJob,
    onSuccess: () => {
      setMutationsInFlight(false);
      refresh();
      onClose();
      ToastNotification.create({
        title: Messages.jobs.editJobSuccess(job.displayName),
        status: InfoBlockStatus.Success,
      });
    },
  });
  const { result } = jobMutation;

  /**
   * Handle the submit event from the form.
   */
  const onSubmit = (form: Form): void => {
    setMutationsInFlight(true);
    const updateJobDetails = form.getValues() as any;
    const jobInfrastructureConfigurationDetails =
      getJobInfrastructureConfigurationFromForm(updateJobDetails);
    jobMutation.reset();
    jobMutation.invoke({
      jobId,
      updateJobDetails: {
        jobInfrastructureConfigurationDetails,
        displayName: trimDisplayName(updateJobDetails.displayName),
        description: updateJobDetails.description,
        freeformTags: updateJobDetails.tags.freeformTags,
        definedTags: updateJobDetails.tags.definedTags,
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

  const validate = (values: FormValues): FormErrors => ({
    displayName: validateField({ value: values.displayName, required: false, maxLen: 255 }),
    description: validateField({ value: values.description, required: false, maxLen: 400 }),
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
  });

  const getShape = (shapeName: string): JobShapeSummary => {
    const shapes =
      shapeQuery && !shapeQuery.error && !shapeQuery.loading ? shapeQuery.response.data : [];
    for (const shape of shapes) {
      if (shape.name === shapeName) {
        return shape;
      }
    }
    return undefined;
  };

  const onComputeSubmit = (
    shape: JobShapeSummary,
    newShapeConfigurationDetails: JobShapeConfigDetails
  ) => {
    setDefaultVmShape(shape);
    setShapeConfigurationDetails(newShapeConfigurationDetails);
    closeCompute();
  };

  const jobInfraConfiguration =
    job && getJobInfrastructureConfigurationFromJob(job.jobInfrastructureConfigurationDetails);
  const tags = job && {
    freeformTags: job.freeformTags,
    definedTags: job.definedTags,
  };
  const subnet =
    !(isManagedEgressEnabled && isManagedEgress) &&
    useQuery({
      wait: !job,
      method: apiClients.virtualNetworkApi.getSubnet,
      options: {
        args: job && {
          subnetId: (jobInfraConfiguration as StandaloneJobInfrastructureConfigurationDetails)
            .subnetId,
        },
      },
    });
  const subnetReady = !subnet.error && subnet.response && subnet.response.data;

  const vcn =
    !(isManagedEgressEnabled && isManagedEgress) &&
    useQuery({
      wait: !subnetReady,
      method: apiClients.virtualNetworkApi.getVcn,
      options: {
        args: subnetReady && { vcnId: subnet.response.data.vcnId },
      },
    });
  const vcnReady = !vcn.error && vcn.response && vcn.response.data;

  const subnetCompartment =
    subnetReady && compartments.find((compartment) => compartment.id === subnetReady.compartmentId);
  const vcnCompartment =
    vcnReady && compartments.find((compartment) => compartment.id === vcnReady.compartmentId);

  const defaultValues = {
    displayName: job && job.displayName,
    description: job && job.description,
    blockStorageSize: jobInfraConfiguration && jobInfraConfiguration.blockStorageSizeInGBs,
    shape: jobInfraConfiguration && jobInfraConfiguration.shapeName,
  };

  const jobMutationError = jobMutation.result && jobMutation.result.error;

  return (
    <>
      <Form
        validator={validate}
        onSubmit={onSubmit}
        formRef={getFormRef}
        defaultValues={defaultValues}
      >
        <FormContextConsumer>
          {() => (
            <Panel
              actions={[
                <FormRemoteSubmitButton formRef={ref} key={"form_btn_submit"} disabled={isError}>
                  {Messages.actions.saveChanges()}
                </FormRemoteSubmitButton>,
              ]}
              onClose={onClose}
              title={Messages.jobs.editTitle()}
              size={PanelSize.Large}
              helpLink={getDialogBoxHelpLink(MANAGE_JOBS, "jobs-edit")}
            >
              {(!job || (areMutationsInFlight && !jobMutationError)) && <DialogLoader />}
              <Field
                label={Messages.jobs.labels.name()}
                fieldName="displayName"
                tooltip={Messages.tooltips.displayName()}
                optional={true}
              >
                <TextInput testId="job-edit-display-name-input" />
              </Field>
              <Field
                label={Messages.jobs.labels.description()}
                optional={true}
                fieldName="description"
              >
                <Textarea rows={4} />
              </Field>
              <JobComputeShape
                defaultVmShape={defaultVmShape}
                openCompute={openCompute}
                isFastLaunch={isFastLaunch}
                setDefaultVmShape={setDefaultVmShape}
                defaultFastLaunchShape={defaultFastLaunchShape}
                defaultCustomConfigShape={defaultCustomConfigShape}
                shapeConfigValue={shapeConfigValue}
                setShapeConfigValue={setShapeConfigValue}
                shapeConfigurationDetails={shapeConfigurationDetails}
              />
              <Field
                label={Messages.jobs.labels.additionalStorage()}
                hint={Messages.jobs.hints.storageHint(
                  JobsBlockStorageSize.minSize,
                  JobsBlockStorageSize.maxSize
                )}
                fieldName="blockStorageSize"
              >
                <NumberInput testId="job-edit-block-storage-size-input" required={true} />
              </Field>
              <FieldSet legend={Messages.shared.networkingResources.networkingResources()}>
                {isManagedEgressEnabled && (
                  <FormattedString
                    inputText={Messages.shared.networkingResources.networkingTypeDescription(
                      isManagedEgress
                        ? Messages.shared.networkingResources.defaultNetworking()
                        : Messages.shared.networkingResources.customNetworking()
                    )}
                  />
                )}
                {(jobQuery.error ||
                  subnet.error ||
                  vcn.error ||
                  (vcnReady && subnetReady && vcnCompartment && subnetCompartment)) && (
                  <VcnSubnetFields
                    vcnInitialCompartment={vcnCompartment}
                    subnetInitialCompartment={subnetCompartment}
                    vcnId={vcnReady ? vcnReady.id : undefined}
                    subnetId={subnetReady ? subnetReady.id : undefined}
                  />
                )}
              </FieldSet>
              <DisclosureLink>
                <br />
                {tags && (
                  <TagsSubForm
                    defaultValues={tags}
                    showLabel={true}
                    compartmentId={compartmentId}
                  />
                )}
              </DisclosureLink>
              {error ||
                (result && result.error && <ErrorText>{result.error.body.message}</ErrorText>)}
            </Panel>
          )}
        </FormContextConsumer>
      </Form>
      {isComputeOpen && (
        <JobComputePanel
          preselectedVmShape={defaultVmShape}
          shapes={isFastLaunch ? fastLaunchVmShapes : vmShapes}
          defaultShapeConfigurationDetails={shapeConfigurationDetails}
          onComputeDataSubmit={onComputeSubmit}
          onClose={closeCompute}
          shapeUseQuery={shapeQuery}
          whitelistOverride={whitelist}
        />
      )}
    </>
  );
};
