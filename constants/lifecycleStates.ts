import { StatusType } from "oui-react";
import {
  ModelDeploymentLifecycleStateEnum,
  ModelLifecycleStateEnum,
  NotebookSessionLifecycleStateEnum,
  ProjectLifecycleStateEnum,
  JobLifecycleStateEnum,
  JobRunLifecycleStateEnum,
  PipelineLifecycleStateEnum,
  PipelineStepRunLifecycleStateEnum,
} from "odsc-client";

export type GenericLifecycleState =
  | ProjectLifecycleStateEnum
  | NotebookSessionLifecycleStateEnum
  | ModelLifecycleStateEnum
  | JobLifecycleStateEnum
  | JobRunLifecycleStateEnum
  | ModelDeploymentLifecycleStateEnum
  | PipelineLifecycleStateEnum
  | PipelineStepRunLifecycleStateEnum;

export const LifecycleState: { [i: string]: string } = {
  CREATING: "CREATING",
  ACTIVE: "ACTIVE",
  DELETING: "DELETING",
  DELETED: "DELETED",
  FAILED: "FAILED",
  INACTIVE: "INACTIVE",
  UPDATING: "UPDATING",
  ACCEPTED: "ACCEPTED",
  IN_PROGRESS: "IN_PROGRESS",
  SUCCEEDED: "SUCCEEDED",
  CANCELING: "CANCELING",
  CANCELED: "CANCELED",
  NEEDS_ATTENTION: "NEEDS_ATTENTION",
  WAITING: "WAITING",
  SKIPPED: "SKIPPED",
};

// Maps the API's lifecycle states to the appropriate status colors.
export const StatusTypeForLifecycleState: { [i: string]: StatusType } = {
  [LifecycleState.CREATING]: StatusType.Muted,
  [LifecycleState.ACTIVE]: StatusType.Success,
  [LifecycleState.DELETING]: StatusType.Warning,
  [LifecycleState.DELETED]: StatusType.Danger,
  [LifecycleState.FAILED]: StatusType.Danger,
  [LifecycleState.INACTIVE]: StatusType.Muted,
  [LifecycleState.UPDATING]: StatusType.Muted,
  [LifecycleState.ACCEPTED]: StatusType.Info,
  [LifecycleState.IN_PROGRESS]: StatusType.Info,
  [LifecycleState.SUCCEEDED]: StatusType.Success,
  [LifecycleState.CANCELING]: StatusType.Warning,
  [LifecycleState.CANCELED]: StatusType.Danger,
  [LifecycleState.NEEDS_ATTENTION]: StatusType.Warning,
  [LifecycleState.WAITING]: StatusType.Info,
  [LifecycleState.SKIPPED]: StatusType.Info,
};
