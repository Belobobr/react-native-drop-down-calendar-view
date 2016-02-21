## react-native-sliding-calendar-view

Tested with react-native 0.20

## Add it to your project

1. Run `npm install react-native-sliding-calendar-view --save`
2. `var ScrollableCalendarView = require('react-native-sliding-calendar-view');`



## Demo
<a href="https://github.com/Belobobr/react-native-scrollable-calendar-view/tree/master/demo.gif"><img src="https://github.com/Belobobr/react-native-scrollable-calendar-view/tree/master/demo.gif" width="350"></a>

## Basic usage

```javascript
import SlidingCalendarView from 'react-native-sliding-calendar-view';

class SlidingCalendarViewExample extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      selectedDay: new Date(),
    }
  }

  render() {
    return <View style={styles.container}>
      <SlidingCalendarView
        selectedDay={this.state.selectedDay}
        onDaySelected={this.onDaySelected.bind(this)}
      >
        <View style={styles.content}>
          <Text>Past here your content</Text>
        </View>
      </SlidingCalendarView>
    </View>
  }

  onDaySelected(day) {
    this.setState({selectedDay: day});
  }
}
```

## Example

See
[examples/SlidingCalendarViewExample](https://github.com/Belobobr/react-native-scrollable-calendar-view/tree/master/examples/SlidingCalendarViewExample).

## Props

- **`selectedDay`** _(Date)_ - selectedDay
- **`onDaySelected`**  - callback on selected day
---

**MIT Licensed**
