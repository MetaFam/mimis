import React from 'react'
import { SearchProvider } from '../SearchContext'
import { Tabs, Icon } from 'antd'
import Browse from '../Browse'
import Debug from '../Debug'
const { TabPane } = Tabs

export default () => {
  return <SearchProvider>
    <Tabs>
      <TabPane
        tab={
          <span><Icon type='book' /> Browse</span>
        }
        key='browse'
      >
        <Browse/>
      </TabPane>
      <TabPane
        tab={
          <span><Icon type='database' /> Load Data</span>
        }
        key='debug'
      >
        <Debug/>
      </TabPane>
      <TabPane
        tab={
          <span><Icon type='control' /> Settings</span>
        }
        key='settings'
      >
        <h1>Settings</h1>
      </TabPane>
    </Tabs>
  </SearchProvider>
}