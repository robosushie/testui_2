import * as React from "react";
import * as Messages from "../../../codegen/Messages";
import "./ModelProvenancePanel.less";
import {
  CardRadioGroup,
  CompartmentScopedField,
  DisclosureLink,
  FormRemoteSubmitButton,
  ListingContextProvider,
  Panel,
  PanelSize,
  useConsoleState,
} from "oui-savant";
import {
  Button,
  Field,
  FieldSet,
  Form,
  FormContextConsumer,
  FormErrors,
  FormRef,
  FormValues,
  Icon,
  InfoBlockStatus,
  OptionsGroupDirection,
  RadioGroup,
  SubForm,
  TextInput,
  ToastNotification,
  Tooltip,
} from "oui-react";
import { isValidTrainingOcid, validateField } from "utils/formUtils";
import { useModalState } from "hooks/useModalState";
import TextInputButton from "components/TextInputButton/TextInputButton";
import RowContainer from "components/RowContainer/RowContainer";
import ProjectSelect from "projects/components/ProjectSelect/ProjectSelect";

import { getHelpLink, MODELS_SAVING } from "utils/docUtils";
import { Examples } from "../../constants/examples";
import { Compartment } from "identity-control-plane-api-client";
import ListModelProvenanceByCompartment from "./ListModelProvenanceByCompartment";
import { ModelProvenance } from "odsc-client/dist/odsc-client";
import ListModelProvenanceByOcid from "./ListModelProvenanceByOcid";
import Label from "../../components/Label/Label";

interface Props {
  activeProjectId?: string;
  preselectedModelProvenanceTrainingResource?: any;
  preselectedModelProvenanceCardType?: string;
  onClose: () => void;
  preselectedModelProvenance: ModelProvenance;
  onModelProvenanceSubmit: (
    selectedModelProvenance: ModelProvenance,
    selectedModelProvenanceResource: any
  ) => void;
}

enum SelectOptions {
  SelectByCompartmentAndProject = "SelectByCompartmentAndProject",
  SelectUsingOCID = "SelectUsingOCID",
}
export enum SelectModelProvenanceOptions {
  SelectByNotebookSession = "Notebook session",
  SelectByJobRun = "Job run",
}

