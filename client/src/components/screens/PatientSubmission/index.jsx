/* eslint-disable react/prop-types */
/* eslint-disable import/named */
/* eslint-disable no-unused-vars */
import React from 'react';
import PropTypes from 'prop-types';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import uuidv1 from 'uuid/v1';
import {
  Steps, Card, Form, Input, Button, message, Radio, DatePicker, Select, Tree,
} from 'antd';
import {
  has,
} from 'lodash';

import IconKit from 'react-icons-kit';
import {
  ic_save, ic_remove, ic_add, ic_visibility, ic_visibility_off, ic_help, ic_person,
} from 'react-icons-kit/md';
import Header from '../../Header';
import Content from '../../Content';
import Footer from '../../Footer';
import DataList from '../../DataList';
import { patientSubmissionShape } from '../../../reducers/patientSubmission';
import { appShape } from '../../../reducers/app';
import {
  savePatient,
} from '../../../actions/patientSubmission';
import './style.scss';

const { Step } = Steps;
const { TextArea, Search } = Input;
const { TreeNode } = Tree;
const { Option, OptGroup } = Select;

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

const getRelationValues = () => ({
  father: {
    value: 'FTH',
    label: intl.get('form.patientSubmission.form.father'),
  },
  mother: {
    value: 'MTH',
    label: intl.get('form.patientSubmission.form.mother'),
  },
  brother: {
    value: 'BRO',
    label: intl.get('form.patientSubmission.form.brother'),
  },
  sister: {
    value: 'SIS',
    label: intl.get('form.patientSubmission.form.sister'),
  },
  halfBrother: {
    value: 'HBRO',
    label: intl.get('form.patientSubmission.form.halfBrother'),
  },
  halfSister: {
    value: 'HSIS',
    label: intl.get('form.patientSubmission.form.halfSister'),
  },
  identicalTwin: {
    value: 'ITWIN',
    label: intl.get('form.patientSubmission.form.identicalTwin'),
  },
  fraternalTwin: {
    value: 'FTWIN',
    label: intl.get('form.patientSubmission.form.fraternalTwin'),
  },
  daughter: {
    value: 'DAUC',
    label: intl.get('form.patientSubmission.form.daughter'),
  },
  son: {
    value: 'SONC',
    label: intl.get('form.patientSubmission.form.son'),
  },
  maternalAunt: {
    value: 'MAUNT',
    label: intl.get('form.patientSubmission.form.maternalAunt'),
  },
  paternalAunt: {
    value: 'PAUNT',
    label: intl.get('form.patientSubmission.form.paternalAunt'),
  },
  maternalUncle: {
    value: 'MUNCLE',
    label: intl.get('form.patientSubmission.form.maternalUncle'),
  },
  paternalUncle: {
    value: 'PUNCHE',
    label: intl.get('form.patientSubmission.form.paternalUncle'),
  },
  maternalCousin: {
    value: 'MCOUSIN',
    label: intl.get('form.patientSubmission.form.maternalCousin'),
  },
  paternalCousin: {
    value: 'PCOUSIN',
    label: intl.get('form.patientSubmission.form.paternalCousin'),
  },
  maternalGrandfather: {
    value: 'MGRFTH',
    label: intl.get('form.patientSubmission.form.maternalGrandfather'),
  },
  paternalGrandfather: {
    value: 'PGRFTH',
    label: intl.get('form.patientSubmission.form.paternalGrandfather'),
  },
  maternalGrandmother: {
    value: 'MGRMTH',
    label: intl.get('form.patientSubmission.form.maternalGrandmother'),
  },
  paternalGrandmother: {
    value: 'PGRMTH',
    label: intl.get('form.patientSubmission.form.paternalGrandmother'),
  },
  nephew: {
    value: 'NEPHEW',
    label: intl.get('form.patientSubmission.form.nephew'),
  },
  niece: {
    value: 'NIECE',
    label: intl.get('form.patientSubmission.form.niece'),
  },
  maternalMember: {
    value: 'MATMEM',
    label: intl.get('form.patientSubmission.form.maternalMember'),
  },
  paternalMember: {
    value: 'PATMEM',
    label: intl.get('form.patientSubmission.form.paternalMember'),
  },
});


