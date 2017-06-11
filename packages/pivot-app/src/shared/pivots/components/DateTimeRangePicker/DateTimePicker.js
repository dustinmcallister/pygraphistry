import moment from 'moment';
import { SingleDatePicker } from 'react-dates';
import { HORIZONTAL_ORIENTATION } from 'react-dates/constants';
import React from 'react';
import ReactDom from 'react-dom';
import TimePicker from 'time-input';
import TimezonePicker from 'react-bootstrap-timezone-picker';

import styles from '../pivots.less';


export const FORMAT = "hh:mm:ss a";

export default class DateTimePicker extends React.Component {

    constructor(props, context) {
        super(props, context);

        this.state = {
            focused: false,

            time: props.defaultTime,
            timezone: "America/Los_Angeles"
        };
    }


    render () {
        
        const { baseid, placeholder, date } = this.props;
        
        return (<div>
            <SingleDatePicker
                id={`sdp_${baseid}`}      

                date={date}
                onDateChange={ date => this.props.onValueChange({ date }) }
                
                focused={ this.state.focused }
                onFocusChange={ ({ focused }) => this.setState({ focused }) }
                
                isOutsideRange={ () => false }
                showClearDate={ true }
                orientation={HORIZONTAL_ORIENTATION}
                showDefaultInputIcon={true}
                withPortal={true}
                keepOpenOnDateSelect
                hideKeyboardShortcutsPanel={true}

                displayFormat={ () => {
                    const hasDate = date | false;
                    if (hasDate) {
                        const dateFormatted = date.format(moment.localeData().longDateFormat('L'));
                        const time = this.state.time.format(FORMAT);
                        return `[${dateFormatted} ${time}]`;
                    } else {
                        return `[${placeholder}]`;
                    }
                } }

                renderCalendarInfo={ () => <span
                        onClick={ (event) => event.stopPropagation() }
                    >
                        <div className={styles['pivot-timepicker-container']}>
                            <span className={styles['pivot-timepicker']} >
                                <TimePicker 
                                    value={ this.state.time.format(FORMAT) }
                                    onChange={ (time) =>  this.setState({ time: moment(time, FORMAT) }) }
                                />
                            </span>
                            <TimezonePicker
                              absolute={true}
                              value={ this.state.timezone }
                              placeholder="Select timezone..."
                              onChange={ (timezone) => this.setState({ timezone }) }
                            />
                        </div>
                    </span> 
                }

                placeholder={ placeholder }
            />            
        </div>);
    }

};


