/* eslint-disable */
import React from 'react';
import {
  Typography, Row, Col, Checkbox, Radio, Input, Tag, Tooltip,
} from 'antd';
import {
  cloneDeep, pull, orderBy, pullAllBy, filter,
} from 'lodash';
import IconKit from 'react-icons-kit';
import {
  empty, one, full,
} from 'react-icons-kit/entypo';
import PropTypes from 'prop-types';

import Filter, { FILTER_TYPE_SPECIFIC } from './index';
import { FILTER_OPERAND_TYPE_ALL, FILTER_OPERAND_TYPE_NONE, FILTER_OPERAND_TYPE_ONE } from './Generic';

const SELECTOR_ALL = 'all'
const SELECTOR_INTERSECTION = 'intersection'
const SELECTOR_DIFFERENCE = 'difference'
const SELECTORS = [SELECTOR_ALL, SELECTOR_INTERSECTION, SELECTOR_DIFFERENCE]

class SpecificFilter extends Filter {

    constructor(props) {
      super(props);
      this.state = {
        draft: null,
        selection: [],
        selector: null,
        indeterminate: false,
        size: null,
        page: null,
        allOptions: null,
      };
      this.getEditor = this.getEditor.bind(this);
      this.getLabel = this.getLabel.bind(this);
      this.getPopoverContent = this.getPopoverContent.bind(this);
      this.getPopoverLegend = this.getPopoverLegend.bind(this);
      this.handleSearchByQuery = this.handleSearchByQuery.bind(this);
      this.handleOperandChange = this.handleOperandChange.bind(this);
      this.handleSelectorChange = this.handleSelectorChange.bind(this);
      this.handleSelectionChange = this.handleSelectionChange.bind(this);
      this.handleCheckAllSelections = this.handleCheckAllSelections.bind(this);
      this.handlePageChange = this.handlePageChange.bind(this);

      // @NOTE Initialize Component State
      const { data, dataSet } = props;

      this.state.draft = cloneDeep(data);
      this.state.selector = SELECTOR_ALL;
      this.state.selection = data.values ? cloneDeep(data.values) : [];
      this.state.page = 1;
      this.state.size = 10;
      this.state.allOptions = cloneDeep(dataSet);

      const { selection, allOptions } = this.state;
      if (selection.length > 0) {
        const value = filter(cloneDeep(dataSet), o => selection.includes(o.value));
        if (value.length === 0) {
          const selectedValue = [];
          selection.map(x => selectedValue.push({ value: x, count: 0 }));
          allOptions.unshift(...selectedValue);
        } else {
          const sorted = orderBy(value, ['count'], ['desc']);
          pullAllBy(allOptions, cloneDeep(sorted), 'value');
          allOptions.unshift(...sorted);
        }
      }
    }

  getLabel() {
    const { data } = this.props;
    const { values } = data;
    return JSON.stringify(values);
  }

  getPopoverLegend() {
    const { data } = this.props;
    const { operand } = data;
    switch (operand) {
      default:
      case FILTER_OPERAND_TYPE_ALL:
        return (<IconKit size={16} icon={full} />);
      case FILTER_OPERAND_TYPE_ONE:
        return (<IconKit size={16} icon={one} />);
      case FILTER_OPERAND_TYPE_NONE:
        return (<IconKit size={16} icon={empty} />);
    }
  }

