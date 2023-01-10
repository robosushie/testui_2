import { ActionDialog } from "./ActionDialog";
import { Wait } from "ui-testing-core";
import { By } from "selenium-webdriver";
import { TimeInterval } from "oui-savant";
import { byDialogXpath } from "../helpers/utils";

export class ProjectDeleteDialog extends ActionDialog {
  private static ERROR_MESSAGE_TEXT: By = byDialogXpath(
    `//div[contains(@class, "oui-form-danger")]`
  );
  public CONFIRMATION_TEXT_FIELD: By = By.name("confirmedDelete");

  public async isDisplayingErrorMessage(): Promise<boolean> {
    try {
      await Wait.waitForPresent(ProjectDeleteDialog.ERROR_MESSAGE_TEXT, TimeInterval.xxl);
      return true;
    } catch (error) {
      console.error("Could not find project delete message", error);
      return false;
    }
  }

  public async delete(): Promise<void | string> {
    try {
      await this.clickPrimary();
    } catch (error) {
      console.error(
        `Selecting the project delete dialog button failed with the following error: ${error.message}`
      );
    }
  }
}
