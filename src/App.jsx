import Step from './Step'
import Watch from './Watch'
import T0 from './Time/0'
import T1 from './Time/1'

export default () => (
  <Step name="Build Queue">
    <Watch on="t">
      <T0/>
      <T1/>
    </Watch>
  </Step>
)
