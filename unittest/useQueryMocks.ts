import apiClients from "apiClients";
import { Errors, mockQuery, QueryMock } from "./utils/savantTestUtils";

export const getNotebookSessionMock: QueryMock<typeof apiClients.odscApi.getNotebookSession> =
  mockQuery(apiClients.odscApi.getNotebookSession).mockError(Errors.NotFound);

export const getNotebookSessionShapesMock: QueryMock<
  typeof apiClients.odscApi.listNotebookSessionShapes
> = mockQuery(apiClients.odscApi.listNotebookSessionShapes).mockError(Errors.NotFound);

export const getComputeShapesMock: QueryMock<typeof apiClients.computeApi.listShapes> = mockQuery(
  apiClients.computeApi.listShapes
).mockError(Errors.NotFound);

export const getProjectMock: QueryMock<typeof apiClients.odscApi.getProject> = mockQuery(
  apiClients.odscApi.getProject
).mockError(Errors.NotFound);

export const getModelMock: QueryMock<typeof apiClients.odscApi.getModel> = mockQuery(
  apiClients.odscApi.getModel
).mockError(Errors.NotFound);

export const getModelVersionSetMock: QueryMock<typeof apiClients.odscApi.getModelVersionSet> =
  mockQuery(apiClients.odscApi.getModelVersionSet).mockError(Errors.NotFound);

export const getModelProvenanceMock: QueryMock<typeof apiClients.odscApi.getModelProvenance> =
  mockQuery(apiClients.odscApi.getModelProvenance).mockError(Errors.NotFound);

export const getUserMock: QueryMock<typeof apiClients.identityApi.getUser> = mockQuery(
  apiClients.identityApi.getUser
).mockError(Errors.NotFound);

export const getSubnetMock: QueryMock<typeof apiClients.virtualNetworkApi.getSubnet> = mockQuery(
  apiClients.virtualNetworkApi.getSubnet
).mockError(Errors.NotFound);

export const getVcnMock: QueryMock<typeof apiClients.virtualNetworkApi.getVcn> = mockQuery(
  apiClients.virtualNetworkApi.getVcn
).mockError(Errors.NotFound);

export const getStreamMock: QueryMock<typeof apiClients.streamApi.listStreams> = mockQuery(
  apiClients.streamApi.listStreams
).mockError(Errors.NotFound);

export const getJobMock: QueryMock<typeof apiClients.odscApi.getJob> = mockQuery(
  apiClients.odscApi.getJob
).mockError(Errors.NotFound);

export const getJobRunMock: QueryMock<typeof apiClients.odscApi.getJobRun> = mockQuery(
  apiClients.odscApi.getJobRun
).mockError(Errors.NotFound);

export const getJobShapesMock: QueryMock<typeof apiClients.odscApi.listJobShapes> = mockQuery(
  apiClients.odscApi.listJobShapes
).mockError(Errors.NotFound);

export const getFastLaunchConfigsMock: QueryMock<
  typeof apiClients.odscApi.listFastLaunchJobConfigs
> = mockQuery(apiClients.odscApi.listFastLaunchJobConfigs).mockError(Errors.NotFound);

export const getPipelineMock: QueryMock<typeof apiClients.odscApi.getPipeline> = mockQuery(
  apiClients.odscApi.getPipeline
).mockError(Errors.NotFound);

export const getPipelineRunMock: QueryMock<typeof apiClients.odscApi.getPipelineRun> = mockQuery(
  apiClients.odscApi.getPipelineRun
).mockError(Errors.NotFound);

export const listContainerImageMock: QueryMock<typeof apiClients.artifactsApi.listContainerImages> =
  mockQuery(apiClients.artifactsApi.listContainerImages).mockError(Errors.NotFound);

export const getNamespaceMock: QueryMock<typeof apiClients.objectStorageApi.getNamespace> =
  mockQuery(apiClients.objectStorageApi.getNamespace).mockError(Errors.NotFound);
export const getJobs: QueryMock<typeof apiClients.odscApi.listJobs> = mockQuery(
  apiClients.odscApi.listJobs
).mockError(Errors.NotFound);
