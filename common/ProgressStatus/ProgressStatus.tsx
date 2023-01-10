import * as React from "react";
import { HealthLabel, StatusType } from "oui-react";

export interface ActionLabel {
  success?: string;
  warning?: string;
  error?: string;
  waiting?: string;
}

export interface Props {
  testId?: string;
  error: boolean;
  warning: boolean;
  completed: boolean;
  actionLabel?: ActionLabel;
}

export const getActionLabels = (actionLabel?: ActionLabel) => {
  return {
    success: actionLabel && actionLabel.success ? actionLabel.success : "Success",
    error: actionLabel && actionLabel.error ? actionLabel.error : "Error",
    warning: actionLabel && actionLabel.warning ? actionLabel.warning : "Warning",
    waiting: actionLabel && actionLabel.waiting ? actionLabel.waiting : "Waiting",
  };
};

export const ProgressStatus: React.FC<Props> = (props) => {
  const {
    testId,
    error,
    warning,
    completed,
    actionLabel = getActionLabels(props.actionLabel),
  } = props;

  let content: React.ReactChild = actionLabel.waiting;
  if (error) {
    content = (
      <>
        {actionLabel.error}
        <HealthLabel statusType={StatusType.Danger} />
      </>
    );
  } else if (completed) {
    content = (
      <>
        {actionLabel.success}
        <HealthLabel statusType={StatusType.Success} />
      </>
    );
  } else if (warning) {
    content = (
      <>
        {actionLabel.warning}
        <HealthLabel statusType={StatusType.Warning} />
      </>
    );
  }
  return (
    <span data-test-id={testId} className="oui-savant__progress-status-wrapper">
      {content}
    </span>
  );
};