  getPopoverContent() {
    const { intl, data, category } = this.props;
    const { Text } = Typography;

    const titleText = intl.formatMessage({ id: `screen.patientvariant.filter_${data.id}` });
    const descriptionText = intl.formatMessage({ id: `screen.patientvariant.filter_${data.id}.description` });
    const operandText = intl.formatMessage({ id: `screen.patientvariant.filter.operand.${data.operand}` });
    const categoryText = category ? intl.formatMessage({ id: `screen.patientvariant.category_${category}` }) : null;
    const valueText = intl.formatMessage({ id: 'screen.patientvariant.filter_value' });
    const valueList = data.values ? data.values.map((x, index) => <li key={index}>{x}</li>) : null;

    return (
      <div>
        <Row type="flex" justify="space-between" gutter={32}>
          <Col>
            <Text strong>{titleText}</Text>
          </Col>
          <Col>
            <Text>{categoryText}</Text>
          </Col>
        </Row>
        <Row>
          <Col>
            <Text>{descriptionText}</Text>
          </Col>
        </Row>
        <br />
        <Row>
          <Col>
            <Text>{operandText}</Text>
          </Col>
        </Row>
        <br />
        <Row>
          <Col>
            {valueText}
            {' '}
            :
          </Col>
        </Row>
        <Row>
          <Col>
            <ul>
              {valueList}
            </ul>
          </Col>
        </Row>
      </div>
    );
  }

  handleSearchByQuery(values) {
    const { dataSet } = this.props;
    const allOptions = cloneDeep(dataSet);
    const search = values.toLowerCase()
    const toRemove = filter(cloneDeep(allOptions), o => (search !== '' ? !o.value.toLowerCase().startsWith(search) : null));

    pullAllBy(allOptions, cloneDeep(toRemove), 'value');
    this.setState({
      allOptions,
    });
  }

  handlePageChange(page, size) {
    this.setState({
      page,
      size,
    });
  }

  handleCheckAllSelections(e) {
    const { target } = e;
    if (!target.checked) {
      this.setState({
        selection: [],
        indeterminate: false,
      });
    } else {
      const { dataSet, externalDataSet } = this.props;
      const { selector } = this.state;
      const externalOntology = externalDataSet.ontology.map(ontology => ontology.code)
      let options = [];
      let indeterminate = false;
      switch (selector) {
        default:
        case SELECTOR_ALL:
          options = dataSet
          break;
        case SELECTOR_INTERSECTION:
          indeterminate = true;
          options = dataSet.filter(option => externalOntology.indexOf(option.value.split(',')[0]) !== -1)
          break;
        case SELECTOR_DIFFERENCE:
          indeterminate = true;
          options = dataSet.filter(option => externalOntology.indexOf(option.value.split(',')[0]) === -1)
          break;
      }

      this.setState({
        selection: options.map(option => option.value),
        indeterminate,
      });
    }
  }

  handleSelectionChange(values) {
    const { dataSet } = this.props;
    const {
      selection, allOptions, page, size,
    } = this.state;

    const minValue = size * (page - 1);
    const maxValue = size * page;
    const options = allOptions.slice(minValue, maxValue);

    options.map((x) => {
      if (selection.includes(x.value)) {
        !values.includes(x.value) ? pull(selection, x.value) : null;
      } else {
        values.includes(x.value) ? selection.push(x.value) : null;
      }
    });
    this.setState({
      selection,
      indeterminate: (!(values.length === dataSet.length) && values.length > 0),
    });
  }

  handleSelectorChange(e) {
    const selector = e.target.value;
    if (SELECTORS.indexOf(selector) !== -1) {
      this.setState({ selector });
    }
  }

  handleOperandChange(e) {
    const { config } = this.props;
    const operand = e.target.value;
    if (config.operands.indexOf(operand) !== -1) {
      const { draft } = this.state;
      draft.operand = operand;
      this.setState({ draft });
    }
  }

