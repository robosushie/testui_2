import { TimeInterval } from "oui-savant";
import { BrowserUtils } from "ui-testing-core";

import { LifecycleState } from "../src/constants/lifecycleStates";
import { clickResourceLink, init, isActionButtonEnabled } from "./helpers/utils";
import { ProjectList } from "./pageObjects/ProjectList";
import { ProjectDetails } from "./pageObjects/ProjectDetails";
import { ProjectCreatePanel } from "./pageObjects/ProjectCreatePanel";
import { ProjectDeleteDialog } from "./pageObjects/ProjectDeleteDialog";
import { CreateModelDetails } from "odsc-client/dist/odsc-client";
import { deleteModel, createModel } from "./helpers/actions";

beforeAll(init);

describe.skip("Project UI Tests", () => {
  let newProjectOcid = "";
  const newProjectName = "Super Cool Project Name";
  const newProjectDescription = "Super cool project description.";

  it(
    "User can visit project list that contains enabled create project button",
    async () => {
      const projectList = new ProjectList();
      await projectList.navigate();
      expect(await projectList.isPageLoaded()).toBeTruthy();
      expect(await isActionButtonEnabled(projectList.CREATE_PROJECT_BUTTON)).toBeTruthy();
    },
    TimeInterval.xl
  );

  it(
    "User can create project & be redirected to newly created project's detail page",
    async () => {
      const projectList = new ProjectList();
      await projectList.navigate();
      expect(await projectList.isPageLoaded()).toBeTruthy();
      await projectList.openCreateProjectPanel();

      const projectCreatePanel = new ProjectCreatePanel();
      expect(await projectCreatePanel.isPanelOpen()).toBeTruthy();
      await projectCreatePanel.create(newProjectName, newProjectDescription);
      expect(await projectCreatePanel.isPanelClosed()).toBeTruthy();

      const projectDetails = new ProjectDetails();
      await projectDetails.waitForPresent();
      expect(await projectDetails.getTitle()).toBe(newProjectName);

      const url = await BrowserUtils.getCurrentURL();
      newProjectOcid = url.split("/projects/")[1].split("?")[0];
      // make sure we parsed a valid ocid from the pathname
      expect(newProjectOcid.includes("ocid1.")).toBeTruthy();
    },
    TimeInterval.xl
  );

  it(
    "User can click on a project link from the list page and navigate to the details page",
    async () => {
      const projectList = new ProjectList();
      await projectList.navigate();
      expect(await projectList.isPageLoaded()).toBeTruthy();
      await clickResourceLink(newProjectOcid);

      const projectDetails = new ProjectDetails(newProjectOcid);
      await projectDetails.waitForPresent();
      expect(await projectDetails.getTitle()).toBe(newProjectName);
    },
    TimeInterval.xl
  );

  it(
    "User can directly visit ACTIVE project's detail page",
    async () => {
      const projectDetails = new ProjectDetails(newProjectOcid);
      await projectDetails.navigate();
      await projectDetails.waitForPresent();
      await projectDetails.waitForState(LifecycleState.ACTIVE);
      expect(await isActionButtonEnabled(projectDetails.EDIT_BUTTON)).toBeTruthy();
      expect(await isActionButtonEnabled(projectDetails.DELETE_PROJECT_BUTTON)).toBeTruthy();
    },
    TimeInterval.xl
  );

  it.skip(
    "User should not be able to delete a project containing a resource",
    async () => {
      // This is being skipped because it fails in CI: https://jira.oci.oraclecorp.com/browse/ODSC-7469
      // Model Details for the new model in the project
      // This uses a model and not a notebook because creating and deleting a notebook makes the test timeout
      const modelDetails = {} as CreateModelDetails;
      modelDetails.displayName = `model${Date.now()}`;
      modelDetails.description = "UI Testing Model Desc";

      const newModelOcid = await createModel(newProjectOcid, modelDetails);

      const projectDetails = new ProjectDetails(newProjectOcid);
      await projectDetails.navigate();
      await projectDetails.waitForPresent();

      await projectDetails.clickDeleteButton();
      const projectDeleteDialog = new ProjectDeleteDialog();
      expect(await projectDeleteDialog.isOpen()).toBeTruthy();
      await projectDeleteDialog.delete();
      expect(await projectDeleteDialog.isOpen()).toBeTruthy();
      expect(await projectDeleteDialog.isDisplayingErrorMessage()).toBeTruthy();
      await projectDeleteDialog.clickCancel();
      expect(await projectDeleteDialog.isClosed()).toBeTruthy();

      await deleteModel(newModelOcid);
    },
    TimeInterval.xl
  );

  it(
    "User can delete an empty project",
    async () => {
      const projectDetails = new ProjectDetails(newProjectOcid);
      await projectDetails.navigate();
      await projectDetails.waitForPresent();
      await projectDetails.clickDeleteButton();
      const projectDeleteDialog = new ProjectDeleteDialog();
      expect(await projectDeleteDialog.isOpen()).toBeTruthy();
      await projectDeleteDialog.enterText(
        projectDeleteDialog.CONFIRMATION_TEXT_FIELD,
        newProjectName
      );
      await projectDeleteDialog.delete();
      expect(await projectDeleteDialog.isClosed()).toBeTruthy();
      await projectDetails.waitForState(LifecycleState.DELETED);
    },
    TimeInterval.xl
  );

  it(
    "User can directly visit DELETED project's detail page",
    async () => {
      const projectDetails = new ProjectDetails(newProjectOcid);
      await projectDetails.navigate();
      await projectDetails.waitForPresent();
      await projectDetails.waitForState(LifecycleState.DELETED);
      expect(await isActionButtonEnabled(projectDetails.EDIT_BUTTON)).toBeFalsy();
      expect(await isActionButtonEnabled(projectDetails.DELETE_PROJECT_BUTTON)).toBeFalsy();
    },
    TimeInterval.xl
  );
});
