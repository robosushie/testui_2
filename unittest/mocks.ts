import {
  Job,
  JobRun,
  JobShapeSummary,
  Model,
  ModelDeploymentDeploymentModeEnum,
  ModelDeploymentLifecycleStateEnum,
  NotebookSession,
  NotebookSessionShapeSummary,
  Project,
  FastLaunchJobConfigSummary,
  OcirModelDeploymentEnvironmentConfigurationDetails,
  DefaultModelDeploymentEnvironmentConfigurationDetails,
} from "odsc-client";
import { Compartment, User } from "identity-control-plane-api-client";
import * as loomPluginRuntime from "loom-plugin-runtime";
import { Shape, Subnet, Vcn } from "coreservices-api-client";
import {
  FixedSizeScalingPolicy,
  ModelDeployment,
  ModelProvenance,
  ModelDeploymentShapeSummary,
  SingleModelDeploymentConfigurationDetails,
  ModelVersionSet,
  PipelineRun,
  Pipeline,
} from "odsc-client/dist/odsc-client";
import { Stream } from "streaming-api-client";
import { ContainerImageSummary } from "../gen/clients/artifacts-api-client";

export const mockGetRouteClient = () => {
  const makePluginUrl = jest.fn((resourceName) => `https://dummyurl/dummyplugin/${resourceName}`);

  const makeUrl = jest.fn((itemPath) => `https://dummyurl${itemPath}`);

  return ((loomPluginRuntime as any).getRouteClient = jest.fn(() => ({
    makePluginUrl,
    makeUrl,
  })));
};

export const mockCompartment = (options: Partial<Compartment>): Compartment => {
  const computedOptions: Compartment = {
    id: options.id || "compartmentId",
    compartmentId: options.compartmentId || "compartmentId",
    name: options.name || "compartment",
    description: options.description || "description",
    timeCreated: options.timeCreated || new Date(0),
    lifecycleState: options.lifecycleState || "ACTIVE",
  };

  return { ...options, ...computedOptions }; // Preserve any extra properties from input
};

export const mockIdentityToken = {
  aud: "iaas_console",
  exp: 1521152254.572,
  iat: 1521148654.572,
  iss: "authService.oracle.com",
  jti: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  name: "mock",
  nonce: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  scope: "openid",
  st_hash: "aaaaaaaaaaaaaaaaa-aa",
  sub: "ocidv1:user:oc1:phx:1234567891011:bbbbbbbb11111111111111111111111111",
  tenant: "ocidv1:tenancy:oc1:phx:1234567891011:bbbbbbbb11111111111111111111111111",
  tenant_name: "mock",
};

/**
 * Notebooks
 */
export const mockNotebook = (options: Partial<NotebookSession>): NotebookSession => {
  const computedOptions: NotebookSession = {
    id: options.id || "mtocid",
    timeCreated: options.timeCreated || new Date(0),
    displayName: options.displayName || "test notebook",
    projectId: options.projectId || "pocid",
    createdBy: options.createdBy || "uocid",
    compartmentId: options.compartmentId || "cocid",
    notebookSessionUrl: options.notebookSessionUrl || "notebook.com",
    lifecycleState: options.lifecycleState || "ACTIVE",
    lifecycleDetails: options.lifecycleDetails || "foo",
    notebookSessionConfigurationDetails: options.notebookSessionConfigurationDetails || {
      shape: "unittestshape",
      subnetId: "subnet",
      blockStorageSizeInGBs: 50,
      notebookSessionShapeConfigDetails: {
        memoryInGBs: 1,
        ocpus: 64,
      },
    },
  };

  return { ...options, ...computedOptions }; // Preserve any extra properties from input
};

export const mockConfigDetailsNotebook = (options: Partial<NotebookSession>): NotebookSession => {
  const computedOptions: NotebookSession = {
    id: options.id || "mtocid",
    timeCreated: options.timeCreated || new Date(0),
    displayName: options.displayName || "test notebook",
    projectId: options.projectId || "pocid",
    createdBy: options.createdBy || "uocid",
    compartmentId: options.compartmentId || "cocid",
    notebookSessionUrl: options.notebookSessionUrl || "notebook.com",
    lifecycleState: options.lifecycleState || "ACTIVE",
    lifecycleDetails: options.lifecycleDetails || "foo",
    notebookSessionConfigDetails: options.notebookSessionConfigDetails || {
      shape: "unittestshape",
      subnetId: "subnet",
      blockStorageSizeInGBs: 50,
      notebookSessionShapeConfigDetails: {
        memoryInGBs: 1,
        ocpus: 64,
      },
    },
  };

  return { ...options, ...computedOptions }; // Preserve any extra properties from input
};

