/* eslint-disable react/no-array-index-key */
/* eslint-disable react/prop-types */
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import {
  Card, Form, Input, Button, Radio, Tree, Select, AutoComplete,
} from 'antd';
import IconKit from 'react-icons-kit';
import {
  ic_add, ic_remove, ic_help, ic_person, ic_visibility, ic_visibility_off,
} from 'react-icons-kit/md';

import {
  map,
  isEmpty,
  has,
} from 'lodash';
import {
  CGH_CODES,
  CGH_VALUES,
  resourceNote,
  getCGHInterpretationCode,
  getIndicationNote,
  getIndicationId,
  getFamilyRelationshipCode,
  getFamilyRelationshipNote,
  hpoOnsetValues,
  getResourceId,
  getHPOCode,
  getHPODisplay,
  getHPOOnsetCode,
  getHPOInterpretationCode,
  hpoInterpretationValues,
  getFamilyRelationshipValues,
  getFamilyRelationshipDisplayForCode,
} from '../../../helpers/fhir/fhir';

import {
  addHpoResource,
  setHpoResourceDeletionFlag,
  setFamilyRelationshipResourceDeletionFlag,
  addFamilyHistoryResource,
  addEmptyFamilyHistory,
  updateHpoNote,
  updateHpoObservation,
  updateHpoAgeOnSet,
} from '../../../actions/patientSubmission';

import Api from '../../../helpers/api';
import { FamilyMemberHistoryBuilder } from '../../../helpers/fhir/builder/FMHBuilder.ts';
import { ObservationBuilder } from '../../../helpers/fhir/builder/ObservationBuilder.ts';

const interpretationIcon = {
  POS: ic_visibility,
  NEG: ic_visibility_off,
  IND: ic_help,
};

const HpoHiddenFields = ({
  hpoResource,
  hpoIndex,
  getFieldDecorator,
}) => (
  <div>
    {getFieldDecorator(`hpoIds[${hpoIndex}]`, {
      rules: [],
      initialValue: getResourceId(hpoResource) || '',
    })(
      <Input size="small" type="hidden" />,
    )}

    {getFieldDecorator(`hposToDelete[${hpoIndex}]`, {
      rules: [],
      initialValue: hpoResource.toDelete,
    })(
      <Input size="small" type="hidden" />,
    )}

    {getFieldDecorator(`hpoCodes[${hpoIndex}]`, {
      rules: [],
      initialValue: getHPOCode(hpoResource) || '',
    })(
      <Input size="small" type="hidden" />,
    )}

    {getFieldDecorator(`hpoDisplays[${hpoIndex}]`, {
      rules: [],
      initialValue: getHPODisplay(hpoResource) || '',
    })(
      <Input size="small" type="hidden" />,
    )}
  </div>
);


const INITIAL_TREE_ROOTS = [
  { key: 'HP:0001197', title: 'Anomalie du développement prénatal ou de la naissance', is_leaf: false },
  { key: 'HP:0001507', title: 'Anomalie de la croissance', is_Leaf: false },
  { key: 'HP:0000478', title: 'Anomalie oculaire', is_leaf: false },
  { key: 'HP:0001574', title: 'Anomalie de l\'oreille', is_leaf: false },
  { key: 'HP:0012519', title: 'Anomalie des téguments', is_leaf: false },
  { key: 'HP:0001626', title: 'Anomalie du système cardiovasculaire', is_leaf: false },
  { key: 'HP:0002086', title: 'Anomalie du système respiratoire', is_leaf: false },
  { key: 'HP:0000924', title: 'Anomalie du système musculo-squelettique', is_leaf: false },
  { key: 'HP:0003011', title: 'Anomalie de la musculature', is_leaf: false },
  { key: 'HP:0000119', title: 'Anomalie génito-urinaire', is_leaf: false },
  { key: 'HP:0025031', title: 'Anomalie du système digestif', is_leaf: false },
  { key: 'HP:0000152', title: 'Anomalie tête et cou', is_leaf: false },
  { key: 'HP:0000707', title: 'Anomalie du système nerveux', is_leaf: false },
];

