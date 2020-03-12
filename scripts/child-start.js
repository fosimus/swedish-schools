import pAll from 'p-all'
import { runMetricsBySchool } from './metrics'

process.on('message', async ({ schools }) => {
  try {
    const promises = schools.map(school => () => runMetricsBySchool(school))
    const stat = await pAll(promises, { concurrency: 10 })

    process.send({ status: 'DONE', value: stat })
  } catch (e) {
    process.send({ status: 'ERROR', value: e })
  }
})
