import * as React from "react";

import { Button, ButtonStyle, ErrorText, Modal } from "oui-react";
import * as Messages from "../../../codegen/Messages";
import DialogLoader from "components/DialogLoader/DialogLoader";
import { useMutation, useQuery } from "oui-savant";
import apiClients from "../../apiClients";
import { FormattedString } from "loom-formatted-string-react";
import { getDialogBoxHelpLink, MANAGE_MODEL_DEPLOYMENTS } from "../../utils/docUtils";

interface Props {
  closeHandler(): void;
  refresh(): void;
  modelDeploymentId: string;
}

export const ModelDeploymentActivateDialog: React.FC<Props> = ({
  modelDeploymentId,
  closeHandler,
  refresh,
}) => {
  const modelDeployment = useQuery({
    method: apiClients.odscApi.getModelDeployment,
    options: {
      args: { modelDeploymentId },
    },
  });
  const modelDeploymentReady =
    !modelDeployment.error && modelDeployment.response && modelDeployment.response.data;

  const { invoke, result, reset } = useMutation({
    method: apiClients.odscApi.activateModelDeployment,
    onSuccess: () => {
      refresh();
      closeHandler();
    },
  });

  const onSubmit = (): void => {
    reset();
    invoke({ modelDeploymentId });
  };

  return (
    <Modal
      testId="activate-model-deployment-dialog"
      isOpen={true}
      closeHandler={closeHandler}
      footerContent={
        <Button
          onClick={onSubmit}
          disabled={!!modelDeployment.error}
          buttonStyle={ButtonStyle.Primary}
        >
          {Messages.actions.activate()}
        </Button>
      }
      title={Messages.modelDeployments.activateTitle()}
      helpLink={getDialogBoxHelpLink(MANAGE_MODEL_DEPLOYMENTS, "model_dep_deactivate")}
    >
      {modelDeployment.loading && <DialogLoader />}
      {result && result.loading && <DialogLoader />}

      {modelDeploymentReady && (
        <>
          <FormattedString
            inputText={Messages.modelDeployments.activateConfirmation(
              modelDeploymentReady.displayName
            )}
          />
        </>
      )}

      {modelDeployment.error && <ErrorText>{modelDeployment.error.body.message}</ErrorText>}
      {result && result.error && <ErrorText>{result.error.body.message}</ErrorText>}
    </Modal>
  );
};
