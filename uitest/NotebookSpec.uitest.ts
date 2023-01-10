import { TimeInterval } from "oui-savant";
import { BrowserUtils } from "ui-testing-core";

import { LifecycleState } from "../src/constants/lifecycleStates";
import { clickResourceLink, init, isActionButtonEnabled } from "./helpers/utils";
import { ProjectList } from "./pageObjects/ProjectList";
import { ProjectDetails } from "./pageObjects/ProjectDetails";
import { ProjectCreatePanel } from "./pageObjects/ProjectCreatePanel";
import { ProjectDeleteDialog } from "./pageObjects/ProjectDeleteDialog";
import { NotebookCreatePanel } from "./pageObjects/NotebookCreatePanel";
import { NotebookComputeSelectPanel } from "./pageObjects/NotebookComputeSelectPanel";
import { NotebookShutdownDialog } from "./pageObjects/NotebookShutdownDialog";
import { NotebookDetails } from "./pageObjects/NotebookDetails";
import { NotebookDeactivateDialog } from "./pageObjects/NotebookDeactivateDialog";
import { NotebookActivatePanel } from "./pageObjects/NotebookActivatePanel";
import { NotebookEditDialog } from "./pageObjects/NotebookEditDialog";
import { NOTEBOOK_TIMEOUT } from "./helpers/constants";

beforeAll(init);

