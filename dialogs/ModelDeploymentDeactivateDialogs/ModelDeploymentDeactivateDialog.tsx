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

export const ModelDeploymentDeactivateDialog: React.FC<Props> = ({
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
    method: apiClients.odscApi.deactivateModelDeployment,
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
      testId="deactivate-model-deployment-dialog"
      isOpen={true}
      closeHandler={closeHandler}
      title={Messages.modelDeployments.deactivateTitle()}
      footerContent={
        <Button
          onClick={onSubmit}
          disabled={!!modelDeployment.error}
          buttonStyle={ButtonStyle.Primary}
        >
          {Messages.actions.deactivate()}
        </Button>
      }
      helpLink={getDialogBoxHelpLink(MANAGE_MODEL_DEPLOYMENTS, "model_dep_deactivate")}
    >
      {modelDeployment.loading && <DialogLoader />}
      {result && result.loading && <DialogLoader />}
      {modelDeploymentReady && (
        <>
          <FormattedString
            inputText={Messages.modelDeployments.deactivateConfirmation(
              modelDeploymentReady.displayName
            )}
          />
          <p>{Messages.modelDeployments.deactivateDisclaimer()}</p>
        </>
      )}
      {modelDeployment.error && <ErrorText>{modelDeployment.error.body.message}</ErrorText>}
      {result && result.error && <ErrorText>{result.error.body.message}</ErrorText>}
    </Modal>
  );
};
