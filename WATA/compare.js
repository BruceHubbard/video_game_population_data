#!/usr/bin/env node

const dataSets = ['WATA_2023_JUNE', 'WATA_2023_DECEMBER']

const platforms = {
    '32x': { name: 'Sega 32x' },
    '2600': { name: 'Atari 2600', hasCIB: true },
    '5200': { name: 'Atari 5200' },
    '7800': { name: 'Atari 7800' },
    'colecovision': { name: 'Colecovision' },
    'dreamcast': { name: 'Dreamcast' },
}

const fs = require('fs')
const gradeMap = {
    'grade_100': '10.0',
    'grade_98': '9.8',
    'grade_96': '9.6',
    'grade_94': '9.4',
    'grade_92': '9.2',
    'grade_90': '9.0',
    'grade_85': '8.5',
    'grade_80': '8.0',
    'grade_75': '7.5',
    'grade_70': '7.0',
    'grade_65': '6.5',
    'grade_below_65': '<6.5',
}
const allGrades = Object.keys(gradeMap)
const wrapperGradeMap = {
    'a_plus_plus': 'A++',
    'a_plus': 'A+',
    'a': 'A',
    'b_plus': 'B+',
    'b': 'B',
    'c_plus': 'C+',
    'c': 'C',
}
const allWrapperGrades = Object.keys(wrapperGradeMap)

// A place to store all of the populations we read and the changes that have happened
const platformPopulations = {

}

const pKeys = Object.keys(platforms)
for (let i = 0; i < pKeys.length; i++) {
    const currentPlatform = pKeys[i]
    const oldData = JSON.parse(fs.readFileSync(`./${dataSets[0]}/pop_report_${currentPlatform}_sealed.json`, 'utf8')).populations

    const newData = JSON.parse(fs.readFileSync(`./${dataSets[1]}/pop_report_${currentPlatform}_sealed.json`, 'utf8')).populations

    const variantChanges = detectBoxVariantPopChanges(oldData, newData)

    const oldTotalGraded = getTotalGraded(oldData)
    const newTotalGraded = getTotalGraded(newData)

    platformPopulations[currentPlatform] = {
        oldData,
        newData
    }

    console.log('-----------------------')
    console.log(`--  Data for ${platforms[currentPlatform].name}`)
    console.log('-----------------------')
    console.log(`\nTotal graded went from ${oldTotalGraded} to ${newTotalGraded}`)
    console.log('\nVariant Changes:')
    console.log(variantChanges.map(vc => `  ${vc.title}\n${vc.changes.map(c => `    -- ${gradeMap[c.grade]}/${wrapperGradeMap[c.wrapperGrade]} CHANGED FROM ${c.oldPop} TO ${c.newPop}`).join('\n')}`).join('\n'))
    
}

/* this takes in a sealed population array like this:

    "grade_96": [
        {
          "a_plus": 2
        },
        {
          "a": 1
        }
      ],

  and returns a better structure like this:

  {
    'a_plus': 2,
    'a': 1
  }
*/
function fixSealedPopulation(popArray) {
    if (!popArray) { return {} }
    const pops = {}

    for (let i = 0; i < popArray.length; i++) {
        for(grade in popArray[i]) {
            // if it doesn't exist yet create it
            if (!pops[grade]) {
                pops[grade] = 0
            }

            pops[grade] += popArray[i][grade]
        }
    }

    return pops
}

function getTotalGraded(popData) {
    let total = 0

    for (let i = 0; i < popData.length; i++) {
        total += popData[i].total
    }

    return total
}

function detectBoxVariantPopChanges(oldData, newData) {
    const allChanges = []
    // first go through all of the oldData and look for changes to those populations in the new data
    for (let i = 0; i < oldData.length; i++) {
        const current = oldData[i]
        const updated = newData.find(g => g.title === current.title && g.box_variant === current.box_variant)
        // We'll output this several places so create a variable for it
        const title = `${current.title}${current.box_variant && ` / ${current.box_variant}`}`
        let hasChanged = false
        const changeObj = { title, changes: [] }
        const logs = []

        // if we don't find a match that most likely means they've updated the box_variant
        //    or a game went from upgraded to graded (and they updated the box_variant)
        //      when we find these we should update the data so they match
        if (!updated) {
            console.error(`POPULATION DELETED OR NOT FOUND: ${title}`)
            // stop processing and make the user fix the data
            process.exit(1)
        }

        logs.push(title)

        if (current.total === 0 && updated.total === 0) {
            // previously not graded and still not graded so skip
            // console.log(`not graded: ${title}`)
            continue
        }

        // if (current.total !== updated.total) {
        //     hasChanged = true
        //     logs.push(`-- TOTAL changed from ${current.total} to ${updated.total}`)
        // }

        // Grab all of the grades declared in the old and new data in order
        const gradesToCheck = allGrades.filter(g => Object.keys(current).includes(g) || Object.keys(updated).includes(g))

        for(let g = 0; g < gradesToCheck.length; g++) {
            const gradeToCheck = gradesToCheck[g]

            // TODO: Add a check here to see if we're dealing with sealed vs non-sealed

            // the data is strange here, they use an array of objects each with one 
            //  property (the wrapper grade) instead of just key/grade.  So fix the data
            const fixedOldPop = fixSealedPopulation(current[gradeToCheck])
            const fixedNewPop = fixSealedPopulation(updated[gradeToCheck])
            // console.log(fixedOldPop, fixedNewPop)
            
            // for sealed now loop through the wrapper grades and compare
            allWrapperGrades.forEach(wrapperGrade => {
                if (fixedOldPop[wrapperGrade] !== fixedNewPop[wrapperGrade]) {
                    changeObj.changes.push({
                        grade: gradeToCheck,
                        wrapperGrade,
                        oldPop: fixedOldPop[wrapperGrade] || 0,
                        newPop: fixedNewPop[wrapperGrade]
                    })
                    // hasChanged = true
                    // logs.push(`  -- ${gradeMap[gradeToCheck]}/${wrapperGradeMap[wrapperGrade]} CHANGED FROM ${fixedOldPop[wrapperGrade] || 0} to ${fixedNewPop[wrapperGrade]}`)
                }
            })
        }

        // if (hasChanged) {
        //     console.log(logs.join('\n'))
        // }
        if (changeObj.changes.length > 0) {
            allChanges.push(changeObj)
        }
        // console.log(`${title}: ${gradesToCheck}`)

    }

    return allChanges
}