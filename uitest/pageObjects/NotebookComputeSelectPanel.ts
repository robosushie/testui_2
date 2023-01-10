import { By } from "selenium-webdriver";
import { Wait, Actions, getDriver } from "ui-testing-core";
import { isActionButtonEnabled } from "../helpers/utils";
import { ActionPanel } from "./ActionPanel";

export class NotebookComputeSelectPanel extends ActionPanel {
  // selectors
  public static DEFAULT_SELECTED_SHAPE: string = `VM.Standard2.1`;
  protected panelSelector: By = By.xpath(`//div[@aria-label="Select compute"]`);
  protected submitButtonSelector: By = By.xpath(
    `//button[@data-test-id="notebook-session-compute-panel-submit-button"]`
  );
  protected shapeSeriesRadioButtonGroupSelector: By = By.xpath(
    `//div[@data-test-id="notebook-compute-panel-radio-group"]`
  );

  protected amdRomeInputSelector: By = By.xpath(`//input[@data-test-id="AMD_ROME"]`);
  protected intelSkylakeInputSelector: By = By.xpath(`//input[@data-test-id="INTEL_SKYLAKE"]`);
  protected nvidiaGpuInputSelector: By = By.xpath(`//input[@data-test-id="NVIDIA_GPU"]`);
  protected legacyInputSelector: By = By.xpath(`//input[@data-test-id="LEGACY"]`);
  protected shapesTableSelector: By = By.xpath(`//table[@data-test-id="compute-shapes-table"]`);
  protected flexSliderSelector: By = By.xpath(`//div[@class="flex-slider-wrapper"]`);
  protected flexOcpuSelector: By = By.xpath(
    `//input[@data-test-id='notebook-session-flex-input-ocpus-test-id']`
  );
  protected flexMemorySelector: By = By.xpath(
    `//input[@data-test-id='notebook-session-flex-input-memory-test-id']`
  );

  // Actions
  public async verifyAMDShapes(): Promise<void> {
    try {
      await Wait.waitForPresent(this.shapeSeriesRadioButtonGroupSelector);
      await getDriver().wait(async () => await isActionButtonEnabled(this.amdRomeInputSelector));
      await Actions.doClick(this.amdRomeInputSelector);
      await Wait.waitForPresent(this.flexSliderSelector);
      await Wait.waitForNotPresent(this.shapesTableSelector);
    } catch (err) {
      console.error(
        `Error verifying the notebook session compute panel radio buttons: ${err.message}`
      );
    }
  }

  public async verifyIntelShapes(): Promise<void> {
    try {
      await Wait.waitForPresent(this.shapeSeriesRadioButtonGroupSelector);
      await getDriver().wait(
        async () => await isActionButtonEnabled(this.intelSkylakeInputSelector)
      );
      await Actions.doClick(this.intelSkylakeInputSelector);
      await Wait.waitForNotPresent(this.flexSliderSelector);
      await Wait.waitForPresent(this.shapesTableSelector);
    } catch (err) {
      console.error(
        `Error verifying the Intel shapesin compute panel radio buttons: ${err.message}`
      );
    }
  }
  public async verifyLegacyShapes(): Promise<void> {
    try {
      await Wait.waitForPresent(this.shapeSeriesRadioButtonGroupSelector);
      await getDriver().wait(async () => await isActionButtonEnabled(this.legacyInputSelector));
      await Actions.doClick(this.legacyInputSelector);
      await Wait.waitForNotPresent(this.flexSliderSelector);
      await Wait.waitForPresent(this.shapesTableSelector);
    } catch (err) {
      console.error(
        `Error verifying the Intel shapesin compute panel radio buttons: ${err.message}`
      );
    }
  }
  public async verifyNvidiaShapes(): Promise<void> {
    try {
      await Wait.waitForPresent(this.shapeSeriesRadioButtonGroupSelector);
      await getDriver().wait(async () => await isActionButtonEnabled(this.nvidiaGpuInputSelector));
      await Actions.doClick(this.nvidiaGpuInputSelector);
      await Wait.waitForNotPresent(this.flexSliderSelector);
      await Wait.waitForPresent(this.shapesTableSelector);
    } catch (err) {
      console.error(
        `Error verifying the Intel shapesin compute panel radio buttons: ${err.message}`
      );
    }
  }

  public async selectAmdShape(ocpus: number, memory: number): Promise<void> {
    try {
      await this.verifyAMDShapes();

      // ocpu
      await Wait.waitForPresent(this.flexOcpuSelector);
      await this.enterText(this.flexOcpuSelector, ocpus.toString());
      await this.enterText(this.flexMemorySelector, memory.toString());
    } catch (err) {
      console.error(`Error while select flex shapes and providing the input: ${err.message}`);
    }
  }
}
