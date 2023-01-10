import * as React from "react";
import * as Messages from "../../../codegen/Messages";
import {
  Panel,
  PanelSize,
  CompartmentSelect,
  useConsoleState,
  ListingContextProvider,
} from "oui-savant";
import {
  Form,
  FormContextConsumer,
  SubForm,
  FormValues,
  FormErrors,
  Button,
  RadioGroup,
  OptionsGroupDirection,
  Tooltip,
  Icon,
  ButtonType,
  ButtonStyle,
} from "oui-react";
import { isValidModelOcid, validateField } from "utils/formUtils";
import { useModalState } from "hooks/useModalState";
import { Model } from "odsc-client/dist/odsc-client";
import TextInputButton from "components/TextInputButton/TextInputButton";
import RowContainer from "components/RowContainer/RowContainer";
import ProjectSelect from "projects/components/ProjectSelect/ProjectSelect";
import { Compartment } from "identity-control-plane-api-client";
import ListModels from "./ListModels/ListModelsByOcid";
import ListModelsByCompartment from "./ListModels/ListModelsByCompartment";
import { getHelpLink } from "utils/docUtils";
interface Props {
  activeProjectId?: string;
  preselectedModel?: Model;
  onClose: () => void;
  onModelDataSubmit: (selectedModel: Model) => void;
}

enum SelectOptions {
  SelectByCompartment = "SelectByCompartment",
  SelectUsingOCID = "SelectUsingOCID",
}

const ModelDeploymentSelectModelPanel: React.FC<Props> = ({
  activeProjectId,
  preselectedModel,
  onClose,
  onModelDataSubmit,
}) => {
  const { activeCompartment } = useConsoleState();
  const [compartmentId, setCompartmentId] = React.useState(
    preselectedModel && preselectedModel.compartmentId
      ? preselectedModel.compartmentId
      : activeCompartment.id
  );
  const [projectId, setProjectId] = React.useState(
    preselectedModel && preselectedModel.projectId ? preselectedModel.projectId : activeProjectId
  );
  const [listModels, openListModels, closeListModels, modelOcid] = useModalState();
  const [selectedModel, setSelectedModel] = React.useState<Model>(preselectedModel);
  const [selectOption, setSelectOption] = React.useState<string>(SelectOptions.SelectByCompartment);
  const modelSelectOptions = [
    {
      label: Messages.modelDeployments.selectPanes.modelSelect.labels.SelectByCompartment(),
      value: SelectOptions.SelectByCompartment,
      fieldName: SelectOptions.SelectByCompartment,
      testId: "radioButton1",
    },
    {
      label: Messages.modelDeployments.selectPanes.modelSelect.labels.SelectUsingOCID(),
      value: SelectOptions.SelectUsingOCID,
      fieldName: SelectOptions.SelectUsingOCID,
      testId: "radioButton2",
    },
  ];

  const validate = (values: FormValues): FormErrors => ({
    searchModelOCID: validateField({
      value: values.searchModelOCID,
      required: true,
      callback: (value: string) => isValidModelOcid(value).isValid,
      callbackMessage: isValidModelOcid(values.modelOcid).errorMessage,
    }),
  });

  const onSearchModelOcidChange = (): void => {
    setSelectedModel(undefined);
    closeListModels();
  };

  const onCompartmentChange = (compartment: Compartment) => {
    setCompartmentId(compartment.id);
    setProjectId(undefined);
  };

  const onOptionChange = (option: string) => {
    if (selectedModel && option === SelectOptions.SelectUsingOCID) {
      setSelectedModel(undefined);
    }
    if (preselectedModel && option === SelectOptions.SelectByCompartment) {
      setSelectedModel(preselectedModel);
      setCompartmentId(preselectedModel.compartmentId);
      setProjectId(preselectedModel.projectId);
    }
    setSelectOption(option);
  };

  const onProjectChange = (projectId: string) => {
    setProjectId(projectId);
    setSelectedModel(
      preselectedModel &&
        preselectedModel.compartmentId === compartmentId &&
        preselectedModel.projectId === projectId
        ? preselectedModel
        : null
    );
  };

  return (
    <Panel
      actions={[
        <Button
          type={ButtonType.Submit}
          buttonStyle={ButtonStyle.Primary}
          key={"form_btn_submit"}
          disabled={!selectedModel}
          testId="submitButton"
          onClick={() => onModelDataSubmit(selectedModel)}
        >
          {Messages.actions.submit()}
        </Button>,
      ]}
      size={PanelSize.Medium}
      title={Messages.modelDeployments.selectPanes.modelSelect.title()}
      onClose={onClose}
      helpLink={getHelpLink("/models-about.htm")}
    >
      <Form>
        <p>{Messages.modelDeployments.selectPanes.modelSelect.message()}</p>
        <RowContainer>
          <RadioGroup
            defaultValue={selectOption}
            direction={OptionsGroupDirection.Row}
            options={modelSelectOptions}
            onSelectionChange={onOptionChange}
            testId="radioGroup"
          />
          <>
            <Button buttonIcon={Icon.Info} />
            <Tooltip>
              {Messages.modelDeployments.selectPanes.modelSelect.tooltips.searchOCID()}
            </Tooltip>
          </>
        </RowContainer>
        {selectOption === SelectOptions.SelectUsingOCID && (
          <>
            <SubForm
              fieldName="modelOCIDSubForm"
              transformData={(data) => data}
              validator={validate}
            >
              <FormContextConsumer>
                {(formContext) => (
                  <TextInputButton
                    label={Messages.modelDeployments.selectPanes.modelSelect.labels.searchOCID()}
                    fieldName="searchModelOCID"
                    textInputTestId="searchModelOCID"
                    onTextInputChange={onSearchModelOcidChange}
                    buttonTestId="searchButton"
                    buttonDisabled={
                      typeof formContext.form.validate().searchModelOCID !== "undefined"
                    }
                    onButtonClick={() =>
                      openListModels(formContext.form.getValue("searchModelOCID"))
                    }
                    buttonName={Messages.modelDeployments.selectPanes.modelSelect.actions.search()}
                  />
                )}
              </FormContextConsumer>
            </SubForm>
            {listModels && (
              <ListingContextProvider>
                <ListModels modelId={modelOcid} onSelectedModelChanged={setSelectedModel} />
              </ListingContextProvider>
            )}
          </>
        )}
        {selectOption === SelectOptions.SelectByCompartment && (
          <>
            <CompartmentSelect
              fieldName="compartmentSelect"
              testId="compartmentSelect"
              value={compartmentId}
              onChange={onCompartmentChange}
              label={Messages.modelDeployments.selectPanes.modelSelect.labels.SelectFromCompartmentList()}
            />
            <ProjectSelect
              compartmentId={compartmentId}
              selectedProjectId={projectId}
              onChange={onProjectChange}
            />
            <ListingContextProvider>
              <ListModelsByCompartment
                preSelectedModel={
                  selectedModel &&
                  selectedModel.compartmentId === compartmentId &&
                  selectedModel.projectId === projectId
                    ? selectedModel
                    : null
                }
                selectedCompartmentId={compartmentId}
                selectedProjectId={projectId}
                onSelectedModelChanged={setSelectedModel}
              />
            </ListingContextProvider>
          </>
        )}
      </Form>
    </Panel>
  );
};

export default ModelDeploymentSelectModelPanel;
