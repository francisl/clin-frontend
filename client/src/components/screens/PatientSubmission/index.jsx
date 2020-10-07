/* eslint-disable react/jsx-boolean-value */
/* eslint-disable react/prop-types */
/* eslint-disable import/named */
import React from 'react';
import PropTypes from 'prop-types';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import {
  AutoComplete, Button, Card, Checkbox, DatePicker, Form, Input, Radio, Row, Select, Steps,
} from 'antd';
import { find, has } from 'lodash';

import IconKit from 'react-icons-kit';
import { ic_save, ic_keyboard_arrow_left } from 'react-icons-kit/md';
import Header from '../../Header';
import Content from '../../Content';
import Footer from '../../Footer';
import { navigateToPatientSearchScreen } from '../../../actions/router';
import {
  assignServiceRequestPractitioner, savePatientSubmission, savePatientLocal, saveObservations,
} from '../../../actions/patientSubmission';
import ClinicalInformation from './ClinicalInformation';
import Api from '../../../helpers/api';

import './style.scss';

import {
  cghDisplay,
  createHPOResource,
  createPractitionerResource,
  getFamilyRelationshipDisplayForCode,
  getHPOOnsetDisplayFromCode,
  hpoInterpretationDisplayForCode,
  isCGH,
  isFamilyHistoryResource,
  isHPO,
  isIndication,
} from '../../../helpers/fhir/fhir';
import { FhirDataManager } from '../../../helpers/fhir/fhir_data_manager.ts';
import { ObservationBuilder } from '../../../helpers/fhir/builder/ObservationBuilder.ts';
import { FamilyMemberHistoryBuilder } from '../../../helpers/fhir/builder/FMHBuilder.ts';

const { Step } = Steps;

const ramqValue = (patient) => {
  const { identifier } = patient;
  if (identifier && identifier.length > 1) {
    return identifier[1].value;
  }

  return '';
};

const mrnValue = (patient) => {
  const { identifier } = patient;
  if (identifier && identifier.length) {
    return identifier[0].value;
  }

  return '';
};

const getValueCoding = (patient, extensionName) => {
  const { extension } = patient;
  const extensionValue = find(extension, o => o.url.includes(extensionName) && o.valueCoding.code);
  if (extensionValue) {
    return extensionValue.valueCoding;
  }
  return undefined;
};

const hasObservations = clinicalImpression => clinicalImpression.investigation[0].item.length > 0;

const getGenderValues = () => ({
  male: {
    value: 'male',
    label: intl.get('form.patientSubmission.form.genderMale'),
  },
  female: {
    value: 'female',
    label: intl.get('form.patientSubmission.form.genderFemale'),
  },
  other: {
    value: 'other',
    label: intl.get('form.patientSubmission.form.genderOther'),
  },
  unknown: {
    value: 'unknown',
    label: intl.get('form.patientSubmission.form.genderUnknown'),
  },
});

