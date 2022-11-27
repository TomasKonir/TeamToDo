import React from 'react'

import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton';
import OutlinedInput from '@mui/material/OutlinedInput';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';

import InputAdornment from '@mui/material/InputAdornment';

import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

class Login extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            login: '',
            password: '',
            showPassword: false,
        }
        this.loginClicked = this.loginClicked.bind(this)
    }

    componentDidMount() {
        document.getElementById('loginField').focus()
    }

    loginClicked() {
        if (this.props.callback) {
            this.props.callback(this.state.login, this.state.password)
            this.setState({login: '', password: ''})            
        }
    }

    render() {
        return (
            <div className='login'>
                <TextField
                    id='loginField'
                    label="Login"
                    size='small'
                    value={this.state.login}
                    fullWidth
                    onChange={(ev) => ev.target.value === null ? this.setState({ login: '' }) : this.setState({ login: ev.target.value })}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            event.defaultMuiPrevented = true;
                            document.getElementById('passwordField').focus()
                        }
                    }}
                />
                <FormControl variant="outlined" size='small'>
                    <InputLabel htmlFor="outlined-adornment-password">Heslo</InputLabel>
                    <OutlinedInput
                        id='passwordField'
                        label="Heslo"                        
                        value={this.state.password}
                        fullWidth
                        type={this.state.showPassword ? 'text' : 'password'}
                        onChange={(ev) => ev.target.value === null ? this.setState({ password: '' }) : this.setState({ password: ev.target.value })}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                event.defaultMuiPrevented = true;
                                if (this.state.login !== '' && this.state.password !== '') {
                                    this.loginClicked()
                                } else {
                                    document.getElementById('loginField').focus()
                                }
                            }
                        }}
                        endAdornment={
                            <InputAdornment position="end">
                                <IconButton
                                    aria-label="toggle password visibility"
                                    onClick={() => this.setState({ showPassword: !this.state.showPassword })}
                                    edge="end"
                                >
                                    {this.state.showPassword ? <Visibility /> : <VisibilityOff />}
                                </IconButton>
                            </InputAdornment>
                        }
                    />
                </FormControl>
                <Button
                    size='medium'
                    variant='contained'
                    disabled={this.state.login === '' || this.state.password === ''}
                    onClick={this.loginClicked}
                >
                    Ok
                </Button>
            </div>
        )
    }
}

export default Login