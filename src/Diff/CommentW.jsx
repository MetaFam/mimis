import React, { useState } from "react";
import TextField from "@material-ui/core/TextField";

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

export default ({onChange}) => {
  const [data, setData] = useState("")
  const handleChange = e => setData(e.target.value)
  return (
    <WrappedTextField value={data} onChange={handleChange}/>
  )
}