const PatientInformation = ({ getFieldDecorator, patient }) => {
  const genderValues = getGenderValues();
  const _has = has;
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
                <Radio.Button value={gv.value}><span className="radioText">{gv.label}</span></Radio.Button>
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
          rules: [{ pattern: RegExp(/^[A-Z]{4}\d{8,9}$/), message: 'Doit comporter quatre lettres majuscules suivies de 8 ou 9 chiffres' }],
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
        <Select defaultValue="CHUSJ" className="small" dropdownClassName="selectDropdown">
          <Select.Option value="CHUSJ">CHUSJ</Select.Option>
          <Select.Option value="CHUM">CHUM</Select.Option>
          <Select.Option value="CUSM">CUSM</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item label="Ethnicité">
        <Select className="large" placeholder="Selectionner" dropdownClassName="selectDropdown">
          <Select.Option value="Canadien-Français">Canadien-Français</Select.Option>
          <Select.Option value="Afro-Américaine">Afro-Américaine</Select.Option>
          <Select.Option value="Caucasienne Européenne">Caucasienne Européenne</Select.Option>
          <Select.Option value="Hispanique">Hispanique</Select.Option>
          <Select.Option value="Asiatique">Asiatique</Select.Option>
          <Select.Option value="Juive">Juive</Select.Option>
          <Select.Option value="Amérindienne">Amérindienne</Select.Option>
          <Select.Option value="Autre">Autre</Select.Option>
        </Select>
        <span className="optional">Facultatif</span>
      </Form.Item>
      <Form.Item label="Consanguinité">
        <Radio.Group buttonStyle="solid">
          <Radio.Button value="yes"><span className="radioText">Oui</span></Radio.Button>
          <Radio.Button value="no"><span className="radioText">Non</span></Radio.Button>
          <Radio.Button value="unknown"><span className="radioText">Inconnu</span></Radio.Button>
        </Radio.Group>
      </Form.Item>
    </Card>
  );
};


