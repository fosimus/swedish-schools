import pAll from 'p-all'
import got from 'got'
import xlsx from 'node-xlsx'
import fs from 'fs'
import { timer, getSchoolAddress, getSchoolScore, getGrades } from './helper'

const getPageLink = page => `https://utbildningsguiden.skolverket.se/appresource/4.5773086416b1c2d84ca134/12.5406806016b70e49d5e2f79/?page=${page}&namn=&omrade=01&skolform=&arskurser=0%2C1%2C2%2C3%2C4%2C5%2C6%2C7%2C8%2C9%2C10&organisationsform=&svAjaxReqParam=ajax`
const headers = { 'X-Requested-With': 'XMLHttpRequest' }
const TIMEOUT = 120000
const OPT = 50

let pagesCount = 0
let schoolsCount = 0
let statisticsCount = 0

const getPagePromises = pagination =>
  Array(pagination.totalPages)
    .fill(null)
    .map((_, index) => () => new Promise(async (resolve, reject) => {
      pagesCount++
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

const getStatisticPromises = links => Object.keys(links)
  .map(linkKey => () => new Promise(async (resolve, reject) => {
    statisticsCount++
    try {
      const schoolData = await got(links[linkKey]).json()

      resolve({ [linkKey]: schoolData })
    } catch (e) {
      reject(e)
    }
  }))

const getMetricsBySchool = school => () => new Promise(async (resolve, reject) => {
  schoolsCount++
  let statisticLinks
  const statisticHref = school._links.statistics.href

  try {
    const { _links } = await got(statisticHref).json()

    statisticLinks = _links
  } catch (e) {
    reject(e)
  }

  const statisticPromises = getStatisticPromises(statisticLinks)

  try {
    const schoolStatistics = await pAll(statisticPromises)
    const stat = schoolStatistics.reduce((acc, cur) => {
      const result = { ...acc, ...cur }
      return result
    }, {})

    resolve({ ...school, stat })
  } catch (e) {
    reject(e)
  }
})

const getSchoolMetrics = async schools => {
  const metricPromises = schools.map(school => getMetricsBySchool(school))

  try {
    const schoolWithMetrics = await pAll(metricPromises, { concurrency: OPT })
    return schoolWithMetrics
  } catch (e) {
    return Promise.reject(e)
  }
}

const createDocument = schools => {
  const data = [[
    // TODO proper names in Swedish
    'Link',
    'Åk 9: Genomsnittligt meritvärde',
    'School name',
    'Address',
    'School type',
    'F6 English',
    'F6 Mathematics',
    'F6 Swedish',
    'F9 English',
    'F9 Mathematics',
    'F9 Swedish',
    'Åk 6: Andel elever med godkända betyg i alla ämnen',
    'Åk 9: Andel elever med godkända betyg i alla ämnen',
    'Behöriga till gymnasieskolan, yrkesprogram'
  ]]

  schools.map(school => {
    const address = getSchoolAddress(school)
    const grades = getGrades(school)
    const type = school.typeOfSchooling.reduce((a, c) => {
      const schoolYears = c.schoolYears.length <= 1 ? c.schoolYears : `${c.schoolYears[0]}-${c.schoolYears[c.schoolYears.length - 1]}`
      return `${a}${c.code} F(${schoolYears}) `
    }, '')

    data.push([
      `https://utbildningsguiden.skolverket.se/skolenhet?schoolUnitID=${school.code}`,
      getSchoolScore(school),
      school.name,
      `${address.street} ${address.zipCode} ${address.city}`,
      type,
      grades.g6eng,
      grades.g6mat,
      grades.g6sve,
      grades.g9eng,
      grades.g9mat,
      grades.g9sve,
      grades.g6pas,
      grades.g9pas,
      grades.progYR
    ])
  })

  const buffer = xlsx.build([{ name: 'schools', data }])

  fs.writeFile('./new-schools.xlsx', buffer, e => {
    if (e) throw e
    console.log('Document created!')
  })
}

;(async () => {
  const interval = setInterval(() => {
    timer({ pagesCount, statisticsCount, schoolsCount })
  }, 1000)

  try {
    const schools = await getAllSchools()
    const schoolsWithMetrics = await getSchoolMetrics(schools)

    createDocument(schoolsWithMetrics)
  } catch (e) {
    console.log(e)
  }
  clearInterval(interval)
})()
