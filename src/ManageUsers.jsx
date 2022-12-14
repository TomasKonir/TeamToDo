import React from 'react'
import { IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import KeyIcon from '@mui/icons-material/Key';
import KeyOffIcon from '@mui/icons-material/KeyOff';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

import { getJSON, getData } from './utils';

class ManageUsersItem extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            newPassword: undefined,
            user: this.props.user,
        }
    }

    componentDidUpdate(oldProps) {
        if (oldProps !== this.props) {
            this.setState({ user: this.props.user })
        }
    }

    render() {
        return (
            <div className='userEntry'>
                <div className='centered-vertical'>
                    {this.state.user.login}
                </div>
                <div className='centered-vertical userEntryPassword'>
                    {this.state.newPassword}
                </div>
                <div className='userEntryButtons'>
                    <IconButton
                        title={this.state.user.hasPassword ? 'Smazat heslo' : 'Vygenerovat heslo'}
                        variant="contained"
                        onClick={() => {
                            let password = "true"
                            if (this.state.user.hasPassword) {
                                if (!window.confirm("Smazat heslo pro: " + this.state.user.login + "?")) {
                                    return
                                }
                                password = ""
                            }
                            getJSON('api.php?cmd=adminUserSetPassword&login=' + this.state.user.login + "&password=" + password, (json) => {
                                if (json.newPassword !== undefined) {
                                    this.setState({ newPassword: json.newPassword })
                                    setTimeout(() => this.setState({ newPassword: undefined }), 16000)
                                }
                                getJSON('api.php?cmd=adminUserOne&login=' + this.state.user.login, (user) => {
                                    this.setState({ user: user })
                                }, this.props.reload)
                            }, this.props.reload)
                        }}>
                        {this.state.user.hasPassword ? <KeyIcon style={{ color: 'green' }} /> : <KeyOffIcon style={{ color: 'red' }} />}
                    </IconButton>
                    <IconButton
                        title={this.state.user.isAdmin  ? 'Zru??it administr??tora' : 'Nastavit administr??tora'}
                        variant="contained"
                        onClick={() => {
                            let admin = "true"
                            if (this.state.user.isAdmin) {
                                admin = "false"
                            }
                            getData('api.php?cmd=adminUserSetAdmin&login=' + this.state.user.login + "&admin=" + admin, () => {
                                getJSON('api.php?cmd=adminUserOne&login=' + this.state.user.login, (user) => {
                                    this.setState({ user: user })
                                }, this.props.reload)
                            }, this.props.reload)
                        }}>
                        <AdminPanelSettingsIcon style={{ color: (this.state.user.isAdmin ? 'green' : 'gray') }} />
                    </IconButton>
                    <IconButton
                    title='Smazat u??ivatele'
                        variant="contained"
                        onClick={() => {
                            if (!window.confirm("Smazat u??ivatele: " + this.state.user.login + "?")) {
                                return
                            }
                            getData('api.php?cmd=adminUserDelete&login=' + this.state.user.login, this.props.reload, this.props.reload)
                        }}>
                        <DeleteIcon />
                    </IconButton>
                </div>
            </div>
        )
    }
}

class ManageUsers extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            userList: [],
            setLogin: undefined,
            newPassword: undefined,
        }
        this.reload = this.reload.bind(this)
    }

    componentDidMount() {
        this.reload()
    }

    reload() {
        getJSON('api.php?cmd=adminUserList', (userList) => {
            this.setState({ userList: userList })
        })
    }

    render() {
        let users = []
        for (let i in this.state.userList) {
            let u = this.state.userList[i]
            users.push(
                <ManageUsersItem key={u.login} user={u} reload={this.reload} />
            )
        }
        return (
            <div className='userPage'>
                <div className='userHeader'>
                    <IconButton
                        title='Zp??t'
                        variant="contained"
                        onClick={() => {
                            if (this.props.backClicked) {
                                this.props.backClicked()
                            }
                        }
                        }>
                        <ArrowBackIcon />
                    </IconButton>
                    <IconButton
                        title='P??idat u??ivatele'
                        variant="contained"
                        onClick={() => {
                            let login = prompt("Nov?? u??ivatel", "");
                            if (login.length > 0) {
                                getData('api.php?cmd=adminUserAdd&login=' + login, this.reload, this.reload)
                            }
                        }
                        }>
                        <PersonAddIcon />
                    </IconButton>
                </div>
                <div className="userContent">
                    {users}
                </div>
            </div>
        )
    }
}

export default ManageUsers