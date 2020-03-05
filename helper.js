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
  const interval = setInterval(() => {
    console.log('---------------------------------')
    console.log('TCL: pagesCount', data.pagesCount)
    console.log('TCL: statisticsCount', data.statisticsCount)
    console.log('TCL: schoolsCount', data.schoolsCount)
  }, 1000)

  return interval
}
