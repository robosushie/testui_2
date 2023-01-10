import { getColumnsList } from "./ListModelsTableColumns";
import { Model } from "odsc-client/dist/odsc-client";
import { getDateTimeFormat } from "utils/timeUtils";
import * as loomPluginRuntime from "loom-plugin-runtime";
import { ResourceNames } from "../../../constants/resourceNames";

describe("ListModelsTableColumns", () => {
  const [modelName, , , createdOnColumn] = getColumnsList([], true);
  const timeCreated: Date = Date.now() as unknown as Date;
  const modelSummary = {
    timeCreated,
    id: "modelId",
    compartmentId: "",
    projectId: "",
    displayName: "modelName",
    description: "",
    lifecycleState: "ACTIVE",
    createdBy: "",
    definedTags: [],
  } as unknown as Model;

  describe("getCreatedOnCell", () => {
    it("should format the date correctly", () => {
      const cell = createdOnColumn.cell(modelSummary);
      expect(cell).toBe(getDateTimeFormat(timeCreated));
    });
  });

  describe("getModelNameCell", () => {
    it("should have the proper link and name", () => {
      jest
        .spyOn(loomPluginRuntime, "getRouteClient")
        .mockReturnValue({ makePluginUrl: (url: string) => url } as loomPluginRuntime.RouteClient);
      const expectedModelUrl = `/${ResourceNames.models}/${modelSummary.id}`;
      const cell = modelName.cell(modelSummary) as JSX.Element;
      expect(cell.props.href).toBe(expectedModelUrl);
      expect(cell.props.children).toBe(modelSummary.displayName);
    });
  });
});
