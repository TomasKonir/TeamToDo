import 'material-design-icons/iconfont/material-icons.css'
import "@fontsource/roboto"

import React from 'react'
import CssBaseline from '@mui/material/CssBaseline'

import { ThemeProvider, createTheme } from '@mui/material/styles'

import { Paper } from '@mui/material'

import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import { IconButton } from '@mui/material'
import Checkbox from '@mui/material/Checkbox'

import AddCircleIcon from '@mui/icons-material/AddCircle'
import LogoutIcon from '@mui/icons-material/Logout'
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts'
import RefreshIcon from '@mui/icons-material/Refresh'
import SegmentIcon from '@mui/icons-material/Segment'
import ReorderIcon from '@mui/icons-material/Reorder'

import Item from './Item'
import ItemDialog from './ItemDialog'
import Login from './Login'
import ManageUsers from './ManageUsers'

import { getJSON, setAuth, getAuth, clearAuth } from './utils'

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
})

class App extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            options: [],
            currentCategory: '',
            list: [],
            currentId: undefined,
            currentData: {},
            userList: [],
            otherName: undefined,
            othersEnabled: false,
            authNeeded: false,
            fetchFailed: false,
            isAdmin: false,
            manageUsersVisible: false,
            segmented: true,
        }
        this.getData = this.getData.bind(this)
        this.logon = this.logon.bind(this)
        this.showCompletedSwitch = this.showCompletedSwitch.bind(this)
    }

    componentDidMount() {
        this.getData()
    }

    getData() {
        let storage = window.localStorage
        let sc = ''
        if (storage !== null) {
            let e = storage.getItem("showCompleted")
            if (e != null && e === "yes") {
                sc = '&all=1'
            }
        }
        if (this.state.otherName) {
            sc += '&otherName=' + this.state.otherName
        }
        getJSON('api.php?cmd=list' + sc, (list) => {
            let options = []
            for (let i in list) {
                options.push(i)
            }
            options.sort((a, b) => (a.toLocaleLowerCase().localeCompare(b.toLocaleLowerCase())))
            this.setState({ list: list, options: options })
            this.setState({ authNeeded: false, fetchFailed: false })
            getJSON('api.php?cmd=me', (me) => {
                document.title = 'Team ToDo (' + me.login + ')'
                this.setState({ isAdmin: me.isAdmin, othersEnabled: me.othersEnabled })
            })
        }, (status) => {
            if (status === 401) {
                this.setState({ authNeeded: true })
                clearAuth()
            } else {
                this.setState({ isAdmin: false, fetchFailed: true, options: [], currentCategory: '', list: [], currentId: undefined, currentData: {} })
            }
        })
        getJSON("api.php?cmd=loginList", (json) => this.setState({ userList: json }))
    }

    async logon(login, password) {
        setAuth(login, password, this.getData)
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
        this.getData()
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
        let fullList = []
        for (let i in this.state.options) {
            let n = this.state.options[i]
            if (this.state.currentCategory === '' || this.state.currentCategory === n) {
                let expanded = false
                if (this.state.currentCategory === n) {
                    expanded = true
                }
                if (this.state.list[n]) {
                    if (this.state.segmented) {
                        items.push(
                            <Item
                                entries={this.state.list[n]}
                                name={n}
                                key={n}
                                expanded={expanded}
                                showCompleted={showCompleted}
                                readOnly={this.state.otherName !== undefined}
                                onChange={this.getData}
                                onEdit={(data) => this.setState({ currentId: data.id, currentData: data })}
                            />
                        )
                    } else {
                        fullList.push(...this.state.list[n])
                    }
                }
            }
        }
        if(fullList.length > 0){
            items.push(<Item
                entries={fullList}
                name=''
                key='FULL'
                showCategory
                expanded={true}
                showCompleted={showCompleted}
                readOnly={this.state.otherName !== undefined}
                onChange={this.getData}
                onEdit={(data) => this.setState({ currentId: data.id, currentData: data })}
            />)
        }
        if (this.state.authNeeded) {
            content = <Login callback={this.logon} />
        } else if (this.state.fetchFailed) {
            content = <div className='error'>SERVER ERROR</div>
        } else if (this.state.manageUsersVisible) {
            content = <ManageUsers backClicked={() => this.setState({ manageUsersVisible: false })} />
        } else {
            let logout = undefined
            let manageUsers = undefined
            if (getAuth()) {
                logout = <IconButton
                    title='Odhlásit'
                    size='small'
                    onClick={() => {
                        if (!window.confirm("Odhlásit ?")) {
                            return
                        }
                        clearAuth()
                        this.getData()
                    }}>
                    <LogoutIcon />
                </IconButton>
            }
            if (this.state.isAdmin) {
                manageUsers = <IconButton
                    title='Nastavit uživatele'
                    size='small'
                    onClick={() => this.setState({ manageUsersVisible: true })}>
                    <ManageAccountsIcon />
                </IconButton>
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
                let others
                if (this.state.othersEnabled) {
                    others = <Autocomplete
                        id="parent"
                        size='small'
                        fullWidth
                        options={this.state.userList}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Uživatel"
                                InputProps={{
                                    ...params.InputProps,
                                }}
                            />
                        )}
                        onChange={(event, value) => {
                            value === null ? this.setState({ otherName: undefined }) : this.setState({ otherName: value })
                            setTimeout(this.getData, 50)
                        }}
                    />
                }
                content = <React.Fragment>
                    <div className='header'>
                        {logout}
                        {manageUsers}
                        <IconButton
                            title='Obnovit'
                            size='small'
                            onClick={this.getData}>
                            <RefreshIcon />
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
                        {others}
                        <IconButton
                            title='Přidat úkol'
                            size='small'
                            disabled={this.state.otherName !== undefined}
                            onClick={
                                () => { this.setState({ currentId: -1, currentData: {} }) }
                            }>
                            <AddCircleIcon />
                        </IconButton>
                        <IconButton
                            title='Dohromady/Po sekcích'
                            size='small'
                            onClick={
                                () => { this.setState({ segmented: !this.state.segmented }) }
                            }
                        >
                            {this.state.segmented ? <SegmentIcon /> : <ReorderIcon />}
                        </IconButton>
                        <Checkbox title='Ukázat dokončené' size="small" checked={showCompleted} onChange={this.showCompletedSwitch} />
                    </div>
                    <div className='content'>
                        {items}
                    </div>
                </React.Fragment>
            }
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

export default App
