const React = require("react");
const {FormattedMessage, injectIntl} = require("react-intl");
const {actionCreators: ac, actionTypes: at} = require("common/Actions.jsm");

const TopSiteForm = require("./TopSiteForm");
const {TopSiteList} = require("./TopSite");

const {TOP_SITES_DEFAULT_LENGTH, TOP_SITES_SHOWMORE_LENGTH} = require("common/Reducers.jsm");
const {TOP_SITES_SOURCE} = require("./TopSitesConstants");

class TopSitesEdit extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      showEditModal: false,
      showAddForm: false,
      showEditForm: false,
      editIndex: -1 // Index of top site being edited
    };
    this.onEditButtonClick = this.onEditButtonClick.bind(this);
    this.onShowMoreLessClick = this.onShowMoreLessClick.bind(this);
    this.onModalOverlayClick = this.onModalOverlayClick.bind(this);
    this.onAddButtonClick = this.onAddButtonClick.bind(this);
    this.onFormClose = this.onFormClose.bind(this);
    this.onEdit = this.onEdit.bind(this);
  }
  onEditButtonClick() {
    this.setState({showEditModal: !this.state.showEditModal});
    const event = this.state.showEditModal ? "TOP_SITES_EDIT_OPEN" : "TOP_SITES_EDIT_CLOSE";
    this.props.dispatch(ac.UserEvent({
      source: TOP_SITES_SOURCE,
      event
    }));
  }
  onModalOverlayClick() {
    this.setState({showEditModal: false, showAddForm: false, showEditForm: false});
    this.props.dispatch(ac.UserEvent({
      source: TOP_SITES_SOURCE,
      event: "TOP_SITES_EDIT_CLOSE"
    }));
    this.props.dispatch({type: at.TOP_SITES_CANCEL_EDIT});
  }
  onShowMoreLessClick() {
    const prefIsSetToDefault = this.props.TopSitesCount === TOP_SITES_DEFAULT_LENGTH;
    this.props.dispatch(ac.SendToMain({
      type: at.SET_PREF,
      data: {name: "topSitesCount", value: prefIsSetToDefault ? TOP_SITES_SHOWMORE_LENGTH : TOP_SITES_DEFAULT_LENGTH}
    }));
    this.props.dispatch(ac.UserEvent({
      source: TOP_SITES_SOURCE,
      event: prefIsSetToDefault ? "TOP_SITES_EDIT_SHOW_MORE" : "TOP_SITES_EDIT_SHOW_LESS"
    }));
  }
  onAddButtonClick() {
    this.setState({showAddForm: true});
    this.props.dispatch(ac.UserEvent({
      source: TOP_SITES_SOURCE,
      event: "TOP_SITES_ADD_FORM_OPEN"
    }));
  }
  onFormClose() {
    this.setState({showAddForm: false, showEditForm: false});
    this.props.dispatch({type: at.TOP_SITES_CANCEL_EDIT});
  }
  onEdit(index) {
    this.setState({showEditForm: true, editIndex: index});
    this.props.dispatch(ac.UserEvent({
      source: TOP_SITES_SOURCE,
      event: "TOP_SITES_EDIT_FORM_OPEN"
    }));
  }
  render() {
    const showEditForm = (this.props.TopSites.editForm && this.props.TopSites.editForm.visible) ||
                         (this.state.showEditModal && this.state.showEditForm);
    let editIndex = this.state.editIndex;
    if (showEditForm && this.props.TopSites.editForm.visible) {
      const targetURL = this.props.TopSites.editForm.site.url;
      editIndex = this.props.TopSites.rows.findIndex(s => s.url === targetURL);
    }
    return (<div className="edit-topsites-wrapper">
      <div className="edit-topsites-button">
        <button
          className="edit"
          title={this.props.intl.formatMessage({id: "edit_topsites_button_label"})}
          onClick={this.onEditButtonClick}>
          <FormattedMessage id="edit_topsites_button_text" />
        </button>
      </div>
      {this.state.showEditModal && !this.state.showAddForm && !this.state.showEditForm &&
        <div className="edit-topsites">
          <div className="modal-overlay" onClick={this.onModalOverlayClick} />
          <div className="modal">
            <section className="edit-topsites-inner-wrapper">
              <div className="section-top-bar">
                <h3 className="section-title"><span className={`icon icon-small-spacer icon-topsites`} /><FormattedMessage id="header_top_sites" /></h3>
              </div>
              <TopSiteList TopSites={this.props.TopSites} TopSitesCount={this.props.TopSitesCount} onEdit={this.onEdit} dispatch={this.props.dispatch} intl={this.props.intl} />
            </section>
            <section className="actions">
              <button className="add" onClick={this.onAddButtonClick}>
                <FormattedMessage id="edit_topsites_add_button" />
              </button>
              <button className={`icon icon-topsites show-${this.props.TopSitesCount === TOP_SITES_DEFAULT_LENGTH ? "more" : "less"}`} onClick={this.onShowMoreLessClick}>
                <FormattedMessage id={`edit_topsites_show${this.props.TopSitesCount === TOP_SITES_DEFAULT_LENGTH ? "more" : "less"}_button`} />
              </button>
              <button className="done" onClick={this.onEditButtonClick}>
                <FormattedMessage id="edit_topsites_done_button" />
              </button>
            </section>
          </div>
        </div>
      }
      {this.state.showEditModal && this.state.showAddForm &&
        <div className="edit-topsites">
          <div className="modal-overlay" onClick={this.onModalOverlayClick} />
          <div className="modal">
            <TopSiteForm onClose={this.onFormClose} dispatch={this.props.dispatch} intl={this.props.intl} />
          </div>
        </div>
      }
      {showEditForm &&
        <div className="edit-topsites">
          <div className="modal-overlay" onClick={this.onModalOverlayClick} />
          <div className="modal">
            <TopSiteForm
              label={this.props.TopSites.rows[editIndex].label || this.props.TopSites.rows[editIndex].hostname}
              url={this.props.TopSites.rows[editIndex].url}
              index={editIndex}
              editMode={true}
              onClose={this.onFormClose}
              dispatch={this.props.dispatch}
              intl={this.props.intl} />
          </div>
        </div>
      }
    </div>);
  }
}

module.exports = injectIntl(TopSitesEdit);
module.exports._unconnected = TopSitesEdit;
