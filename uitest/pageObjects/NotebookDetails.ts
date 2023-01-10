import { TimeInterval } from "oui-savant";
import { BasePluginPage, Actions, Wait, getConfig } from "ui-testing-core";
import { By } from "selenium-webdriver";

import { byPageXpath, isActionButtonEnabled } from "../helpers/utils";
import { NOTEBOOK_TIMEOUT } from "../helpers/constants";

export class NotebookDetails extends BasePluginPage<NotebookDetails> {
  // The following class vars are required by BasePluginPage
  protected pageUrl: string = "";
  protected pageLoadedElement: By = NotebookDetails.NAME;
  protected isLegacyPlugin: boolean = false;

  constructor(ocid?: string) {
    super();
    this.pageUrl = this.pageUrl = `${getConfig("driverInfo").pluginName}notebook-sessions/${ocid}?${
      getConfig("driverInfo").pluginOverride
    }`;
  }

  // Internal Notebook Session Details Page Locators
  private static NAME: By = byPageXpath("//h1");
  private static NOTEBOOK_NAME_BREADCRUMB: By = byPageXpath(
    "//ul[contains(@class, 'oui-breadcrumb')]/li[4]"
  );
  private static CREATED_BY: By = By.xpath("//strong[contains(text(),'Created by')]/../span");
  private static INSTANCE_SHAPE: By = By.xpath(
    "//div[@data-test-id='notebook-details-shape']/span"
  );
  private static BLOCK_VOLUME_SIZE: By = By.xpath(
    "//div[@data-test-id='notebook-details-block-storage-size']/span"
  );
  private static LIFECYCLE_STATE_TEXT: By = byPageXpath(
    '//p[contains(@class, "oui-status-badge__status__label")]'
  );
  // Public Notebook Session Details Page Locators
  public OPEN_BUTTON: By = By.xpath('//button[@data-test-id="notebook-details-open-btn"]');
  public EDIT_BUTTON: By = By.xpath('//button[@data-test-id="notebook-details-edit-btn"]');
  public DELETE_BUTTON: By = By.xpath('//button[@data-test-id="notebook-details-delete-btn"]');
  public DEACTIVATE_BUTTON: By = By.xpath(
    '//button[@data-test-id="notebook-details-deactivate-btn"]'
  );
  public ACTIVATE_BUTTON: By = By.xpath('//button[@data-test-id="notebook-details-activate-btn"]');
  public MORE_ACTIONS_BUTTON: By = By.xpath('//button[text()="More Actions"]');

  public async waitForPresent(): Promise<any> {
    /**
     * Use the breadcrumb as the definitive element for testing when the page is present.
     * This is more dependable than using the title / h1 element, as both the project
     * details page to notebook details page have this element.
     */
    try {
      return Wait.waitForPresent(NotebookDetails.NOTEBOOK_NAME_BREADCRUMB, TimeInterval.lg);
    } catch (error) {
      console.error(`Waiting for the notebook details page to load failed: ${error.message}`);
    }
  }

  public async getName(): Promise<string> {
    try {
      return await Actions.getText(NotebookDetails.NAME);
    } catch (error) {
      console.error(
        `Getting the notebook session name failed with the following error: ${error.message}`
      );
    }
  }

  public async getCreatedBy(): Promise<string> {
    try {
      return await Actions.getText(NotebookDetails.CREATED_BY);
    } catch (error) {
      console.error(
        `Getting the created by user failed with the following error: ${error.message}`
      );
    }
  }

  public async getInstanceShape(): Promise<string> {
    try {
      return await Actions.getText(NotebookDetails.INSTANCE_SHAPE);
    } catch (error) {
      console.error(`Getting the instance shape failed with the following error: ${error.message}`);
    }
  }

  public async getBlockVolumeSize(): Promise<string> {
    try {
      return await Actions.getText(NotebookDetails.BLOCK_VOLUME_SIZE);
    } catch (error) {
      console.error(
        `Getting the block volume size failed with the following error: ${error.message}`
      );
    }
  }

  public async waitForState(state: string): Promise<boolean> {
    try {
      await Wait.waitForText(NotebookDetails.LIFECYCLE_STATE_TEXT, state, true, NOTEBOOK_TIMEOUT);
      return true;
    } catch (error) {
      console.error(
        `Waiting for notebook detail page to reach ${state} state failed: ${error.message}`
      );
    }
  }

  public async clickActionButton(by: By): Promise<void> {
    try {
      await Actions.doClick(by);
    } catch (error) {
      console.error(
        `Click the  ${by.toString()} button failed with the following error: ${error.message}`
      );
    }
  }

  public async isDeleteButtonEnabled(): Promise<boolean> {
    try {
      await this.clickActionButton(this.MORE_ACTIONS_BUTTON);
      return await isActionButtonEnabled(this.DELETE_BUTTON);
    } catch (err) {
      console.error(
        `Failed while checking for notebook session delete button enable: ${err.message}`
      );
    }
  }

  public async clickDeleteButton(): Promise<void> {
    try {
      expect(await isActionButtonEnabled(this.MORE_ACTIONS_BUTTON)).toBeTruthy();
      await this.clickActionButton(this.MORE_ACTIONS_BUTTON);
      expect(await isActionButtonEnabled(this.DELETE_BUTTON)).toBeTruthy();
      await this.clickActionButton(this.DELETE_BUTTON);
    } catch (err) {
      console.error(
        `Failed while clicking for notebook session delete button enable: ${err.message}`
      );
    }
  }
}
