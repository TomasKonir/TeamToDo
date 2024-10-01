import React from 'react'

import { IconButton, Popover } from '@mui/material'
import Checkbox from '@mui/material/Checkbox'
import MenuItem from '@mui/material/MenuItem'
import Menu from '@mui/material/Menu'

import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import MoveDownIcon from '@mui/icons-material/MoveDown'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'


import { getData, postData, isIdExpanded, switchIdExpanded, priorityColors, unixTimeToDateString } from './utils'
import ItemMoveDialog from './ItemMoveDialog'

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

export default class Item extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            menuVisible: false,
            moveItem: undefined,
            anchorEl: undefined,
            anchorPosition: undefined,
            contextMenuVisible: false,
        }
        this.expand = this.expand.bind(this)
        this.checked = this.checked.bind(this)
        this.priorityChanged = this.priorityChanged.bind(this)
        this.onContextMenu = this.onContextMenu.bind(this)
    }

    expand() {
        let storage = window.localStorage
        if (storage !== null) {
            let expanded = storage.getItem("expanded-" + this.props.data.id)
            if (expanded == null) {
                storage.setItem("expanded-" + this.props.data.id, "yes")
            } else {
                storage.setItem("expanded-" + this.props.data.id, expanded === "yes" ? "no" : "yes")
            }
        }
        this.forceUpdate()
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

    onContextMenu(event) {
        this.setState({ anchorPosition: { left: event.clientX, top: event.clientY }, anchorEl: event.currentTarget, contextMenuVisible: true })
        event.preventDefault()
    }

    render() {
        let text = undefined
        let checkSx = {}

        if (this.props.data.dateTo && this.props.data.checkTime === undefined) {
            let days = (this.props.data.dateTo - new Date().getTime())/(1000*60*60*24)
            if (days <= 0) {
                checkSx.backgroundColor = '#A52A2A99'
            } else if (days <= 7) {
                checkSx.backgroundColor = '#D2691E66'
            } else if (days <= 14) {
                checkSx.backgroundColor = '#DAA52066'
            }
        }

        let expanded = isIdExpanded(this.props.data.id)
        if (expanded) {
            let timeA = ''
            let timeB = ''
            timeA = < div className='itemComplete margin-left' >{formatDateTime(this.props.data.ctime)}</div>
            if (this.props.data.checkTime !== undefined) {
                timeB = < div className='itemComplete margin-right-05rem' >{formatDateTime(this.props.data.checkTime)}</div >
            } else {
                timeB = < div className='itemInProgress margin-right-05rem' >TBD</div >
            }
            text = <div className='itemDetail'>
                <div className='itemComplete margin-left margin-right-05rem'>{this.props.data.dateTo ? 'Splnit do:' : ''} {unixTimeToDateString(this.props.data.dateTo)}</div>
                <div className={'flex-row ' + (this.props.data.text.length === 0 ? 'itemDetailHeaderEmpty' : 'itemDetailHeader')}>
                    {timeA} - {timeB}
                </div>
                {this.props.data.text.length === 0 ? '' : <div className='itemDetailContent'><pre>{this.props.data.text}</pre></div>}
            </div>
        }

        let expandedSubs = false
        let storage = window.localStorage
        if (storage !== null) {
            let e = storage.getItem("expanded-" + this.props.data.id)
            if (e != null) {
                expandedSubs = e === "yes"
            }
        }
        let subs = []
        let uncheckedSub = false
        if (this.props.data.sub) {
            for (let i in this.props.data.sub) {
                let n = this.props.data.sub[i]
                if (n.checkTime) {
                    if (!this.props.showCompleted) {
                        continue
                    }
                } else {
                    uncheckedSub = true
                }
                if (expandedSubs) {
                    subs.push(
                        <Item
                            data={n}
                            parent={this.props.data}
                            key={n.id}
                            level={this.props.level + 1}
                            showCompleted={this.props.showCompleted}
                            readOnly={this.props.readOnly}
                            onChange={this.props.onChange}
                            onEdit={this.props.onEdit}
                            onAdd={this.props.onAdd}
                        />
                    )
                } else {
                    subs.push(null)
                }
            }
        }

        let ret = []
        let style = {}
        style.marginLeft = (this.props.level * 1) + 'rem'
        if (this.props.level === 0) {
            style.backgroundColor = '#131320'
        }
        let expandColor = 'blue'
        if (this.props.expanded || expanded) {
            expandColor = 'success'
        } else if (this.props.data.text === undefined || this.props.data.text.length === 0) {
            expandColor = 'gray'
        }
        let statusInfo
        if (this.props.showCompleted) {
            if (this.props.data.unchecked !== undefined && this.props.data.checked !== undefined && (this.props.data.unchecked > 0 || this.props.data.checked > 0)) {
                statusInfo = this.props.data.unchecked + '/' + this.props.data.checked
            }
        } else {
            if (this.props.data.unchecked !== undefined && this.props.data.unchecked > 0) {
                statusInfo = this.props.data.unchecked
            }
        }

        let contextMenu
        if (this.state.contextMenuVisible) {
            contextMenu = <Popover
                open={this.state.contextMenuVisible}
                onClose={() => this.setState({ contextMenuVisible: false, anchorEl: undefined, anchorPosition: undefined })}
                anchorPosition={this.state.anchorPosition}
                anchorReference='anchorPosition'
            >
                <div className='flex-column'>
                    <div className='flex-row' style={{ width: '100%', maxWidth: '12rem', maxHeight: '2rem', height: '2rem', padding: '0.25rem', backgroundColor: 'black' }}>
                        <b style={{ marginLeft: 'auto', marginRight: 'auto', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {this.props.data.name}
                        </b>
                    </div>

                    <MenuItem className="menu" disabled={this.props.readOnly} onClick={() => {
                        this.setState({ contextMenuVisible: false, anchorEl: undefined, anchorPosition: undefined })
                        if (this.props.onEdit) {
                            this.props.onEdit(this.props.data)
                        }
                    }}>
                        <div className='flex-row' style={{ gap: '0.5rem' }}><EditIcon /><b>Upravit</b></div>
                    </MenuItem>

                    <MenuItem className="menu" disabled={this.props.level > 4 || this.props.readOnly || this.props.data.checkTime} onClick={() => {
                        this.setState({ moveItem: this.props.data, contextMenuVisible: false, anchorEl: undefined, anchorPosition: undefined })
                    }}>
                        <div className='flex-row' style={{ gap: '0.5rem' }}><MoveDownIcon /><b>Přesunout</b></div>
                    </MenuItem>

                    <MenuItem className="menu" disabled={this.props.level > 4 || this.props.readOnly || this.props.data.checkTime} onClick={() => {
                        this.setState({ contextMenuVisible: false, anchorEl: undefined, anchorPosition: undefined })
                        this.props.onAdd(this.props.data)
                    }}>
                        <div className='flex-row' style={{ gap: '0.5rem' }}><AddCircleIcon /><b>Přidat podúkol</b></div>
                    </MenuItem>

                    <MenuItem className="menu" disabled={this.props.readOnly} onClick={() => {
                        this.setState({ contextMenuVisible: false, anchorEl: undefined, anchorPosition: undefined })
                        if (!window.confirm("Smazat úkol: " + this.props.data.name + "?")) {
                            return
                        }
                        getData('api.php?cmd=delete&id=' + this.props.data.id, (data) => {
                            if (this.props.onChange) {
                                this.props.onChange()
                            }
                        })
                    }}>
                        <div className='flex-row' style={{ gap: '0.5rem' }}><DeleteIcon /><b>Smazat</b></div>
                    </MenuItem>
                </div>
            </Popover>
        }

        let priorityMenu
        if (this.state.menuVisible) {
            let menuItems = []
            menuItems.push(
                <MenuItem key={0} onClick={() => this.priorityChanged(0)} className="menu">
                    <div className='itemPriority' style={{ backgroundColor: 'black' }}>-</div>
                </MenuItem>
            )
            for (let i = 1; i < 10; i++) {
                menuItems.push(
                    <MenuItem key={i} onClick={() => this.priorityChanged(i)} className="menu">
                        <div className='itemPriority' style={{ backgroundColor: priorityColors[i] }}>{i}</div>
                    </MenuItem>
                )
            }
            priorityMenu = <Menu
                open={this.state.menuVisible}
                onClose={() => this.setState({ menuVisible: false })}
                anchorEl={this.state.anchorEl}
            >
                {menuItems}
            </Menu>
        }

        ret.push(
            <div key={this.props.data.id} className='itemEntry' style={style} onContextMenuCapture={this.onContextMenu}>
                <div className='itemEntryHeader'>
                    {
                        this.props.data.priority > 0
                            ?
                            <IconButton
                                title='Priorita'
                                size='small'
                                disabled={this.props.readOnly}
                                onClick={
                                    (event) => {
                                        this.setState({ anchorEl: event.currentTarget, menuVisible: true })
                                    }
                                }
                                style={{ backgroundColor: priorityColors[this.props.data.priority], color: 'white' }}
                            >
                                <div className='vcenter itemPriority'>{this.props.data.priority}</div>
                            </IconButton>
                            :
                            ''
                    }
                    {
                        subs.length > 0
                            ?
                            <IconButton size='small' onClick={this.expand}>
                                {expandedSubs ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
                            </IconButton>
                            :
                            <div style={{ width: '2rem' }} />
                    }
                    <div className='vcenter itemEntryName'                        >
                        {this.props.level === 0 ? <b>{this.props.data.name}</b> : <div>{this.props.data.name}</div>}
                        <div className='spacer' />
                        {statusInfo}
                    </div>
                    <div className='flex-row' style={{ marginLeft: 'auto' }}>
                        <IconButton
                            size='small'
                            color={expandColor}
                            onClick={
                                () => {
                                    switchIdExpanded(this.props.data.id)
                                    this.forceUpdate()
                                }
                            }>
                            {(expanded || this.props.expanded) ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                        </IconButton>
                        <Checkbox
                            disabled={
                                this.props.readOnly ||
                                (this.props.parent && this.props.parent.checkTime && this.props.data.checkTime !== undefined) ||
                                (uncheckedSub && this.props.data.checkTime === undefined)
                            }
                            title='Hotovo?'
                            size="small"
                            checked={this.props.data.checkTime !== undefined}
                            onChange={(ev) => this.checked(ev.target.checked)}
                            sx={checkSx}
                        />
                    </div>
                </div>
                {text}
                {priorityMenu}
                {contextMenu}
                {
                    this.state.moveItem
                        ?
                        <ItemMoveDialog onClose={() => this.setState({ moveItem: undefined })} onAccept={this.props.onChange} item={this.state.moveItem} />
                        :
                        undefined
                }
            </div>
        )

        return (ret.concat(subs))
    }
}