const ClinicalInformation = (props) => {
  const relationrValues = getRelationValues();
  const familyItem = (
    <div className="familyLine">
      <Form.Item>
        <Input placeholder="Ajouter une note…" className="input noteInput note" />
      </Form.Item>
      <Form.Item>
        <Select suffixIcon={<IconKit className="selectIcon" size={16} icon={ic_person} />} className="selectRelation" placeholder="Relation parental" dropdownClassName="selectDropdown">
          {Object.values(relationrValues).map(rv => (
            <Select.Option value={rv.value}>{rv.label}</Select.Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item>
        <Button className="delButton" shape="round">
          <IconKit size={20} icon={ic_remove} />
        </Button>
      </Form.Item>
    </div>
  );

  const selectedPhenotype = ['coucou'];
  const phenotypeItem = (
    <div className="phenotypeBlock">
      <div className="phenotypeFirstLine">
        <div className="leftBlock">
          <span className="hpoTitle">Abnormal cornea morphology</span>
          <Button type="link" className="bordelessButton deleteButton">Supprimer</Button>
        </div>
        <div className="rightBlock">
          <Form.Item>
            <Select className="select selectObserved" defaultValue="O" placeholder="Interpretation" size="small" dropdownClassName="selectDropdown">
              <Select.Option value="O"><IconKit className="observedIcon icon" size={14} icon={ic_visibility} />Observé</Select.Option>
              <Select.Option value="NO"><IconKit className="notObservedIcon icon" size={14} icon={ic_visibility_off} />Non-observé</Select.Option>
              <Select.Option value="I"><IconKit className="unknownIcon icon" size={14} icon={ic_help} />Inconu</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Select className="select selectAge" size="small" placeholder="Âge d’apparition" dropdownClassName="selectDropdown">
              <OptGroup label="Pediatric onset">
                <Option value="Juvenile onset">Juvenile</Option>
                <Option value="Childhood onset">Childhood</Option>
                <Option value="Infantile onset">Infantile</Option>
              </OptGroup>
              <OptGroup label="Adult onset">
                <Option value="YoungAdult onset">Young adult</Option>
                <Option value="MiddleAge onset">Middle age</Option>
                <Option value="Late onset">Late</Option>
              </OptGroup>
              <OptGroup label="Antenatal onset">
                <Option value="Fetal onset">Fetal</Option>
                <Option value="Embryonal onset">Embryonal</Option>
              </OptGroup>
              <OptGroup label="Neonatal onset">
                <Option value="YoungAdult onset">Neonatal</Option>
              </OptGroup>
              <OptGroup label="Congenital onset">
                <Option value="YoungAdult onset">Congenital</Option>
              </OptGroup>
            </Select>
          </Form.Item>
        </div>
      </div>
      <div className="phenotypeSecondLine">
        <Form.Item>
          <Input placeholder="Ajouter une note…" size="small" className="input hpoNote" />
        </Form.Item>
      </div>

    </div>

  );

  return (
    <div>
      <Form>
        <Card title="Informations cliniques" bordered={false} className="staticCard patientContent">

          <Form.Item label="Type d’analyse">
            <Radio.Group buttonStyle="solid">
              <Radio.Button value="exome"><span className="radioText">Exome</span></Radio.Button>
              <Radio.Button value="genome"><span className="radioText">Génome</span></Radio.Button>
              <Radio.Button value="sequencage"><span className="radioText">Séquençage ciblé</span></Radio.Button>
            </Radio.Group>
          </Form.Item>
        </Card>
        <Card title="Résumé de l’investigation" bordered={false} className="staticCard patientContent">
          <Form.Item label="CGH">
            <Radio.Group buttonStyle="solid">
              <Radio.Button value="negatif"><span className="radioText">Négatif</span></Radio.Button>
              <Radio.Button value="anormal"><span className="radioText">Anormal</span></Radio.Button>
              <Radio.Button value="so"><span className="radioText">Sans objet</span></Radio.Button>
            </Radio.Group>
          </Form.Item>
          <Form.Item label="Précision">
            <Input placeholder="Veuillez préciser…" className="input note" />
          </Form.Item>
          <Form.Item label="Résumé">
            <TextArea className="input note" rows={4} />
            <span className="optional">Facultatif</span>
          </Form.Item>
        </Card>
        <Card title="Histoire familiale" bordered={false} className="staticCard patientContent">
          <div className="familyLines">
            {familyItem}
          </div>
          <Form.Item>
            <Button className="addFamilyButton">
              <IconKit size={14} icon={ic_add} />
              Ajouter
            </Button>
          </Form.Item>
        </Card>
        <Card title="Signes cliniques" bordered={false} className="staticCard patientContent">
          <div className="separator">
            <div className="cardSeparator">
              <Form.Item className="searchInput">
                <Search classeName="searchInput" placeholder="Filtrer les signes par titre…" />
              </Form.Item>
              <Tree checkable selectable={false}>
                <TreeNode checkable={false} title="Eye Defetcs" key="0-0">
                  <TreeNode checkable={false} title="Abnormality of the optical nerve" key="0-0-0" disabled>
                    <TreeNode title="Abnormality of optic chiasm morphology" key="0-0-0-0" disableCheckbox />
                    <TreeNode title="leaf" key="0-0-0-1" />
                  </TreeNode>
                  <TreeNode checkable={false} title="parent 1-1" key="0-0-1">
                    <TreeNode title="sss" key="0-0-1-0" />
                  </TreeNode>
                </TreeNode>
              </Tree>
            </div>
            <div className="cardSeparator">
              {
                selectedPhenotype.length === 0
                  ? <p>Choisissez au moins un signe clinique depuis l’arbre de gauche afin de fournir l’information la plus complète possible sur le patient à tester.</p>
                  : phenotypeItem
              }
            </div>
          </div>

        </Card>
        <Card title="Indications" bordered={false} className="staticCard patientContent">
          <Form.Item label="Hypothèse(s) de diagnostique">
            <TextArea className="input note" rows={4} />
          </Form.Item>
        </Card>
      </Form>
    </div>
  );
};

const Approval = props => (
  <div>
    <Card title="Consentements" bordered={false} className="staticCard patientContent">
      <Form>
        <Form.Item label="Some field">
          <Input className="input" placeholder="a placeholder ..." />
        </Form.Item>
      </Form>
    </Card>
  </div>

);

class PatientSubmissionScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentPageIndex: 0,
    };

    this.handleSubmit = this.handleSubmit.bind(this);
  }


  handleSubmit(e) {
    const { form } = this.props;
    e.preventDefault();
    form.validateFields((err, values) => {
      if (err) { return; }

      const { actions, patient, serviceRequest } = this.props;
      const patientData = {
        name: {
          family: values.family,
          given: values.given,
        },
        birthDate: values.birthDate,
        gender: values.gender,
        id: patient.id,
        identifier: [
          {
            type: {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
                  code: 'MR',
                  display: 'Medical record number',
                },
              ],
              text: 'Numéro du dossier médical',
            },
            value: values.mrn,
          },
          {
            type: {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
                  code: 'JHN',
                  display: 'Jurisdictional health number (Canada)',
                },
              ],
              text: 'Numéro assurance maladie du Québec',
            },
            value: values.ramq,
          },
        ],
      };

      actions.savePatient(patientData, serviceRequest);
    });
  }

  nbPages() {
    return this.pages.length;
  }

  next() {
    const { currentPageIndex } = this.state;
    const pageIndex = currentPageIndex + 1;
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

  render() {
    const { form } = this.props;
    const { getFieldDecorator } = form;
    const { patient } = this.props;

    this.pages = [
      {
        title: intl.get('screen.clinicalSubmission.patientInformation'),
        content: (
          <PatientInformation parentForm={this} getFieldDecorator={getFieldDecorator} patient={patient} />
        ),
        name: 'PatientInformation',
        values: {},
      },
      {
        title: intl.get('screen.clinicalSubmission.clinicalInformation'),
        content: (
          <ClinicalInformation parentForm={this} getFieldDecorator={getFieldDecorator} />
        ),
        name: 'ClinicalInformation',
        values: {},
      },
      {
        title: intl.get('screen.clinicalSubmission.approval'),
        content: (
          <Approval parentForm={this} getFieldDecorator={getFieldDecorator} />
        ),
        name: 'Approval',
        values: {},
      },
    ];

    const { currentPageIndex } = this.state;
    const currentPage = this.pages[currentPageIndex];
    const pageContent = currentPage.content;

    return (
      <Content type="auto">
        <Header />
        <div className="page_headerStatic">
          <Steps current={currentPageIndex} className="headerStaticContent step">
            {this.pages.map(item => <Step key={item.title} title={item.title} />)}
          </Steps>
        </div>
        <div className="page-static-content">
          <Form
            initialValues={{
              remember: true,
            }}
            onSubmit={this.handleSubmit}
          >
            {pageContent}
            <div className="submission-form-actions">
              <Button type="primary" onClick={() => this.next()} disabled={this.isLastPage()}>
                {intl.get('screen.clinicalSubmission.nextButtonTitle')}
              </Button>
              <Button onClick={() => this.previous()} disabled={this.isFirstPage()}>
                {intl.get('screen.clinicalSubmission.previousButtonTitle')}
              </Button>
              <Button
                htmlType="submit"
              >
                <IconKit size={20} icon={ic_save} />
                {intl.get('screen.clinicalSubmission.saveButtonTitle')}
              </Button>
              <Button
                onClick={() => message.success('Cancelled ...')}
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
  // patientInformation: PropTypes.shape(patientSubmissionShape).isRequired,
};

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators({
    savePatient,
  }, dispatch),
});

const mapStateToProps = state => ({
  app: state.app,
  router: state.router,
  patient: state.patientSubmission.patient,
  search: state.search,
});

const WrappedPatientSubmissionForm = Form.create({ name: 'patient_submission' })(PatientSubmissionScreen);

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(WrappedPatientSubmissionForm);
