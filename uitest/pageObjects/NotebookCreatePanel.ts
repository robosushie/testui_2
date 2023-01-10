import { By } from "selenium-webdriver";
import { Actions, getDriver, Wait } from "ui-testing-core";
import { isActionButtonEnabled } from "../helpers/utils";
import { ActionPanel } from "./ActionPanel";

export class NotebookCreatePanel extends ActionPanel {
  // Selectors
  protected panelSelector: By = By.xpath(`//div[@aria-label="Create notebook session"]`);
  protected nameInputSelector: By = By.xpath(
    `//input[@data-test-id="notebook-create-display-name-input"]`
  );
  protected blockVolumeSizeInputSelector: By = By.xpath(
    `//input[@data-test-id="notebook-create-block-storage-size-input"]`
  );
  protected submitButtonSelector: By = By.xpath(
    `//button[@data-test-id="create-notebook-session-submit-button"]`
  );
  protected selectComputeButtonSelector: By = By.xpath(
    `//button[@data-test-id="create-notebook-session-compute-select"]`
  );
  protected selectedShapeNameSelector: By = By.xpath(`//div[@class='select-card']//h3[1]`);
  protected selectShapeConfigSelector: By = By.xpath(`//div[@class='select-card']//p[1]`);

  // Actions
  public async create(blockStorageSize: string, name?: string): Promise<void> {
    try {
      blockStorageSize &&
        (await this.enterText(this.blockVolumeSizeInputSelector, blockStorageSize));
      name && (await this.enterText(this.nameInputSelector, name));

      await this.clickSubmitButton();
    } catch (error) {
      console.error("Notebook create failed:", error);
    }
  }

  public async openComputePanel(): Promise<void> {
    try {
      await getDriver().wait(
        async () => await isActionButtonEnabled(this.selectComputeButtonSelector)
      );
      await Actions.doClick(this.selectComputeButtonSelector);
    } catch (err) {
      console.error(`Error during compute panel ${err}`);
    }
  }

  public async verifySelectedShapeName(shapeName: string): Promise<boolean> {
    try {
      await Wait.waitForText(this.selectedShapeNameSelector, shapeName, false);
      return true;
    } catch (err) {
      console.error(`Error during fetching the select shape name in create panel : ${err.message}`);
    }
    return false;
  }

  public async verifySelectedShapeConfig(config: string): Promise<boolean> {
    try {
      await Wait.waitForText(this.selectShapeConfigSelector, config, false);
      return true;
    } catch (err) {
      console.error(
        `Error during fetching the select shape config in create panel : ${err.message}`
      );
    }
    return false;
  }
}
