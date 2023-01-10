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

export const ModelDeactivateDialog: React.FC<Props> = ({ modelId, closeHandler, refresh }) => {
  const model = useQuery({
    method: apiClients.odscApi.getModel,
    options: {
      args: { modelId },
    },
  });
  const modelReady = !model.error && model.response && model.response.data;

  const { invoke, result, reset } = useMutation({
    method: apiClients.odscApi.deactivateModel,
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
      testId="deactivate-model-dialog"
      isOpen={true}
      closeHandler={closeHandler}
      title={Messages.models.deactivateTitle()}
      footerContent={
        <Button onClick={onSubmit} type={ButtonType.Button} buttonStyle={ButtonStyle.Primary}>
          {Messages.actions.deactivate()}
        </Button>
      }
      helpLink={getDialogBoxHelpLink(MANAGE_MODELS, "deactivate-models")}
    >
      {model.loading && <DialogLoader />}
      {result && result.loading && <DialogLoader />}
      {modelReady && (
        <>
          <FormattedString
            inputText={Messages.models.deactivateConfirmation(modelReady.displayName)}
          />
          <p>{Messages.models.deactivateDisclaimer()}</p>
        </>
      )}
      {model.error && <ErrorText>{model.error.body.message}</ErrorText>}
      {result && result.error && <ErrorText>{result.error.body.message}</ErrorText>}
    </Modal>
  );
};
