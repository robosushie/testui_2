import { By } from "selenium-webdriver";
import { ActionPanel } from "./ActionPanel";

export class NotebookActivatePanel extends ActionPanel {
  // selectors
  protected panelSelector: By = By.xpath(`//div[@aria-label="Activate notebook session"]`);
  protected submitButtonSelector: By = By.xpath(
    `//button[@data-test-id="activate-notebook-session-submit-button"]`
  );
  protected blockStorageInputSelector: By = By.xpath(
    `//input[@data-test-id="notebook-activate-block-storage-size-input"]`
  );

  // Actions
  public async activateNotebook(blockStorageSize: string): Promise<void> {
    try {
      blockStorageSize && (await this.enterText(this.blockStorageInputSelector, blockStorageSize));
      await this.clickSubmitButtonIfPresent();
    } catch (error) {
      console.error(`Activating the notebook failed with the following error: ${error.message}`);
    }
  }
}