export const mockManagedNotebook = (options: Partial<NotebookSession>): NotebookSession => {
  const computedOptions: NotebookSession = {
    id: options.id || "mtocid",
    timeCreated: options.timeCreated || new Date(0),
    displayName: options.displayName || "test notebook",
    projectId: options.projectId || "pocid",
    createdBy: options.createdBy || "uocid",
    compartmentId: options.compartmentId || "cocid",
    notebookSessionUrl: options.notebookSessionUrl || "notebook.com",
    lifecycleState: options.lifecycleState || "ACTIVE",
    lifecycleDetails: options.lifecycleDetails || "foo",
    notebookSessionConfigDetails: options.notebookSessionConfigDetails || {
      shape: "unittestshape",
      blockStorageSizeInGBs: 50,
      notebookSessionShapeConfigDetails: {
        memoryInGBs: 1,
        ocpus: 64,
      },
    },
  };

  return { ...options, ...computedOptions }; // Preserve any extra properties from input
};

/**
 * NotebookSessionShapes
 */
export const mockNotebookSessionShapes = (
  options: NotebookSessionShapeSummary[]
): NotebookSessionShapeSummary[] => {
  const defaultShapes: NotebookSessionShapeSummary[] = [
    {
      shapeSeries: "INTEL_SKYLAKE",
      name: "unittestshape",
      coreCount: 1,
      memoryInGBs: 64,
    },
  ];

  return !!options && options.length > 0 ? [...defaultShapes, ...options] : defaultShapes;
};

/**
 * Compute Shapes
 */
export const mockShapes = (options: Shape[]): Shape[] => {
  const defaultShapes: Shape[] = [
    {
      shape: "unittestshape",
      ocpus: 1,
      memoryInGBs: 64,
    },
  ];

  return !!options && options.length > 0 ? [...defaultShapes, ...options] : defaultShapes;
};

/**
 * ModelDeploymentShapes
 */
export const mockModelDeploymentShapes = (
  options: ModelDeploymentShapeSummary[]
): ModelDeploymentShapeSummary[] => {
  const defaultShapes: ModelDeploymentShapeSummary[] = [
    {
      shapeSeries: "INTEL_SKYLAKE",
      name: "unittestshape",
      coreCount: 1,
      memoryInGBs: 64,
    },
  ];

  return !!options && options.length > 0 ? [...defaultShapes, ...options] : defaultShapes;
};

/**
 * Projects
 */
export const mockProject = (options: Partial<Project>): Project => {
  const computedOptions: Project = {
    id: options.id || "mtocid",
    description: options.description || "Super cool project",
    timeCreated: options.timeCreated || new Date(0),
    displayName: options.displayName || "test project",
    createdBy: options.createdBy || "uocid",
    compartmentId: options.compartmentId || "cocid",
    lifecycleState: options.lifecycleState || "ACTIVE",
  };

  return { ...options, ...computedOptions }; // Preserve any extra properties from input
};

/**
 * Identity
 */
export const mockUser = (options: Partial<User>): User => {
  const computedOptions: User = {
    id: options.id || "uocid",
    compartmentId: options.compartmentId || "cocid",
    timeCreated: options.timeCreated || new Date(0),
    name: options.name || "foo.bar@oracle.com",
    description: options.description || "A foo description",
    lifecycleState: options.lifecycleState || "ACTIVE",
    isMfaActivated: false,
  };

  return { ...options, ...computedOptions }; // Preserve any extra properties from input
};

/**
 * Models
 */
