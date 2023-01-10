import { getColumnsList } from "./ListModelProvenanceTableColumns";
import { NotebookSessionSummary } from "odsc-client/dist/odsc-client";
import { getDateTimeFormat } from "utils/timeUtils";

describe("ListModelProvenanceTableColumns", () => {
  const [, , , createdOnColumn] = getColumnsList([], true);
  const timeCreated: Date = Date.now() as unknown as Date;
  const notebookSessionSummary = {
    timeCreated,
    id: "datasciencenotebooksession",
    compartmentId: "compartmentId",
    projectId: "projectId",
    displayName: "notebookSession",
    description: "",
    lifecycleState: "ACTIVE",
  } as unknown as NotebookSessionSummary;

  describe("getCreatedOnCell", () => {
    it("should format the date correctly", () => {
      const cell = createdOnColumn.cell(notebookSessionSummary);
      expect(cell).toBe(getDateTimeFormat(timeCreated));
    });
  });
});
