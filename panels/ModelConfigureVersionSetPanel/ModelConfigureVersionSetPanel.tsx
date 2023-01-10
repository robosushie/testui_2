import * as React from "react";
import * as Messages from "@codegen/Messages";
import {
  CompartmentSelect,
  DisclosureLink,
  FormRemoteSubmitButton,
  ListingContextProvider,
  ListingHeading,
  Panel,
  PanelSize,
  TagsSubForm,
  useConsoleState,
} from "oui-savant";
import {
  ErrorText,
  Field,
  FieldSet,
  Form,
  FormErrors,
  FormRef,
  FormValues,
  InfoBlockStatus,
  OptionsGroupDirection,
  RadioGroup,
  Tab,
  Tabs,
  Textarea,
  TextInput,
  ToastNotification,
} from "oui-react";
import { trimDisplayName, validateField } from "utils/formUtils";
import RowContainer from "../../components/RowContainer/RowContainer";
import { CreateModelVersionSetDetails, ModelVersionSet } from "odsc-client/dist/odsc-client";
import ListModelVersionSets from "./ListModelVersionSets";
import ProjectSelect from "projects/components/ProjectSelect/ProjectSelect";
import { Compartment } from "identity-control-plane-api-client";
import ModelVersionSetModelList from "../ModelVersionSetCreatePanel/ModelVersionSetModelList";

interface Props {
  onClose: () => void;
  preSelectedCompartmentId: string;
  preSelectedProjectId: string;
  onModelVersionSetSubmit: (
    isNewModelVersionSet: boolean,
    selectedModelIds: string[],
    modelVersionSetDetails: CreateModelVersionSetDetails,
    modelVersionSetId: string,
    modelsForAssociation: Map<string, string>,
    labelList: Map<string, string>,
    label: string,
    mvsName: string
  ) => void;
  preSelectedIsNewModelVersionSet: boolean;
  preSelectedModelIds: string[];
  preSelectedModelVersionSetDetails: CreateModelVersionSetDetails;
  preSelectedModelVersionSetId: string;
  preLabelList: Map<string, string>;
  preLabelText: string;
}

enum ModelVersionSetOptions {
  selectFromExistingGroups = "selectFromExistingGroups",
  createModelInNewModelVersionSet = "createModelInNewModelVersionSet",
}

