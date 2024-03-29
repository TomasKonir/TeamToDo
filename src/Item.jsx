import React from 'react'

import { IconButton } from '@mui/material'
import Checkbox from '@mui/material/Checkbox'
import MenuItem from '@mui/material/MenuItem'
import Menu from '@mui/material/Menu'

import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import AccessTimeIcon from '@mui/icons-material/AccessTime'

import { postData, isIdExpanded, switchIdExpanded } from './utils'

let priorityColors = ["black", "red", "orangered", "salmon", "orange", "goldenrod", "yellowgreen", "lawngreen", "springgreen", "lightgreen"]

export function formatDateTime(ts) {
    if (ts === undefined) {
        return ("Neplatný čas")
    }
    let t = new Date(ts)
    let h = t.getHours()
    let m = t.getMinutes()
    //    let s = t.getSeconds()
    let ret = ""

    ret += t.getDate() + "."
    ret += (t.getMonth() + 1) + "."
    ret += t.getFullYear() + " "

    if (h < 10) {
        ret += "0"
    }
    ret += h + ":"
    if (m < 10) {
        ret += "0"
    }
    ret += m

    return (ret)
}

class ItemEntry extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            menuVisible: false,
            timeVisible: false,
            anchorEl: undefined,
        }
        this.checked = this.checked.bind(this)
        this.priorityChanged = this.priorityChanged.bind(this)
    }

    checked(ch) {
        let post = this.props.data
        if (ch) {
            post.checkTime = new Date().getTime()
        } else {
            post.checkTime = undefined
        }
        postData('api.php?cmd=set', JSON.stringify(post), this.props.onChange)
    }

    priorityChanged(prio) {
        let post = this.props.data
        post.priority = prio
        postData('api.php?cmd=set', JSON.stringify(post), this.props.onChange)
        this.setState({ menuVisible: false })
    }

    render() {
        let text = undefined
        let timeIcon = undefined
        let expanded = isIdExpanded(this.props.data.id)
        timeIcon = <IconButton
            className='hoverHighlighted'
            title='Čas'
            size='small'
            color={this.state.timeVisible ? 'success' : 'default'}
            onClick={
                (event) => {
                    this.setState({ timeVisible: !this.state.timeVisible })
                }
            }
        >
            <AccessTimeIcon />
        </IconButton>
        let timeHeader = undefined
        if (this.state.timeVisible) {
            let timeA = ''
            let timeB = ''
            timeA = < div className='itemComplete margin-left' >{formatDateTime(this.props.data.ctime)}</div>
            if (this.props.data.checkTime !== undefined) {
                timeB = < div className='itemComplete margin-right-05rem' >{formatDateTime(this.props.data.checkTime)}</div >
            } else {
                timeB = < div className='itemInProgress margin-right-05rem' >TBD</div >
            }
            timeHeader = <div className={'flex-row ' + (this.props.data.text.length === 0 ? 'itemDetailHeaderEmpty' : 'itemDetailHeader')}>{timeA} - {timeB}</div>
        }
        if (expanded) {
            text = <div className='itemDetail'>
                {timeHeader}
                {this.props.data.text.length === 0 ? '' : <div className='itemDetailContent'><pre>{this.props.data.text}</pre></div>}
            </div>
        } else if (timeHeader !== undefined) {
            text = <div className='itemDetail'>
                {timeHeader}
            </div>
        }
        let menuItems = []
        for (let i = 1; i < 10; i++) {
            menuItems.push(
                <MenuItem key={i} onClick={() => this.priorityChanged(i)} className="menu">
                    <div className='itemPriority' style={{ backgroundColor: priorityColors[i] }}>{i}</div>
                </MenuItem>
            )
        }
        return (
            <div className='itemEntry'>
                <div className='itemEntryHeader'>
                    <IconButton
                        title='Priorita'
                        size='small'
                        disabled={this.props.readOnly}
                        onClick={
                            (event) => {
                                this.setState({ anchorEl: event.currentTarget, menuVisible: true })
                            }
                        }
                        style={{ backgroundColor: priorityColors[this.props.data.priority] }}
                    >
                        <div className='vcenter itemPriority'>{this.props.data.priority}</div>
                    </IconButton>
                    <IconButton
                        size='small'
                        disabled={this.props.data.text.length === 0}
                        sx={this.props.data.text.length === 0 ? { opacity: 0 } : {}}
                        onClick={
                            () => {
                                switchIdExpanded(this.props.data.id)
                                this.forceUpdate()
                            }
                        }>
                        {(expanded || this.props.expanded) ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
                    </IconButton>
                    <div
                        className='vcenter itemEntryName'
                        onClick={() => {
                            if (this.props.onEdit && !this.props.readOnly) {
                                this.props.onEdit(this.props.data)
                            }
                        }}>
                        {this.props.data.name}
                    </div>
                    <div className='flex-row' style={{ marginLeft: 'auto' }}>
                        {this.props.showCategory ? <div className='vcenter'>{this.props.data.category}</div> : ''}
                        {timeIcon}
                        <Checkbox disabled={this.props.readOnly} title='Hotovo?' size="small" checked={this.props.data.checkTime !== undefined} onChange={(ev) => this.checked(ev.target.checked)} />
                    </div>
                </div>
                {text}
                <Menu
                    open={this.state.menuVisible}
                    onClose={() => this.setState({ menuVisible: false })}
                    anchorEl={this.state.anchorEl}
                >
                    {menuItems}
                </Menu>
            </div>
        )
    }
}


