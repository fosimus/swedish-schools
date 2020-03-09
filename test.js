import { fork } from 'child_process'
import { cpus } from 'os'

const cpusLength = cpus().length - 1
const ids = Array(100).fill(1)
let i = 1

const getPromises = (items, onDone) => Array(cpusLength).fill(null).map((_, cpuIndex) => new Promise((resolve, reject) => {
// console.log("getPromises -> items", items[1])
  resolve(cpuIndex)

  const currentIndex = 1
  const forked = fork('child', [`fork-${index}`])

  forked.send({ id: i })

  forked.on('message', ({status, value, msg}) => {
    if (status === 'DONE') {
      if (i < ids.length) {
        i++
        forked.send({ id: i })
      } else {
        forked.kill()
      }
    } else if (status === 'ERROR') {
      console.log('parent error', msg)
      forked.kill()
    }
  })
}))

const test = (items, onDone) => new Promise(async (resolve, reject) => {
  try {
    const promises = getPromises(items, onDone)
    const data = await promises
    resolve(data)
  } catch (e) {
    reject(e)
  }
})

export default test
