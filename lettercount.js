const fs = require('fs')
const _ = require('lodash')

const wordfile = fs.readFileSync('sgb-words.txt', { encoding: 'utf8'})
const matcher = /\w/
const letterMap = {}
_.forEach(wordfile, letter => {
    if(matcher.test(letter)) {        
        letterMap[letter] = (letterMap[letter] ?? 0) + 1
    }
})
const totalLetters = _.reduce(_.entries(letterMap), (sum, entry) => entry[1] + sum, 0)
// console.log(letterMap);
// console.log(`Total: ${totalLetters}`)
// console.log(_.sortBy(_.entries(letterMap), (entry) => entry[1]))
const percentages = _.map(_.entries(letterMap), (entry) => [ entry[0], entry[1] / totalLetters ] );
const percentageReverseOrder = _.reverse(_.sortBy(percentages, (entry) => entry[1]))
// console.log(percentageReverseOrder)
// console.log(_.toUpper(_.reduce(percentageReverseOrder, (sum, entry) => `${sum}${entry[0]}`, '')))
const words = wordfile.split(new RegExp('\n'))
const percentageMap = _.fromPairs(percentages)
const frequencyScore = (word) => _.reduce(word, (sum, letter) => percentageMap[letter] + sum, 0)
const frequencies = _.sortBy(_.map(words, (word) => [word, frequencyScore(word)]), (wordEntry) => wordEntry[1])
// console.log(frequencies)
// console.log(_.filter(frequencies, (entry) => _.uniq(entry[0]).length === 5))

// specs - {
//  exact: array of 5 spaces, contains a letter if there, null if not
//  contains: array of letters contained in the word
//  barred: array of letters not in the word   
// }

const filterMatch = (word, specs) => {
    const regex = _.reduce(specs.exact, (sum, letter) => sum + (letter == null ? '\\\w' : letter), '')
    const exactMatch = new RegExp(regex)
    const includesAllContained = _.reduce(specs.contains, (sum, letter) => sum && _.includes(word, letter), true)
    const excludesAllBarred = _.reduce(specs.barred, (sum, letter) => sum && !_.includes(word, letter), true)
    return exactMatch.test(word) && includesAllContained && excludesAllBarred;
}

const scoreWord = (word, inputWord) => {
    const spec = {
        exact: [],
        contains: [],
        barred: []
    }
    _.forEach(inputWord, (letter, index) => {
        spec.exact[index] = letter == word[index] ? letter : null
        if (_.includes(word, letter)) {
            spec.contains.push(letter)
        } else {
            spec.barred.push(letter)
        }
    })
    return spec
}

const specUnion = (spec1, spec2) => {
    const exact = _.map(spec1.exact, (exactLetter, index) => {
        if (exactLetter != null) return exactLetter;
        if (spec2.exact[index] != null) return spec2.exact[index]
        return null
    })
    const contains = _.uniq(_.concat(spec1.contains, spec2.contains))
    const barred = _.uniq(_.concat(spec1.barred, spec2.barred))
    return ({
        exact,
        contains,
        barred
    })
}

const wordDistance = (goal, guess) => {
    const spec = scoreWord(goal, guess)
    return _.min(_.reduce(spec.exact, (sum, letter) => sum + (letter != 0 ? .2 : 0), 0) +
    spec.contains * .1, 1)
}

const badAtWordle = (goal, guess, possibleWordList, level = 0) => {
    console.log("Step: " + level + "\n  Guess: " + guess)
    if (goal === guess) {
        console.log('  Exact match!')
        return
    }
    const spec = scoreWord(goal, guess)
    let matchingWords = _.filter(possibleWordList, (word) => filterMatch(word, spec))
    const worstWord = _.first(_.sortBy(matchingWords, (word) => wordDistance(goal, word)))
    matchingWords = _.tail(matchingWords)
    console.log("  Matching words: " + matchingWords)
    return badAtWordle(goal, worstWord, matchingWords, level + 1)
}

badAtWordle('fuzzy', 'esses', words)