describe("Notebook Sessions UI Tests", () => {
  // const username = LOGGED_IN_USER;
  let projectOcid = "";
  const projectName = "Automated_UI_Test_Project";
  const projectDescription = "Automated_UI_Test_Project";
  const notebookNameToUpdate = "Updated_Notebook";

  let newNotebookOcid = "";
  const notebookName = `notebookSession${Date.now()}`;
  const blockStorageSize = "60";

  describe("Notebook CRUD Tests", () => {
    it(
      "User can create project & be redirected to newly created project's detail page",
      async () => {
        const projectList = new ProjectList();
        await projectList.navigate();
        expect(await projectList.isPageLoaded()).toBeTruthy();
        expect(await isActionButtonEnabled(projectList.CREATE_PROJECT_BUTTON)).toBeTruthy();

        await projectList.openCreateProjectPanel();

        const projectCreatePanel = new ProjectCreatePanel();
        expect(await projectCreatePanel.isPanelOpen()).toBeTruthy();
        await projectCreatePanel.create(projectName, projectDescription);
        expect(await projectCreatePanel.isPanelClosed()).toBeTruthy();

        const projectDetails = new ProjectDetails();
        await projectDetails.waitForPresent();
        expect(await projectDetails.getTitle()).toBe(projectName);

        const url = await BrowserUtils.getCurrentURL();
        projectOcid = url.split("/projects/")[1].split("?")[0];
        // make sure we parsed a valid ocid from the pathname
        expect(projectOcid.includes("ocid1.")).toBeTruthy();
      },
      TimeInterval.xl
    );

    it(
      "User can visit project detail page that contains enabled create notebook button",
      async () => {
        const projectDetails = new ProjectDetails(projectOcid);
        await projectDetails.navigate();
        await projectDetails.waitForPresent();
        expect(await projectDetails.isPageLoaded()).toBeTruthy();
        expect(await isActionButtonEnabled(projectDetails.CREATE_NOTEBOOK_BUTTON)).toBeTruthy();
      },
      TimeInterval.xl
    );

    describe.skip("Flex Shape tests ", () => {
      it("User can select flex shapes correctly while creating notebook session", async () => {
        const projectDetails = new ProjectDetails(projectOcid);
        await projectDetails.navigate();
        await projectDetails.waitForPresent();
        expect(await projectDetails.isPageLoaded()).toBeTruthy();
        await projectDetails.clickCreateNotebookButton();

        const notebookCreatePanel = new NotebookCreatePanel();
        const notebookComputePanel = new NotebookComputeSelectPanel();
        expect(await notebookCreatePanel.isPanelOpen()).toBeTruthy();

        // verify compute panel is in good state
        await notebookCreatePanel.openComputePanel();
        expect(await notebookComputePanel.isPanelOpen()).toBeTruthy();

        await notebookComputePanel.verifyLegacyShapes();
        await notebookComputePanel.verifyNvidiaShapes();
        await notebookComputePanel.verifyIntelShapes();
        await notebookComputePanel.verifyAMDShapes();

        await notebookComputePanel.selectAmdShape(1, 16);
        await notebookComputePanel.clickSubmitButton();
        expect(await notebookComputePanel.isPanelClosed()).toBeTruthy();
        expect(
          await notebookCreatePanel.verifySelectedShapeName("VM.Standard.E3.Flex")
        ).toBeTruthy();
        expect(
          await notebookCreatePanel.verifySelectedShapeConfig(`1 core OCPU, 16GB memory`)
        ).toBeTruthy();
      });
    });

    it(
      "User can create a notebook session & be redirected to newly create notebook's detail page",
      async () => {
        const projectDetails = new ProjectDetails(projectOcid);
        await projectDetails.navigate();
        await projectDetails.waitForPresent();
        expect(await projectDetails.isPageLoaded()).toBeTruthy();
        await projectDetails.clickCreateNotebookButton();

        const notebookCreatePanel = new NotebookCreatePanel();
        expect(await notebookCreatePanel.isPanelOpen()).toBeTruthy();

        // const notebookComputePanel = new NotebookComputeSelectPanel();
        // expect(await notebookCreatePanel.isPanelOpen()).toBeTruthy();

        // verify compute panel is in good state
        // await notebookCreatePanel.openComputePanel();
        // expect(await notebookComputePanel.isPanelOpen()).toBeTruthy();

        // await notebookComputePanel.clickSubmitButton();
        // expect(await notebookComputePanel.isPanelClosed()).toBeTruthy();

        await notebookCreatePanel.create(blockStorageSize, notebookName);
        expect(await notebookCreatePanel.isPanelClosed()).toBeTruthy();

        const notebookDetails = new NotebookDetails();
        await notebookDetails.waitForPresent();

        expect(await notebookDetails.waitForState(LifecycleState.CREATING)).toBeTruthy();
        // Only the delete button should be enabled while the notebook is in a CREATING state
        expect(await isActionButtonEnabled(notebookDetails.OPEN_BUTTON)).toBeFalsy();
        expect(await isActionButtonEnabled(notebookDetails.EDIT_BUTTON)).toBeFalsy();
        expect(await notebookDetails.isDeleteButtonEnabled()).toBeFalsy();
        expect(await isActionButtonEnabled(notebookDetails.DEACTIVATE_BUTTON)).toBeFalsy();

        expect(await notebookDetails.waitForState(LifecycleState.ACTIVE)).toBeTruthy();
        expect(await notebookDetails.isPageLoaded()).toBeTruthy();
        expect(await notebookDetails.getName()).toBe(notebookName);
        expect(await notebookDetails.getInstanceShape()).toBe(
          NotebookComputeSelectPanel.DEFAULT_SELECTED_SHAPE
        );
        expect(await notebookDetails.getBlockVolumeSize()).toBe(`${blockStorageSize} GB`);
        // expect(await notebookDetails.getCreatedBy()).toBe(username);

        const url = await BrowserUtils.getCurrentURL();
        newNotebookOcid = url.split("/notebook-sessions/")[1].split("?")[0];
        // make sure we parsed a valid ocid from the pathname
        expect(newNotebookOcid.includes("ocid1.")).toBeTruthy();
      },
      NOTEBOOK_TIMEOUT
    ); // For when tests timeout: https://dyn.slack.com/archives/CPU1MBFPF/p1584565917386100

    it(
      "User can click on a notebook link from the Project-list page and navigate to the notebook-details page",
      async () => {
        expect(newNotebookOcid).not.toBe("");
        const projectDetails = new ProjectDetails(projectOcid);
        await projectDetails.navigate();
        await projectDetails.waitForPresent();
        expect(await projectDetails.isPageLoaded()).toBeTruthy();
        await clickResourceLink(newNotebookOcid);

        const notebookDetails = new NotebookDetails();
        await notebookDetails.waitForPresent();
        expect(await notebookDetails.isPageLoaded()).toBeTruthy();
        expect(await notebookDetails.getName()).toBe(notebookName);
        expect(await notebookDetails.getInstanceShape()).toBe(
          NotebookComputeSelectPanel.DEFAULT_SELECTED_SHAPE
        );
        // expect(await notebookDetails.getCreatedBy()).toBe(username);
      },
      TimeInterval.xl
    );

    it(
      "User can directly visit ACTIVE notebook's detail page and interact with action buttons",
      async () => {
        expect(newNotebookOcid).not.toBe("");
        const notebookDetails = new NotebookDetails(newNotebookOcid);
        await notebookDetails.navigate();
        await notebookDetails.waitForPresent();
        expect(await notebookDetails.isPageLoaded()).toBeTruthy();
        expect(await notebookDetails.waitForState(LifecycleState.ACTIVE)).toBeTruthy();
        // All of the action buttons should be enabled when the notebook is in an ACTIVE state
        expect(await isActionButtonEnabled(notebookDetails.OPEN_BUTTON)).toBeTruthy();
        expect(await isActionButtonEnabled(notebookDetails.EDIT_BUTTON)).toBeTruthy();
        expect(await isActionButtonEnabled(notebookDetails.DEACTIVATE_BUTTON)).toBeTruthy();
        expect(await notebookDetails.isDeleteButtonEnabled()).toBeTruthy();
      },
      TimeInterval.xl
    );

    it(
      "User can update notebook",
      async () => {
        expect(newNotebookOcid).not.toBe("");
        const notebookDetailsPage = new NotebookDetails(newNotebookOcid);
        await notebookDetailsPage.navigate();
        await notebookDetailsPage.waitForPresent();
        expect(await notebookDetailsPage.waitForState(LifecycleState.ACTIVE)).toBeTruthy();

        expect(await isActionButtonEnabled(notebookDetailsPage.EDIT_BUTTON)).toBeTruthy();

        await notebookDetailsPage.clickActionButton(notebookDetailsPage.EDIT_BUTTON);

        const notebookEditPage = new NotebookEditDialog();
        expect(await notebookEditPage.isOpen()).toBeTruthy();

        await notebookEditPage.updateNotebook(notebookNameToUpdate);
        expect(await notebookEditPage.isClosed()).toBeTruthy();

        await notebookDetailsPage.navigate();
        await notebookDetailsPage.waitForPresent();
        expect(await notebookDetailsPage.waitForState(LifecycleState.ACTIVE)).toBeTruthy();

        expect(await notebookDetailsPage.getName()).toBe(notebookNameToUpdate);
      },
      NOTEBOOK_TIMEOUT
    );

    it(
      "User can deactivate a notebook session",
      async () => {
        expect(newNotebookOcid).not.toBe("");
        const notebookDetailsPage = new NotebookDetails(newNotebookOcid);
        await notebookDetailsPage.navigate();
        await notebookDetailsPage.waitForPresent();
        expect(await notebookDetailsPage.isPageLoaded()).toBeTruthy();
        expect(await notebookDetailsPage.waitForState(LifecycleState.ACTIVE)).toBeTruthy();
        expect(await isActionButtonEnabled(notebookDetailsPage.DEACTIVATE_BUTTON)).toBeTruthy();
        await notebookDetailsPage.clickActionButton(notebookDetailsPage.DEACTIVATE_BUTTON);

        const notebookDeactivateDialog = new NotebookDeactivateDialog();
        expect(await notebookDeactivateDialog.isOpen()).toBeTruthy();
        await notebookDeactivateDialog.deactivateNotebook();
        expect(await notebookDeactivateDialog.isClosed()).toBeTruthy();

        expect(await notebookDetailsPage.waitForState(LifecycleState.UPDATING)).toBeTruthy();
        // None of the action buttons should be enabled while the notebook is in a UPDATING state
        expect(await isActionButtonEnabled(notebookDetailsPage.OPEN_BUTTON)).toBeFalsy();
        expect(await isActionButtonEnabled(notebookDetailsPage.EDIT_BUTTON)).toBeFalsy();
        expect(await notebookDetailsPage.isDeleteButtonEnabled()).toBeFalsy();

        expect(await notebookDetailsPage.waitForState(LifecycleState.INACTIVE)).toBeTruthy();
        // Some of the action buttons should be enabled when the notebook is in an INACTIVE state
        expect(await isActionButtonEnabled(notebookDetailsPage.OPEN_BUTTON)).toBeFalsy();
        expect(await isActionButtonEnabled(notebookDetailsPage.EDIT_BUTTON)).toBeFalsy();
        expect(await isActionButtonEnabled(notebookDetailsPage.ACTIVATE_BUTTON)).toBeTruthy();
        expect(await notebookDetailsPage.isDeleteButtonEnabled()).toBeTruthy();
      },
      NOTEBOOK_TIMEOUT
    );

    it(
      "User can activate a notebook session",
      async () => {
        expect(newNotebookOcid).not.toBe("");
        const notebookDetailsPage = new NotebookDetails(newNotebookOcid);
        await notebookDetailsPage.navigate();
        await notebookDetailsPage.waitForPresent();
        expect(await notebookDetailsPage.isPageLoaded()).toBeTruthy();
        expect(await notebookDetailsPage.waitForState(LifecycleState.INACTIVE)).toBeTruthy();
        expect(await isActionButtonEnabled(notebookDetailsPage.ACTIVATE_BUTTON)).toBeTruthy();
        await notebookDetailsPage.clickActionButton(notebookDetailsPage.ACTIVATE_BUTTON);

        const notebookActivatePanel = new NotebookActivatePanel();
        expect(await notebookActivatePanel.isPanelOpen()).toBeTruthy();
        await notebookActivatePanel.activateNotebook(
          (parseInt(blockStorageSize, 10) + 1).toString()
        );
        expect(await notebookActivatePanel.isPanelClosed()).toBeTruthy();

        expect(await notebookDetailsPage.waitForState(LifecycleState.UPDATING)).toBeTruthy();
        // None of the action buttons should be enabled while the notebook is in a UPDATING state
        expect(await isActionButtonEnabled(notebookDetailsPage.OPEN_BUTTON)).toBeFalsy();
        expect(await isActionButtonEnabled(notebookDetailsPage.EDIT_BUTTON)).toBeFalsy();
        expect(await notebookDetailsPage.isDeleteButtonEnabled()).toBeFalsy();

        expect(await notebookDetailsPage.waitForState(LifecycleState.ACTIVE)).toBeTruthy();
        // Some of the action buttons should be enabled when the notebook is in an ACTIVE state
        expect(await isActionButtonEnabled(notebookDetailsPage.OPEN_BUTTON)).toBeTruthy();
        expect(await isActionButtonEnabled(notebookDetailsPage.EDIT_BUTTON)).toBeTruthy();
        expect(await isActionButtonEnabled(notebookDetailsPage.DEACTIVATE_BUTTON)).toBeTruthy();
        expect(await notebookDetailsPage.isDeleteButtonEnabled()).toBeTruthy();
      },
      NOTEBOOK_TIMEOUT
    );

    it(
      "User can delete a notebook session",
      async () => {
        expect(newNotebookOcid).not.toBe("");
        const notebookDetailsPage = new NotebookDetails(newNotebookOcid);
        await notebookDetailsPage.navigate();
        await notebookDetailsPage.waitForPresent();
        expect(await notebookDetailsPage.isPageLoaded()).toBeTruthy();
        expect(await isActionButtonEnabled(notebookDetailsPage.MORE_ACTIONS_BUTTON)).toBeTruthy();
        await notebookDetailsPage.clickDeleteButton();

        const notebookShutdownDialog = new NotebookShutdownDialog();
        expect(await notebookShutdownDialog.isOpen()).toBeTruthy();
        await notebookShutdownDialog.enterText(
          notebookShutdownDialog.CONFIRMATION_TEXT_FIELD,
          notebookNameToUpdate
        );
        await notebookShutdownDialog.delete();
        expect(await notebookShutdownDialog.isClosed()).toBeTruthy();

        expect(await notebookDetailsPage.waitForState(LifecycleState.DELETING)).toBeTruthy();
        // None of the action buttons should be enabled while the notebook is in a DELETING state
        expect(await isActionButtonEnabled(notebookDetailsPage.OPEN_BUTTON)).toBeFalsy();
        expect(await isActionButtonEnabled(notebookDetailsPage.EDIT_BUTTON)).toBeFalsy();
        expect(await notebookDetailsPage.isDeleteButtonEnabled()).toBeFalsy();
        expect(await isActionButtonEnabled(notebookDetailsPage.DEACTIVATE_BUTTON)).toBeFalsy();

        expect(await notebookDetailsPage.waitForState(LifecycleState.DELETED)).toBeTruthy();
        // None of the action buttons should be enabled while the notebook is in a DELETED state
        expect(await isActionButtonEnabled(notebookDetailsPage.OPEN_BUTTON)).toBeFalsy();
        expect(await isActionButtonEnabled(notebookDetailsPage.EDIT_BUTTON)).toBeFalsy();
        expect(await isActionButtonEnabled(notebookDetailsPage.DEACTIVATE_BUTTON)).toBeFalsy();
        expect(await notebookDetailsPage.isDeleteButtonEnabled()).toBeFalsy();
      },
      NOTEBOOK_TIMEOUT
    );
  });

  describe("User can delete Project which has no active resource", () => {
    it(
      "User can delete an empty project",
      async () => {
        const projectDetails = new ProjectDetails(projectOcid);
        await projectDetails.navigate();
        await projectDetails.waitForPresent();
        expect(await projectDetails.isPageLoaded()).toBeTruthy();

        await projectDetails.clickDeleteButton();
        const projectDeleteDialog = new ProjectDeleteDialog();
        expect(await projectDeleteDialog.isOpen()).toBeTruthy();
        await projectDeleteDialog.enterText(
          projectDeleteDialog.CONFIRMATION_TEXT_FIELD,
          projectName
        );
        await projectDeleteDialog.delete();
        expect(await projectDeleteDialog.isClosed()).toBeTruthy();
        await projectDetails.waitForState(LifecycleState.DELETED);
      },
      TimeInterval.xl
    );
  });
});
