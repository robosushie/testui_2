import { TimeInterval } from "oui-savant";
import { By } from "selenium-webdriver";
import { Actions, getDriver, Wait } from "ui-testing-core";
import { isActionButtonEnabled } from "../helpers/utils";

export abstract class ActionPanel {
  protected abstract panelSelector: By;
  protected abstract submitButtonSelector: By;
  protected cancelButtonSelector: By = By.xpath(`//button[text()='Cancel']`);

  // Actions
  public async enterText(field: By, value: string): Promise<void> {
    try {
      // await Actions.doClick(field);
      await Actions.enterText(field, value);
    } catch (error) {
      console.error(
        `Entering a ${field.toString()} in a panel failed with the following error: ${
          error.message
        }`
      );
    }
  }

  public async enterTextArea(field: By, value: string): Promise<void> {
    try {
      // await Actions.doClick(field);
      await Actions.enterTextArea(field, value);
    } catch (error) {
      console.error(
        `Entering a ${field.toString()} in a panel failed with the following error: ${
          error.message
        }`
      );
    }
  }

  public async isPanelOpen(): Promise<boolean> {
    try {
      await Wait.waitForPresent(this.panelSelector, TimeInterval.xl);
      return true;
    } catch (error) {
      console.error("Waiting for panel to open failed", error);
      return false;
    }
  }

  public async isPanelClosed(): Promise<boolean> {
    try {
      await Wait.waitForNotPresent(this.panelSelector, TimeInterval.xl);
      return true;
    } catch (error) {
      console.error("Waiting for panel to close failed", error);
      return false;
    }
  }

  public async clickSubmitButton(): Promise<void> {
    try {
      await getDriver().wait(async () => await isActionButtonEnabled(this.submitButtonSelector));
      await Actions.doClick(this.submitButtonSelector);
    } catch (error) {
      console.error("Clicking submit button failed", error);
    }
  }

  public async clickSubmitButtonIfPresent(): Promise<void> {
    try {
      await Wait.waitForPresent(this.submitButtonSelector, TimeInterval.md);
      // await Actions.scrollIntoView(this.submitButtonSelector);
      await Actions.doClick(this.submitButtonSelector);
    } catch (error) {
      console.error("Clicking submit button failed", error);
    }
  }
}
