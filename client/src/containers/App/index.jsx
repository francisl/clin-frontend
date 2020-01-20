/* eslint-disable */

import { hot } from 'react-hot-loader/root';
import React from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router';
import { ConnectedRouter } from 'connected-react-router';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { IntlProvider } from 'react-intl-redux';
import { Spin, Layout, ConfigProvider } from 'antd';

import 'antd/dist/antd.less';
import './style.scss';

import HomeScreen from '../../components/screens/Home';
import MaintenanceScreen from '../../components/screens/Maintenance';
import NoMatchScreen from '../../components/screens/NoMatch';
import PatientScreen from '../../components/screens/Patient';
import PatientSearchScreen from '../../components/screens/PatientSearch';
import PatientVariantScreen from '../../components/screens/PatientVariant';
import PrivateRoute from '../PrivateRoute';

import { loadApp, error, warning } from '../../actions/app';
import { appShape } from '../../reducers/app';
import { userShape } from '../../reducers/user';

export class App extends React.Component {
  constructor() {
    super();
    this.state = { caughtError: false };
  }

  componentDidMount() {
    const { actions } = this.props;
    actions.loadApp();
  }

  // @TODO
  static getDerivedStateFromError() {
    return { caughtError: true };
  }

  componentDidCatch(e, info) {
    error(e.toString());
    warning(info);
  }

  render() {
    const { caughtError } = this.state;
    if (caughtError) {
      return (
        <MaintenanceScreen />
      );
    }

    const { app, user, history } = this.props;
    return (
      <Spin key="spinner" size="large" spinning={app.showLoadingAnimation}>
        <IntlProvider key="locale-intl">
          <ConfigProvider key="locale-antd" locale={app.locale.antd}>
            <Layout id="layout" key="layout">
              <ConnectedRouter key="connected-router" history={history}>
                <Switch key="switch">
                  <PrivateRoute exact path="/patient/search" Component={PatientSearchScreen} key="route-patient-search" user={user} />
                  <PrivateRoute exact path="/patient/:uid/variant" Component={PatientVariantScreen} key="route-patient-variant" user={user}  />
                  <PrivateRoute exact path="/patient/:uid" Component={PatientScreen} key="route-patient" user={user} />
                  <Route exact path="/" component={HomeScreen} key="route-home" />
                  <Route component={NoMatchScreen} key="route-nomatch" />
                </Switch>
              </ConnectedRouter>
            </Layout>
          </ConfigProvider>
        </IntlProvider>
      </Spin>
    );
  }
}

App.propTypes = {
  actions: PropTypes.shape({}).isRequired,
  app: PropTypes.shape(appShape).isRequired,
  user: PropTypes.shape(userShape).isRequired,
  history: PropTypes.shape({}).isRequired,
};

const mapStateToProps = state => ({
  app: state.app,
  user: state.user,
});

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators({
    loadApp,
  }, dispatch),
});

export const ConnectedApp = connect(
  mapStateToProps,
  mapDispatchToProps,
)(App);

export default hot(ConnectedApp);
