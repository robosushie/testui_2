import { By } from "selenium-webdriver";
import { Actions, Wait } from "ui-testing-core";
import { isActionButtonEnabled } from "../helpers/utils";

/**
 * The class for action menu in List view (delete, edit, etc.)
 */
export class ListActionMenu {
  private getActionMenu(resourceOcid: string): By {
    return By.xpath(
      `//a[contains(@href, "${resourceOcid}")]/../../td[@class='oui-table__action-menu__cell']/button`
    );
  }

  private getMenuAction(actionText: string): By {
    return By.xpath(
      `//*[@class='oui-table__action-menu__tooltip']//button[text()="${actionText}"]`
    );
  }

  private getMenuActionByTestId(testId: string): By {
    return By.xpath(
      `//*[@class='oui-table__action-menu__tooltip']//button[@data-test-id="${testId}"]`
    );
  }

  /**
   * This method is to open List action menu
   * */
  public async openActionMenu(resourceOcid: string): Promise<void> {
    const actionMenuPath = this.getActionMenu(resourceOcid);
    await Actions.doClick(actionMenuPath);
  }

  /**
   * Click List menu action
   * and make sure Action Menu is already open before this method call
   * */
  public async clickMenuAction(actionText: string): Promise<void> {
    // find the action by text
    const actionButton = this.getMenuAction(actionText);
    await Wait.waitForPresent(actionButton);

    // click on action
    await Actions.doClick(actionButton);
  }

  /**
   * Click List menu action
   * and make sure Action Menu is already open before this method call
   * */
  public async clickMenuActionByTestId(testId: string): Promise<void> {
    // find the action by text
    const actionButton = this.getMenuActionByTestId(testId);
    await Wait.waitForPresent(actionButton);

    // click on action
    await Actions.doClick(actionButton);
  }

  /**
   * Check if List menu action is enabled or not
   * and make sure Action Menu is already open before this method call
   * */
  public async isMenuActionEnabled(actionText: string): Promise<boolean> {
    // find the action by text
    const actionButton = this.getMenuAction(actionText);

    // Get element for action
    return await isActionButtonEnabled(actionButton);
  }

  /**
   * Check if List menu action is enabled or not
   * and make sure Action Menu is already open before this method call
   * */
  public async isMenuActionEnabledByTestId(testId: string): Promise<boolean> {
    // find the action by text
    const actionButton = this.getMenuActionByTestId(testId);

    // Get element for action
    const actionElement = await Wait.waitForPresent(actionButton);
    return actionElement.isEnabled();
  }
}
