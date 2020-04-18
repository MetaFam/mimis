import React from 'react'
import { SearchProvider } from '../SearchContext'
import { Tabs, Icon } from 'antd'
import Browse from '../Browse'
import FAQ from '../FAQ'
import Settings from '../Settings'
import Setup from '../Setup'
import './index.scss'
const { TabPane } = Tabs

export default () => {
  return <SearchProvider>
    <Tabs defaultActiveKey='browse'>
      <TabPane
        tab={
          <span><Icon type='setting' /> Setup</span>
        }
        key='setup'
      >
        <Setup/>
      </TabPane>
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
          <span><Icon type='question' /> FAQ</span>
        }
        key='faq'
      >
        <FAQ/>
      </TabPane>
      <TabPane
        tab={
          <span><Icon type='control' /> Settings</span>
        }
        key='settings'
      >
        <Settings/>
      </TabPane>
    </Tabs>
  </SearchProvider>
}