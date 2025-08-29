import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import objectSupport from 'dayjs/plugin/objectSupport'

dayjs.extend(utc)
dayjs.extend(objectSupport)

export { dayjs }
