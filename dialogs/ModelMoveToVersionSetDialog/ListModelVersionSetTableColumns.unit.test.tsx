import { getColumnsList } from "./ListModelVersionSetTableColumns";
import { ModelVersionSetSummary } from "odsc-client/dist/odsc-client";
import { getDateTimeFormat } from "utils/timeUtils";
import * as loomPluginRuntime from "loom-plugin-runtime";
import * as Messages from "@codegen/Messages";

describe("ListModelVersionSetTableColumns", () => {
  const [getNameColumn, getStatusColumn, createdByColumn, createdAtColumn] = getColumnsList(
    [],
    true
  );
  const timeCreated: Date = Date.now() as unknown as Date;
  const modelVersionSetSummary = {
    timeCreated,
    timeUpdated: Date.now() as unknown as Date,
    id: "datasciencemodelversionset",
    compartmentId: "compartmentId",
    projectId: "projectId",
    name: "mvs1",
    createdBy: "test",
    description: "",
    lifecycleState: "ACTIVE",
  } as ModelVersionSetSummary;

  describe("getNameCell", () => {
    it("should validate the name column", () => {
      jest.spyOn(loomPluginRuntime, "getRouteClient").mockReturnValue({
        getPluginBaseUrl: () => "http://localhost:24000/20190101",
        makeUrl: (url: string) => url,
        makePluginUrl: (url: string) => url,
      } as any);
      const nameColumnName = getNameColumn.id;
      expect(nameColumnName).toContain("name");
      const nameColumnHeader = getNameColumn.header;
      expect(nameColumnHeader).toContain(Messages.modelVersionSets.labels.name());
      const nameCell = getNameColumn.cell(modelVersionSetSummary);
      expect(nameCell).toBeInstanceOf(Object);
    });
  });

  describe("getStatusCell", () => {
    it("should validate the status column", () => {
      const statusColumnName = getStatusColumn.id;
      expect(statusColumnName).toContain("status");
      const statusColumnHeader = getStatusColumn.header;
      expect(statusColumnHeader).toContain(Messages.modelVersionSets.labels.status());
      const statusCell = getStatusColumn.cell(modelVersionSetSummary);
      expect(statusCell).toBeInstanceOf(Object);
    });
  });

  describe("getCreatedByCell", () => {
    it("should validate the created by column", () => {
      const createdByColumnName = createdByColumn.id;
      expect(createdByColumnName).toContain("createdBy");
      const createdByColumnHeader = createdByColumn.header;
      expect(createdByColumnHeader).toContain(Messages.modelVersionSets.labels.createdBy());
      const createdByCell = createdByColumn.cell(modelVersionSetSummary);
      expect(createdByCell).toBeInstanceOf(Object);
    });
  });

  describe("getCreatedAtCell", () => {
    it("should format the date correctly", () => {
      const cell = createdAtColumn.cell(modelVersionSetSummary);
      expect(cell).toBe(getDateTimeFormat(timeCreated));
    });
  });
});