  getEditor() {
    const { intl, config, renderCustomDataSelector } = this.props;
    const {
      draft, selection, selector, size, page, allOptions, indeterminate
    } = this.state;
    const { operand } = draft;
    const allSelected = allOptions ? selection.length === allOptions.length : false;
    const selectAll = intl.formatMessage({ id: 'screen.patientvariant.filter.selection.all' });
    const selectNone = intl.formatMessage({ id: 'screen.patientvariant.filter.selection.none' });
    const selectorAll = intl.formatMessage({ id: 'screen.patientvariant.filter.specific.selector.all' });
    const selectorIntersection = intl.formatMessage({ id: 'screen.patientvariant.filter.specific.selector.intersection' });
    const selectorDifference = intl.formatMessage({ id: 'screen.patientvariant.filter.specific.selector.difference' });
    const minValue = size * (page - 1);
    const maxValue = size * page;

    pullAllBy(allOptions, [{ value: '' }], 'value');

    const options = allOptions.slice(minValue, maxValue).map((option) => {
      const value = option.value.length < 60 ? option.value : `${option.value.substring(0, 55)} ...`;
      return {
        label: (
          <span>
            <Tooltip title={option.value}>
              {value}
            </Tooltip>
            <Tag>{option.count}</Tag>
          </span>
        ),
        value: option.value,
      };
    });

    const customDataSelector = renderCustomDataSelector(
      this.handleSelectorChange,
      this.handleCheckAllSelections,
      [
        { label: selectorIntersection, value: SELECTOR_INTERSECTION},
        { label: selectorDifference, value: SELECTOR_DIFFERENCE },
        { label: selectorAll, value: SELECTOR_ALL },
      ],
      selector,
      allSelected ? selectNone : selectAll,
      allSelected,
      indeterminate,
    )

    return (
      <>
        <Row>
          <Col span={24}>
            <Radio.Group size="small" type="primary" value={operand} onChange={this.handleOperandChange}>
              {config.operands.map(configOperand => (
                <Radio.Button style={{ width: 150, textAlign: 'center' }} value={configOperand}>
                  {intl.formatMessage({ id: `screen.patientvariant.filter.operand.${configOperand}` })}
                </Radio.Button>
              ))}
            </Radio.Group>
          </Col>
        </Row>
        { customDataSelector }
        <br />
        <Row>
          <Col span={24}>
            <Checkbox.Group
              options={options}
              value={selection}
              onChange={this.handleSelectionChange}
            />
          </Col>
        </Row>
      </>
    );
  }
  render() {
    const { allOptions } = this.state;
    return (
      <Filter
        {...this.props}
        type={FILTER_TYPE_SPECIFIC}
        searchable={true}
        editor={this.getEditor()}
        label={this.getLabel()}
        legend={this.getPopoverLegend()}
        content={this.getPopoverContent()}
        onPageChangeCallBack={this.handlePageChange}
        onSearchCallback = {this.handleSearchByQuery}
        sortData={allOptions}
      />
    );
  }
}
SpecificFilter.propTypes = {
  intl: PropTypes.shape({}).isRequired,
  data: PropTypes.shape({}).isRequired,
  dataSet: PropTypes.array.isRequired,
  externalDataSet: PropTypes.shape({}).isRequired,
  category: PropTypes.string,
  config: PropTypes.shape({}).isRequired,
  renderCustomDataSelector: PropTypes.shape.func,
};
SpecificFilter.defaultProps = {
  renderCustomDataSelector: (onChangeCallback, onCheckAllCallback, values, selector, checkboxLabel, checkboxIsChecked, checkboxIsIndeterminate = false) => (
    //@NOTE Contained in both dataSet and externalDataSet -> intersection / not intersection
    <>
      <br />
      <Row style={{ display: 'flex', alignItems: 'center' }} >
        <Col span={6}>
          <Checkbox
            key="specific-selector-check-all"
            className="selector"
            indeterminate={checkboxIsIndeterminate}
            onChange={onCheckAllCallback}
            checked={checkboxIsChecked}
          />
          {checkboxLabel}
        </Col>
        <Col span={18}>
          <Radio.Group size="small" type="secondary" value={selector} onChange={onChangeCallback} style={{ display: 'flex', justifyContent: 'stretch' }}>
            { values.map(value => (
              <Radio.Button style={{ textAlign: 'center', width: '100%' }} value={value.value}>
                {value.label}
              </Radio.Button>
            )) }
          </Radio.Group>
        </Col>
      </Row>
    </>
  ),
  category: '',
  config: {
    operands: [FILTER_OPERAND_TYPE_ALL, FILTER_OPERAND_TYPE_ONE, FILTER_OPERAND_TYPE_NONE]
  },
};
export default SpecificFilter;