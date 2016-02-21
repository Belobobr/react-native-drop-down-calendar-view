import React, {
    StyleSheet,
    View,
    TouchableHighlight,
    TouchableOpacity,
    Text,
    Dimensions,
    PanResponder,
    ScrollView,
    Animated,
    Image,
} from 'react-native';

import moment from 'moment';

const DEVICE_WIDTH = Dimensions.get('window').width;
const DAYS_IN_WEEK = 7;
const MIDDLE_OF_WEEK = 3;
const DAY_OF_WEAK_WIDTH = DEVICE_WIDTH / DAYS_IN_WEEK;
const MONTH_CALENDAR_HEIGHT = DAY_OF_WEAK_WIDTH * 6;
const MONTH_HEADER_HEIGHT = 29;
const WEEK_CONTAINER_HEIGHT_OPENED = 34.5;
const WEEK_CONTAINER_HEIGHT_CLOSED = 79;
var WEEK_CONTAINER_HEIGHT = WEEK_CONTAINER_HEIGHT_CLOSED;

const CALENDAR_OPEN_THRESHOLD = MONTH_CALENDAR_HEIGHT / 2;
const VY_MAX = 0.1;

class CalendarView extends React.Component {
  constructor(props) {
    super(props);
    const now = new Date();
    this.state = {
      displayedDay: now,
      scrollViewWidth: 0,
      containerViewY: 0,
      openMonthCalendarValue: new Animated.Value(0),
      previewMode: true,
      calendarViewOpened: false,
      interactionWithMonthCalendar: false,
    };
  }

