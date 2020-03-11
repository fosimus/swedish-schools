import { cpus } from 'os'
import { fork } from 'child_process'

const cpusLength = cpus().length - 1
const schoolsPerFork = 10

export const forker = (schools, callback) => Promise.all(
  Array(cpusLength).fill(null).map((_, cpuIndex) => new Promise((resolve, reject) => {
    const forked = fork('child-fork', [`fork-${cpuIndex}`])

    forked.send({ schools: schools.splice(0, schoolsPerFork) })

    forked.on('message', ({ status, value }) => {
      if (status === 'DONE') {
        if (schools.length > 0) {
          forked.send({ schools: schools.splice(0, schoolsPerFork) })
          callback(value)
        } else {
          forked.kill()
          resolve(cpuIndex)
        }
      } else if (status === 'ERROR') {
        forked.kill()
        reject(value)
      }
    })
  }))
)
