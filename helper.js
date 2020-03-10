import got from 'got'
import pAll from 'p-all'

export const getSchoolScore = school =>
  school?.stat['gr-statistics']?.averageGradesMeritRating9thGrade?.schoolValues[0]?.value

export const getSchoolAddress = school => school?.stat?.self?.contactInfo?.addresses[0]

export const getGrades = school => ({
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

export const timer = (data) => {
  console.log('---------------------------------')
  console.log('pagesCount', data.pagesCount)
  console.log('statisticsCount', data.statisticsCount)
  console.log('schoolsCount', data.schoolsCount)
}

// TODO eslint not used arg?
export const runMetricsBySchool = (school, i) => new Promise(async (resolve, reject) => {
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

    resolve(stat)
  } catch (e) {
    reject(e)
  }
})

export const getStatisticPromises = links => Object.keys(links)
  .map(linkKey => () => new Promise(async (resolve, reject) => {
    try {
      const schoolData = await got(links[linkKey]).json()

      resolve({ [linkKey]: schoolData })
    } catch (e) {
      reject(e)
    }
  }))