class ClinicalInformation extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hpoOptions: [],
      treeData: INITIAL_TREE_ROOTS,
    };

    const { treeData } = this.state;
    this.loadedHpoTreeNodes = treeData.reduce((acc, value) => { acc[value.key] = true; return acc; }, {});
    this.onLoadHpoChildren = this.onLoadHpoChildren.bind(this);
    this.addFamilyHistory = this.addFamilyHistory.bind(this);
    this.deleteFamilyHistory = this.deleteFamilyHistory.bind(this);
    this.handleHpoSearchTermChanged = this.handleHpoSearchTermChanged.bind(this);
    this.handleHpoOptionSelected = this.handleHpoOptionSelected.bind(this);
    this.handleHpoDeleted = this.handleHpoDeleted.bind(this);
    this.handleHpoNodesChecked = this.handleHpoNodesChecked.bind(this);
    this.hpoSelected = this.hpoSelected.bind(this);
    this.isAddDisabled = this.isAddDisabled.bind(this);
    this.fmhSelected = this.fmhSelected.bind(this);
    this.handleHpoNoteChanged = this.handleHpoNoteChanged.bind(this);
    this.handleObservationChanged = this.handleObservationChanged.bind(this);
    this.handleHpoAgeChanged = this.handleHpoAgeChanged.bind(this);
  }


  onLoadHpoChildren(treeNode) {
    return new Promise((resolve) => {
      const { treeData } = this.state;
      const { dataRef } = treeNode.props;
      const { key } = dataRef;

      if (treeNode.props.children) {
        resolve();
        return;
      }

      Api.searchHpoChildren(key).then((response) => {
        if (response.payload) {
          const { data } = response.payload.data;
          const { hits } = data;
          const results = map(hits, '_source')
            .map(r => ({ title: r.name, key: r.id, checkable: true }))
            .map(r => ({ ...r, checked: true }));

          treeNode.props.dataRef.children = results;

          results.forEach((r) => { this.loadedHpoTreeNodes[r.key] = true; });

          this.setState({
            treeData: [...treeData],
          });
          resolve();
        }
      });
    });
  }

  phenotype({
    hpoResource,
    form,
    hpoIndex,
    deleteHpo,
  }) {
    const { getFieldDecorator } = form;
    const { Option, OptGroup } = Select;

    const defaultValue = () => {
      if (hpoResource.note.length > 0) {
        return hpoResource.note[0].text;
      }
      return '';
    };
    return (
      <div key={hpoResource.valueCodeableConcept.coding[0].code} className="phenotypeBlock">
        <div className="phenotypeFirstLine">
          <div className="leftBlock">
            <span className="hpoTitle">{getHPODisplay(hpoResource)}</span>
            <Button type="link" className="bordelessButton deleteButton" onClick={() => deleteHpo(getHPOCode(hpoResource))}>Supprimer</Button>
          </div>
          <HpoHiddenFields hpoResource={hpoResource} form={form} hpoIndex={hpoIndex} deleteHpo={deleteHpo} getFieldDecorator={getFieldDecorator} />
          <div className="rightBlock">
            <Form.Item key={`interpretation-${hpoIndex}`}>
              <Select
                className="select selectObserved"
                placeholder="Interpretation"
                size="small"
                dropdownClassName="selectDropdown"
                defaultValue={getHPOInterpretationCode(hpoResource)}
                onChange={event => this.handleObservationChanged(event, hpoIndex)}
              >
                {hpoInterpretationValues().map((interpretation, index) => (
                  <Select.Option
                    key={`hpoInterpretation_${index}`}
                    value={interpretation.value}
                  >
                    <IconKit className={`${interpretation.iconClass} icon`} size={14} icon={interpretationIcon[interpretation.value]} />
                    {interpretation.display}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item key={`onset-${hpoIndex}`}>
              <Select
                className="select selectAge"
                size="small"
                placeholder="Âge d’apparition"
                dropdownClassName="selectDropdown"
                defaultValue={getHPOOnsetCode(hpoResource)}
                onChange={event => this.handleHpoAgeChanged(event, hpoIndex)}
              >
                {
                    hpoOnsetValues.map((group, gIndex) => (
                      <OptGroup label={group.groupLabel} key={`onsetGroup_${gIndex}`}>
                        {group.options.map((o, oIndex) => (
                          <Option value={o.code} key={`onsetOption_${oIndex}`}>{o.display}</Option>
                        ))}
                      </OptGroup>
                    ))
                  }
              </Select>
            </Form.Item>
          </div>
        </div>
        <div className="phenotypeSecondLine" key={`input-${hpoIndex}`}>
          <Form.Item>
            <Input placeholder="Ajouter une note…" value={defaultValue()} size="small" onChange={event => this.handleHpoNoteChanged(event.target.value, hpoIndex)} className="input hpoNote" />
          </Form.Item>
        </div>
      </div>
    );
  }

  handleHpoNoteChanged(note, index) {
    const { actions } = this.props;
    actions.updateHpoNote(note, index);
  }

  handleObservationChanged(observationCode, index) {
    const { actions } = this.props;


    actions.updateHpoObservation(
      {
        interpretation: {
          code: observationCode,
          display: hpoInterpretationValues().find(interpretation => interpretation.value === observationCode).display,
        },
      }, index,
    );
  }

  handleHpoAgeChanged(code, index) {
    const { actions } = this.props;
    let value = null;
    const keys = Object.keys(hpoOnsetValues);
    // eslint-disable-next-line no-restricted-syntax
    for (const key of keys) {
      const group = hpoOnsetValues[key];
      value = group.options.find(onSet => onSet.code === code);
      if (value != null) {
        break;
      }
    }

    if (value == null) {
      throw new Error(`OnSet code [${code}] not found in [hpoOnsetValues]`);
    }
    actions.updateHpoAgeOnSet(value, index);
  }

  isAddDisabled() {
    const { form } = this.props;
    const values = form.getFieldsValue();
    const {
      familyRelationshipCodes,
    } = values;
    const index = familyRelationshipCodes.length - 1;
    return familyRelationshipCodes[index] == null || familyRelationshipCodes[index].length === 0;
  }

  addFamilyHistory() {
    const { actions } = this.props;
    actions.addEmptyFamilyHistory();
  }

  fmhSelected(fhmCode, index) {
    const { form } = this.props;
    const values = form.getFieldsValue();
    const {
      familyRelationshipCodes,
    } = values;

    let { familyRelationshipNotes } = values;

    familyRelationshipNotes = familyRelationshipNotes.map(n => n.trim());
    const fmh = [];
    const { observations } = this.props;
    familyRelationshipCodes.forEach((c, i) => {
      const code = i === index ? fhmCode : c;
      if (code != null && code.length > 0) {
        const builder = new FamilyMemberHistoryBuilder(code, getFamilyRelationshipDisplayForCode(code));
        if (familyRelationshipNotes[index] != null) {
          builder.withNote(familyRelationshipNotes[index]);
        }
        const familyHistory = builder.build();

        if (observations.fmh[i].id != null && observations.fmh[i].id.length > 0) {
          familyHistory.id = observations.fmh[i].id;
        }
        fmh.push(familyHistory);
      }
    });
    const { actions } = this.props;
    actions.addFamilyHistoryResource(fmh);
  }

  deleteFamilyHistory({ code }) {
    const { form, actions } = this.props;
    const values = form.getFieldsValue();
    const {
      familyRelationshipIds,
      familyRelationshipCodes,
      familyRelationshipNotes,
    } = values;

    const codes = [];
    const ids = [];
    const notes = [];

    familyRelationshipCodes.forEach((c, i) => {
      if (c !== code) {
        codes.push(c);
        ids.push(familyRelationshipIds[i]);
        notes.push(familyRelationshipNotes[i]);
      }
    });

    values.familyRelationshipCodes = codes;
    values.familyRelationshipIds = ids;
    values.familyRelationshipNotes = notes;
    form.setFieldsValue(values);

    const fmh = [];
    const deleted = [];
    const { observations } = this.props;

    observations.fmh.forEach((familyHistory) => {
      if (isEmpty(familyHistory) || familyHistory.relationship.coding[0].code !== code) {
        fmh.push(familyHistory);
      } else if (familyHistory.id != null) {
        deleted.push(familyHistory);
      }
    });

    actions.addFamilyHistoryResource(fmh);
    actions.setFamilyRelationshipResourceDeletionFlag(deleted);
    if (fmh.length === 0) {
      actions.addEmptyFamilyHistory();
    }
  }

  handleHpoSearchTermChanged(term) {
    Api.searchHpos(term.toLowerCase().trim()).then((response) => {
      if (response.payload) {
        const { data } = response.payload.data;
        const { hits } = data;
        const results = map(hits, '_source');

        this.setState({
          hpoOptions: results,
        });
      }
    });
  }

  hpoSelected({ code, display }) {
    const { actions } = this.props;

    const builder = new ObservationBuilder('HPO');
    builder.withValue({
      coding: [{
        code, display,
      }],
    });

    actions.addHpoResource(builder.build());
  }

  handleHpoNodesChecked(_, info) {
    const { actions, observations } = this.props;

    const checkedNodes = info.checkedNodes.map(n => ({ code: n.key, display: n.props.title }));
    const hpoResources = observations.hpos;

    const toDelete = [];
    const toAdd = [];
    hpoResources.forEach((resource) => {
      if (checkedNodes.find(r => r.code === resource.valueCodeableConcept.coding[0].code) == null) {
        toDelete.push(resource);
      }
    });
    checkedNodes.forEach((resource) => {
      if (hpoResources.find(r => resource.code === r.valueCodeableConcept.coding[0].code) == null) {
        toAdd.push(resource);
      }
    });

    toDelete.map(r => ({ code: r.valueCodeableConcept.coding[0].code })).forEach(actions.setHpoResourceDeletionFlag);
    toAdd.forEach(this.hpoSelected);
  }

  handleHpoOptionSelected(value) {
    const { hpoOptions } = this.state;
    const option = hpoOptions.find(h => h.name === value);

    this.hpoSelected({ code: option.key, display: option.name });
  }

  handleHpoDeleted(hpoId) {
    const { actions } = this.props;
    actions.setHpoResourceDeletionFlag({ code: hpoId, toDelete: true });
  }

  renderTreeNodes(data) {
    return data.map((item) => {
      const { TreeNode } = Tree;
      if (item.children) {
        return (
          <TreeNode title={item.title} key={item.key} dataRef={item}>
            {this.renderTreeNodes(item.children)}
          </TreeNode>
        );
      }
      return <TreeNode key={item.key} {...item} dataRef={item} />;
    });
  }

  render() {
    const { hpoOptions, treeData } = this.state;

    const hpoOptionsLabels = map(hpoOptions, 'name');
    const {
      form, observations, localStore,
    } = this.props;
    const { getFieldDecorator, getFieldValue } = form;

    const { TextArea } = Input;


    const relationshipPossibleValues = getFamilyRelationshipValues();
    const familyHistoryResources = observations.fmh;
    const familyItems = familyHistoryResources.map((resource, index) => ((
      <div className="familyLine">
        {getFieldDecorator(`familyRelationshipIds[${index}]`, {
          rules: [],
          initialValue: getResourceId(resource) || '',
        })(
          <Input size="small" type="hidden" />,
        )}

        {getFieldDecorator(`familyRelationshipsToDelete[${index}]`, {
          rules: [],
          initialValue: resource.toDelete,
        })(
          <Input size="small" type="hidden" />,
        )}

        <Form.Item required={false} key={`familyHistoryNote_${getFamilyRelationshipCode(resource)}`}>
          {getFieldDecorator(`familyRelationshipNotes[${index}]`, {
            validateTrigger: ['onChange', 'onBlur'],
            initialValue: getFamilyRelationshipNote(resource),
            rules: [{
              whitespace: true,
              message: 'Ne peut pas contenir que des espaces',
            },
            ],
          })(
            <Input placeholder="Ajouter une note…" className="input noteInput note" />,
          )}
        </Form.Item>
        <Form.Item required={false} key={`familyRelation_${getFamilyRelationshipCode(resource)}`}>
          {getFieldDecorator(`familyRelationshipCodes[${index}]`, {
            validateTrigger: ['onChange', 'onBlur'],
            initialValue: getFamilyRelationshipCode(resource),
            rules: [],
          })(
            <Select suffixIcon={<IconKit className="selectIcon" size={16} icon={ic_person} />} className="selectRelation" placeholder="Relation parentale" dropdownClassName="selectDropdown" onChange={(event) => { this.fmhSelected(event, index); }}>
              {Object.values(relationshipPossibleValues).map(rv => (
                <Select.Option value={rv.value} key={`relationship_${rv.value}`}>{rv.label}</Select.Option>
              ))}
            </Select>,
          )}
        </Form.Item>
        <Button
          className="delButton"
          disabled={!(getFieldValue(`familyRelationshipNotes[${index}]`)) || !(getFieldValue(`familyRelationshipCodes[${index}]`)) || familyHistoryResources.length === 1}
          shape="round"
          onClick={() => this.deleteFamilyHistory({ code: getFieldValue(`familyRelationshipCodes[${index}]`) })}
        >
          <IconKit size={20} icon={ic_remove} />
        </Button>
      </div>
    )));

    let cghInterpretationValue;
    let summaryNoteValue;
    let cghId = null;
    if (observations.cgh != null) {
      cghId = observations.cgh.id;
      cghInterpretationValue = getCGHInterpretationCode(observations.cgh);
    }


    if (observations.summary != null) {
      summaryNoteValue = resourceNote(observations.summary);
    }

    let indicationNoteValue;
    let indicationResource;
    if (observations.indic != null) {
      indicationNoteValue = getIndicationNote(observations.indic);
    }

    const hpoResources = observations.hpos;
    const hpoCodes = hpoResources.filter(r => !r.toDelete).map(getHPOCode);

    return (
      <div>
        <Card title="Informations cliniques" bordered={false} className="staticCard patientContent">
          {getFieldDecorator('cghId', {
            rules: [],
            initialValue: cghId,
          })(
            <Input size="small" type="hidden" />,
          )}

          {/* TODO initialValue */}
          <Form.Item label="Type d’analyse">
            {getFieldDecorator('analyse', {
              rules: [],
              initialValue: has(localStore.serviceRequest, 'code') ? localStore.serviceRequest.code : null,
            })(
              <Radio.Group buttonStyle="solid">
                <Radio.Button value="WXS"><span className="radioText">Exome</span></Radio.Button>
                <Radio.Button value="WGS"><span className="radioText">Génome</span></Radio.Button>
                <Radio.Button value="GP"><span className="radioText">Séquençage ciblé</span></Radio.Button>
              </Radio.Group>,
            )}
          </Form.Item>
        </Card>
        <Card title="Résumé de l’investigation" bordered={false} className="staticCard patientContent">
          <Form.Item label="CGH">
            {getFieldDecorator('cghInterpretationValue', {
              rules: [],
              initialValue: cghInterpretationValue,
            })(
              <Radio.Group buttonStyle="solid">
                {CGH_VALUES().map((v, index) => (
                  <Radio.Button key={`cghValue_${index}`} value={v.value}><span className="radioText">{v.display}</span></Radio.Button>
                ))}
              </Radio.Group>,
            )}
          </Form.Item>
          {
            /* TODO initalValue */
            (form.getFieldsValue().cghInterpretationValue === CGH_CODES.A)
            && (
            <Form.Item label="Précision">
              {getFieldDecorator('cghPrecision', {
                rules: [{
                  required: true,
                  message: 'Veuillez indiquer le résultat du CGH',
                },
                {
                  whitespace: true,
                  message: 'Ne peut pas contenir que des espaces',
                },
                ],
              })(
                <Input placeholder="Veuillez préciser…" className="input note" />,
              )}
            </Form.Item>
            )
          }

          <Form.Item label="Résumé">
            {getFieldDecorator('summaryNote', {
              rules: [{
                whitespace: true,
                message: 'Ne peut pas contenir que des espaces',
              },
              ],
              initialValue: summaryNoteValue,
            })(
              <TextArea className="input note" rows={4} />,
            )}
            <span className="optional">Facultatif</span>
          </Form.Item>
        </Card>
        <Card title="Histoire familiale" bordered={false} className="staticCard patientContent">
          <div className="familyLines">
            {familyItems}
          </div>
          <Form.Item>
            {/* <Button className="addFamilyButton" disabled={(!(getFieldValue('note')[getFieldValue('note').length - 1]) && !(getFieldValue('relation')[getFieldValue('relation').length - 1]))} onClick={this.addFamilyHistory}> */}
            <Button className="addFamilyButton" disabled={this.isAddDisabled()} onClick={this.addFamilyHistory}>
              <IconKit size={14} icon={ic_add} />
                Ajouter
            </Button>
          </Form.Item>
        </Card>
        <Card title="Signes cliniques" bordered={false} className="staticCard patientContent">
          <div className="separator">
            <div className="cardSeparator">
              <Form.Item className="searchInput searchInputFull">
                <AutoComplete
                  classeName="searchInput"
                  placeholder="Chercher un signe clinique ..."
                  dataSource={hpoOptionsLabels}
                  onSelect={this.handleHpoOptionSelected}
                  onChange={this.handleHpoSearchTermChanged}
                />

              </Form.Item>
              <Tree
                loadData={this.onLoadHpoChildren}
                checkStrictly
                checkable
                checkedKeys={hpoCodes}
                onCheck={this.handleHpoNodesChecked}
              >
                {this.renderTreeNodes(treeData)}
              </Tree>
            </div>
            <div className={hpoResources.length === 0 ? 'cardSeparator message' : 'cardSeparator'}>              {
                hpoResources.length === 0
                  ? <p>Choisissez au moins un signe clinique depuis l’arbre de gauche afin de fournir l’information la plus complète possible sur le patient à tester.</p>
                  : hpoResources.map((hpoResource, hpoIndex) => this.phenotype({
                    hpoResource,
                    form,
                    hpoIndex,
                    deleteHpo: this.handleHpoDeleted,
                  }))
              }
            </div>
          </div>

        </Card>
        <Card title="Indications" bordered={false} className="staticCard patientContent">
          {getFieldDecorator('indicationId', {
            rules: [],
            initialValue: getIndicationId(indicationResource) || '',
          })(
            <Input size="small" type="hidden" />,
          )}

          <Form.Item label="Hypothèse(s) de diagnostic">
            {getFieldDecorator('indication', {
              rules: [
                {
                  whitespace: true,
                  message: 'Ne peut pas contenir que des espaces',
                },
              ],
              initialValue: indicationNoteValue,
            })(
              <TextArea className="input note" rows={4} />,
            )}
          </Form.Item>
        </Card>
      </div>
    );
  }
}

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators({
    addHpoResource,
    setHpoResourceDeletionFlag,
    setFamilyRelationshipResourceDeletionFlag,
    addFamilyHistoryResource,
    addEmptyFamilyHistory,
    updateHpoNote,
    updateHpoObservation,
    updateHpoAgeOnSet,
  }, dispatch),
});

const mapStateToProps = state => ({
  clinicalImpression: state.patientSubmission.clinicalImpression,
  observations: state.patientSubmission.observations,
  serviceRequest: state.patientSubmission.serviceRequest,
  localStore: state.patientSubmission.local,
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ClinicalInformation);
