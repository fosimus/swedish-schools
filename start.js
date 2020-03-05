const pAll = require('p-all')
const got = require('got')
const xlsx = require('node-xlsx')
const fs = require('fs')
const path = require('path')

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
    throw new Error(`Err: ${e}`)
  }
}

const getSchoolValues = school => {
  // TODO fix
  const data = school &&
  school.stat &&
  school.stat['gr-statistics'] &&
  school.stat['gr-statistics'].averageGradesMeritRating9thGrade &&
  school.stat['gr-statistics'].averageGradesMeritRating9thGrade.schoolValues &&
  school.stat['gr-statistics'].averageGradesMeritRating9thGrade.schoolValues[0] &&
  school.stat['gr-statistics'].averageGradesMeritRating9thGrade.schoolValues[0].value
  return data
}

const getSchoolAddress = school => {
  const data = school &&
  school.stat &&
  school.stat.self &&
  school.stat.self.contactInfo &&
  school.stat.self.contactInfo.addresses &&
  school.stat.self.contactInfo.addresses[0]
  return data
}

const getStatisticPromises = links => Object.keys(links)
  .map(linkKey => () => new Promise(async (resolve, reject) => {
    statisticsCount++
    try {
      const schoolData = await got(links[linkKey]).json()

      resolve({ [linkKey]: schoolData })
    } catch (e) {
      reject(e)
      // TODO add reject for all and test
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
    // TODO test with reject or throw
    throw new Error(`Err: ${e}`)
  }
}

const getGrades = school => ({
  g6sve: school.stat['gr-statistics']?.averageResultNationalTestsSubjectSVE6thGrade?.schoolValues[0]?.value,
  g6eng: school.stat['gr-statistics']?.averageResultNationalTestsSubjectENG6thGrade?.schoolValues[0]?.value,
  g6mat: school.stat['gr-statistics']?.averageResultNationalTestsSubjectMA6thGrade?.schoolValues[0]?.value,
  g6sva: school.stat['gr-statistics']?.averageResultNationalTestsSubjectSVA6thGrade?.schoolValues[0]?.value,
  g9sve: school.stat['gr-statistics']?.averageResultNationalTestsSubjectSVE9thGrade?.schoolValues[0]?.value,
  g9eng: school.stat['gr-statistics']?.averageResultNationalTestsSubjectENG9thGrade?.schoolValues[0]?.value,
  g9mat: school.stat['gr-statistics']?.averageResultNationalTestsSubjectMA9thGrade?.schoolValues[0]?.value,
  g9sva: school.stat['gr-statistics']?.averageResultNationalTestsSubjectSVA9thGrade?.schoolValues[0]?.value,
  g6pas: school.stat['gr-statistics']?.ratioOfPupilsIn6thGradeWithAllSubjectsPassed?.schoolValues[0]?.value,
  g9pas: school.stat['gr-statistics']?.ratioOfPupilsIn9thGradeWithAllSubjectsPassed?.schoolValues[0]?.value,
  progYR: school.stat['gr-statistics']?.ratioOfPupils9thGradeEligibleForNationalProgramYR?.schoolValues[0]?.value
})

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
  // TODO remove fsk F(0) gr F(1-6) grs F(1-9) for 92347699

  schools.map(school => {
    const address = getSchoolAddress(school)
    const grades = getGrades(school)
    const type = school.typeOfSchooling.reduce((a, c) => {
      const schoolYears = c.schoolYears.length <= 1 ? c.schoolYears : `${c.schoolYears[0]}-${c.schoolYears[c.schoolYears.length - 1]}`
      return `${a}${c.code} F(${schoolYears}) `
    }, '')

    data.push([
      `https://utbildningsguiden.skolverket.se/skolenhet?schoolUnitID=${school.code}`,
      getSchoolValues(school),
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
    console.log('Schools document created!')
  })
}

const timer = () => {
  const interval = setInterval(() => {
    console.log('---------------------------------')
    console.log('TCL: pagesCount', pagesCount)
    console.log('TCL: statisticsCount', statisticsCount)
    console.log('TCL: schoolsCount', schoolsCount)
  }, 1000)

  return interval
}

;(async () => {
  const interval = timer()
  try {
    const schools = await getAllSchools()
    const schoolsWithMetrics = await getSchoolMetrics(schools)

    createDocument(schoolsWithMetrics)
  } catch (e) {
    console.log(e)
  }
  clearInterval(interval)
})()
