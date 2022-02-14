import * as React from 'react'
import ReactMde from 'react-mde'
import ReactMarkdown from 'react-markdown'
import gfm from 'remark-gfm'
import classNames from 'classnames'
import {useId} from '@reach/auto-id'
import {uniqueId} from 'lodash'

import PatchEvent, {set, unset} from 'part:@sanity/form-builder/patch-event'
import sanityClient from 'part:@sanity/base/client'

import {FormField} from '@sanity/base/components'
import {BoundaryElementProvider, Layer, Portal, PortalProvider, usePortal} from '@sanity/ui'

import useDebounce from '../hooks/useDebounce'

import './mde-editor.css?raw'
import './mde-preview.css?raw'
import 'react-mde/lib/styles/css/react-mde-suggestions.css?raw'
import 'react-mde/lib/styles/css/react-mde-toolbar.css?raw'
import 'react-mde/lib/styles/css/react-mde.css?raw'
import styles from './Editor.module.css'

import {ExpandCollapseButton} from './ExpandCollapseButton'

const Preview = ({markdown}) => {
  return <ReactMarkdown plugins={[gfm]}>{markdown}</ReactMarkdown>
}

const defaultToolbarCommands = [
  ['header', 'bold', 'italic', 'strikethrough'],
  ['link', 'quote', 'code'],
  ['unordered-list', 'ordered-list', 'checked-list'],
]

export default React.forwardRef(function Editor(props, ref) {
  const {type, value = '', markers, onBlur, onChange, onFocus, presence, readOnly} = props
  const {options = {}} = type
  const activationId = React.useMemo(() => uniqueId('MarkdownInput'), [])

  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const portalElement = usePortal()
  const [scrollContainerElement, setScrollContainerElement] = React.useState(null)

  const [selectedTab, setSelectedTab] = React.useState('write')
  const [editedValue, setEditedValue] = React.useState(value)
  const debouncedValue = useDebounce(editedValue, 100)
  const textarea = React.useRef()
  const handleToggleFullscreen = () => setIsFullscreen(!isFullscreen)

  React.useEffect(() => {
    if (value) {
      setEditedValue(value)
    }
  }, [value])

  React.useEffect(() => {
    // Don't trigger a patch if both values are ''
    if (!debouncedValue && !value) return

    if (!debouncedValue || debouncedValue === '') {
      props.onChange(PatchEvent.from([unset()]))
    } else if (debouncedValue !== value) {
      props.onChange(PatchEvent.from([set(debouncedValue)]))
    }
  }, [debouncedValue])

  const saveImage = async function* (data) {
    const client = sanityClient.withConfig({apiVersion: '2021-03-25'})

    let success = true
    const result = await client.assets
      .upload('image', data)
      .then((doc) => `${doc.url}?w=450`)
      .catch(() => {
        success = false
        return `Error: Could not upload file. Only images are supported.`
      })

    yield result
    return success
  }

  const mdEditor = React.useMemo(
    () => (
      <>
        <ExpandCollapseButton
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
        />
        <ReactMde
          toolbarCommands={options['toolbar'] || defaultToolbarCommands}
          value={editedValue}
          onChange={setEditedValue}
          selectedTab={selectedTab}
          onTabChange={setSelectedTab}
          minEditorHeight={isFullscreen ? '100vh' : '500'}
          generateMarkdownPreview={(markdown) => Promise.resolve(<Preview markdown={markdown} />)}
          childProps={{
            textArea: {
              id: inputId,
              onBlur,
              onFocus,
            },
            writeButton: {
              tabIndex: -1,
            },
          }}
          classes={{
            reactMde: classNames('editorBoxContent', {
              previewContainer: selectedTab === 'preview' && !isFullscreen,
            }),
          }}
          paste={{saveImage}}
          refs={{textarea}}
        />
      </>
    ),
    [editedValue, selectedTab, saveImage, isFullscreen]
  )
  // Generate a random ID to link our FormField label and input component
  const inputId = useId()
  return (
    <FormField
      description={type.description} // Creates description from schema
      inputId={inputId} // A unique ID for this input
      title={type.title} // Creates label from schema title
      __unstable_markers={markers} // Handles all markers including validation
      __unstable_presence={presence} // Handles presence avatars
    >
      {isFullscreen && (
        <Portal key={`portal-${activationId}`}>
          <PortalProvider element={portalElement}>
            <BoundaryElementProvider element={scrollContainerElement}>
              <Layer
                ref={ref}
                className={classNames(styles.fullscreenPortal, styles.editorWrapper)}
              >
                {mdEditor}
              </Layer>
            </BoundaryElementProvider>
          </PortalProvider>
        </Portal>
      )}
      {!isFullscreen && mdEditor}
    </FormField>
  )
})