export const mockModel = (options: any): Model => {
  return {
    id: options.id || "mtocid",
    timeCreated: options.timeCreated || new Date(0),
    displayName: options.displayName || "test model",
    description: options.description || "test model",
    projectId: options.projectId || "pocid",
    createdBy: options.createdBy || "uocid",
    inputSchema: options.inputSchema || "",
    outputSchema: options.outputSchema || "",
    compartmentId: options.compartmentId || "cocid",
    lifecycleState: options.lifecycleState || "ACTIVE",
    definedMetadataList: options.definedMetadataList || [],
    customMetadataList: options.customMetadataList || [],
    definedTags: options.definedTags || {},
    freeformTags: options.freeformTags || {},
    modelVersionSetId: options.modelVersionSetId || "",
    modelVersionSetName: options.modelVersionSetName || "",
    versionLabel: options.versionLabel || "",
    versionId: options.versionId || 0,
  };
};

export const mockModelVersionSet = (options: any): ModelVersionSet => {
  return {
    id: options.id || "mvsocid",
    timeCreated: options.timeCreated || new Date(0),
    timeUpdated: options.timeUpdated || new Date(0),
    name: options.name || "test model version set",
    description: options.description || "test model version set",
    projectId: options.projectId || "pocid",
    createdBy: options.createdBy || "uocid",
    compartmentId: options.compartmentId || "cocid",
    lifecycleState: options.lifecycleState || "ACTIVE",
    definedTags: options.definedTags || {},
    freeformTags: options.freeformTags || {},
  };
};

/**
 * Model provenance
 */
export const mockModelProvenance = (options: any): ModelProvenance => {
  return {
    gitBranch: options.gitBranch || "branch",
    gitCommit: options.gitCommit || "commit",
    repositoryUrl: options.repositoryUrl || "repo",
    scriptDir: options.scriptDir || "dir",
    trainingId: options.trainingId || "tid",
    trainingScript: options.trainingScript || "script",
  };
};

export const mockModelDeployment = (
  options: Partial<{
    inputStreamIds: string[];
    outputStreamIds: string[];
    id: string;
    compartmentId: string;
    createdBy: string;
    modelDeploymentUrl: string;
    displayName: string;
    lifecycleState: ModelDeploymentLifecycleStateEnum;
    deploymentMode: ModelDeploymentDeploymentModeEnum;
    environmentConfigurationDetails:
      | OcirModelDeploymentEnvironmentConfigurationDetails
      | DefaultModelDeploymentEnvironmentConfigurationDetails;
  }>
): ModelDeployment => {
  const scalingPolicy: FixedSizeScalingPolicy = {
    policyType: "FIXED_SIZE",
    instanceCount: 1,
  };

  const modelDeploymentConfigurationDetails: SingleModelDeploymentConfigurationDetails = {
    deploymentType: "SINGLE_MODEL",
    modelConfigurationDetails: {
      scalingPolicy,
      modelId: "modelOcid",
      bandwidthMbps: 10,
      instanceConfiguration: {
        instanceShapeName: "",
      },
    },
    streamConfigurationDetails:
      options.deploymentMode === "STREAM_ONLY"
        ? {
            inputStreamIds: options.inputStreamIds || [],
            outputStreamIds: options.outputStreamIds || [],
          }
        : {
            inputStreamIds: null,
            outputStreamIds: null,
          },
    environmentConfigurationDetails: options.environmentConfigurationDetails || undefined,
  };

  return {
    modelDeploymentConfigurationDetails,
    id: "",
    timeCreated: new Date(),
    projectId: options.id || "",
    compartmentId: options.compartmentId || "",
    createdBy: options.createdBy || "",
    modelDeploymentUrl: options.modelDeploymentUrl || "",
    displayName: options.displayName || "name",
    lifecycleState: options.lifecycleState || "ACTIVE",
    deploymentMode: options.deploymentMode || "HTTPS_ONLY",
  };
};

/**
 * Subnet
 */
export const mockSubnet = (options: Partial<Subnet>): Subnet => {
  const computedOptions: Subnet = {
    id: options.id || "subnetocid",
    cidrBlock: options.cidrBlock || "unittestcidr",
    compartmentId: options.compartmentId || "cocid",
    lifecycleState: options.lifecycleState || "AVAILABLE",
    routeTableId: options.routeTableId || "rtocid",
    vcnId: options.vcnId || "vcnocid",
    virtualRouterIp: options.virtualRouterIp || "unittestIp",
    virtualRouterMac: options.virtualRouterMac || "unittestMac",
    displayName: options.displayName || "subnetDisplayName",
  };

  return { ...options, ...computedOptions }; // Preserve any extra properties from input
};

