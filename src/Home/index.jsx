import React from 'react'
import { SearchProvider } from '../SearchContext'
import { BookOutlined, ControlOutlined, QuestionOutlined, SettingOutlined, ClearOutlined } from '@ant-design/icons';
import { Tabs } from 'antd';
import Browse from '../Browse'
import FAQ from '../FAQ'
import Settings from '../Settings'
import Setup from '../Setup'
import './index.scss'
import Manage from '../Manage'
const { TabPane } = Tabs

export default () => {
  return (
    <SearchProvider>
      <Tabs defaultActiveKey='browse'>
        <TabPane key='setup'
          tab={<span><SettingOutlined /> Setup</span>}
        >
          <Setup/>
        </TabPane>
        <TabPane key='browse'
          tab={<span><BookOutlined /> Browse</span>}
        >
          <Browse/>
        </TabPane>
        <TabPane key='manage'
          tab={<span><ClearOutlined /> Manage</span>}
        >
          <Manage/>
        </TabPane>
        <TabPane key='faq'
          tab={<span><QuestionOutlined /> FAQ</span>}
        >
          <FAQ/>
        </TabPane>
        <TabPane key='settings'
          tab={<span><ControlOutlined /> Settings</span>}
        >
          <Settings/>
        </TabPane>
      </Tabs>
    </SearchProvider>
  );
}