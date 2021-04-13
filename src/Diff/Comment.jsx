import React, { useState, useContext } from 'react'
import { Tabs, Tab, TextField, Button, Box } from '@material-ui/core'
import ReactMarkdown from 'react-markdown'
import Comment from './Comment'

export default ({ onComment, hide }) => {
  const [comment, setComment] = useState()
  const [tabIndex, setTabIndex] = useState(0)
  const [data, setData] = useState("")
  const handleChange = e => setData(e.target.value)
  
  const WrappedTextField = ({ value, onChange }) => (
    <TextField
      label='Comment'
      placeholder='Leave a markdown-formatted comment…'
      value={value}
      onChange={onChange}
      multiline
      rows={4}
    />
  )

  function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`scrollable-force-tabpanel-${index}`}
        aria-labelledby={`scrollable-force-tab-${index}`}
        {...other}
      >
        {value === index && (
          <Box p={3}>
            {children}
          </Box>
        )}
      </div>
    )
  }

  return (
    <div className='comment'>
      <Tabs
        value={tabIndex}
        onChange={(evt, newValue) => setTabIndex(newValue)}
      >
        <Tab label="Write" key="write"/>
        <Tab label="Preview" key="preview"/>
      </Tabs>
      <TabPanel value={tabIndex} index={0}>
        <WrappedTextField value={data} onChange={handleChange}/>
      </TabPanel>
      <TabPanel value={tabIndex} index={1}>
        <div className='preview'>
          <ReactMarkdown source={comment}/>
        </div>
      </TabPanel>
      <Button
        className='submit'
        color='primary'
        variant='contained'
        onClick={() => onComment(comment)}
      >Comment</Button>
      <Button
        color='secondary'
        variant='contained'
        onClick={hide}
      >Cancel</Button>
    </div>
  )
}