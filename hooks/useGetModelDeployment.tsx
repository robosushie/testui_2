import { useQuery, QueryResult, TimeInterval } from "oui-savant";
import apiClients from "apiClients";
import { ModelDeployment } from "odsc-client/dist/odsc-client";

export const useGetModelDeployment = (modelDeploymentId: string): QueryResult<ModelDeployment> => {
  return useQuery({
    method: apiClients.odscApi.getModelDeployment,
    options: {
      args: { modelDeploymentId },
      caching: {
        type: "polling",
        pollingInterval: TimeInterval.sm,
      },
    },
  });
};
