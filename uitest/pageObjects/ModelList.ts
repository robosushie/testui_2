import { Actions, getConfig, BasePluginPage, Wait } from "ui-testing-core";
import { By } from "selenium-webdriver";
import { TimeInterval } from "oui-savant";

export class ModelList extends BasePluginPage<ModelList> {
  /* Projects Page URL */
  protected pageUrl: string = "";

  /* Plugin is not a legacy plugin */
  protected isLegacyPlugin: boolean = false;

  /* Locator to help BasePluginPage determine if the Model page has loaded successfully */
  protected pageLoadedElement: By = ModelList.TITLE;

  constructor(projectOcid?: string) {
    super();
    this.pageUrl = `${getConfig("driverInfo").pluginName}projects/${projectOcid}/models?${
      getConfig("driverInfo").pluginOverride
    }`;
  }

  /* Page Locators */
  private static TITLE: By = By.xpath('//*[@id="oui-savant__listing-content"]/div/h1/div');
  public CREATE_MODEL_BUTTON: By = By.xpath('//button[text()="Create Model"]');

  public async clickCreateModelButton(): Promise<void> {
    try {
      await Actions.doClick(this.CREATE_MODEL_BUTTON);
    } catch (error) {
      console.error(
        `Selecting the create model button failed with the following error: ${error.message}`
      );
    }
  }

  private getListColumn(resourceOcid: string, columnIndex: number): By {
    return By.xpath(`//a[contains(@href, "${resourceOcid}")]/../../td[${columnIndex}]`);
  }

  public async waitForColumnText(
    resourceOcid: string,
    columnIndex: number,
    text: string
  ): Promise<boolean> {
    try {
      const stateColumn = this.getListColumn(resourceOcid, columnIndex);
      await Wait.waitForText(stateColumn, text, true, TimeInterval.md);
      return true;
    } catch (error) {
      console.error(`waiting for model text in model list page failed: ${error.message}`);
    }
  }

  public async getColumnText(resourceOcid: string, columnIndex: number): Promise<string> {
    try {
      const stateColumn = this.getListColumn(resourceOcid, columnIndex);
      return await Actions.getText(stateColumn);
    } catch (error) {
      console.error(`Getting for model detail from model list page failed: ${error.message}`);
    }
  }
}
