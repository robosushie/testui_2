import * as React from "react";

import { Button, ButtonStyle, InfoBlock, Modal, InfoBlockStatus, ProgressBar } from "oui-react";
import { normalizeError } from "savant-connector/dist/src/connector";
import * as Messages from "../../../codegen/Messages";

import { CustomDataScienceApi } from "../../models/customApiClients";
import { DownloadArtifactRequest } from "../../models/ArtifactModels";
import DialogLoader from "components/DialogLoader/DialogLoader";
import {
  getDialogBoxHelpLink,
  MANAGE_MODELS,
  getHelpLink,
  MANAGE_JOBS,
} from "../../utils/docUtils";
import { ResourceNames } from "constants/resourceNames";
import { DS_NON_PROD_ENDPOINT } from "pluginConstants";
import { useWhitelist } from "oui-savant";

interface Props {
  ocid: string;
  type: string;
  closeHandler: () => void;
  stepName?: string;
}

export const DownloadArtifactDialog: React.FC<Props> = ({ ocid, type, closeHandler, stepName }) => {
  const [downloadProgress, setDownloadProgress] = React.useState(0);
  const [errorText, setErrorText] = React.useState("");
  const [nonProdEndpoint] = useWhitelist(DS_NON_PROD_ENDPOINT);
  let overrideEndpoint;
  if (nonProdEndpoint) {
    overrideEndpoint = nonProdEndpoint.toString();
  } else if (process.env.NON_PROD_ENDPOINT) {
    overrideEndpoint = process.env.NON_PROD_ENDPOINT;
  }
  const customDataScienceApi = new CustomDataScienceApi(overrideEndpoint);

  React.useEffect(() => {
    const initiateDownload = async (): Promise<void> => {
      try {
        const downloadRequest: DownloadArtifactRequest = {
          stepName,
          type,
          id: ocid,
          progressHandler: setDownloadProgress,
        };
        await customDataScienceApi.getArtifact(downloadRequest);
        closeHandler();
      } catch (error) {
        const errorMessage = await normalizeError(error);
        setErrorText(errorMessage.body.message);
      }
    };

    if (!errorText) {
      customDataScienceApi.allowRequests();
      initiateDownload();
    }
  }, [errorText]);

  const retryDownload = (): void => {
    setErrorText("");
    setDownloadProgress(0);
  };

  const cancelDownload = (): void => {
    customDataScienceApi.abortInprogressRequests();
    closeHandler();
  };

  return (
    <Modal
      testId="download-artifact-dialog"
      isOpen={true}
      title={Messages.models.downloadArtifact()}
      footerContent={
        <Button
          data-test-id="cancel-download-button"
          buttonStyle={ButtonStyle.Danger}
          onClick={cancelDownload}
        >
          {Messages.models.actions.cancelDownloadArtifact()}
        </Button>
      }
      closeHandler={closeHandler}
      helpLink={
        type === ResourceNames.models
          ? getDialogBoxHelpLink(MANAGE_MODELS, "download-models")
          : getHelpLink(MANAGE_JOBS)
      }
    >
      {downloadProgress === 0 && !errorText && <DialogLoader />}
      <ProgressBar
        value={downloadProgress}
        progressLabel={Messages.upload.progressMsgText(downloadProgress)}
      />
      {errorText && (
        <InfoBlock
          title={errorText}
          status={InfoBlockStatus.Critical}
          actions={[
            {
              title: Messages.models.actions.retryDownloadArtifact(),
              onClick: retryDownload,
            },
          ]}
        />
      )}
    </Modal>
  );
};
