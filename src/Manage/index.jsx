import React, { useContext, useEffect } from 'react'
import { Table } from 'antd'
import { useDB } from 'react-pouchdb'

export default () => {
  const db = useDB()

  const columns = [
    {
      title: 'Title',
      dataIndex: 'name',
      render: text => <a>{text}</a>,
    },
    {
      title: 'Author',
      className: 'column-money',
      dataIndex: 'money',
    },
    {
      title: 'Size',
      dataIndex: 'address',
    },
  ]

  const data = [
    {
      key: '1',
      name: 'John Brown',
      money: '￥300,000.00',
      address: 'New York No. 1 Lake Park',
    },
    {
      key: '2',
      name: 'Jim Green',
      money: '￥1,256,000.00',
      address: 'London No. 1 Lake Park',
    },
    {
      key: '3',
      name: 'Joe Black',
      money: '￥120,000.00',
      address: 'Sidney No. 1 Lake Park',
    },
  ]

  useEffect(() => {
    (async () => {
      db.allDocs()
    })()
  }, [])

  return <Table
    columns={columns}
    dataSource={data}
    bordered
    title={() => 'Header'}
    footer={() => 'Footer'}
  />
}