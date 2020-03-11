import { cpus } from 'os'
import { fork } from 'child_process'
import { SCHOOLS_PER_FORK } from './consts'

const cpusLength = cpus().length - 1

export const forker = (schools, callback) => Promise.all(
  Array(cpusLength).fill(null).map((_, cpuIndex) => new Promise((resolve, reject) => {
    const forked = fork('child-fork', [`fork-${cpuIndex}`])

    forked.send({ schools: schools.splice(0, SCHOOLS_PER_FORK) })

    forked.on('message', ({ status, value }) => {
      if (status === 'DONE') {
        if (schools.length > 0) {
          forked.send({ schools: schools.splice(0, SCHOOLS_PER_FORK) })
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
