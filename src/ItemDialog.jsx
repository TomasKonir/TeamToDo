import * as React from 'react';
import { TextField } from '@mui/material';
import { Autocomplete } from '@mui/material';
import { IconButton } from '@mui/material';

import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

import AddCircleIcon from '@mui/icons-material/AddCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import DoneIcon from '@mui/icons-material/Done';

import { postData, getJSON, getData } from './utils'

let priorityColors = ["black", "red", "orangered", "salmon", "orange", "goldenrod", "yellowgreen", "lawngreen", "springgreen", "lightgreen"]


class ItemDialog extends React.Component {
    constructor(props) {
        super(props)
        let c = this.props.categories.concat([])
        if (c.length === 0) {
            c = ["default"]
        }
        this.state = {
            categories: c,
            category: this.props.data.category ? this.props.data.category : c[0],
            name: this.props.data.name ? this.props.data.name : '',
            text: this.props.data.text ? this.props.data.text : '',
            priority: this.props.data.priority ? this.props.data.priority : 5,
            userList: [],
            targetUser: undefined,
        }
        this.accepted = this.accepted.bind(this)
        this.delete = this.delete.bind(this)
        getJSON("api.php?cmd=loginList", (json) => this.setState({ userList: json }))
    }

    componentDidUpdate(prevProps) {
        if (prevProps.id !== this.props.id) {
            let c = this.props.categories.concat([])
            if (c.length === 0) {
                c = ["default"]
            }
            this.setState({
                categories: c,
                category: this.props.data.category ? this.props.data.category : c[0],
                name: this.props.data.name ? this.props.data.name : '',
                text: this.props.data.text ? this.props.data.text : '',
                priority: this.props.data.priority ? this.props.data.priority : 5,
                userList: [],
                targetUser: undefined,
            })
            getJSON("api.php?cmd=loginList", (json) => this.setState({ userList: json }))
        }
    }

    accepted() {
        let post = this.props.data
        post.category = this.state.category
        post.name = this.state.name
        post.text = this.state.text
        post.priority = this.state.priority
        if (this.props.id === -1) {
            post.ctime = new Date().getTime()
            post.id = -1
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

    delete() {
        if (this.props.id === -1) {
            return
        }
        getData('api.php?cmd=delete&id=' + this.props.id, (data) => {
            if (this.props.onChange) {
                this.props.onChange()
            }
        })
    }


    render() {
        return (
            <div className='itemDialog'>
                <div className='itemDialogHeader'>
                    <IconButton variant="contained" onClick={
                        () => {
                            if (this.props.onClose) {
                                this.props.onClose()
                            }
                        }
                    }>
                        <ArrowBackIcon />
                    </IconButton>
                    <IconButton variant="contained" disabled={this.props.id <= 0} onClick={
                        () => {
                            if (!window.confirm("Smazat úkol: " + this.state.name + "?")) {
                                return
                            }
                            this.delete()
                            if (this.props.onClose) {
                                this.props.onClose()
                            }
                        }
                    }>
                        <DeleteIcon />
                    </IconButton>
                    <IconButton variant="contained" disabled={this.state.category === undefined || this.state.category.length === 0 || this.state.name.length === 0} onClick={() => {
                        if (this.props.onClose) {
                            this.props.onClose()
                        }
                        this.accepted()
                    }}>
                        <DoneIcon />
                    </IconButton>
                </div>
                <div className="itemDialogContent">
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
                    <div className='flex-row'>
                        <Select
                            size='small'
                            labelId="demo-simple-select-label"
                            style={{ backgroundColor: priorityColors[this.state.priority] }}
                            id="demo-simple-select"
                            value={this.state.priority}
                            onChange={(ev) => {
                                this.setState({ priority: ev.target.value })
                            }}
                        >
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
                        <Autocomplete
                            id="parent"
                            size='small'
                            fullWidth
                            options={this.state.categories}
                            disabled={this.state.targetUser !== undefined}
                            value={this.state.category}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Kategorie"
                                    InputProps={{
                                        ...params.InputProps,
                                    }}
                                />
                            )}
                            onChange={(event, value) => value === null ? this.setState({}) : this.setState({ category: value })}
                        />
                        <IconButton
                            disabled={this.state.targetUser !== undefined}
                            size='small'
                            onClick={
                                () => {
                                    let add = prompt("Nová kategorie", "");
                                    if (add.length > 0) {
                                        let c = this.state.categories
                                        c.push(add)
                                        this.setState({ categories: c, category: add })
                                    }
                                }
                            }>
                            <AddCircleIcon />
                        </IconButton>
                    </div>
                    <TextField
                        label="Jméno"
                        size='small'
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
