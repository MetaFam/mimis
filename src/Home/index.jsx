import React from 'react'
import { SearchProvider } from '../SearchContext'
import { BookOutlined, ControlOutlined, QuestionOutlined, SettingOutlined } from '@ant-design/icons';
import { Tabs } from 'antd';
import Browse from '../Browse'
import FAQ from '../FAQ'
import Settings from '../Settings'
import Setup from '../Setup'
import './index.scss'
const { TabPane } = Tabs

export default () => {
  return (
    <SearchProvider>
      <Tabs defaultActiveKey='browse'>
        <TabPane
          tab={
            <span><SettingOutlined /> Setup</span>
          }
          key='setup'
        >
          <Setup/>
        </TabPane>
        <TabPane
          tab={
            <span><BookOutlined /> Browse</span>
          }
          key='browse'
        >
          <Browse/>
        </TabPane>
        <TabPane
          tab={
            <span><QuestionOutlined /> FAQ</span>
          }
          key='faq'
        >
          <FAQ/>
        </TabPane>
        <TabPane
          tab={
            <span><ControlOutlined /> Settings</span>
          }
          key='settings'
        >
          <Settings/>
        </TabPane>
      </Tabs>
    </SearchProvider>
  );
}