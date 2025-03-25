import React from 'react'

export default (props) => {
  const { filename, filenameId, bookId } = props
  const [linkId, setLinkId] = (
    React.useState(props.linkId)
  )
  let action = '/links'
  let cmd = 'Link'

  if(linkId) {
    action = `/links/${linkId}`
    cmd = 'Unlink'
  }

  const submitHandler = async (evt) => {
    evt.preventDefault()

    if(linkId) {
      const res = await fetch(
        action,
        {
          method: 'DELETE',
          headers: {
            Accept: 'application/json', 
          },
        }
      )
      if(res.ok) {
        setLinkId(undefined)
      } else {
        alert(`Error Unlinking: ${linkId}`)
        console.error('Response', res)
      }
    } else {
      const formData = new FormData();
      formData.append('link[book_id]', bookId);
      formData.append('link[filename_id]', filenameId);

      const res = await fetch(
        action,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json', 
          },
          body: formData,
        }
      )
      const json = await res.json()
      if(res.ok) {
        setLinkId(json['id'])
      }
    }
  }

  return <React.Fragment>
    <form onSubmit={submitHandler}>
      <label>
        <span>{filename}</span>
        <button type='submit'>{cmd}</button>
      </label>
    </form>
  </React.Fragment>
}
