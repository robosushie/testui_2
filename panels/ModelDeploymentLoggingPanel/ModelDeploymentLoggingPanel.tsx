import { FormRemoteSubmitButton, Panel, PanelSize } from "oui-savant";
import * as React from "react";
import * as Messages from "@codegen/Messages";
import { getHelpLink } from "utils/docUtils";
import { Form, FormRef } from "oui-react";

import "./ModelDeploymentLoggingPanel.less";
import { LogTypeSelect } from "./LogTypeSelect/LogTypeSelect";
import { CategoryLogDetails } from "odsc-client/dist/odsc-client";

interface Props {
  compartmentId: string;
  onClose: () => void;
  onLoggingSubmit: (logDetails: CategoryLogDetails) => void;
  defaultValues?: CategoryLogDetails;
}

export const ModelDeploymentLoggingPanel: React.FC<Props> = ({
  compartmentId,
  onClose,
  onLoggingSubmit,
  defaultValues,
}) => {
  const fieldNames = {
    accessLogs: {
      subForm: "accessLogs",
      compartmentSelect: "accessCompartmentSelect",
      logGroup: "accessLogGroup",
      log: "accessLog",
    },
    predictLogs: {
      subForm: "predictLogs",
      compartmentSelect: "predictCompartmentSelect",
      logGroup: "predictLogGroup",
      log: "predictLog",
    },
  };
  const [formRef, setFormRef] = React.useState<FormRef>(undefined);

  const getFormRef = (newFormRef: FormRef) => {
    setFormRef(newFormRef);
    return newFormRef;
  };

  return (
    <Form
      formRef={getFormRef}
      onSubmit={(form: Form) => {
        const values = form.getValues();
        onLoggingSubmit({
          access: values.accessLogs.accessLog
            ? {
                logGroupId: values.accessLogs.accessLogGroup,
                logId: values.accessLogs.accessLog,
              }
            : null,
          predict: values.predictLogs.predictLog
            ? {
                logGroupId: values.predictLogs.predictLogGroup,
                logId: values.predictLogs.predictLog,
              }
            : null,
        });
        onClose();
      }}
    >
      <Panel
        actions={[
          <FormRemoteSubmitButton formRef={formRef} key="form_btn_submit">
            {Messages.actions.submit()}
          </FormRemoteSubmitButton>,
        ]}
        size={PanelSize.Medium}
        title={Messages.modelDeployments.selectPanes.loggingSelect.title()}
        onClose={onClose}
        helpLink={getHelpLink("/data-science.htm")}
      >
        <LogTypeSelect
          logTitle={Messages.modelDeployments.selectPanes.loggingSelect.accessLogsTitle()}
          titleTooltip={Messages.modelDeployments.selectPanes.loggingSelect.tooltips.accessLogs()}
          fieldNames={fieldNames.accessLogs}
          defaultValues={{
            compartmentId,
            logGroup:
              defaultValues && defaultValues.access ? defaultValues.access.logGroupId : undefined,
            log: defaultValues && defaultValues.access ? defaultValues.access.logId : undefined,
          }}
        />

        <LogTypeSelect
          logTitle={Messages.modelDeployments.selectPanes.loggingSelect.predictLogsTitle()}
          titleTooltip={Messages.modelDeployments.selectPanes.loggingSelect.tooltips.predictLogs()}
          fieldNames={fieldNames.predictLogs}
          defaultValues={{
            compartmentId,
            logGroup:
              defaultValues && defaultValues.predict ? defaultValues.predict.logGroupId : undefined,
            log: defaultValues && defaultValues.predict ? defaultValues.predict.logId : undefined,
          }}
        />
      </Panel>
    </Form>
  );
};