  componentWillMount() {
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: this.__onStartShouldSetPanResponder.bind(this),
      onMoveShouldSetPanResponder: this._shouldSetPanResponder.bind(this),
      onPanResponderMove: this._panResponderMove.bind(this),
      onPanResponderRelease: this._panResponderRelease.bind(this),
      onPanResponderGrant: this._panResponderGrant.bind(this),
    });
  }

  displayedDays(day) {
    const firstMonthDay = this.firstRenderedDay(day);
    const lastMonthDay = this.lastRenderedDay(day);

    var acc = [];
    for(let i = 0; i < lastMonthDay.diff(firstMonthDay, 'days'); i++) {
      acc.push(moment(firstMonthDay).add(i, 'days'));
    }
    return acc;
  }

  weekDays(day) {
    const firstWeekDay = moment(day).startOf('isoWeek');
    const secondWeekDay = moment(day).endOf('isoWeek');

    var acc = [];
    for(let i = 0; i <= secondWeekDay.diff(firstWeekDay, 'days'); i++) {
      acc.push(moment(firstWeekDay).add(i, 'days'));
    }
    return acc;
  }

  monthDays(day) {
    const firstMonthDay = this.firstMonthDay(day);
    const lastMonthDay = this.lastMonthDay(day);

    var acc = [];
    for (let i = 0; i <= lastMonthDay.diff(firstMonthDay, 'days'); i++) {
      acc.push(moment(firstMonthDay).add(i, 'days'));
    }
    return acc;
  }

  firstRenderedDay(day) {
    return moment(day).subtract(1, 'month').startOf('month').startOf('isoWeek');
  }

  lastRenderedDay(day) {
    return moment(day).add(1, 'month').endOf('month').endOf('isoWeek');
  }

  firstMonthDay(day) {
    return moment(day).startOf('month').startOf('isoWeek');
  }

  lastMonthDay(day) {
    return moment(day).endOf('month').endOf('isoWeek');
  }

  lastDayInFirstRenderedWeek(day) {
    return moment(day).subtract(1, 'month').startOf('month').endOf('isoWeek');
  }

  weekScrollOffset() {
    const index = this.indexOfDisplayedWeek();
    return {x : this.state.scrollViewWidth * index, y: 0};
  }

  indexOfDisplayedWeek() {
    return moment(this.state.displayedDay).diff(this.firstRenderedDay(this.state.displayedDay), 'weeks');
  }

  monthScrollOffset() {
    const index = this.indexOfDisplayedMonth();
    return {x : this.state.scrollViewWidth * index, y: 0};
  }

  indexOfDisplayedMonth() {
    const monthDiff =  moment(this.state.displayedDay).month() - this.lastDayInFirstRenderedWeek(this.state.displayedDay).month();
    return monthDiff > 0 ? monthDiff : 1;
  }

  getMonthView(dayOfMonth) {
    return <View style={[styles.monthCalendar, {height: MONTH_CALENDAR_HEIGHT, width : DEVICE_WIDTH}]}>
      {this.monthDays(dayOfMonth).map((day) => {
        return this.getMonthDayView(day, dayOfMonth);
      })}
    </View>;
  }

  getMonthStubView() {
    return <View style={[styles.monthCalendar, {height: MONTH_CALENDAR_HEIGHT, width : DEVICE_WIDTH}]}>
    </View>;
  }

  getPreviousMonthView(day) {
    const previousMonthDay = moment(day).subtract(1, 'month');
    return this.getMonthView(previousMonthDay);
  }

  getNextMonthView(day) {
    const nextMonthDay = moment(day).add(1, 'month');
    return this.getMonthView(nextMonthDay);
  }

  getWeekDayView(day) {
    return <View style={styles.dayOfWeakContainer} key={day.unix()}>
      <Text style={styles.dayOfWeakTitle}>{getWeakDayTitle(day.day())}</Text>
      <TouchableHighlight onPress={this.changeSelectedDate.bind(this, day)} underlayColor={'rgba(0,0,0,0)'}>
        {this.getViewForDay(day, this.state.displayedDay)}
      </TouchableHighlight>
    </View>;
  }

  getWeekDaysHeaderView() {
    return <View style={styles.weekDaysHeader}>
      {this.weekDays(moment()).map((day) => {
        return <View style={styles.dayOfWeakContainer}>
          <Text style={styles.dayOfWeakTitle}>{getWeakDayTitle(day.day())}</Text>
        </View>;
      })}
    </View>;
  }

  getMonthDayView(day, dayOfMonth) {
    return <TouchableHighlight
        style={styles.dayOfMonthContainer}
        onPress={this.changeSelectedDate.bind(this, day)}
        underlayColor={'rgba(0,0,0,0)'}
    >
      <View style={styles.dayOfMonthContainer}>
        {this.getViewForDay(day, dayOfMonth)}
      </View>
    </TouchableHighlight>;
  }

  getViewForDay(day, dayOfMonth) {
    const currentDateStyle = day.isSame(moment(), 'day') ? styles.currentDate : {};
    const notInCurrentMonthDateStyle = !day.isSame(dayOfMonth, 'month') ? styles.notInCurrentMonthDate : {};

    if (day.isSame(this.props.selectedDay, 'day')) {
      return <View style={styles.dateContainer}>
        <Image
            source={require('./img/calendar_today_background.png')}
            style={styles.highlightedDateBackground}/>
        <Text style={[styles.highlightedDate, currentDateStyle, notInCurrentMonthDateStyle]}>{day.date()}</Text>
      </View>;
    } else {
      return <View style={styles.dateContainer}>
        <Text style={[styles.date, currentDateStyle, notInCurrentMonthDateStyle]}>{day.date()}</Text>
      </View>;
    }
  }

  changeSelectedDate(date) {
    if (this.state.calendarViewOpened) {
      this.setState({
        displayedDay: date,
      });
    }
    this.props.onDaySelected && this.props.onDaySelected(date);
    this.closeMonthCalendar();
  }

  render() {
    WEEK_CONTAINER_HEIGHT = WEEK_CONTAINER_HEIGHT_CLOSED;

    //replace to something like native props
    if (this.monthScrollView) {
      this.monthScrollView.scrollTo({
        x: this.indexOfDisplayedMonth() * this.state.scrollViewWidth,
        animated: false
      });
    }
    if (this.weekScroolView && !this.state.calendarViewOpened) {
      this.weekScroolView.scrollTo({
        x: this.indexOfDisplayedWeek() * this.state.scrollViewWidth,
        animated: false
      });
    }

    const outputRange = [-MONTH_CALENDAR_HEIGHT, 0 - DAY_OF_WEAK_WIDTH];

    //type ExtrapolateType = 'extend' | 'identity' | 'clamp';
    const monthCalendarTransition = this.state.openMonthCalendarValue.interpolate({
      inputRange: [0, 1],
      outputRange: outputRange,
      extrapolate: 'clamp',
    });
    const weekContainerOpacity = this.state.openMonthCalendarValue.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    const animatedMonthCalendarStyles = {transform: [{translateY: monthCalendarTransition}]};
    const animatedWeekContainerStyles = {opacity: weekContainerOpacity};

    const previewMode = this.state.previewMode;
    this.state.previewMode = false;

    const displayedDays = previewMode || this.state.calendarViewOpened ? this.weekDays(this.state.displayedDay) : this.displayedDays(this.state.displayedDay);
    const weekContainerVisible = this.state.interactionWithMonthCalendar || !this.state.calendarViewOpened;
    const hiddenCalendarStyle = this.props.searchFocused ? styles.hiddenCalendarStyle : {};

    return <View style={styles.container} onLayout={this.onContainerLayout.bind(this)} ref='container'>
      <View style={{flex: 1}}>
        {this.props.children}
      </View>

      <View style={[styles.calendarStyle, hiddenCalendarStyle]}>
        <Animated.View style={[animatedMonthCalendarStyles, styles.animatedMonthCalendar,]}>
          <ScrollView style={styles.scrolledMontCalendarContainer}
                      automaticallyAdjustContentInsets={false}
                      horizontal={true}
                      pagingEnabled={true}
                      scrollEventThrottle={16}
                      removeClippedSubviews={true}
                      contentOffset={this.monthScrollOffset()}
                      onMomentumScrollEnd={this.onMonthScrollAnimationEnd.bind(this)}
                      ref={(monthScrollView) => { this.monthScrollView = monthScrollView; }}
          >
            {this.renderMonthCalendar(previewMode)}
          </ScrollView>
          <View style={styles.sliderContainer} {...this._panResponder.panHandlers}>
            <View style={styles.slideView}/>
          </View>
        </Animated.View>

        <View style={[styles.monthHeader]}>
          <TouchableOpacity onPress={this.scrollToPreviousMonth.bind(this)}>
            <Image source={require('./img/calendar_arrow_left.png')} style={styles.arrows}/>
          </TouchableOpacity>

          <Text style={styles.monthTitle}>{formatMonthTitle(this.state.displayedDay)}</Text>

          <TouchableOpacity onPress={this.scrollToNextMonth.bind(this)}>
            <Image source={require('./img/calendar_arrow_right.png')} style={styles.arrows}/>
          </TouchableOpacity>
        </View>

        {this.getWeekDaysHeaderView()}

        <Animated.View style={[animatedWeekContainerStyles, styles.weekContainer]}>
          <ScrollView automaticallyAdjustContentInsets={false}
                      horizontal={true}
                      pagingEnabled={true}
                      scrollEventThrottle={16}
                      removeClippedSubviews={true}
                      onLayout={this.onScrollLayout.bind(this)}
                      contentOffset={this.state.calendarViewOpened ? {x:0, y:0} : this.weekScrollOffset()}
                      onMomentumScrollEnd={this.onWeekScrollAnimationEnd.bind(this)}
                      ref={(weekScroolView) => { this.weekScroolView = weekScroolView; }}>
            {displayedDays.map((day) => {
              return this.getWeekDayView(day);
            })}
          </ScrollView>
        </Animated.View>

        {this.getWeekDaysHeaderView()}

        {weekContainerVisible &&<Animated.View style={[animatedWeekContainerStyles, styles.weekContainer]}>
          <ScrollView automaticallyAdjustContentInsets={false}
                      horizontal={true}
                      pagingEnabled={true}
                      scrollEventThrottle={16}
                      removeClippedSubviews={true}
                      onLayout={this.onScrollLayout.bind(this)}
                      contentOffset={this.state.calendarViewOpened ? {x:0, y:0} : this.weekScrollOffset()}
                      onMomentumScrollEnd={this.onWeekScrollAnimationEnd.bind(this)}
                      ref={(weekScroolView) => { this.weekScroolView = weekScroolView; }}>
            {displayedDays.map((day) => {
              return this.getWeekDayView(day);
            })}
          </ScrollView>
        </Animated.View>}
      </View>
    </View>;
  }

  renderMonthCalendar(previewMode) {
    if (!previewMode) {
      if (this.state.calendarViewOpened) {
        return <View style={styles.monthCalendarContainer}>
          {this.getPreviousMonthView(this.state.displayedDay)}
          {this.getMonthView(this.state.displayedDay)}
          {this.getNextMonthView(this.state.displayedDay)}
        </View>;
      } else {
        return <View style={styles.monthCalendarContainer}>
          {this.getMonthStubView()}
          {this.getMonthView(this.state.displayedDay)}
          {this.getMonthStubView()}
        </View>;
      }
    }
  }

  scrollToNextMonth() {
    if (!this.state.calendarViewOpened) {
      const firstDayOfNextMonth = moment(this.state.displayedDay).add(1, 'month').startOf('month');
      var weekOffset  = firstDayOfNextMonth.diff(this.firstRenderedDay(this.state.displayedDay), 'weeks');
      if (firstDayOfNextMonth.isSame(moment(this.state.displayedDay), 'isoWeek')) {
        weekOffset++;
      }
      this.weekScroolView.scrollTo({x: weekOffset * this.state.scrollViewWidth});
    } else {
      const nextMonthOffset = 2;
      this.monthScrollView.scrollTo({x: nextMonthOffset * this.state.scrollViewWidth});
    }
  }

  scrollToPreviousMonth() {
    this.state.calendarViewOpened ? this.monthScrollView.scrollTo({x: 0}) : this.weekScroolView.scrollTo({x: 0});
  }

  onWeekScrollAnimationEnd(e) {
    const calendarWidth = e.nativeEvent.layoutMeasurement.width;
    const offset = e.nativeEvent.contentOffset.x;
    const weekFromStart = offset / calendarWidth;
    const newDisplayedDay = this.firstRenderedDay(this.state.displayedDay).add(weekFromStart, 'weeks').add(MIDDLE_OF_WEEK, 'days');

    this.setState({displayedDay: newDisplayedDay.toDate()});
  }

  onMonthScrollAnimationEnd(e) {
    const calendarWidth = e.nativeEvent.layoutMeasurement.width;
    const offset = e.nativeEvent.contentOffset.x;
    const monthFromStart = offset / calendarWidth;

    var newDisplayedDay = this.state.displayedDay;

    if (monthFromStart == 0) {
      const middleOfFirstRenderedWeek = this.firstRenderedDay(this.state.displayedDay).add(MIDDLE_OF_WEEK, 'days');
      const middleOfSecondRenderedWeek = this.firstRenderedDay(this.state.displayedDay).add(1, 'weeks').add(MIDDLE_OF_WEEK, 'days');

      const monthDiff = moment(this.state.displayedDay).month() - middleOfFirstRenderedWeek.month();
      if (monthDiff == 1) {
        newDisplayedDay = middleOfFirstRenderedWeek.toDate();
      }  else  {
        newDisplayedDay = middleOfSecondRenderedWeek.toDate();
      }
    } else if (monthFromStart == 2) {
      const firstMonthDay = this.firstMonthDay(moment(this.state.displayedDay).add(1, 'month'));
      const middleOfFirstWeekInNextMonth = firstMonthDay.add(MIDDLE_OF_WEEK, 'days');
      const middleOfSecondWeekInNextMonth = moment(middleOfFirstWeekInNextMonth).add(1, 'weeks');

      const monthDiff = middleOfFirstWeekInNextMonth.month() - moment(this.state.displayedDay).month();
      if (monthDiff== 1) {
        newDisplayedDay = middleOfFirstWeekInNextMonth.toDate();
      }  else  {
        newDisplayedDay = middleOfSecondWeekInNextMonth.toDate();
      }
    }

    this.setState({displayedDay: newDisplayedDay});
  }

  __onStartShouldSetPanResponder() {
    return true;
  }

  _shouldSetPanResponder() {
    return true;
  }

  _panResponderGrant(e, gestureState) {
    this.setState({
      interactionWithMonthCalendar: true,
    });
  }

  _panResponderMove(e, gestureState) {
    var openMonthCalendarValue = this._getOpenMonthCalendarValueForDy(gestureState.moveY);

    if (openMonthCalendarValue > 1) {
      openMonthCalendarValue = 1;
    } else if (openMonthCalendarValue < 0) {
      openMonthCalendarValue = 0;
    }

    this.state.openMonthCalendarValue.setValue(openMonthCalendarValue);
  }

  _panResponderRelease(e, gestureState) {
    const {dy, vy} = gestureState;

    if (dy > CALENDAR_OPEN_THRESHOLD || vy > VY_MAX) {
      this.openMonthCalendar({velocity: vy});
    } else {
      this.closeMonthCalendar({velocity: vy});
    }
  }

  _getOpenMonthCalendarValueForDy(moveY) {
    return (moveY - this.state.containerViewY - simpleModeHeight()) / MONTH_CALENDAR_HEIGHT;
  }

  openMonthCalendar(options={}) {
    this.setState({
      interactionWithMonthCalendar: true,
    });
    Animated.spring(
        this.state.openMonthCalendarValue,
        {
          toValue: 1,
          bounciness: 0,
          restSpeedThreshold: 0.1,
          ...options,
        }
    ).start(this.onCalendarViewOpened.bind(this));
  }

  closeMonthCalendar(options={}) {
    this.setState({
      interactionWithMonthCalendar: true,
    });
    Animated.spring(
        this.state.openMonthCalendarValue,
        {
          toValue: 0,
          bounciness: 0,
          restSpeedThreshold: 1,
          ...options,
        }
    ).start(this.onCalendarViewClosed.bind(this));
  }

  onCalendarViewOpened() {
    this.setState({
      calendarViewOpened: true,
      interactionWithMonthCalendar: false,
    });
    this.props.onCalendarViewOpened && this.props.onCalendarViewOpened();
  }

  onCalendarViewClosed() {
    this.setState({
      calendarViewOpened: false,
      interactionWithMonthCalendar: false,
    });
    this.props.onCalendarViewClosed && this.props.onCalendarViewClosed();
  }

  onScrollLayout(event) {
    this.setState({
      scrollViewWidth: event.nativeEvent.layout.width,
    });
  }

  onContainerLayout() {
    this.refs['container'].measure((x, y, width, height, pageX, pageY) => {
      this.setState({
        containerViewY: pageY,
      });
    });
  }
}

