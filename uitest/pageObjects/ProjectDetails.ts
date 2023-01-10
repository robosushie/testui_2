import { Actions, Wait, BasePluginPage, getConfig } from "ui-testing-core";
import { By } from "selenium-webdriver";
import { TimeInterval } from "oui-savant";

import { byPageXpath, isActionButtonEnabled } from "../helpers/utils";

export class ProjectDetails extends BasePluginPage<ProjectDetails> {
  // These vars are required by the BasePluginPage
  protected pageUrl: string = "";
  protected isLegacyPlugin: boolean = false;
  protected pageLoadedElement: By = ProjectDetails.TITLE;

  public DELETE_PROJECT_BUTTON: By = By.xpath(
    '//button[@data-test-id="project-details-delete-btn" and text()="Delete"]'
  );

  constructor(projectOcid?: string) {
    super();
    this.pageUrl = `${getConfig("driverInfo").pluginName}projects/${projectOcid}?${
      getConfig("driverInfo").pluginOverride
    }`;
  }

  // Project Details Page Locators
  // *[@id="data-science-wrapper"]/div/div[2]/div[1]/div[1]/div/p
  private static TITLE: By = byPageXpath("//h1");
  private static PROJECT_NAME_BREADCRUMB: By = byPageXpath(
    "//ul[contains(@class, 'oui-breadcrumb')]/li[3]"
  );
  private static LIFECYCLE_STATE_TEXT: By = byPageXpath(
    '//p[contains(@class, "oui-status-badge__status__label")]'
  );
  public CREATE_NOTEBOOK_BUTTON: By = By.xpath('//button[text()="Create notebook session"]');
  public EDIT_BUTTON: By = byPageXpath('//button[text()="Edit"]');

  public async waitForPresent(): Promise<any> {
    // Use the breadcrumb as the definitive element for testing when the page is present.
    // This is more dependable than using the title / h1 element, which can exist across
    // transitions.
    try {
      return await Wait.waitForPresent(ProjectDetails.PROJECT_NAME_BREADCRUMB, TimeInterval.md);
    } catch (error) {
      console.error(`Waiting for the project details page to load failed: ${error.message}`);
    }
  }

  // Project Details Page Methods
  public async getTitle(): Promise<string> {
    try {
      return await Actions.getText(ProjectDetails.TITLE);
    } catch (error) {
      console.error(
        `Getting the project title text failed with the following error: ${error.message}`
      );
    }
  }

  public async clickCreateNotebookButton(): Promise<void> {
    try {
      await Actions.scrollIntoView(this.CREATE_NOTEBOOK_BUTTON);
      await Actions.doClick(this.CREATE_NOTEBOOK_BUTTON);
    } catch (error) {
      console.error(
        `Selecting the create notebook sessions button failed with the following error: ${error.message}`
      );
    }
  }

  public async waitForState(state: string): Promise<void> {
    try {
      await Wait.waitForText(ProjectDetails.LIFECYCLE_STATE_TEXT, state, true, 100000);
    } catch (error) {
      console.error(`Waiting for project state ${state} led to an error: ${error}`);
    }
  }

  public async clickDeleteButton(): Promise<void> {
    try {
      expect(await isActionButtonEnabled(this.DELETE_PROJECT_BUTTON)).toBeTruthy();
      await Actions.scrollIntoView(this.DELETE_PROJECT_BUTTON);
      await Actions.doClick(this.DELETE_PROJECT_BUTTON);
    } catch (error) {
      console.error(
        `Selecting the project delete button failed with the following error: ${error.message}`
      );
    }
  }
}
