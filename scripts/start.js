import got from 'got'
import pAll from 'p-all'
import fs, { promises as fsp } from 'fs'
import cliProgress from 'cli-progress'

import { forker } from './fork'
import { CONCURRENCY, HEADERS } from './consts'
import { cvsHeader, parseSchoolData, getPageLink } from './helper'

const getSchoolMetrics = async (schools) => {
  let progressBarValue = 0
  const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)
  progressBar.start(schools.length, 0)

  const writeCSVStream = await createDocument()

  try {
    await forker(schools, (schoolsWithStat) => {
      writeCSVStream.write(
        schoolsWithStat.map((school) => parseSchoolData(school)).join('')
      )
      progressBarValue += schoolsWithStat.length
      progressBar.update(progressBarValue)
    })
  } catch (e) {
    return Promise.reject(e)
  } finally {
    writeCSVStream.end()
    progressBar.stop()
  }
}

const createDocument = async () => {
  try {
    const fileName = 'schools'
    await fsp.writeFile(`./${fileName}.csv`, cvsHeader)
    const writeCSVStream = fs.createWriteStream(`./${fileName}.csv`, { flags: 'a' })

    writeCSVStream.on('error', (e) => {
      console.error('Stream error', e)
    })

    return Promise.resolve(writeCSVStream)
  } catch (e) {
    return Promise.reject(e)
  }
}

const getPagePromises = (pagination) =>
  Array(pagination.totalPages)
    .fill(null)
    .map((_, index) => () => new Promise(async (resolve, reject) => {
      try {
        const { schoolUnits } = await got(getPageLink(index), { headers: HEADERS }).json()

        resolve(schoolUnits)
      } catch (e) {
        reject(e)
      }
    }))

const getAllSchools = async () => {
  const { pagination } = await got(getPageLink(0), { headers: HEADERS }).json()
  const allPages = getPagePromises(pagination)

  try {
    const schoolsData = await pAll(allPages, { concurrency: CONCURRENCY })
    const schools = schoolsData.reduce((acc, cur) => {
      cur.map((el) => {
        acc.push(el)
      })
      return acc
    }, [])

    if (pagination.totalElements !== schools.length) {
      console.log('totalElements !== schools', pagination.totalElements, schools.length)
    } else {
      console.log('total schools', pagination.totalElements)
    }

    return schools
  } catch (e) {
    return Promise.reject(e)
  }
}

;(async () => {
  const start = new Date().getTime()

  try {
    const schools = await getAllSchools()
    await getSchoolMetrics(schools)
  } catch (e) {
    console.error(e)
  } finally {
    console.log('Execution time: ', new Date().getTime() - start)
  }
})()
