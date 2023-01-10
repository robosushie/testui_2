import {
  CompartmentScopedField,
  FormRemoteSubmitButton,
  Panel,
  PanelSize,
  SmartSelect,
  useQuery,
} from "oui-savant";
import * as React from "react";
import * as Messages from "@codegen/Messages";
import { getHelpLink } from "utils/docUtils";
import { CheckBox, Field, Form, FormRef, RadioGroup } from "oui-react";
import apiClients from "../../apiClients";

import { Compartment } from "identity-control-plane-api-client";
import { JobLogConfigurationDetails } from "odsc-client/dist/odsc-client";

interface Props {
  activeCompartment: Compartment;
  onClose: () => void;
  onLoggingSubmit: (logDetails: any) => void;
  defaultValues?: JobLogConfigurationDetails;
  setLogGroupName: (logGroupName: string) => void;
  setLogName: (logName: string) => void;
  isPipeline?: boolean;
}

export const LoggingPanel: React.FC<Props> = ({
  activeCompartment,
  onClose,
  onLoggingSubmit,
  defaultValues,
  setLogGroupName,
  setLogName,
  isPipeline,
}) => {
  const [formRef, setFormRef] = React.useState<FormRef>(undefined);
  const [enableLogging, setEnableLogging] = React.useState(
    defaultValues ? defaultValues.enableLogging : true
  );
  const [logGroupValue, setLogGroupValue] = React.useState(
    defaultValues && defaultValues.logGroupId
  );
  const [logValue, setLogValue] = React.useState(defaultValues && defaultValues.logId);
  const [enableAutoLogCreation, setEnableAutoLogCreation] = React.useState(
    defaultValues && defaultValues.enableAutoLogCreation ? true : false
  );

  const getFormRef = (newFormRef: FormRef) => {
    setFormRef(newFormRef);
    return newFormRef;
  };

  const onRadioChange = (selection: String) => {
    if (selection === "true") {
      setEnableAutoLogCreation(true);
    } else {
      setEnableAutoLogCreation(false);
    }
  };

  // once we select a group, default to enableAutoLogCreation being true
  const onLogGroupChange = (e: React.FormEvent<HTMLSelectElement>) => {
    setLogGroupValue(e.currentTarget.value);
    if (e.currentTarget.value) {
      setEnableAutoLogCreation(true);
    }
  };

  const logGroupQuery = useQuery({
    method: apiClients.asyncLoggingApi.getLogGroup,
    wait: !logGroupValue,
    options: {
      args: {
        logGroupId: logGroupValue,
      },
    },
  });

  const logQuery = useQuery({
    method: apiClients.asyncLoggingApi.getLog,
    wait: !logValue,
    options: {
      args: {
        logId: logValue,
        logGroupId: logGroupValue,
      },
    },
  });

  React.useEffect(() => {
    const logGroup =
      logGroupQuery && !logGroupQuery.error && !logGroupQuery.loading
        ? logGroupQuery.response.data
        : undefined;
    const log =
      logQuery && !logQuery.error && !logQuery.loading ? logQuery.response.data : undefined;
    if (logGroup) {
      setLogGroupName(logGroup.displayName);
      if (log) {
        setLogName(log.displayName);
      }
    }
  }, [logGroupQuery, logQuery]);

  return (
    <Form
      formRef={getFormRef}
      onSubmit={() => {
        const logConfigurationDetails: JobLogConfigurationDetails = {
          enableLogging: enableLogging ? true : false,
          logGroupId: enableLogging ? logGroupValue : null,
          enableAutoLogCreation: enableLogging ? enableAutoLogCreation : false,
          logId: enableLogging && !enableAutoLogCreation ? logValue : null,
        };

        onLoggingSubmit(logConfigurationDetails);
        onClose();
      }}
    >
      <Panel
        actions={[
          <FormRemoteSubmitButton formRef={formRef} key="form_btn_select">
            {Messages.actions.select()}
          </FormRemoteSubmitButton>,
        ]}
        size={PanelSize.Medium}
        title={Messages.loggingConfiguration.selectLogging()}
        onClose={onClose}
        helpLink={getHelpLink("/log-about.htm")}
      >
        <Field label={Messages.loggingConfiguration.enableLogging()} fieldName="enableLogging">
          <CheckBox checked={enableLogging} onChange={() => setEnableLogging(!enableLogging)} />
        </Field>
        {enableLogging && (
          <CompartmentScopedField
            fieldName="logGroup"
            label={Messages.loggingConfiguration.logGroup()}
            initialCompartment={activeCompartment}
          >
            {({ selectedCompartment }: { selectedCompartment: Compartment }) => {
              return (
                <SmartSelect
                  disabled={!enableLogging}
                  dependency={apiClients.asyncLoggingApi.listLogGroups}
                  args={{ args: selectedCompartment && { compartmentId: selectedCompartment.id } }}
                  mapFn={(response) =>
                    response.data && [
                      { label: Messages.loggingConfiguration.noLogGroupSelected(), value: "" },
                      ...response.data.map((logGroup) => ({
                        label: logGroup.displayName,
                        value: logGroup.id,
                      })),
                    ]
                  }
                  emptyText={Messages.loggingConfiguration.noLogGroupsFound()}
                  value={logGroupValue}
                  onChange={(event) => onLogGroupChange(event)}
                />
              );
            }}
          </CompartmentScopedField>
        )}
        <br />
        {enableLogging && logGroupValue && (
          <Field fieldName="enableAutoLogCreation">
            <RadioGroup
              onSelectionChange={onRadioChange}
              // defaultValue={enableAutoLogCreation ? "true" : "false"}
              value={enableAutoLogCreation ? "true" : "false"}
              options={[
                {
                  label: Messages.loggingConfiguration.enableAutoLogCreation(),
                  value: "true",
                  description: isPipeline
                    ? Messages.pipelines.tooltips.autoLogCreation()
                    : Messages.jobs.tooltips.autoLogCreation(),
                },
                { label: Messages.loggingConfiguration.selectALog(), value: "false" },
              ]}
            />
          </Field>
        )}
        {enableLogging && !enableAutoLogCreation && logGroupValue && (
          <Field fieldName="logName" label={Messages.loggingConfiguration.logName()}>
            <SmartSelect
              disabled={!enableLogging || enableAutoLogCreation}
              dependency={apiClients.asyncLoggingApi.listLogs}
              args={{ args: { logGroupId: logGroupValue, logType: "CUSTOM" } }}
              mapFn={(response) =>
                response.data && [
                  { label: Messages.loggingConfiguration.noLogSelected(), value: "" },
                  ...response.data.map((log) => ({ label: log.displayName, value: log.id })),
                ]
              }
              emptyText={Messages.loggingConfiguration.noLogsFound()}
              errorText={Messages.loggingConfiguration.noLogsFound()}
              value={logValue}
              onChange={(event) => setLogValue(event.currentTarget.value)}
            />
          </Field>
        )}
      </Panel>
    </Form>
  );
};
