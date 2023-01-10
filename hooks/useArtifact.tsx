import * as React from "react";

import { ArtifactMetaData } from "../models/ArtifactModels";
import { CustomDataScienceApi } from "../models/customApiClients";
import { ErrorMessages } from "../constants/errorMessages";
import { useWhitelist } from "oui-savant";
import { DS_NON_PROD_ENDPOINT } from "pluginConstants";

interface Artifact {
  name: string;
  type: string;
  size: number;
}

interface ArtifactResp {
  result?: Artifact;
  loading: boolean;
  errorCode?: number;
  refresh: () => Promise<void>;
}

export const useArtifact = (
  id: string,
  type: string,
  isCallable: boolean,
  stepName?: string
): ArtifactResp => {
  const [artifact, setArtifact] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [errorCode, setErrorCode] = React.useState<number>(null);
  const [nonProdEndpoint] = useWhitelist(DS_NON_PROD_ENDPOINT);
  let overrideEndpoint: string;
  if (nonProdEndpoint) {
    overrideEndpoint = nonProdEndpoint.toString();
  } else if (process.env.NON_PROD_ENDPOINT) {
    overrideEndpoint = process.env.NON_PROD_ENDPOINT;
  }

  const fetchArtifact = React.useCallback(async () => {
    if (isCallable) {
      setArtifact(null);
      setLoading(true);
      setErrorCode(null);

      const onArtifactSuccess = (artifactMetaData: ArtifactMetaData): void => {
        setLoading(false);
        setArtifact({
          name: artifactMetaData.fileName,
          size: parseInt(artifactMetaData.size, 10),
        });
      };

      try {
        const customDataScienceApi = new CustomDataScienceApi(overrideEndpoint);
        await customDataScienceApi.headArtifact({
          id,
          type,
          stepName,
          successCallBack: onArtifactSuccess,
        });
      } catch (err) {
        setErrorCode(-1);
        if (err instanceof Error && err.message === ErrorMessages.HTTP_404) {
          setErrorCode(404);
        }
        setLoading(false);
      }
    }
  }, [isCallable]);

  React.useEffect(() => {
    fetchArtifact();
  }, [isCallable]);

  return { loading, errorCode, result: artifact, refresh: fetchArtifact };
};
