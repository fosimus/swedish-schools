export const getPageLink = page => `https://utbildningsguiden.skolverket.se/appresource/4.5773086416b1c2d84ca134/12.5406806016b70e49d5e2f79/?page=${page}&svAjaxReqParam=ajax`
// only Stockholm export const getPageLink = page => `https://utbildningsguiden.skolverket.se/appresource/4.5773086416b1c2d84ca134/12.5406806016b70e49d5e2f79/?page=${page}&namn=&omrade=01&skolform=&arskurser=0%2C1%2C2%2C3%2C4%2C5%2C6%2C7%2C8%2C9%2C10&organisationsform=&svAjaxReqParam=ajax`

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

export const parseSchoolData = school => {
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
  '"Year 9: Average credit value",',
  '"F6 English",',
  '"F6 Mathematics",',
  '"F6 Swedish",',
  '"F9 English",',
  '"F9 Mathematics",',
  '"F9 Swedish",',
  '"Year 6: Percentage of students with approved grades in all subjects",',
  '"Year 9: Percentage of students with approved grades in all subjects",',
  '"Enrolled in upper secondary school, vocational program"\n'
].join('')
