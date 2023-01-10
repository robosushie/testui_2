import * as React from "react";

import { Button, ButtonStyle, ButtonType, ErrorText, Modal } from "oui-react";
import * as Messages from "../../../codegen/Messages";

import DialogLoader from "components/DialogLoader/DialogLoader";

import { useMutation, useQuery } from "oui-savant";
import apiClients from "../../apiClients";
import { FormattedString } from "loom-formatted-string-react";
import { getDialogBoxHelpLink, MANAGE_MODELS } from "../../utils/docUtils";

interface Props {
  closeHandler(): void;
  refresh(): void;
  modelId: string;
}

export const ModelActivateDialog: React.FC<Props> = ({ modelId, closeHandler, refresh }) => {
  const model = useQuery({
    method: apiClients.odscApi.getModel,
    options: {
      args: { modelId },
    },
  });
  const modelReady = !model.error && model.response && model.response.data;

  const { invoke, result, reset } = useMutation({
    method: apiClients.odscApi.activateModel,
    onSuccess: () => {
      refresh();
      closeHandler();
    },
  });

  const onSubmit = (): void => {
    reset();
    invoke({ modelId });
  };

  return (
    <Modal
      testId="activate-model-dialog"
      isOpen={true}
      closeHandler={closeHandler}
      footerContent={
        <Button onClick={onSubmit} type={ButtonType.Button} buttonStyle={ButtonStyle.Primary}>
          {Messages.actions.activate()}
        </Button>
      }
      title={Messages.models.activateTitle()}
      helpLink={getDialogBoxHelpLink(MANAGE_MODELS, "activate-models")}
    >
      {model.loading && <DialogLoader />}
      {result && result.loading && <DialogLoader />}

      {modelReady && (
        <>
          <FormattedString
            inputText={Messages.models.activateConfirmation(modelReady.displayName)}
          />
          <p>{Messages.models.activateDisclaimer()}</p>
        </>
      )}

      {model.error && <ErrorText>{model.error.body.message}</ErrorText>}
      {result && result.error && <ErrorText>{result.error.body.message}</ErrorText>}
    </Modal>
  );
};
