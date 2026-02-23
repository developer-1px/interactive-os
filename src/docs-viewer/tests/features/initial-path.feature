Feature: DocsViewer Initial Path from URL Hash

  Background:
    Given the DocsViewer app is mounted

  Scenario: Refresh with a hash pointing to a specific doc
    Given the URL hash is "#/docs/inbox/readme.md"
    When the page is refreshed (app mounts fresh)
    Then activePath should be "docs/inbox/readme.md"
    And NOT the first file in the sidebar

  Scenario: Refresh with no hash
    Given the URL hash is ""
    When the page is refreshed (app mounts fresh)
    Then activePath should be null
    And the first file is selected by auto-select fallback

  Scenario: Refresh with ext: hash (external folder mode)
    Given the URL hash is "#ext:my-folder/path/to/file.md"
    When the page is refreshed (app mounts fresh)
    Then activePath should be null (ext handled separately)
    And auto-select fallback applies
