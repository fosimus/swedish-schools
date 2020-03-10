import { runMetricsBySchool } from './helper'

const forkName = process.argv[2]

process.on('message', async ({ school, i }) => {
  console.log('child i', i)
  try {
    const stat = await runMetricsBySchool(school, i)

    process.send({ status: 'DONE', value: stat })
  } catch (e) {
    console.log('child id error', e, forkName)
    process.send({ status: 'ERROR', value: e })
  }
})
