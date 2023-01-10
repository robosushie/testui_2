import { Compartment } from "identity-control-plane-api-client";
import { Button, Field, Icon, Link, SubForm, Tooltip } from "oui-react";
import { CompartmentSelect, SmartSelect } from "oui-savant";
import * as React from "react";
import * as Messages from "@codegen/Messages";
import apiClients from "apiClients";
import { LOG_GROUP_HELP_LINK, LOG_HELP_LINK } from "utils/docUtils";

import "./LogTypeSelect.less";

interface Props {
  logTitle: string;
  titleTooltip: string;
  fieldNames: {
    subForm: string;
    compartmentSelect: string;
    logGroup: string;
    log: string;
  };
  defaultValues: {
    compartmentId: string;
    logGroup: string;
    log: string;
  };
}

export const LogTypeSelect: React.FC<Props> = ({
  logTitle,
  titleTooltip,
  fieldNames,
  defaultValues,
}) => {
  const [compartmentId, setCompartmentId] = React.useState(defaultValues.compartmentId);
  const [logGroupValue, setLogGroupValue] = React.useState(defaultValues.logGroup);

  return (
    <SubForm fieldName={fieldNames.subForm} transformData={(data) => data}>
      <h4 className="log-type-title">
        <span>{logTitle}</span>
        <Button buttonIcon={Icon.Info} />
        <Tooltip>
          <div className="oui-width-medium">{titleTooltip}</div>
        </Tooltip>
      </h4>
      <CompartmentSelect
        fieldName={fieldNames.compartmentSelect}
        value={compartmentId}
        onChange={(compartment: Compartment) => setCompartmentId(compartment.id)}
        label={Messages.modelDeployments.selectPanes.loggingSelect.compartment()}
      />
      <div className={"log-group-field-add-link"}>
        <Field
          label={Messages.modelDeployments.selectPanes.loggingSelect.logGroup()}
          fieldName={fieldNames.logGroup}
        >
          <>
            <Link href={LOG_GROUP_HELP_LINK} openInNewWindow={true}>
              {Messages.modelDeployments.selectPanes.loggingSelect.learnMore()}
            </Link>
            <SmartSelect
              dependency={apiClients.asyncLoggingApi.listLogGroups}
              args={{ args: { compartmentId } }}
              mapFn={(response) =>
                response.data &&
                response.data.map((logGroup) => ({
                  label: logGroup.displayName,
                  value: logGroup.id,
                }))
              }
              emptyText={Messages.modelDeployments.selectPanes.loggingSelect.noLogGroupsFound()}
              value={logGroupValue}
              onChange={(event) => setLogGroupValue(event.currentTarget.value)}
            />
          </>
        </Field>
      </div>
      <div className={"log-group-field-add-link"}>
        <Field
          label={Messages.modelDeployments.selectPanes.loggingSelect.logName()}
          fieldName={fieldNames.log}
        >
          <>
            <Link href={LOG_HELP_LINK} openInNewWindow={true}>
              {Messages.modelDeployments.selectPanes.loggingSelect.learnMore()}
            </Link>
            <SmartSelect
              dependency={apiClients.asyncLoggingApi.listLogs}
              args={{ args: { logGroupId: logGroupValue, logType: "CUSTOM" } }}
              mapFn={(response) =>
                response.data && [
                  { label: Messages.modelDeployments.resources.logs.noLogSelected(), value: "" },
                  ...response.data.map((log) => ({ label: log.displayName, value: log.id })),
                ]
              }
              emptyText={Messages.modelDeployments.selectPanes.loggingSelect.noLogsFound()}
              errorText={Messages.modelDeployments.selectPanes.loggingSelect.errorFetchingLogs()}
              defaultValue={defaultValues.log}
            />
          </>
        </Field>
      </div>
    </SubForm>
  );
};