/**
 * Vcn
 */
export const mockVcn = (options: Partial<Vcn>): Vcn => {
  const computedOptions: Vcn = {
    id: options.id || "vcnocid",
    cidrBlock: options.cidrBlock || "unittestcidr",
    cidrBlocks: options.cidrBlocks || ["unittestcidrs"],
    compartmentId: options.compartmentId || "cocid",
    lifecycleState: options.lifecycleState || "AVAILABLE",
    displayName: options.displayName || "vcnDisplayName",
  };

  return { ...options, ...computedOptions }; // Preserve any extra properties from input
};

/**
 * Jobs
 */
export const mockJob = (options: any): Job => {
  return {
    id: options.id || "jocid",
    timeCreated: options.timeCreated || new Date(0),
    createdBy: options.createdBy || "uocid",
    projectId: options.projectId || "pocid",
    compartmentId: options.compartmentId || "cocid",
    displayName: options.displayName || "test job",
    description: options.displayName || "test job description",
    jobConfigurationDetails: options.jobConfigurationDetails || {
      jobType: "DEFAULT",
      maximumRuntimeInMinutes: 5,
      environmentVariables: {
        key1: "value1",
        key2: "value2",
      },
    },
    jobInfrastructureConfigurationDetails: options.jobInfrastructureConfigurationDetails || {
      jobInfrastructureType: "STANDALONE",
      shapeName: "VM.Standard2.1",
      blockStorageSizeInGBs: 450,
      subnetId: "socid",
    },
    lifecycleState: options.lifecycleState || "ACTIVE",
    lifecycleDetails: options.lifecycleDetails || "test job lifecycle details",
    freeformTags: options.freeformTags || {
      fftag1: "fftag1",
      fftag2: "fftag2",
    },
    definedTags: options.definedTags || {},
    jobLogConfigurationDetails: options.jobLogConfigurationDetails || {},
  };
};

export const mockManagedEgressJob = (options: any): Job => {
  return {
    id: options.id || "jocid",
    timeCreated: options.timeCreated || new Date(0),
    createdBy: options.createdBy || "uocid",
    projectId: options.projectId || "pocid",
    compartmentId: options.compartmentId || "cocid",
    displayName: options.displayName || "test job",
    description: options.displayName || "test job description",
    jobConfigurationDetails: options.jobConfigurationDetails || {
      jobType: "DEFAULT",
      maximumRuntimeInMinutes: 5,
      environmentVariables: {
        key1: "value1",
        key2: "value2",
      },
    },
    jobInfrastructureConfigurationDetails: options.jobInfrastructureConfigurationDetails || {
      jobInfrastructureType: "ME_STANDALONE",
      shapeName: "VM.Standard2.1",
      blockStorageSizeInGBs: 450,
    },
    lifecycleState: options.lifecycleState || "ACTIVE",
    lifecycleDetails: options.lifecycleDetails || "test job lifecycle details",
    freeformTags: options.freeformTags || {
      fftag1: "fftag1",
      fftag2: "fftag2",
    },
    definedTags: options.definedTags || {},
    jobLogConfigurationDetails: options.jobLogConfigurationDetails || {},
  };
};

/**
 * JobRuns
 */
export const mockJobRun = (options: any): JobRun => {
  return {
    id: options.id || "jrocid",
    timeAccepted: options.timeAccepted || new Date(0),
    timeStarted: options.timeStarted || new Date(0),
    timeFinished: options.timeFinished || new Date(0),
    createdBy: options.createdBy || "uocid",
    projectId: options.projectId || "pocid",
    compartmentId: options.compartmentId || "cocid",
    jobId: options.jobId || "jocid",
    displayName: options.displayName || "test job run",
    jobConfigurationOverrideDetails: options.jobConfigurationOverrideDetails || {
      jobType: "DEFAULT",
      maximumRuntimeInMinutes: 5,
      environmentVariables: {
        key1: "value1",
        key2: "value2",
      },
      commandLineArguments: "args",
    },
    jobInfrastructureConfigurationDetails: options.jobInfrastructureConfigurationDetails || {
      jobInfrastructureType: "STANDALONE",
      shapeName: "VM.Standard2.1",
      blockStorageSizeInGBs: 450,
      subnetId: "socid",
    },
    jobLogConfigurationOverrideDetails: options.jobLogConfigurationDetails || {},
    logDetails: options.logDetails || {},
    lifecycleState: options.lifecycleState || "ACTIVE",
    lifecycleDetails: options.lifecycleDetails || "test job lifecycle details",
    freeformTags: options.freeformTags || {
      fftag1: "fftag1",
      fftag2: "fftag2",
    },
    definedTags: options.definedTags || {},
  };
};

