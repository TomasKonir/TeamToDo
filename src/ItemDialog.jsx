import * as React from 'react'
import { TextField } from '@mui/material'
import { Autocomplete } from '@mui/material'
import { IconButton } from '@mui/material'

import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'

import DoneIcon from '@mui/icons-material/Done'
import CloseIcon from '@mui/icons-material/Close'

import DateTimeInput from './DateTimeInput'
import { postData, getJSON, priorityColors } from './utils'

class ItemDialog extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            dateTo: (this.props.data.dateTo && this.props.id > 0) ? new Date(this.props.data.dateTo) : null,
            name: (this.props.data.name && this.props.id > 0) ? this.props.data.name : '',
            text: (this.props.data.text && this.props.id > 0) ? this.props.data.text : '',
            priority: this.props.data.priority ? this.props.data.priority : 5,
            userList: [],
            targetUser: undefined,
        }
        console.info(this.props.data.dateTo)
        this.accepted = this.accepted.bind(this)
        getJSON("api.php?cmd=loginList", (json) => this.setState({ userList: json }))
    }

    componentDidUpdate(prevProps) {
        if (prevProps.id !== this.props.id) {
            this.setState({
                dateTo: (this.props.data.dateTo && this.props.id > 0) ? new Date(this.props.data.dateTo) : null,
                name: (this.props.data.name && this.props.id > 0) ? this.props.data.name : '',
                text: (this.props.data.text && this.props.id > 0) ? this.props.data.text : '',
                priority: this.props.data.priority ? this.props.data.priority : 5,
                userList: [],
                targetUser: undefined,
            })
            getJSON("api.php?cmd=loginList", (json) => this.setState({ userList: json }))
        }
    }

    accepted() {
        let post = JSON.parse(JSON.stringify(this.props.data))
        post.name = this.state.name
        post.text = this.state.text
        post.priority = this.state.priority
        post.sub = undefined
        if (this.state.dateTo !== null) {
            post.dateTo = this.state.dateTo.getTime()
        } else {
            post.dateTo = undefined
        }
        if (this.props.id === -1) {
            post.ctime = new Date().getTime()
            post.id = -1
            if (this.props.data.id > 0) {
                post.parentId = this.props.data.id
            }
        }
        if (this.state.targetUser !== undefined) {
            post.login = this.state.targetUser
        }

        postData('api.php?cmd=set', JSON.stringify(post), (result) => {
            if (this.props.onChange) {
                this.props.onChange()
            }
        })
    }

    render() {
        return (
            <div className='itemDialog'>
                <div className='itemDialogHeader'>
                    <IconButton title='Zpět' variant="contained" onClick={
                        () => {
                            if (this.props.onClose) {
                                this.props.onClose()
                            }
                        }
                    }>
                        <CloseIcon />
                    </IconButton>
                    <IconButton title='Použít' variant="contained" disabled={this.state.name.length === 0} onClick={() => {
                        if (this.props.onClose) {
                            this.props.onClose()
                        }
                        this.accepted()
                    }}>
                        <DoneIcon />
                    </IconButton>
                </div>
                <div className="itemDialogContent">
                    <div className='flex-row'>
                        <Select
                            title='Priorita'
                            size='small'
                            labelId="demo-simple-select-label"
                            style={{ backgroundColor: priorityColors[this.state.priority] }}
                            id="demo-simple-select"
                            value={this.state.priority}
                            onChange={(ev) => {
                                this.setState({ priority: ev.target.value })
                            }}
                        >
                            <MenuItem style={{ backgroundColor: 'black' }} value={0}>-</MenuItem>
                            <MenuItem style={{ backgroundColor: priorityColors[1] }} value={1}>1</MenuItem>
                            <MenuItem style={{ backgroundColor: priorityColors[2] }} value={2}>2</MenuItem>
                            <MenuItem style={{ backgroundColor: priorityColors[3] }} value={3}>3</MenuItem>
                            <MenuItem style={{ backgroundColor: priorityColors[4] }} value={4}>4</MenuItem>
                            <MenuItem style={{ backgroundColor: priorityColors[5] }} value={5}>5</MenuItem>
                            <MenuItem style={{ backgroundColor: priorityColors[6] }} value={6}>6</MenuItem>
                            <MenuItem style={{ backgroundColor: priorityColors[7] }} value={7}>7</MenuItem>
                            <MenuItem style={{ backgroundColor: priorityColors[8] }} value={8}>8</MenuItem>
                            <MenuItem style={{ backgroundColor: priorityColors[9] }} value={9}>9</MenuItem>
                        </Select>
                        <DateTimeInput
                            variant='outlined'
                            label='Splnit do'
                            value={this.state.dateTo}
                            onClear={() => this.setState({ dateTo: null })}
                            onAccept={(val) => this.setState({ dateTo: val })}
                        />
                        <Autocomplete
                            id="parent"
                            size='small'
                            fullWidth
                            options={this.state.userList}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Přiřadit člověku"
                                    InputProps={{
                                        ...params.InputProps,
                                    }}
                                />
                            )}
                            onChange={(event, value) => value === null ? this.setState({ targetUser: undefined }) : this.setState({ targetUser: value })}
                        />
                    </div>
                    <TextField
                        label="Název"
                        size='small'
                        autoFocus
                        value={this.state.name}
                        fullWidth
                        onChange={(ev) => ev.target.value === null ? this.setState({ name: '' }) : this.setState({ name: ev.target.value })}
                    />
                    <TextField
                        label="Text"
                        size='small'
                        value={this.state.text}
                        multiline
                        fullWidth
                        minRows={8}
                        onChange={(ev) => ev.target.value === null ? this.setState({ text: '' }) : this.setState({ text: ev.target.value })}
                    />
                </div>

            </div>
        )
    }
}

export default ItemDialog
