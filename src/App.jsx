import 'material-design-icons/iconfont/material-icons.css'
import "@fontsource/roboto";

import React from 'react'
import CssBaseline from '@mui/material/CssBaseline';

import { ThemeProvider, createTheme } from '@mui/material/styles'

import { Paper } from '@mui/material';

import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import { IconButton } from '@mui/material';
import Checkbox from '@mui/material/Checkbox';

import AddCircleIcon from '@mui/icons-material/AddCircle';

import Item from './Item'
import ItemDialog from './ItemDialog'

import { getJSON } from './utils';

const theme = createTheme({
  palette: {
    mode: 'dark',
    active: {
      main: '#3382FF',
    },
    on: {
      main: '#E0F20D',
    },
    off: {
      main: '#B7B7AD',
    },
    selected: {
      main: '#060D35',
    },
    default: {
      main: '#43444A',
    }
  },
  typography: {
    button: {
      textTransform: 'none'
    },
    "fontFamily": `"Roboto", "Helvetica", "Arial", sans-serif`,
    "fontSize": 14,
    "fontWeightLight": 300,
    "fontWeightRegular": 400,
    "fontWeightMedium": 500,
  },
});

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      options: [],
      currentCategory: '',
      list: [],
      currentId: undefined,
      currentData: {},
    }
    this.getData = this.getData.bind(this)
    this.showCompletedSwitch = this.showCompletedSwitch.bind(this)
  }

  componentDidMount() {
    this.getData()
  }

  getData() {
      getJSON('api.php?cmd=list',(list) => {        
        let options = []
        for (let i in list) {
          options.push(i)
        }
        options.sort((a, b) => (a.toLocaleLowerCase().localeCompare(b.toLocaleLowerCase())))
        this.setState({ list: list, options: options })
      })    
  }

  showCompletedSwitch() {
    let storage = window.localStorage
    if (storage !== null) {
      let sc = storage.getItem("showCompleted")
      if (sc == null) {
        storage.setItem("showCompleted", "yes")
      } else {
        storage.setItem("showCompleted", sc === "yes" ? "no" : "yes")
      }      
    }
    this.forceUpdate()
  }

  render() {
    let items = []
    let content = undefined
    let showCompleted = false
    let storage = window.localStorage
    if (storage !== null) {
      let e = storage.getItem("showCompleted")
      if (e != null) {
        showCompleted = e === "yes"
      }
    }
    for (let i in this.state.options) {
      let n = this.state.options[i]
      if (this.state.currentCategory === '' || this.state.currentCategory === n) {
        let expanded = false
        if (this.state.currentCategory === n) {
          expanded = true
        }
        if(this.state.list[n]){
          items.push(<Item entries={this.state.list[n]} name={n} key={n} expanded={expanded} showCompleted={showCompleted} onChange={this.getData} onEdit={(data) => this.setState({currentId : data.id, currentData: data})} />)
        }
      }
    }
    if (this.state.currentId !== undefined) {
      content = <ItemDialog
        categories={this.state.options}
        id={this.state.currentId}
        data={this.state.currentData}
        onClose={() => this.setState({ currentId: undefined, currentData: {} })}
        onChange={this.getData}
      />
    } else {
      content = <React.Fragment>
        <div className='header'>
          <IconButton size='small' onClick={
            () => { this.setState({ currentId: -1, currentData: {} }) }
          }>
            <AddCircleIcon />
          </IconButton>
          <Autocomplete
            fullWidth
            size='small'
            id="parent"
            options={this.state.options}
            renderInput={(params) => (
              <TextField
                {...params}
                label={'Kategorie'}
                InputProps={{
                  ...params.InputProps,
                }}
              />
            )}
            onChange={(event, value) => {
              value === null ? this.setState({ currentCategory: '' }) : this.setState({ currentCategory: value })
            }}
          />
          <Checkbox size="small" checked={showCompleted} onChange={this.showCompletedSwitch}/>
        </div>
        <div className='content'>
          {items}
        </div>
      </React.Fragment>
    }
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline key="css" />
        <Paper className={window.isMobile ? 'body-mobile' : 'body'} sx={{ borderRadius: 0 }}>
          {content}
        </Paper>
      </ThemeProvider>
    )
  }
}

export default App;