export default CalendarView;

function getWeakDayTitle(dayOfWeek) {
  const dayOfWeekTitles = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  return dayOfWeekTitles[dayOfWeek];
}

function formatMonthTitle(day) {
  return moment(day).format( 'MMMM YYYY Г.').toUpperCase();
}

function simpleModeHeight() {
  return MONTH_HEADER_HEIGHT + WEEK_CONTAINER_HEIGHT;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection : 'column',
    backgroundColor : '#FFF',
    overflow: 'hidden',
  },
  monthHeader: {
    position: 'absolute',
    left:0,
    top: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 13.5,
    height: MONTH_HEADER_HEIGHT,
    width: DEVICE_WIDTH,
    backgroundColor : "#51545B",
  },
  monthCalendar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    backgroundColor: '#51545B',
  },
  scrolledMontCalendarContainer: {
    height: MONTH_CALENDAR_HEIGHT,
    width : DEVICE_WIDTH,
    backgroundColor: '#51545B',
  },
  monthCalendarContainer: {
    height: MONTH_CALENDAR_HEIGHT,
    flexDirection: 'row',
    flexWrap: 'nowrap',
  },
  animatedMonthCalendar: {
    backgroundColor: '#FF0',
    position: 'absolute',
    left: 0,
    top: simpleModeHeight(),
    width: DEVICE_WIDTH,
    height: MONTH_CALENDAR_HEIGHT + 30,
  },
  dayOfMonthContainer: {
    width: DAY_OF_WEAK_WIDTH - 2,
    height: DAY_OF_WEAK_WIDTH,
    alignItems : 'center',
    justifyContent: 'center',
  },
  weekContainer: {
    position: 'absolute',
    width: DEVICE_WIDTH,
    height: WEEK_CONTAINER_HEIGHT,
    left : 0,
    top: MONTH_HEADER_HEIGHT,
    paddingTop: 20,
    backgroundColor : '#51545B',
  },
  weekDaysHeader: {
    position: 'absolute',
    flexDirection: 'row',
    width: DEVICE_WIDTH,
    height: WEEK_CONTAINER_HEIGHT_OPENED,
    left : 0,
    top: MONTH_HEADER_HEIGHT,
    paddingTop: 20,
    backgroundColor : '#51545B',
  },
  sliderContainer: {
    borderTopColor: '#5e6169',
    borderTopWidth: 0.5,
    justifyContent: 'center',
    alignItems: 'center',
    height: SLIDER_HEIGHT,
    backgroundColor : '#51545B',
  },
  sliderTouchContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideView: {
    width: 30,
    height: 5,
    borderRadius: 2,
    backgroundColor: '#5e6169',
  },
  dayOfWeakContainer: {
    flexDirection : 'column',
    width : DAY_OF_WEAK_WIDTH,
    alignItems : 'center',
  },
  dayOfWeakTitle: {
    color: '#FDFDFD',
    fontWeight: '300',
    fontSize: 10.5,
  },
  date: {
    marginTop: 10,
    marginBottom: 10,
    color: '#FDFDFD',
    fontWeight: '300',
    fontSize: 16,
  },
  highlightedDate: {
    marginTop: 10,
    marginBottom: 10,
    color: '#5e6169',
    fontWeight: '300',
    fontSize: 16,
  },
  currentDate: {
    fontWeight: '600',
  },
  notInCurrentMonthDate: {
    opacity: 0.5,
  },
  dateContainer: {
    marginTop: 4,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  highlightedDateBackground: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 32,
    height: 32,
  },
  arrows: {
    width: 8,
    height: 14,
    marginLeft: 15,
    marginRight: 15,
  },
  monthTitle: {
    color: '#FFF',
    fontWeight: '400',
  },
  calendarStyle: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  hiddenCalendarStyle: {
    height: 0,
    overflow: 'hidden',
  },
});
