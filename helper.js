import got from 'got'
import pAll from 'p-all'
// TODO maybe slipt the doc into two parts: help and parse?
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

    resolve({ ...school, stat })
  } catch (e) {
    reject(e)
  }
})

const getStatisticPromises = links => Object.keys(links)
  .map(linkKey => () => new Promise(async (resolve, reject) => {
    try {
      const schoolData = await got(links[linkKey]).json()

      resolve({ [linkKey]: schoolData })
    } catch (e) {
      reject(e)
    }
  }))

export const parseSchoolData = school => {
  // TODO proper names in Swedish
  const address = getSchoolAddress(school)
  const grades = getGrades(school)
  const type = school.typeOfSchooling.reduce((a, c) => {
    const schoolYears = c.schoolYears.length <= 1
      ? c.schoolYears
      : `${c.schoolYears[0]}-${c.schoolYears[c.schoolYears.length - 1]}`
    return `${a}${c.code} F(${schoolYears}) `
  }, '')

  return [
    `"https://utbildningsguiden.skolverket.se/skolenhet?schoolUnitID=${school.code}",`,
    `"${school.name || ''}",`,
    `"${address.street} ${address.zipCode} ${address.city}",`,
    `"${type}",`,
    `"${getSchoolScore(school) || ''}",`,
    `"${grades.g6eng || ''}",`,
    `"${grades.g6mat || ''}",`,
    `"${grades.g6sve || ''}",`,
    `"${grades.g9eng || ''}",`,
    `"${grades.g9mat || ''}",`,
    `"${grades.g9sve || ''}",`,
    `"${grades.g6pas || ''}",`,
    `"${grades.g9pas || ''}",`,
    `"${grades.progYR || ''}"\n`
  ].join('')
}

export const cvsHeader = [
  '"Link",',
  '"School name",',
  '"Address",',
  '"School type",',
  '"Åk 9: Genomsnittligt meritvärde",',
  '"F6 English",',
  '"F6 Mathematics",',
  '"F6 Swedish",',
  '"F9 English",',
  '"F9 Mathematics",',
  '"F9 Swedish",',
  '"Åk 6: Andel elever med godkända betyg i alla ämnen",',
  '"Åk 9: Andel elever med godkända betyg i alla ämnen",',
  '"Behöriga till gymnasieskolan, yrkesprogram"\n'
].join('')
