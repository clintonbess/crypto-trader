import React, { Component } from 'react';
import { NavLink } from 'react-router-dom';
import { connect } from 'react-redux';
import moment from 'moment';
import PropTypes from 'prop-types';

import {
  updateHeartbeat,
  fetchAccounts,
  initProducts,
} from '../../actions';
import { round } from '../../utils/math';

class Navigation extends Component {
  static propTypes = {
    live: PropTypes.bool.isRequired,
    accounts: PropTypes.arrayOf(PropTypes.object).isRequired,
    session: PropTypes.string.isRequired,
    products: PropTypes.arrayOf(PropTypes.object).isRequired,
    websocket: PropTypes.object.isRequired,
    selectedProductIds: PropTypes.arrayOf(PropTypes.string).isRequired,
    location: PropTypes.object.isRequired,
  }

  componentDidMount() {
    this.props.initProducts();

    setInterval(() => {
      if (this.props.session.length > 5) {
        this.props.fetchAccounts(this.props.session);
      }
    }, 5000);

    setInterval(() => {
      if (moment().unix() - moment(this.props.websocket.heartbeatTime).unix() > 30
          && this.props.websocket.connected === true) {
        this.props.updateHeartbeat(false);
      }
    }, 10000);
  }

  // only render if accounts or orderbook or location changed
  shouldComponentUpdate(nextProps) {
    const accountsChanged = JSON.stringify(this.props.accounts)
      !== JSON.stringify(nextProps.accounts);
    const locationChanged = JSON.stringify(this.props.location)
      !== JSON.stringify(nextProps.location);
    return accountsChanged || locationChanged;
  }

  render() {
    console.log('rendering navigation container');
    return (
      <nav className={`navbar ${this.props.live ? 'live' : ''}`}>
        <a
          className="nav-group"
          target="_blank"
          rel="noopener noreferrer"
          href="https://github.com/aastein/crypto-trader"
        >
          <img
            alt="logo"
            src="https://avatars0.githubusercontent.com/u/18291415?v=3&s=460"
          />
        </a>
        <ul className="nav-group links">
          <li>
            <NavLink
              exact
              activeClassName="active"
              to="/"
            >
                Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink
              exact
              activeClassName="active"
              to="/profile"
            >
              Profile
            </NavLink>
          </li>
          <li className="accounts-nav">
            <NavLink
              exact
              activeClassName="active"
              to="/accounts"
            >
              Accounts
            </NavLink>
          </li>
        </ul>
        <ul className="nav-group orderbook">
          {
            this.props.products.filter(p => (
              this.props.selectedProductIds.indexOf(p.id) > -1
            )).map(a => (
              <li key={a.display_name}>
                <div>
                  <p>{a.display_name}</p>
                  <p>{`Bid: ${a.bids.length > 0 ? a.bids[0][0] : ''}`}</p>
                  <p>{`Ask: ${a.asks.length > 0 ? a.asks[0][0] : ''}`}</p>
                </div>
              </li>
          ))}
        </ul>
        <ul className="nav-group-right accounts">
          {this.props.accounts.map(a => (
            <li key={a.currency}>
              <div>
                <p>{a.currency}</p>
                <p>{`Available: ${round(a.available, 6)}`}</p>
                <p>{`Balance: ${round(a.balance, 6)}`}</p>
              </div>
            </li>
          ))}
        </ul>
      </nav>
    );
  }
}

const mapStateToProps = state => (
  {
    live: state.profile.live,
    accounts: state.profile.accounts,
    session: state.profile.session,
    products: state.chart.products,
    websocket: state.websocket,
    selectedProductIds: state.profile.selectedProducts.map(p => (p.value)),
    location: state.location,
  }
);

const mapDispatchToProps = dispatch => (
  {
    updateHeartbeat: (status) => {
      dispatch(updateHeartbeat(status));
    },
    fetchAccounts: (session) => {
      dispatch(fetchAccounts(session));
    },
    initProducts: () => {
      dispatch(initProducts());
    },
  }
);

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Navigation);
