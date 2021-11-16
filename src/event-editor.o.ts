import { customElement, LitElement, css, property, query } from 'lit-element'
import '@vaadin/vaadin-app-layout/vaadin-app-layout.js'
import '@vaadin/vaadin-menu-bar/vaadin-menu-bar.js'
import '@vaadin/vaadin-split-layout/vaadin-split-layout.js'
import '@vaadin/vaadin-button/vaadin-button.js'
import '@material/mwc-icon/mwc-icon.js'
import '@vaadin-component-factory/vcf-tooltip'
import type { ShaperoneForm } from '@hydrofoil/shaperone-wc'
import { html, render } from 'lit-html'
import '@hydrofoil/shaperone-wc/shaperone-form'
import '@rdfjs-elements/rdf-editor'
import { connect } from '@captaincodeman/rdx'
import { Quad } from 'rdf-js'
import { store, State, Dispatch } from './state/store'
import { shapeMenu } from './menu/shape'
// remove
import { resourceMenu } from './menu/resource'
import { formMenu } from './menu/formMenu'
import { configureRenderer, selectComponents } from './configure'

interface RdfEditor {
  serialized: string
  quads: Quad[]
  codeMirror: {
    value: string
  }
}

import { xottl, parseTTL } from './person-foaf-ttl';

@customElement('event-editor')
export class EventEditor extends connect(store(), LitElement) {
  static get styles() {
    return css`:host {
      height: 100vh;
      display: block;
    }

    [hidden] {
      display: none;
    }

    .content {
      height: 100%;
      display: flex;
    }

    #top-splitter {
      flex: 1;
    }

    vaadin-menu-bar {
      position: sticky;
      position: -webkit-sticky;
      z-index: 100;
      top: 0;
      background: white;
    }

    // remove
    rdf-editor {
      height: 100%;
    }

    #title {
      flex: 1;
    }

    [slot=navbar] {
      margin-right: 10px;
    }

    shaperone-form::part(property) {
      flex: 1;
      min-width: 250px;
      border: solid 1px black;
      border-radius: 3px;
      margin: 4px;
    }

    shaperone-form::part(property invalid) {
      border-color: red;
    }

    shaperone-form::part(focus-node-header invalid) {
      --mdc-theme-text-primary-on-background: red;
    }

    shaperone-form::part(property):nth-child(0) {
      flex-basis: 100%;
    }

    shaperone-form::part(focus-node), shaperone-form::part(property-group) {
      display: flex;
      flex-wrap: wrap;
    }`
  }

  @property({ type: Object })
  parsedTTL!: State['parsedTTL']

  @property({ type: String })
  xottl!: State['xottl']

  @property({ type: Object })
  shape!: State['shape']

  @property({ type: Object })
  playground!: State['playground']

  @property({ type: Object })
  resource!: State['resource']

  @query('#shapeEditor')
  shapeEditor!: RdfEditor

  @query('#resourceEditor')
  resourceEditor!: RdfEditor

  @query('#form')
  form!: ShaperoneForm

  @property({ type: Object })
  components!: State['componentsSettings']

  @property({ type: Object })
  renderer!: State['rendererSettings']

  @property({ type: Boolean })
  noEditorSwitches!: boolean

  async connectedCallback() {
    document.addEventListener('resource-selected', (e: any) => store().dispatch.resource.selectResource({ id: e.detail.value }))
    document.addEventListener('prefixes-changed', (e: any) => store().dispatch.resource.setPrefixes(e.detail.value))
    document.addEventListener('shape-load', (e: any) => store().dispatch.shape.loadShape(e.detail))
    document.addEventListener('generate-instances', (e: any) => store().dispatch.shape.generateInstances())

    super.connectedCallback()

    this.parsedTTL = await parseTTL();
    this.xottl = xottl;
    this.requestUpdate();
    this.__setShape(undefined);
    store().dispatch.playground.restoreState()
  }