const PatientInformation = ({ getFieldDecorator, patient }) => {
  const genderValues = getGenderValues();
  const ethnicityValueCoding = getValueCoding(patient, 'qc-ethnicity');
  const consanguinityValueCoding = getValueCoding(patient, 'blood-relationship');
  return (
    <Card title="Patient" bordered={false} className="staticCard patientContent">
      <Form.Item label="Nom">
        {getFieldDecorator('family', {
          rules: [{ required: true, message: 'Please enter the family name!' }],
          initialValue: has(patient, 'name.family') ? patient.name.family : '',
        })(
          <Input placeholder="Nom de famille" className="input large" />,
        )}
      </Form.Item>
      <Form.Item label="Prénom">
        {getFieldDecorator('given', {
          rules: [{ required: true, message: 'Please enter the given name!' }],
          initialValue: has(patient, 'name.given') ? patient.name.given : '',
        })(
          <Input placeholder="Prénom" className="input large" />,
        )}
      </Form.Item>
      <Form.Item label="Sexe">
        {getFieldDecorator('gender', {
          rules: [{ required: true, message: 'Please select the gender!' }],
          initialValue: has(patient, 'gender') ? patient.gender : '',
        })(
          <Radio.Group buttonStyle="solid">
            {
                            Object.values(genderValues).map(gv => (
                              <Radio.Button value={gv.value} key={`gender_${gv.value}`}>
                                <span className="radioText">{gv.label}</span>
                              </Radio.Button>
                            ))
                        }
          </Radio.Group>,
        )}
      </Form.Item>
      <Form.Item label="Date de naissance">
        {getFieldDecorator('birthDate', {
          rules: [{ required: true, message: 'Please enter the birthdate!' }],
          initialValue: has(patient, 'birthDate') ? patient.birthDate : '',
        })(
          <DatePicker className="small" />,
        )}
      </Form.Item>
      <Form.Item label="RAMQ">
        {getFieldDecorator('ramq', {
          rules: [{
            pattern: RegExp(/^[A-Z]{4}\d{8,9}$/),
            message: 'Doit comporter quatre lettres majuscules suivies de 8 ou 9 chiffres',
          }],
          initialValue: ramqValue(patient),
        })(
          <Input placeholder="ABCD 0000 0000" className="input large" />,
        )}
        <span className="optional">Facultatif</span>
      </Form.Item>
      <Form.Item label="MRN">
        {getFieldDecorator('mrn', {
          rules: [{ required: true, message: 'Please enter the MRN number!' }],
          initialValue: mrnValue(patient),
        })(
          <Input placeholder="12345678" className="input small" />,
        )}
      </Form.Item>
      <Form.Item label="Hôpital">
        {getFieldDecorator('organization', {
          rules: [{ required: true, message: 'Please select the hospital!' }],
          initialValue: has(patient, 'managingOrganization') ? patient.managingOrganization : 'CHUSJ',
        })(
          <Select className="small" dropdownClassName="selectDropdown">
            <Select.Option value="CHUSJ">CHUSJ</Select.Option>
            <Select.Option value="CHUM">CHUM</Select.Option>
            <Select.Option value="CUSM">CUSM</Select.Option>
          </Select>,
        )}
      </Form.Item>
      <Form.Item label="Ethnicité">
        {getFieldDecorator('ethnicity', {
          rules: [{ required: false }],
          initialValue: ethnicityValueCoding ? ethnicityValueCoding.code : ethnicityValueCoding,
        })(
          <Select className="large" placeholder="Selectionner" dropdownClassName="selectDropdown">
            <Select.Option value="CA-FR">Canadien-Français</Select.Option>
            <Select.Option value="EU">Caucasienne Européenne</Select.Option>
            <Select.Option value="AFR">Africain ou caribéen</Select.Option>
            <Select.Option value="LAT- AM">Hispanique</Select.Option>
            <Select.Option value="ES-AS">Asiatique de l&apos;est et du sud-est</Select.Option>
            <Select.Option value="SO-AS">Asiatique du sud</Select.Option>
            <Select.Option value="ABOR">Aboriginal</Select.Option>
            <Select.Option value="MIX">Origine mixte</Select.Option>
            <Select.Option value="OTH">Autre</Select.Option>
          </Select>,
        )}
        <span className="optional">Facultatif</span>
      </Form.Item>
      <Form.Item label="Consanguinité">
        {getFieldDecorator('consanguinity', {
          rules: [{ required: false }],
          initialValue: consanguinityValueCoding ? consanguinityValueCoding.display : consanguinityValueCoding,
        })(
          <Radio.Group buttonStyle="solid">
            <Radio.Button value="Ye"><span className="radioText">Oui</span></Radio.Button>
            <Radio.Button value="No"><span className="radioText">Non</span></Radio.Button>
            <Radio.Button value="Unknown"><span className="radioText">Inconnu</span></Radio.Button>
          </Radio.Group>,
        )}
        <span className="optional">Facultatif</span>
      </Form.Item>
    </Card>
  );
};