export const mockManagedEgressJobRun = (options: any): JobRun => {
  return {
    id: options.id || "jrocid",
    timeAccepted: options.timeAccepted || new Date(0),
    timeStarted: options.timeStarted || new Date(0),
    timeFinished: options.timeFinished || new Date(0),
    createdBy: options.createdBy || "uocid",
    projectId: options.projectId || "pocid",
    compartmentId: options.compartmentId || "cocid",
    jobId: options.jobId || "jocid",
    displayName: options.displayName || "test job run",
    jobConfigurationOverrideDetails: options.jobConfigurationOverrideDetails || {
      jobType: "DEFAULT",
      maximumRuntimeInMinutes: 5,
      environmentVariables: {
        key1: "value1",
        key2: "value2",
      },
      commandLineArguments: "args",
    },
    jobInfrastructureConfigurationDetails: options.jobInfrastructureConfigurationDetails || {
      jobInfrastructureType: "ME_STANDALONE",
      shapeName: "VM.Standard2.1",
      blockStorageSizeInGBs: 450,
    },
    jobLogConfigurationOverrideDetails: options.jobLogConfigurationDetails || {},
    logDetails: options.logDetails || {},
    lifecycleState: options.lifecycleState || "ACTIVE",
    lifecycleDetails: options.lifecycleDetails || "test job lifecycle details",
    freeformTags: options.freeformTags || {
      fftag1: "fftag1",
      fftag2: "fftag2",
    },
    definedTags: options.definedTags || {},
  };
};

/**
 * JobShapes
 */
export const mockJobShapes = (options: JobShapeSummary[]): JobShapeSummary[] => {
  const defaultShapes: JobShapeSummary[] = [
    {
      shapeSeries: "INTEL_SKYLAKE",
      name: "unittestshape",
      coreCount: 1,
      memoryInGBs: 64,
    },
  ];

  return !!options && options.length > 0 ? [...defaultShapes, ...options] : defaultShapes;
};

/**
 * JobShape
 */
export const mockJobShape = (options: any): JobShapeSummary => {
  return {
    shapeSeries: options.shapeSeries || "INTEL_SKYLAKE",
    name: options.shapeSeries || "unittestshape",
    coreCount: options.coreCount || 1,
    memoryInGBs: options.memoryInGBs || 64,
  };
};

/**
 * ListStream
 */
export const mockListStreams = (options: Partial<Stream[]>): Stream[] => {
  const defaultStream: Stream = {
    name: "defaultName",
    id: "defaultId",
    compartmentId: "defaultCompartmentId",
    partitions: 1,
    retentionInHours: 1,
    streamPoolId: "defaultStreamPoolId",
    lifecycleState: "ACTIVE",
    timeCreated: new Date(0),
    messagesEndpoint: "defaultMessagesEndpoint",
  };

  return options.length > 0
    ? options.map((stream: Partial<Stream>) => ({
        name: stream.name || "defaultName",
        id: stream.id || "defaultId",
        compartmentId: stream.compartmentId || "defaultCompartmentId",
        partitions: stream.partitions || 1,
        retentionInHours: 1,
        streamPoolId: "defaultStreamPoolId",
        lifecycleState: "ACTIVE",
        timeCreated: new Date(0),
        messagesEndpoint: "defaultMessagesEndpoint",
      }))
    : [defaultStream];
};

/**
 * JobShapes
 */
