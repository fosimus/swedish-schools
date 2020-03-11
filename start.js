import pAll from 'p-all'
import got from 'got'
import fs, { promises as fsp } from 'fs'
import { cvsHeader, parseSchoolData } from './helper'
import { forker } from './fork'

const getPageLink = page => `https://utbildningsguiden.skolverket.se/appresource/4.5773086416b1c2d84ca134/12.5406806016b70e49d5e2f79/?page=${page}&namn=&omrade=01&skolform=&arskurser=0%2C1%2C2%2C3%2C4%2C5%2C6%2C7%2C8%2C9%2C10&organisationsform=&svAjaxReqParam=ajax`
const headers = { 'X-Requested-With': 'XMLHttpRequest' }
const TIMEOUT = 120000
const OPT = 50

const getPagePromises = pagination =>
  Array(pagination.totalPages)
    .fill(null)
    .map((_, index) => () => new Promise(async (resolve, reject) => {
      try {
        const { schoolUnits } = await got(getPageLink(index), { TIMEOUT, headers }).json()

        resolve(schoolUnits)
      } catch (e) {
        reject(e)
      }
    }))

const getAllSchools = async () => {
  const { pagination } = await got(getPageLink(0), { headers }).json()
  const allPages = getPagePromises(pagination)

  try {
    const schoolsData = await pAll(allPages, { concurrency: OPT })
    const schools = schoolsData.reduce((acc, cur) => {
      cur.map(el => {
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
// let ipa = 0
// const getMetricsBySchool = (school, writeCSVStream) => () => new Promise(async (resolve, reject) => {
//   console.log("child i", ipa)
//   ipa++
//   let statisticLinks
//   const statisticHref = school._links.statistics.href

//   try {
//     const { _links } = await got(statisticHref).json()

//     statisticLinks = _links
//   } catch (e) {
//     reject(e)
//   }

//   const statisticPromises = getStatisticPromises(statisticLinks)

//   try {
//     const schoolStatistics = await pAll(statisticPromises)
//     const stat = schoolStatistics.reduce((acc, cur) => {
//       const result = { ...acc, ...cur }
//       return result
//     }, {})

//     resolve()

//     writeCSVStream.write(
//       parseSchoolData({ ...school, stat })
//     )
//   } catch (e) {
//     reject(e)
//   }
// })

const getSchoolMetrics = async (schoolsData) => {
  const schools = [...schoolsData]
  // const metricPromises = schools.map(school => getMetricsBySchool(school, writeCSVStream))
  // TODO cheecek all schools.length and reesult
  console.log('getSchoolMetrics -> metricPromises.length', schools.length)

  const writeCSVStream = await createDocument()

  try {
    await forker(schools, (schoolsWithStat) => {
      writeCSVStream.write(
        schoolsWithStat.map(school => parseSchoolData(school)).join('')
      )
    })
    // await pAll(metricPromises, { concurrency: 10 })
  } catch (e) {
    return Promise.reject(e)
  } finally {
    writeCSVStream.end()
  }
}

const createDocument = () => {
  try {
    fsp.writeFile('./test.csv', cvsHeader)
    const writeCSVStream = fs.createWriteStream('./test.csv', { flags: 'a' })

    writeCSVStream.on('error', e => {
      console.error('Stream error', e)
    })

    return Promise.resolve(writeCSVStream)
  } catch (e) {
    return Promise.reject(e)
  }
}

;(async () => {
  const start = new Date().getTime()

  try {
    // TODO move to init.js
    const schools = await getAllSchools()
    await getSchoolMetrics(schools)
    console.log('DONE')
  } catch (e) {
    console.error(e)
  }
  console.log('Execution time: ', new Date().getTime() - start)
})()