class Item extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            entries: this.sort(props.entries),
        }
        this.expand = this.expand.bind(this)
    }

    sort(list) {
        if (list === undefined) {
            return (list)
        }
        list.sort(
            (a, b) => {
                if (typeof (a.checkTime) !== typeof (b.checkTime)) {
                    if (a.checkTime === undefined) {
                        return (-1)
                    } else {
                        return (1)
                    }
                }
                if (a.priority < b.priority) {
                    return (-1)
                } else if (a.priority > b.priority) {
                    return (1)
                }
                return (a.name.toLocaleLowerCase().localeCompare(b.name.toLocaleLowerCase()))
            }
        )
        return (list)
    }

    expand() {
        let storage = window.localStorage
        if (storage !== null) {
            let expanded = storage.getItem("expanded-" + this.props.name)
            if (expanded == null) {
                storage.setItem("expanded-" + this.props.name, "yes")
            } else {
                storage.setItem("expanded-" + this.props.name, expanded === "yes" ? "no" : "yes")
            }
        }
        this.forceUpdate()
    }

    render() {
        let entries = []
        let completed = 0
        let expanded = false
        let storage = window.localStorage
        let count = 0
        if (storage !== null) {
            let e = storage.getItem("expanded-" + this.props.name)
            if (e != null) {
                expanded = e === "yes"
            }
        }

        let pe = this.sort(this.props.entries)
        console.info(JSON.stringify(pe, null, ' '))

        for (let i in pe) {
            let d = pe[i]
            if (d.checkTime === undefined || this.props.showCompleted) {
                count++
            }
            if (expanded || this.props.expanded) {
                if (d.checkTime === undefined || this.props.showCompleted) {
                    entries.push(
                        <ItemEntry key={d.id} data={d} onChange={this.props.onChange} onEdit={this.props.onEdit} readOnly={this.props.readOnly} showCategory={this.props.showCategory} />
                    )
                }
            }
            if (d.checkTime === undefined) {
                completed++
            }
        }

        if (count === 0) {
            return (<React.Fragment></React.Fragment>)
        }

        return (
            <div className='item'>
                <div className='itemHeader'>
                    <IconButton size='small' onClick={this.expand}>
                        {(expanded || this.props.expanded) ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
                    </IconButton>
                    <div className='vcenter'>{this.props.name}</div>
                    <div className='vcenter margin-left margin-right-05rem'>({completed}/{this.props.entries.length})</div>
                </div>
                {entries}
            </div>
        )
    }

}

export default Item