const Approval = ({
  practitionerOptionsLabels,
  practitionerOptionSelected,
  practitionerSearchTermChanged,
  assignedPractitionerLabel,
  getFieldDecorator,
}) => (
  <div>
    <Card title="Consentements" bordered={false} className="staticCard patientContent">
      <Form>
        {/* TODO initialValue */}
        <Form.Item label="Clauses signées" className="labelTop">
          {getFieldDecorator('consent', {
            rules: [{ required: true }],
          })(
            <Checkbox.Group className="checkboxGroup">
              <Row>
                <Checkbox className="checkbox" value="c1"><span className="checkboxText">Clause 1</span></Checkbox>
              </Row>
              <Row>
                <Checkbox className="checkbox" value="c2"><span className="checkboxText">Clause 2</span></Checkbox>
              </Row>
              <Row>
                <Checkbox className="checkbox" value="c3"><span className="checkboxText">Clause 3</span></Checkbox>
              </Row>
              <Row>
                <Checkbox className="checkbox" value="c4"><span className="checkboxText">Clause 4</span></Checkbox>
              </Row>
            </Checkbox.Group>,
          )}
        </Form.Item>
      </Form>
    </Card>
    <Card title="Approbation" bordered={false} className="staticCard patientContent">
      <Form>
        <p className="cardDescription">Nullam id dolor id nibh ultricies vehicula ut id elit. Vestibulum id ligula porta felis euismod semper.</p>
        {/* TODO initialValue */}
        <Form.Item className="searchInput searchInput340" label="Médecin résponsable">
          {getFieldDecorator('practitioner', {
            rules: [{ required: true }],
          })(
            <AutoComplete
              classeName="searchInput"
              placeholder="Recherche par nom ou licence…"
              // value={assignedPractitionerLabel}
              dataSource={practitionerOptionsLabels}
              onSelect={practitionerOptionSelected}
              onChange={practitionerSearchTermChanged}
            />,
          )}

        </Form.Item>
      </Form>
    </Card>
  </div>
);

const stringifyPractionerOption = po => `${po.family}, ${po.given} License No: ${po.license}`;
const practitionerOptionFromResource = resource => ({
  given: resource.name[0].given[0],
  family: resource.name[0].family,
  license: resource.identifier[0].value,
});

class PatientSubmissionScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentPageIndex: 0,
      practitionerOptions: [],
    };

    this.handleSubmit = this.handleSubmit.bind(this);
    this.isClinicalInformationComplete = this.isClinicalInformationComplete.bind(this);
    this.handlePractitionerSearchTermChanged = this.handlePractitionerSearchTermChanged.bind(this);
    this.handlePractitionerOptionSelected = this.handlePractitionerOptionSelected.bind(this);
    this.canGoNextPage = this.canGoNextPage.bind(this);
  }

  getPatientData() {
    const { currentPageIndex } = this.state;
    const { patient, form } = this.props;
    const values = form.getFieldsValue();

    const getEthnicityDisplay = (ethnicity) => {
      switch (ethnicity) {
        case 'CA-FR':
          return 'French Canadian';
        case 'EU':
          return 'European Caucasia';
        case 'AFR':
          return 'African or Carabean';
        case 'LAT- AM':
          return 'Hispanic and Latino Americans';
        case 'ES-AS':
          return 'East and Southeast Asian';
        case 'SO-AS':
          return 'South Asian';
        case 'ABOR':
          return 'Aboriginal';
        case 'MIX':
          return 'Mixted descent';
        case 'OTH':
          return 'Other ethnicity';
        default:
          return '';
      }
    };
    if (currentPageIndex === 0) {
      const value = FhirDataManager.createPatient({
        ...values,
        id: patient.id,
        bloodRelationship: values.consanguinity,
        ethnicityCode: values.ethnicity ? values.ethnicity : '',
        ethnicityDisplay: getEthnicityDisplay(values.ethnicity),
        active: false,
        birthDate: new Date(values.birthDate.toDate()),
      });
      return value;
    }

    return { ...patient };
  }

  getHPOData() {
    console.log(this);
    return [];
  }

  getPractitioner() {
    const { currentPageIndex } = this.state;
    const { form } = this.props;
    const values = form.getFieldsValue();
    if (currentPageIndex === 2) {
      return values.practitioner.id;
    }

    return null;
  }

  getClinicalImpressionData() {
    const { currentPageIndex } = this.state;
    const { clinicalImpression } = this.props;

    const clinicalImpressionData = { ...clinicalImpression };

    if (currentPageIndex === 1) {
      const { investigation } = clinicalImpression;
      investigation[0].item = [
        this.createCGHResourceList(),
        ...this.createFamilyRelationshipResourceList(),
        // ...this.createHPOResourceList(),
        this.createIndicationResourceList(),
      ];
    }

    return clinicalImpressionData;
  }

  getServiceRequestCode() {
    const { form } = this.props;
    const values = form.getFieldsValue();

    if (values.analyse != null) {
      return values.analyse;
    }
    return undefined;
  }

  canGoNextPage(currentPage) {
    const { form } = this.props;
    const values = form.getFieldsValue();
    switch (currentPage) {
      case 0:
        if (values.given && values.family && values.gender && values.birthDate && values.mrn) {
          return false;
        }
        return true;
      case 1: {
        const checkIfEmptyValue = (array) => {
          if (array) {
            if (array.findIndex(element => !element) !== -1) {
              return false;
            }
            return true;
          }
          return false;
        };

        const checkCghInterpretationValue = () => {
          if (values.cghInterpretationValue) {
            if (values.cghInterpretationValue !== 'A') {
              return true;
            }
            if (values.cghPrecision !== null) {
              return true;
            }
            return false;
          }
          return false;
        };
        if (values.cghInterpretationValue
          && values.analyse
          && checkCghInterpretationValue()
          && values.indication
        ) {
          return false;
        }
        return true;
      }
      case 2:
        if (values.consent && values.practitioner) {
          return false;
        }
        return true;
      default:
        return false;
    }
  }

  createFamilyRelationshipResourceList() {
    const { form } = this.props;
    const values = form.getFieldsValue();

    if (values.familyRelationshipCodes === undefined) {
      return [];
    }

    const {
      familyRelationshipIds,
      familyRelationshipCodes,
      familyRelationshipNotes,
      familyRelationshipsToDelete,
    } = values;

    return familyRelationshipCodes.map((code, index) => {
      const id = familyRelationshipIds[index];
      const toDelete = familyRelationshipsToDelete[index];
      if (id == null || id.length === 0) {
        const builder = new FamilyMemberHistoryBuilder({
          coding: [{
            code,
            display: getFamilyRelationshipDisplayForCode(familyRelationshipCodes[index]),
          }],
        });
        const note = familyRelationshipNotes[index];
        if (note != null && note.length > 0) {
          builder.withNote(note);
        }
        if (toDelete) {
          builder.withStatus('entered-in-error');
        }
        return builder.build();
      }
      return null;
    }).filter(r => r != null);
  }

  createHPOResourceList() {
    const { form } = this.props;
    const values = form.getFieldsValue();

    if (values.hpoCodes === undefined) {
      return [];
    }

    const {
      hpoIds,
      hpoCodes,
      hpoDisplays,
      hpoOnsets,
      hpoNotes,
      hposToDelete,
      hpoInterpretationCodes,
    } = values;

    const hpoResources = hpoCodes.map((code, index) => createHPOResource({
      id: hpoIds[index],
      hpoCode: { code, display: hpoDisplays[index] },
      onset: { code: hpoOnsets[index], display: getHPOOnsetDisplayFromCode(hpoOnsets[index]) },
      category: {
        code: '',
        display: '',
      },
      interpretation: {
        code: hpoInterpretationCodes[index],
        display: hpoInterpretationDisplayForCode(hpoInterpretationCodes[index]),
      },
      note: hpoNotes[index],
      toDelete: hposToDelete[index],
    }));

    return hpoResources;
  }

  createCGHResourceList() {
    const { form } = this.props;
    const values = form.getFieldsValue();

    if (values.cghInterpretationValue === undefined) {
      return undefined;
    }

    const {
      cghInterpretationValue,
      cghNote,
    } = values;

    const builder = new ObservationBuilder('CGH')
      .withStatus('final');


    if (cghInterpretationValue != null) {
      builder.withInterpretation({
        coding: [{
          display: cghDisplay(cghInterpretationValue),
          code: cghInterpretationValue,
        }],
      });
    }

    if (cghNote != null && cghNote.length > 0) {
      builder.withNote(cghNote);
    }

    return builder.build();
  }

  createIndicationResourceList() {
    const { form } = this.props;
    const values = form.getFieldsValue();

    if (values.indication === undefined) {
      return [];
    }

    const {
      indication,
    } = values;

    const builder = new ObservationBuilder('INDIC');
    if (indication != null) {
      builder.withNote(indication);
    }

    return builder.build();
  }


  handleSubmit(e) {
    const { form } = this.props;
    e.preventDefault();
    form.validateFields((err) => {
      if (err) {
        return;
      }

      const {
        actions, serviceRequest, clinicalImpression, observations, deleted, practitionerId,
      } = this.props;

      const patientData = this.getPatientData();

      const clinicalImpressionData = this.getClinicalImpressionData();

      const submission = {
        patient: patientData,
        serviceRequest,
      };

      submission.serviceRequest = submission.serviceRequest || {};
      submission.serviceRequest.code = this.getServiceRequestCode();

      if (hasObservations(clinicalImpression)) {
        submission.clinicalImpression = clinicalImpressionData;
      }
      const { currentPageIndex } = this.state;

      if (currentPageIndex === 1) {
        submission.observations = {
          ...observations,
          cgh: {
            ...observations.cgh,
            ...this.createCGHResourceList(),
          },
          indic: {
            ...observations.indic,
            ...this.createIndicationResourceList(),
          },
        };
        actions.saveObservations(submission.observations);
      } else {
        submission.observations = {
          ...observations,
          cgh: {
            ...observations.cgh,
          },
          indic: {
            ...observations.indic,
          },
        };
      }

      submission.practitionerId = practitionerId;
      submission.deleted = deleted;
      actions.savePatientSubmission(submission);
    });
  }

  nbPages() {
    return this.pages.length;
  }

  next() {
    const { currentPageIndex } = this.state;
    const { actions, observations } = this.props;
    const pageIndex = currentPageIndex + 1;
    if (currentPageIndex === 0) {
      actions.savePatientLocal(this.getPatientData());
    } else if (currentPageIndex === 1) {
      actions.saveObservations(
        {
          ...observations,
          cgh: {
            ...observations.cgh,
            ...this.createCGHResourceList(),
          },
          indic: {
            ...observations.indic,
            ...this.createIndicationResourceList(),
          },
        },
      );
    }

    this.setState({ currentPageIndex: pageIndex });
  }

  previous() {
    const { currentPageIndex } = this.state;
    const pageIndex = currentPageIndex - 1;
    this.setState({ currentPageIndex: pageIndex });
  }

  isFirstPage() {
    const { currentPageIndex } = this.state;
    return currentPageIndex === 0;
  }

  isLastPage() {
    const { currentPageIndex } = this.state;
    return currentPageIndex === this.nbPages() - 1;
  }

  // TODO: Update check
  isClinicalInformationComplete() {
    return true;
  }

  handlePractitionerOptionSelected(value) {
    const { actions } = this.props;
    const { practitionerOptions } = this.state;
    const option = practitionerOptions.find(o => stringifyPractionerOption(o) === value);

    if (option) {
      const resource = createPractitionerResource(option);
      actions.assignServiceRequestPractitioner(resource);
    }
  }

  handlePractitionerSearchTermChanged(term) {
    const normalizedTerm = term.toLowerCase().trim();

    if (normalizedTerm.length > 0 && normalizedTerm.length < 10) {
      const params = { term: normalizedTerm };
      Api.searchPractitioners(params).then((response) => {
        if (response.payload) {
          const { data } = response.payload;

          const result = [];
          if (data.entry != null) {
            data.entry.forEach((entry) => {
              const { resource } = entry;
              if (resource != null && resource.name != null && resource.name.length > 0) {
                result.push({
                  id: resource.id,
                  family: resource.name[0].family,
                  given: resource.name[0].given[0],
                  license: resource.identifier[0].value,
                });
              }
            });
          }

          this.setState({
            practitionerOptions: result,
          });
        }
      });
    }
  }

  render() {
    const { form, actions } = this.props;
    const { getFieldDecorator } = form;
    const { patient, clinicalImpression, serviceRequest } = this.props;
    const { practitionerOptions, currentPageIndex } = this.state;

    const assignedPractitioner = serviceRequest ? serviceRequest.requester : null;
    const assignedPractitionerLabel = assignedPractitioner && has(assignedPractitioner, 'resourceType')
      ? stringifyPractionerOption(practitionerOptionFromResource(assignedPractitioner))
      : '';

    const practitionerOptionsLabels = practitionerOptions.map(stringifyPractionerOption);

    this.pages = [
      {
        title: intl.get('screen.clinicalSubmission.patientInformation'),
        content: (
          <PatientInformation parentForm={this} getFieldDecorator={getFieldDecorator} patient={patient} />
        ),
        name: 'PatientInformation',
        values: {},
        isComplete: () => true,
      },
      {
        title: intl.get('screen.clinicalSubmission.clinicalInformation'),
        content: (
          <ClinicalInformation parentForm={this} form={form} clinicalImpression={clinicalImpression} />
        ),
        name: 'ClinicalInformation',
        values: {},
        isComplete: () => true,
      },
      {
        title: intl.get('screen.clinicalSubmission.approval'),
        content: (
          <Approval
            parentForm={this}
            getFieldDecorator={getFieldDecorator}
            practitionerOptionsLabels={practitionerOptionsLabels}
            practitionerOptionSelected={this.handlePractitionerOptionSelected}
            practitionerSearchTermChanged={this.handlePractitionerSearchTermChanged}
            assignedPractitionerLabel={assignedPractitionerLabel}
          />
        ),
        name: 'Approval',
        values: {},
      },
    ];

    const currentPage = this.pages[currentPageIndex];
    const pageContent = currentPage.content;
    const validation = this.canGoNextPage(currentPageIndex);
    return (
      <Content type="auto">
        <Header />
        <div className="page_headerStaticMargin">
          <Steps current={currentPageIndex} className="headerStaticContent step">
            {this.pages.map(item => <Step key={item.title} title={item.title} />)}
          </Steps>
        </div>
        <div className="page-static-content">
          <Form
            onSubmit={this.handleSubmit}
          >
            {pageContent}
            <div className="submission-form-actions">
              {
                currentPageIndex === this.pages.length - 1 && (
                  <Button
                    htmlType="submit"
                    type="primary"
                    disabled={validation}
                  >
                    Soumettre
                  </Button>
                )
              }
              {
                currentPageIndex !== this.pages.length - 1 && (
                  <Button type="primary" onClick={() => this.next()} disabled={validation}>
                    {intl.get('screen.clinicalSubmission.nextButtonTitle')}
                  </Button>
                )
              }

              {
                                currentPageIndex !== 0 && (
                                <Button onClick={() => this.previous()} disabled={this.isFirstPage()}>
                                  <IconKit size={20} icon={ic_keyboard_arrow_left} />
                                  {intl.get('screen.clinicalSubmission.previousButtonTitle')}
                                </Button>
                                )
                            }

              <Button
                htmlType="submit"
              >
                <IconKit size={20} icon={ic_save} />
                {intl.get('screen.clinicalSubmission.saveButtonTitle')}
              </Button>
              <Button
                onClick={actions.navigateToPatientSearchScreen}
                className="cancelButton"
              >
                {intl.get('screen.clinicalSubmission.cancelButtonTitle')}
              </Button>
            </div>
          </Form>
        </div>
        <Footer />
      </Content>
    );
  }
}

PatientSubmissionScreen.propTypes = {
  router: PropTypes.shape({}).isRequired,
  actions: PropTypes.shape({}).isRequired,
};

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators({
    navigateToPatientSearchScreen,
    savePatientSubmission,
    savePatientLocal,
    assignServiceRequestPractitioner,
    saveObservations,
  }, dispatch),
});

const mapStateToProps = state => ({
  app: state.app,
  router: state.router,
  serviceRequest: state.patientSubmission.serviceRequest,
  patient: state.patientSubmission.patient,
  clinicalImpression: state.patientSubmission.clinicalImpression,
  observations: state.patientSubmission.observations,
  deleted: state.patientSubmission.deleted,
  practitionerId: state.patientSubmission.practitionerId,
  search: state.search,
});

const WrappedPatientSubmissionForm = Form.create({ name: 'patient_submission' })(PatientSubmissionScreen);

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(WrappedPatientSubmissionForm);
