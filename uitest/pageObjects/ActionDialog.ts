import { By } from "selenium-webdriver";
import { Actions, Wait, getDriver } from "ui-testing-core";
import { TimeInterval } from "oui-savant";

import { byDialogXpath, isActionButtonEnabled } from "../helpers/utils";

/**
 * The base class for action dialogs (delete, edit, create, etc.)
 */
export class ActionDialog {
  private static VIEW_DETAILS_CHECKBOX: By = By.id("redirectOnCreate");
  private static PRIMARY_BUTTON: By = byDialogXpath("//div[@class='oui-modal-footer']//button[1]");
  private static CANCEL_BUTTON: By = byDialogXpath(
    "//div[@class='oui-modal-footer']//button[text()='Cancel']"
  );
  private static DIALOG_CONTAINER: By = byDialogXpath("//div[contains(@class, 'oui-modal')]");

  public async enterText(field: By, value: string): Promise<void> {
    try {
      await Actions.doClick(field);
      await Actions.enterText(field, value);
    } catch (error) {
      console.error(
        `Entering a ${field.toString()} in a dialog failed with the following error: ${
          error.message
        }`
      );
    }
  }

  public async enterTextArea(field: By, value: string): Promise<void> {
    try {
      await Actions.doClick(field);
      await Actions.enterTextArea(field, value);
    } catch (error) {
      console.error(
        `Entering a ${field.toString()} in a dialog failed with the following error: ${
          error.message
        }`
      );
    }
  }

  public async toggleViewDetailsCheckbox(): Promise<void> {
    try {
      await Actions.doClick(ActionDialog.VIEW_DETAILS_CHECKBOX);
    } catch (error) {
      console.error(
        `Clicking the view detail checkbox failed with the following error: ${error.message}`
      );
    }
  }

  public async clickPrimary(): Promise<void> {
    try {
      await getDriver().wait(async () => await isActionButtonEnabled(ActionDialog.PRIMARY_BUTTON));
      await Actions.doClick(ActionDialog.PRIMARY_BUTTON);
    } catch (error) {
      console.error("Clicking primary dialog button failed", error);
    }
  }

  public async clickCancel(): Promise<void> {
    try {
      await Actions.doClick(ActionDialog.CANCEL_BUTTON);
    } catch (error) {
      console.error("Clicking secondary dialog button failed", error);
    }
  }

  public async isOpen(): Promise<boolean> {
    try {
      await Wait.waitForPresent(ActionDialog.DIALOG_CONTAINER, TimeInterval.xl);
      return true;
    } catch (error) {
      console.error("Waiting for dialog to open failed", error);
      return false;
    }
  }

  public async isClosed(): Promise<boolean> {
    try {
      await Wait.waitForNotPresent(ActionDialog.DIALOG_CONTAINER, TimeInterval.xl);
      return true;
    } catch (error) {
      console.error("Waiting for dialog to close failed", error);
      return false;
    }
  }
}