const ModelConfigureVersionSetPanel: React.FC<Props> = ({
  onClose,
  preSelectedCompartmentId,
  preSelectedProjectId,
  onModelVersionSetSubmit,
  preSelectedIsNewModelVersionSet,
  preSelectedModelIds,
  preSelectedModelVersionSetId,
  preLabelList,
  preSelectedModelVersionSetDetails,
  preLabelText,
}) => {
  const { activeCompartment } = useConsoleState();
  const [compartmentId, setCompartmentId] = React.useState(preSelectedCompartmentId);
  const [projectId, setProjectId] = React.useState(preSelectedProjectId);
  const [modelVersionSetId, setModelVersionSetId] = React.useState(preSelectedModelVersionSetId);
  const [modelVersionSetName, setModelVersionSetName] = React.useState<string>(undefined);
  const [modelVersionSetOption, setModelVersionSetOption] = React.useState<string>(
    preSelectedIsNewModelVersionSet
      ? ModelVersionSetOptions.createModelInNewModelVersionSet
      : ModelVersionSetOptions.selectFromExistingGroups
  );
  const [errorText, setErrorText] = React.useState("");
  const [selectedModelIds, setSelectedModelIds] = React.useState(preSelectedModelIds);
  const [isNewModelVersionSet, setIsNewModelVersionSet] = React.useState(
    preSelectedIsNewModelVersionSet
  );
  const [ref, setRef] = React.useState<FormRef>(null);
  const getFormRef = (formRef: FormRef): FormRef => {
    setRef(formRef);
    return formRef;
  };
  const [labelList, setLabelList] = React.useState<Map<string, string>>(() => preLabelList);
  let modelsForAssociation = new Map<string, string>();
  const onSubmit = (form: Form): void => {
    const createModelVersionSetDetails = form.getValues();
    if (isNewModelVersionSet || !!modelVersionSetId) {
      ToastNotification.create({
        title: `${Messages.models.selectPanes.modelVersionSet.toastNotification()}`,
        status: InfoBlockStatus.Success,
      });
    }
    onModelVersionSetSubmit(
      isNewModelVersionSet,
      selectedModelIds,
      {
        projectId,
        compartmentId: createModelVersionSetDetails.compartmentId,
        name: trimDisplayName(createModelVersionSetDetails.name),
        description: createModelVersionSetDetails.description,
        freeformTags:
          createModelVersionSetDetails.tags && createModelVersionSetDetails.tags.freeformTags,
        definedTags:
          createModelVersionSetDetails.tags && createModelVersionSetDetails.tags.definedTags,
      } as CreateModelVersionSetDetails,
      modelVersionSetId,
      modelsForAssociation,
      labelList,
      !createModelVersionSetDetails.label ? null : createModelVersionSetDetails.label,
      isNewModelVersionSet ? createModelVersionSetDetails.name : modelVersionSetName
    );
  };

  /* validation */

  const validate = (values: FormValues): FormErrors => ({
    name: validateField({
      value: values.name,
      required: false,
      callback: (value: string) => isNameValid(value).isValid,
      callbackMessage: isNameValid(values.name).errorMessage,
    }),
    description: validateField({ value: values.description, required: false, maxLen: 400 }),
    label: validateField({ value: values.label, required: false, maxLen: 255 }),
  });

  const onSelectedModelIdsChanged = (
    selectedIds: string[],
    labelList: Map<string, string>,
    modelListForAssociation: Map<string, string>
  ) => {
    // sort models in created at desc
    setLabelList(labelList);
    setErrorText(null);
    modelsForAssociation = modelListForAssociation;
    setSelectedModelIds(selectedIds);
  };

  const ModelVersionSetConfigureSelectOptions = [
    {
      label: Messages.models.selectPanes.modelVersionSet.labels.selectFromExistingGroups(),
      value: ModelVersionSetOptions.selectFromExistingGroups,
      fieldName: ModelVersionSetOptions.selectFromExistingGroups,
      testId: "SelectFromExistingGroupsRadioButton",
    },
    {
      label: Messages.models.selectPanes.modelVersionSet.labels.createNewModelVersionSet(),
      value: ModelVersionSetOptions.createModelInNewModelVersionSet,
      fieldName: ModelVersionSetOptions.createModelInNewModelVersionSet,
      testId: "CreateModelInNewModelVersionSetRadioButton",
    },
  ];

  const onOptionChange = (option: string) => {
    if (option === ModelVersionSetOptions.createModelInNewModelVersionSet) {
      setIsNewModelVersionSet(true);
    } else {
      setIsNewModelVersionSet(false);
    }
    setModelVersionSetOption(option);
  };
  const onCompartmentChange = (compartment: Compartment) => {
    setCompartmentId(compartment.id);
    setProjectId(null);
  };
  const defaultValues = {
    name:
      preSelectedModelVersionSetDetails && preSelectedModelVersionSetDetails.name
        ? preSelectedModelVersionSetDetails.name
        : null,
    description:
      preSelectedModelVersionSetDetails && preSelectedModelVersionSetDetails.description
        ? preSelectedModelVersionSetDetails.description
        : null,
    label: preLabelText,
  };

  const isNameValid = (name: string) => {
    let isValid: boolean;
    let errorMessage: string | undefined;
    if (modelVersionSetOption === ModelVersionSetOptions.createModelInNewModelVersionSet) {
      if (!!name) {
        if (name.length < 255) {
          isValid = true;
        } else {
          isValid = false;
          errorMessage = Messages.validation.maxLength(255);
        }
      } else {
        isValid = false;
        errorMessage = Messages.validation.required();
      }
    } else {
      isValid = true;
    }

    return { isValid, errorMessage };
  };

  const onSelectedModelVersionSetChanged = (mvsDetails: ModelVersionSet) => {
    if (mvsDetails) {
      setModelVersionSetName(mvsDetails.name);
      setModelVersionSetId(mvsDetails.id);
    } else {
      setModelVersionSetName(null);
      setModelVersionSetId(null);
    }
  };

  return (
    <Form
      formRef={getFormRef}
      onSubmit={onSubmit}
      validator={validate}
      defaultValues={defaultValues}
    >
      <Panel
        actions={[
          <FormRemoteSubmitButton formRef={ref} key={"form_btn_submit"}>
            {Messages.actions.select()}
          </FormRemoteSubmitButton>,
        ]}
        onClose={onClose}
        title={Messages.models.selectPanes.modelVersionSet.configureTitle()}
        size={PanelSize.Medium}
      >
        <p>{Messages.models.selectPanes.modelVersionSet.description()}</p>
        <FieldSet
          legend={Messages.models.selectPanes.modelVersionSet.labels.modelVersionSetConfigurationOptions()}
        >
          <RowContainer>
            <RadioGroup
              defaultValue={modelVersionSetOption}
              direction={OptionsGroupDirection.Column}
              options={ModelVersionSetConfigureSelectOptions}
              onSelectionChange={onOptionChange}
              testId="radioGroup"
            />
          </RowContainer>
          {modelVersionSetOption === ModelVersionSetOptions.createModelInNewModelVersionSet && (
            <>
              <CompartmentSelect
                value={compartmentId}
                onChange={onCompartmentChange}
                fieldName="compartmentId"
                tooltip={Messages.tooltips.compartmentSelect()}
                label={Messages.models.selectPanes.modelVersionSet.labels.compartment()}
              />
              <ProjectSelect
                compartmentId={compartmentId}
                selectedProjectId={projectId}
                onChange={(projectId) => setProjectId(projectId)}
                label={Messages.models.selectPanes.modelVersionSet.labels.projectId()}
                tooltip={Messages.tooltips.projectSelect()}
              />
              <Field
                label={Messages.models.selectPanes.modelVersionSet.labels.name()}
                fieldName="name"
                hint={Messages.models.selectPanes.modelVersionSet.hints.name()}
              >
                <TextInput required={true} />
              </Field>
              <Field
                label={Messages.models.selectPanes.modelVersionSet.labels.description()}
                fieldName="description"
                optional={true}
              >
                <Textarea />
              </Field>
              <DisclosureLink>
                <Tabs>
                  <Tab
                    label={Messages.models.selectPanes.modelVersionSet.labels.addModelsToModelVersionTabs()}
                  >
                    {errorText ? (
                      <ErrorText>{errorText}</ErrorText>
                    ) : (
                      <>
                        <ListingHeading
                          title={Messages.models.selectPanes.modelVersionSet.labels.versions()}
                        />
                        <p>
                          {Messages.models.selectPanes.modelVersionSet.modelVersionSetTable.description()}
                        </p>
                        <ListingContextProvider paging={{ pageSize: 10 }}>
                          <ModelVersionSetModelList
                            selectedCompartmentId={compartmentId}
                            selectedProjectId={projectId}
                            onSelectedModelIdsChanged={onSelectedModelIdsChanged}
                            preSelectedIds={selectedModelIds}
                            preLabelList={labelList}
                          />
                        </ListingContextProvider>
                      </>
                    )}
                  </Tab>
                  <Tab label={Messages.models.selectPanes.modelVersionSet.labels.tags()}>
                    <TagsSubForm showLabel={true} compartmentId={compartmentId} />
                  </Tab>
                </Tabs>
              </DisclosureLink>
            </>
          )}
          {modelVersionSetOption === ModelVersionSetOptions.selectFromExistingGroups && (
            <>
              <ListingContextProvider paging={{ pageSize: 10 }}>
                <ListModelVersionSets
                  compartmentId={activeCompartment.id}
                  onSelectedModelVersionSetChanged={onSelectedModelVersionSetChanged}
                  preSelectedVersionId={modelVersionSetId}
                />
              </ListingContextProvider>
            </>
          )}
        </FieldSet>
        <Field
          label={Messages.models.selectPanes.modelVersionSet.labels.versionLabel()}
          fieldName="label"
          optional={true}
        >
          <TextInput />
        </Field>
      </Panel>
    </Form>
  );
};

export default ModelConfigureVersionSetPanel;