export const ModelProvenancePanel: React.FC<Props> = ({
  activeProjectId,
  preselectedModelProvenanceTrainingResource,
  onClose,
  onModelProvenanceSubmit,
  preselectedModelProvenanceCardType,
  preselectedModelProvenance,
}) => {
  const { activeCompartment, compartments } = useConsoleState();
  const pageSizeForListByCompartment = 10;
  const [compartmentId, setCompartmentId] = React.useState(
    preselectedModelProvenanceTrainingResource &&
      preselectedModelProvenanceTrainingResource.compartmentId
      ? preselectedModelProvenanceTrainingResource.compartmentId
      : activeCompartment.id
  );

  const [projectId, setProjectId] = React.useState(
    preselectedModelProvenanceTrainingResource &&
      preselectedModelProvenanceTrainingResource.projectId
      ? preselectedModelProvenanceTrainingResource.projectId
      : activeProjectId
  );
  const [selectModelProvenanceTypeOption, setSelectModelProvenanceTypeOption] = React.useState(
    preselectedModelProvenanceCardType
  );
  const [isValidSubForm, setIsValidSubForm] = React.useState(false);
  const [
    listModelProvenance,
    openListModelProvenance,
    closeListModelProvenance,
    modelProvenanceTrainingResourceOcid,
  ] = useModalState();
  const [selectedModelProvenanceTrainingResource, setSelectedModelProvenanceTrainingResource] =
    React.useState<any>(preselectedModelProvenanceTrainingResource);
  const selectedModelProvenance = preselectedModelProvenance ? preselectedModelProvenance : {};
  const [selectOption, setSelectOption] = React.useState<string>(
    SelectOptions.SelectByCompartmentAndProject
  );
  const validate = (values: FormValues): FormErrors => ({
    repositoryUrl: validateField({ value: values.repositoryUrl, maxLen: 255 }),
    gitCommit: validateField({ value: values.gitCommit, maxLen: 255 }),
    gitBranch: validateField({ value: values.gitBranch, maxLen: 255 }),
    scriptDir: validateField({ value: values.scriptDir, maxLen: 255 }),
    trainingScript: validateField({ value: values.trainingScript, maxLen: 255 }),
  });

  const isValidTrainingOcidValue = (modelProvenanceTrainingResourceOcid: any) => {
    setIsValidSubForm(
      !!modelProvenanceTrainingResourceOcid
        ? isValidTrainingOcid(modelProvenanceTrainingResourceOcid, selectModelProvenanceTypeOption)
            .isValid
        : false
    );
    return isValidTrainingOcid(
      modelProvenanceTrainingResourceOcid,
      selectModelProvenanceTypeOption
    );
  };

  const validateSubForm = (values: FormValues): FormErrors => ({
    searchModelProvenanceTrainingOCID: validateField({
      value: values.searchModelProvenanceTrainingOCID,
      required: false,
      callback: (value: string) => isValidTrainingOcidValue(value).isValid,
      callbackMessage: isValidTrainingOcidValue(values.modelProvenanceTrainingResourceOcid)
        .errorMessage,
    }),
  });

  const onCompartmentChange = (compartment: Compartment) => {
    setCompartmentId(compartment.id);
    setProjectId(undefined);
  };
  const ModelProvenanceTrainingOcidSelectOptions = [
    {
      label:
        Messages.models.selectPanes.modelProvenanceSelect.labels.selectByCompartmentAndProject(),
      value: SelectOptions.SelectByCompartmentAndProject,
      fieldName: SelectOptions.SelectByCompartmentAndProject,
      testId: "SelectByCompartmentRadioButton",
    },
    {
      label: (
        <>
          {Messages.models.selectPanes.modelProvenanceSelect.labels.searchOCID()}
          &emsp;
          <Button buttonIcon={Icon.Info} />
          <Tooltip>
            {selectModelProvenanceTypeOption ===
            SelectModelProvenanceOptions.SelectByNotebookSession
              ? Messages.models.selectPanes.modelProvenanceSelect.notebookSession.tooltip()
              : Messages.models.selectPanes.modelProvenanceSelect.jobsRun.tooltip()}
          </Tooltip>
        </>
      ),
      value: SelectOptions.SelectUsingOCID,
      fieldName: SelectOptions.SelectUsingOCID,
      testId: "SelectUsingOCIDRadioButton",
    },
  ];

  const onSearchModelProvenanceOcidChange = (): void => {
    setSelectedModelProvenanceTrainingResource(undefined);
    closeListModelProvenance();
  };

  const onOptionChange = (option: string) => {
    if (selectedModelProvenanceTrainingResource && option === SelectOptions.SelectUsingOCID) {
      setSelectedModelProvenanceTrainingResource(null);
    }
    if (
      selectedModelProvenanceTrainingResource &&
      option === SelectOptions.SelectByCompartmentAndProject
    ) {
      setSelectedModelProvenanceTrainingResource(selectedModelProvenanceTrainingResource);
      setCompartmentId(selectedModelProvenanceTrainingResource.compartmentId);
      setProjectId(selectedModelProvenanceTrainingResource.projectId);
    }
    setSelectOption(option);
  };
  const onCardOptionChange = (option: string) => {
    if (option === SelectModelProvenanceOptions.SelectByNotebookSession) {
      setSelectModelProvenanceTypeOption(SelectModelProvenanceOptions.SelectByNotebookSession);
    } else {
      setSelectModelProvenanceTypeOption(SelectModelProvenanceOptions.SelectByJobRun);
    }
  };
  const onProjectChange = (projectId: string) => {
    setProjectId(projectId);
    setSelectedModelProvenanceTrainingResource(
      selectedModelProvenanceTrainingResource &&
        selectedModelProvenanceTrainingResource.compartmentId === compartmentId &&
        selectedModelProvenanceTrainingResource.projectId === projectId
        ? selectedModelProvenanceTrainingResource
        : null
    );
  };
  const ModelProvenanceTypeOptions = [
    {
      label: Messages.models.selectPanes.modelProvenanceSelect.notebookSession.optionText(),
      value: SelectModelProvenanceOptions.SelectByNotebookSession,
      description: Messages.models.selectPanes.modelProvenanceSelect.notebookSession.description(),
    },
    {
      label: Messages.models.selectPanes.modelProvenanceSelect.jobsRun.optionText(),
      value: SelectModelProvenanceOptions.SelectByJobRun,
      description: Messages.models.selectPanes.modelProvenanceSelect.jobsRun.description(),
    },
  ];
  const [ref, setRef] = React.useState<FormRef>(undefined);
  const getFormRef = (formRef: FormRef): FormRef => {
    setRef(formRef);
    return formRef;
  };
  const onSubmit = (form: Form): void => {
    const values = form.getValues() as ModelProvenance;
    values.scriptDir = !!values.scriptDir ? values.scriptDir : null;
    values.gitBranch = !!values.gitBranch ? values.gitBranch : null;
    values.gitCommit = !!values.gitCommit ? values.gitCommit : null;
    values.repositoryUrl = !!values.repositoryUrl ? values.repositoryUrl : null;
    values.trainingScript = !!values.trainingScript ? values.trainingScript : null;
    values.trainingId =
      !!selectedModelProvenanceTrainingResource && selectedModelProvenanceTrainingResource.id
        ? selectedModelProvenanceTrainingResource.id
        : null;
    if (!!values.trainingId) {
      ToastNotification.create({
        title: Messages.models.selectPanes.modelProvenanceSelect.toastNotification(
          selectedModelProvenanceTrainingResource.displayName
        ),
        status: InfoBlockStatus.Success,
      });
    }
    onModelProvenanceSubmit(values, selectedModelProvenanceTrainingResource);
  };
  const defaultValues = {
    gitBranch: selectedModelProvenance.gitBranch,
    gitCommit: selectedModelProvenance.gitCommit,
    repositoryUrl: selectedModelProvenance.repositoryUrl,
    scriptDir: selectedModelProvenance.scriptDir,
    trainingScript: selectedModelProvenance.trainingScript,
  };

  const onSelectedModelProvenanceChanged = (value: any) => {
    setSelectedModelProvenanceTrainingResource(value);
  };

  const fetchInitialCompartmentForProjectSelect = () => {
    return preselectedModelProvenanceTrainingResource &&
      preselectedModelProvenanceTrainingResource.compartmentId
      ? compartments.find(
          (compartment) =>
            compartment.id === preselectedModelProvenanceTrainingResource.compartmentId
        )
      : activeCompartment;
  };

  return (
    <Form
      formRef={getFormRef}
      onSubmit={onSubmit}
      defaultValues={defaultValues}
      validator={validate}
    >
      <Panel
        actions={[
          <FormRemoteSubmitButton formRef={ref} key={"form_btn_select"}>
            {Messages.actions.select()}
          </FormRemoteSubmitButton>,
        ]}
        size={PanelSize.Medium}
        title={Messages.models.selectPanes.modelProvenanceSelect.title()}
        onClose={onClose}
        helpLink={getHelpLink(MODELS_SAVING)}
      >
        <p>{Messages.models.selectPanes.modelProvenanceSelect.description()}</p>
        <FieldSet legend={Messages.models.selectPanes.modelProvenanceSelect.label()}>
          <CardRadioGroup
            columns={2}
            fieldName="Model Provenance Type"
            options={ModelProvenanceTypeOptions}
            defaultValue={preselectedModelProvenanceCardType}
            onSelectionChange={onCardOptionChange}
            addRoleGroup={false}
          />
          <>
            <br />
            {selectModelProvenanceTypeOption ===
            SelectModelProvenanceOptions.SelectByNotebookSession ? (
              <Label>
                {Messages.models.selectPanes.modelProvenanceSelect.notebookSession.label()}
              </Label>
            ) : (
              <Label>{Messages.models.selectPanes.modelProvenanceSelect.jobsRun.label()}</Label>
            )}
            <RowContainer>
              <RadioGroup
                defaultValue={selectOption}
                direction={OptionsGroupDirection.Row}
                options={ModelProvenanceTrainingOcidSelectOptions}
                onSelectionChange={onOptionChange}
                testId="radioGroup"
              />
            </RowContainer>

            {selectOption === SelectOptions.SelectUsingOCID && (
              <>
                <SubForm
                  fieldName="modelProvenanceOCIDSubForm"
                  transformData={(data) => data}
                  validator={validateSubForm}
                >
                  <FormContextConsumer>
                    {(formContext) => (
                      <div className={"oui-provenance-search-button"}>
                        <TextInputButton
                          label={
                            selectModelProvenanceTypeOption ===
                            SelectModelProvenanceOptions.SelectByNotebookSession
                              ? Messages.models.selectPanes.modelProvenanceSelect.labels.searchByOCIDLabel()
                              : Messages.models.selectPanes.modelProvenanceSelect.labels.searchByJobRunOCIDLabel()
                          }
                          fieldName="searchModelProvenanceTrainingOCID"
                          textInputTestId="searchModelProvenanceTrainingOCID"
                          onTextInputChange={onSearchModelProvenanceOcidChange}
                          buttonTestId="searchButton"
                          buttonDisabled={!isValidSubForm}
                          onButtonClick={() =>
                            openListModelProvenance(
                              formContext.form.getValue("searchModelProvenanceTrainingOCID")
                            )
                          }
                          buttonName={Messages.models.selectPanes.modelProvenanceSelect.actions.search()}
                        />
                        {/*This placebo element is created so that the validate function gets
                  called when the selected file is set*/}
                        <div className="hidden">
                          <Field fieldName="placeboElement">
                            <TextInput
                              value={
                                selectModelProvenanceTypeOption ===
                                SelectModelProvenanceOptions.SelectByJobRun
                                  ? "true"
                                  : "false"
                              }
                            />
                          </Field>
                        </div>
                      </div>
                    )}
                  </FormContextConsumer>
                </SubForm>
                {listModelProvenance && (
                  <ListingContextProvider>
                    <ListModelProvenanceByOcid
                      notebookSessionId={modelProvenanceTrainingResourceOcid}
                      selectModelProvenanceTypeOption={selectModelProvenanceTypeOption}
                      onSelectedModelProvenanceChanged={onSelectedModelProvenanceChanged}
                      jobRunId={modelProvenanceTrainingResourceOcid}
                    />
                  </ListingContextProvider>
                )}
              </>
            )}
            {selectOption === SelectOptions.SelectByCompartmentAndProject && (
              <>
                <CompartmentScopedField
                  fieldName={"compartmentScopedSelect"}
                  label={Messages.models.selectPanes.modelProvenanceSelect.labels.selectByProjectLabel()}
                  initialCompartment={fetchInitialCompartmentForProjectSelect()}
                  onChange={onCompartmentChange}
                >
                  {({ selectedCompartment }) => (
                    <ProjectSelect
                      compartmentId={selectedCompartment.id}
                      selectedProjectId={projectId}
                      onChange={onProjectChange}
                      label={""}
                    />
                  )}
                </CompartmentScopedField>
                {SelectModelProvenanceOptions.SelectByNotebookSession ===
                selectModelProvenanceTypeOption ? (
                  <p className="compartment-scoped-field-metadata">
                    {Messages.models.selectPanes.modelProvenanceSelect.notebookSession.cardDesc()}
                  </p>
                ) : (
                  <p className="compartment-scoped-field-jobRun-metadata">
                    {Messages.models.selectPanes.modelProvenanceSelect.jobsRun.cardDesc()}
                  </p>
                )}
                <ListingContextProvider paging={{ pageSize: pageSizeForListByCompartment }}>
                  <ListModelProvenanceByCompartment
                    preselectedModelProvenanceTrainingOcid={
                      selectedModelProvenanceTrainingResource &&
                      selectedModelProvenanceTrainingResource.compartmentId === compartmentId &&
                      selectedModelProvenanceTrainingResource.projectId === projectId
                        ? selectedModelProvenanceTrainingResource
                        : null
                    }
                    selectModelProvenanceTypeOption={selectModelProvenanceTypeOption}
                    selectedCompartmentId={compartmentId}
                    selectedProjectId={projectId}
                    onSelectedModelProvenanceChanged={onSelectedModelProvenanceChanged}
                  />
                </ListingContextProvider>
              </>
            )}
          </>
        </FieldSet>
        <div className={"oui-training-fieldset"}>
          <DisclosureLink>
            <FieldSet
              legend={Messages.models.selectPanes.modelProvenanceSelect.trainingCode.optionText()}
            >
              <Field
                label={Messages.models.selectPanes.modelProvenanceSelect.trainingCode.label.repositoryUrl()}
                fieldName="repositoryUrl"
                hint={Messages.models.hints.example(Examples.REPOSITORY_URL)}
                optional={true}
                tooltip={Messages.models.selectPanes.modelProvenanceSelect.tooltip.gitRepoURL()}
              >
                <TextInput testId="repositoryUrl-input" />
              </Field>
              <Field
                label={Messages.models.selectPanes.modelProvenanceSelect.trainingCode.label.gitCommit()}
                fieldName="gitCommit"
                hint={Messages.models.hints.example(Examples.COMMIT_HASH)}
                optional={true}
                tooltip={Messages.models.selectPanes.modelProvenanceSelect.tooltip.gitCommit()}
              >
                <TextInput testId="gitCommit-input" />
              </Field>
              <Field
                label={Messages.models.selectPanes.modelProvenanceSelect.trainingCode.label.gitBranch()}
                fieldName="gitBranch"
                hint={Messages.models.hints.example(Examples.BRANCH_NAME)}
                optional={true}
                tooltip={Messages.models.selectPanes.modelProvenanceSelect.tooltip.gitBranch()}
              >
                <TextInput testId="gitBranch-name-input" />
              </Field>
              <Field
                label={Messages.models.selectPanes.modelProvenanceSelect.trainingCode.label.scriptDir()}
                fieldName="scriptDir"
                hint={Messages.models.hints.example(Examples.SCRIPT_DIRECTORY)}
                optional={true}
                tooltip={Messages.models.selectPanes.modelProvenanceSelect.tooltip.modelTrainingScript()}
              >
                <TextInput testId="scriptDir-input" />
              </Field>
              <Field
                label={Messages.models.selectPanes.modelProvenanceSelect.trainingCode.label.trainingScript()}
                fieldName="trainingScript"
                hint={Messages.models.hints.example(Examples.TRAINING_SCRIPT)}
                optional={true}
                tooltip={Messages.models.selectPanes.modelProvenanceSelect.tooltip.modelTrainingScript()}
              >
                <TextInput testId="trainingScript-input" />
              </Field>
            </FieldSet>
          </DisclosureLink>
        </div>
      </Panel>
    </Form>
  );
};