  render() {
    return html`<vaadin-app-layout>
  <h2 id="title" slot="navbar">
    <span>SHACL Event Editor</span>
  </h2>
  <vaadin-button slot="navbar" @click="${this.__reset}">Reset</vaadin-button>
  <mwc-icon>share</mwc-icon>
  </vaadin-button>
  <vcf-tooltip for="share-button" position="bottom" ?manual="${!this.playground.hasError}">
    Please fix syntax errors before sharing
  </vcf-tooltip>
  <a href="https://github.com/hypermedia-app/shaperone" target="_blank" slot="navbar"><img alt="GitHub"
      src="/_media/GitHub-Mark-32px.png"></a>

  <div class="content">
    <vaadin-split-layout id="top-splitter">
      <vaadin-split-layout style="width: 80%">
        <div>
          <vaadin-menu-bar .items="${formMenu(this.components, this.renderer)}"
            @item-selected="${this.__formMenuSelected}"></vaadin-menu-bar>
          <shaperone-form id="form" .shapes="${this.shape.pointer}" .resource="${this.resource.pointer}"
            ?no-editor-switches="${this.noEditorSwitches}" @changed="${this.__saveResource}"></shaperone-form>
        </div>
        <!-- remove -->
        <div style="min-width: 50%; max-width: 80%">
          <vaadin-menu-bar .items="${resourceMenu(this.resource)}"
            @item-selected="${this.__editorMenuSelected(store().dispatch.resource, this.resourceEditor)}">
          </vaadin-menu-bar>
          <rdf-editor id="resourceEditor" prefixes="${this.resource.prefixes.join(',')}"
            .serialized="${this.resource.serialized}" .format="${this.resource.format}" .quads="${this.resource.quads}"
            @parsing-failed="${this.__setDataError}" @quads-changed="${this.__setResource}"
            @serialized="${this.__setSerializedResource}"></rdf-editor>
        </div>
      </vaadin-split-layout>
    </vaadin-split-layout>
  </div>
</vaadin-app-layout>

</vaadin-dialog>`
  }

  __setShape(e: CustomEvent) {
    store().dispatch.shape.setShapesGraph(this.parsedTTL)
    store().dispatch.shape.serialized(this.xottl)
  }

  __setShapeError(e: CustomEvent) {
    store().dispatch.shape.error(e.detail.error)
  }

  __setDataError(e: CustomEvent) {
    store().dispatch.resource.error(e.detail.error)
  }

  __setSerializedShape(e: any) {
    store().dispatch.shape.serialized(e.detail.value)
  }

  __setSerializedResource(e: any) {
    store().dispatch.resource.setSerialized(e.detail.value)
  }

  __setResource(e: CustomEvent) {
    store().dispatch.resource.replaceGraph({ dataset: e.detail.value })
    store().dispatch.resource.setSerialized(this.resourceEditor.codeMirror.value)
  }

  __formMenuSelected(e: CustomEvent) {
    switch (e.detail.value.type) {
      case 'editorChoice':
        store().dispatch.componentsSettings.setEditorChoice(!e.detail.value.checked)
        break
      case 'components':
        store().dispatch.componentsSettings.switchComponents(e.detail.value.text)
        break
      case 'layout':
        store().dispatch.rendererSettings.switchLayout(e.detail.value.id)
        break
      case 'renderer':
        store().dispatch.rendererSettings.switchNesting(e.detail.value.id)
        break
      case 'labs':
        store().dispatch.rendererSettings.toggleLab({ lab: e.detail.value.id })
        break
      default:
        break
    }
  }

  __saveResource() {
    if (this.form.value) {
      store().dispatch.resource.replaceGraph({ dataset: this.form.resource?.dataset, updatePointer: false })
    }
  }

  __editorMenuSelected(dispatch: Dispatch['shape'], editor: RdfEditor) {
    return (e: CustomEvent) => {
      switch (e.detail.value.type) {
        case 'format':
          dispatch.format(e.detail.value.text)
          break
        case 'root shape':
          dispatch.selectRootShape(e.detail.value.pointer)
          break
        default:
          dispatch.serialized(editor.codeMirror.value)
          dispatch.setShapesGraph(editor.quads)
          break
      }
    }
  }

  __reset() {
    localStorage.removeItem(document.location.hostname)
    document.location.reload()
  }


  mapState(state: State) {
    selectComponents(state.componentsSettings.components)
    configureRenderer.switchLayout(state.rendererSettings)
    configureRenderer.switchNesting(state.rendererSettings)
    configureRenderer.setLabs(state.rendererSettings)

    return {
      components: state.componentsSettings,
      renderer: state.rendererSettings,
      resource: state.resource,
      shape: state.shape,
      playground: state.playground,
      noEditorSwitches: state.componentsSettings.disableEditorChoice,
    }
  }
}
