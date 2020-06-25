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
      <Setup/>
    </SearchProvider>
  )
}