export const mockFastLaunchJobConfig = (
  options: FastLaunchJobConfigSummary[]
): FastLaunchJobConfigSummary[] => {
  const defaultShapes: FastLaunchJobConfigSummary[] = [
    {
      name: "VM.STANDARD2.1_C1_M15GB_UNSUPPORTED",
      shapeName: "VM.Standard2.1",
      coreCount: 1,
      memoryInGBs: 15,
      shapeSeries: "INTEL_SKYLAKE",
      managedEgressSupport: "UNSUPPORTED",
    },
    {
      shapeSeries: "INTEL_SKYLAKE",
      name: "VM.STANDARD2.4_C4_M60GB_supported",
      shapeName: "VM.Standard2.4",
      coreCount: 4,
      memoryInGBs: 60,
      managedEgressSupport: "SUPPORTED",
    },
  ];

  return !!options && options.length > 0 ? [...defaultShapes, ...options] : defaultShapes;
};

/**
 * Pipeline
 */
export const mockPipeline = (options: Partial<Pipeline>): Pipeline => {
  const computedOptions: Pipeline = {
    projectId: options.id || "projectOcid",
    stepDetails: options.stepDetails || [
      {
        stepName: "preprocess",
        description: "preprocess",
        stepType: "ML_JOB",
        dependsOn: ["training"],
      },
    ],
    id: options.id || "pipelineOcid",
    description: options.description || "Super cool pipeline",
    timeCreated: options.timeCreated || new Date(0),
    displayName: options.displayName || "test pipeline",
    createdBy: options.createdBy || "uocid",
    compartmentId: options.compartmentId || "cocid",
    lifecycleState: options.lifecycleState || "ACTIVE",
    infrastructureConfigurationDetails: options.infrastructureConfigurationDetails || null,
    logConfigurationDetails: options.logConfigurationDetails || {
      enableLogging: true,
      enableAutoLogCreation: true,
      logGroupId: "logGroupdId",
    },
    configurationDetails: options.configurationDetails || {
      type: "DEFAULT",
    },
  };

  return { ...options, ...computedOptions }; // Preserve any extra properties from input
};

/**
 * PipelineRun
 */
export const mockPipelineRun = (options: Partial<PipelineRun>): PipelineRun => {
  const computedOptions: PipelineRun = {
    projectId: options.id || "projectOcid",
    id: options.id || "pipelineRunOcid",
    timeAccepted: options.timeAccepted || new Date(),
    timeStarted: options.timeStarted || new Date(),
    timeUpdated: options.timeUpdated || new Date(),
    timeFinished: options.timeFinished || new Date(),
    createdBy: options.createdBy || "uocid",
    compartmentId: options.compartmentId || "cocid",
    pipelineId: options.pipelineId || "pipelineOcid",
    displayName: options.displayName || "display name",
    configurationDetails: options.configurationDetails || {
      type: "DEFAULT",
    },
    configurationOverrideDetails: options.configurationOverrideDetails || {
      type: "DEFAULT",
    },
    logConfigurationOverrideDetails: options.logConfigurationOverrideDetails || {
      enableLogging: false,
    },
    stepOverrideDetails: options.stepOverrideDetails || [
      {
        stepName: "step name",
        stepConfigurationDetails: {},
      },
    ],
    logDetails: options.logDetails || null,
    lifecycleState: options.lifecycleState || "SUCCEEDED",
    stepRuns: options.stepRuns || [
      {
        stepType: "ML_JOB",
        stepName: "step name",
        lifecycleState: "SUCCEEDED",
        timeStarted: new Date(),
        timeFinished: new Date(),
      },
    ],
  };

  return { ...options, ...computedOptions };
};

export const mockContainerImageSummary = (
  options: Partial<ContainerImageSummary> = {}
): ContainerImageSummary => {
  const computedOptions: ContainerImageSummary = {
    compartmentId: options.compartmentId || "compartmentId",
    digest: options.digest || "digest",
    displayName: options.displayName || "displayName",
    id: options.id || "id",
    lifecycleState: options.lifecycleState || "ACTIVE",
    repositoryId: options.repositoryId || "repositoryId",
    repositoryName: options.repositoryName || "repositoryName",
    timeCreated: options.timeCreated || new Date(),
    version: options.version || "latest",
  };
  return { ...options, ...computedOptions };
};
