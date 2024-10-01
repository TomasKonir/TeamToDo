import 'material-design-icons/iconfont/material-icons.css'
import "@fontsource/roboto"

import React from 'react'
import CssBaseline from '@mui/material/CssBaseline'

import { ThemeProvider, createTheme } from '@mui/material/styles'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import 'dayjs/locale/cs'


import { Paper } from '@mui/material'

import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import { IconButton } from '@mui/material'

import AddCircleIcon from '@mui/icons-material/AddCircle'
import LogoutIcon from '@mui/icons-material/Logout'
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts'
import RefreshIcon from '@mui/icons-material/Refresh'
import SettingsIcon from '@mui/icons-material/Settings'
import CleaningServicesIcon from '@mui/icons-material/CleaningServices'

import Item from './Item'
import ItemDialog from './ItemDialog'
import Login from './Login'
import ManageUsers from './ManageUsers'

import { getData, getJSON, setAuth, getAuth, clearAuth } from './utils'

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
        },
        blue: {
            main: '#6495ED',
        },
        gray: {
            main: '#333'
        },
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
        }
        this.getData = this.getData.bind(this)
        this.logon = this.logon.bind(this)
        this.showCompletedSwitch = this.showCompletedSwitch.bind(this)
    }

    componentDidMount() {
        this.getData()
    }

    getData() {
        console.info('get data')
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
        getJSON('api.php?cmd=me', (me) => {
            document.title = 'Team ToDo (' + me.login + ')'
            this.setState({ authNeeded: false, fetchFailed: false, isAdmin: me.isAdmin, othersEnabled: me.othersEnabled })
            getJSON('api.php?cmd=list' + sc, (list) => {
                console.info(JSON.stringify(list, undefined, 2))
                this.setState({ list: list })
            })
        }, (status) => {
            if (status === 401) {
                this.setState({ authNeeded: true })
                clearAuth()
            } else {
                this.setState({ isAdmin: false, fetchFailed: true, list: [], currentId: undefined, currentData: {} })
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
        this.setState({ otherName: undefined })
        setTimeout(this.getData, 50)
    }

    render() {
        let items = []
        let content = undefined
        let showCompleted = false
        let storage = window.localStorage
        let unchecked = 0
        if (storage !== null) {
            let e = storage.getItem("showCompleted")
            if (e != null) {
                showCompleted = e === "yes"
            }
        }
        for (let i in this.state.list) {
            let n = this.state.list[i]
            if (n.checkTime !== undefined && !showCompleted) {
                continue
            }
            unchecked += n.unchecked
            items = items.concat(
                <Item
                    data={n}
                    key={n.id}
                    level={0}
                    showCompleted={showCompleted}
                    readOnly={this.state.otherName !== undefined}
                    onChange={this.getData}
                    onEdit={(data) => this.setState({ currentId: data.id, currentData: data })}
                    onAdd={(data) => this.setState({ currentId: -1, currentData: data })}
                />
            )
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
                if (this.state.othersEnabled && showCompleted) {
                    others = <Autocomplete
                        id="parent"
                        size='small'
                        fullWidth
                        options={this.state.userList}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                size='small'
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
                } else {
                    others = <b className='spacer'>Zbývá: {unchecked}</b>
                }
                let addButton
                if (showCompleted) {
                    addButton = <IconButton
                        title='Vyčistit hotové'
                        size='small'
                        onClick={
                            () => {
                                if (!window.confirm("Vyčistit všechny hotové úkoly?")) {
                                    return
                                }
                                getData('api.php?cmd=cleanup', (data) => {
                                    this.getData()
                                })
                            }
                        }>
                        <CleaningServicesIcon />
                    </IconButton>
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
                        {others}
                        {addButton}
                        <IconButton
                            title='Přidat top level úkol'
                            size='small'
                            disabled={this.state.otherName !== undefined}
                            onClick={
                                () => { this.setState({ currentId: -1, currentData: {} }) }
                            }>
                            <AddCircleIcon />
                        </IconButton>
                        <IconButton
                            title='Nastavení'
                            size='small'
                            onClick={this.showCompletedSwitch}
                            color={showCompleted ? 'success' : undefined}
                        >
                            <SettingsIcon />
                        </IconButton>
                    </div>
                    <div className='content'>
                        {items}
                    </div>
                </React.Fragment>
            }
        }
        return (
            <ThemeProvider theme={theme}>
                <LocalizationProvider dateAdapter={AdapterDayjs} locale='cs'>
                    <CssBaseline key="css" />
                    <Paper className={window.isMobile ? 'body-mobile' : 'body'} sx={{ backgroundColor: 'black' }} square>
                        {content}
                    </Paper>
                </LocalizationProvider>
            </ThemeProvider>
        )
    }
}

export default App
