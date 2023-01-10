import { useQuery, QueryResult, TimeInterval } from "oui-savant";
import apiClients from "apiClients";
import { ModelVersionSet } from "odsc-client/dist/odsc-client";

export const useGetModelVersionSet = (modelVersionSetId: string): QueryResult<ModelVersionSet> => {
  return useQuery({
    method: apiClients.odscApi.getModelVersionSet,
    options: {
      args: { modelVersionSetId },
      caching: {
        type: "polling",
        pollingInterval: TimeInterval.sm,
      },
    },
  });
};
