import React from 'react'
import ReactDOM from 'react-dom'
import Autosuggest from 'react-autosuggest'
import axios from 'axios'
import { debounce } from 'throttle-debounce'

class AutoComplete extends React.Component {
  state = {
    value: '',
    suggestions: []
  }

  componentWillMount() {
    this.onSuggestionsFetchRequested = debounce(
      500,
      this.onSuggestionsFetchRequested
    )
  }

  renderSuggestion = suggestion => {
    return (
      <div className="result">
        <div>{suggestion.text}</div>
      </div>
    )
  }

  onChange = (event, { newValue }) => {
    this.setState({ value: newValue })
  }

  onSuggestionsFetchRequested = ({ value }) => {
    axios
    .post('/search', {
      partial: value,
    })
    .then(res => {
      const results = res.data
      this.setState({ suggestions: results })
    })
  }

  onSuggestionsClearRequested = () => {
    this.setState({ suggestions: [] })
  }

  onSuggestionSelected = (evt, { suggestion }) => {
    window.location = suggestion.url
  }

  render() {
    const { value, suggestions } = this.state

    const inputProps = {
      placeholder: 'Book Title, Author, Award, Series, or Genre',
      value,
      onChange: this.onChange
    }

    return (
      <Autosuggest
        suggestions={suggestions}
        onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
        onSuggestionsClearRequested={this.onSuggestionsClearRequested}
        getSuggestionValue={suggestion => suggestion.text}
        renderSuggestion={this.renderSuggestion}
        inputProps={inputProps}
        onSuggestionSelected={this.onSuggestionSelected}
      />
    )
  }
}

export default AutoComplete