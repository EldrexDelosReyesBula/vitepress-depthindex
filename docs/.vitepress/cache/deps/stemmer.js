import "./chunk-BUSYA2B4.js";

// node_modules/stemmer/index.js
var step2list = {
  ational: "ate",
  tional: "tion",
  enci: "ence",
  anci: "ance",
  izer: "ize",
  bli: "ble",
  alli: "al",
  entli: "ent",
  eli: "e",
  ousli: "ous",
  ization: "ize",
  ation: "ate",
  ator: "ate",
  alism: "al",
  iveness: "ive",
  fulness: "ful",
  ousness: "ous",
  aliti: "al",
  iviti: "ive",
  biliti: "ble",
  logi: "log"
};
var step3list = {
  icate: "ic",
  ative: "",
  alize: "al",
  iciti: "ic",
  ical: "ic",
  ful: "",
  ness: ""
};
var consonant = "[^aeiou]";
var vowel = "[aeiouy]";
var consonants = "(" + consonant + "[^aeiouy]*)";
var vowels = "(" + vowel + "[aeiou]*)";
var gt0 = new RegExp("^" + consonants + "?" + vowels + consonants);
var eq1 = new RegExp(
  "^" + consonants + "?" + vowels + consonants + vowels + "?$"
);
var gt1 = new RegExp("^" + consonants + "?(" + vowels + consonants + "){2,}");
var vowelInStem = new RegExp("^" + consonants + "?" + vowel);
var consonantLike = new RegExp("^" + consonants + vowel + "[^aeiouwxy]$");
var sfxLl = /ll$/;
var sfxE = /^(.+?)e$/;
var sfxY = /^(.+?)y$/;
var sfxIon = /^(.+?(s|t))(ion)$/;
var sfxEdOrIng = /^(.+?)(ed|ing)$/;
var sfxAtOrBlOrIz = /(at|bl|iz)$/;
var sfxEED = /^(.+?)eed$/;
var sfxS = /^.+?[^s]s$/;
var sfxSsesOrIes = /^.+?(ss|i)es$/;
var sfxMultiConsonantLike = /([^aeiouylsz])\1$/;
var step2 = /^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/;
var step3 = /^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/;
var step4 = /^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/;
function stemmer(value) {
  let result = String(value).toLowerCase();
  if (result.length < 3) {
    return result;
  }
  let firstCharacterWasLowerCaseY = false;
  if (result.codePointAt(0) === 121) {
    firstCharacterWasLowerCaseY = true;
    result = "Y" + result.slice(1);
  }
  if (sfxSsesOrIes.test(result)) {
    result = result.slice(0, -2);
  } else if (sfxS.test(result)) {
    result = result.slice(0, -1);
  }
  let match;
  if (match = sfxEED.exec(result)) {
    if (gt0.test(match[1])) {
      result = result.slice(0, -1);
    }
  } else if ((match = sfxEdOrIng.exec(result)) && vowelInStem.test(match[1])) {
    result = match[1];
    if (sfxAtOrBlOrIz.test(result)) {
      result += "e";
    } else if (sfxMultiConsonantLike.test(result)) {
      result = result.slice(0, -1);
    } else if (consonantLike.test(result)) {
      result += "e";
    }
  }
  if ((match = sfxY.exec(result)) && vowelInStem.test(match[1])) {
    result = match[1] + "i";
  }
  if ((match = step2.exec(result)) && gt0.test(match[1])) {
    result = match[1] + step2list[match[2]];
  }
  if ((match = step3.exec(result)) && gt0.test(match[1])) {
    result = match[1] + step3list[match[2]];
  }
  if (match = step4.exec(result)) {
    if (gt1.test(match[1])) {
      result = match[1];
    }
  } else if ((match = sfxIon.exec(result)) && gt1.test(match[1])) {
    result = match[1];
  }
  if ((match = sfxE.exec(result)) && (gt1.test(match[1]) || eq1.test(match[1]) && !consonantLike.test(match[1]))) {
    result = match[1];
  }
  if (sfxLl.test(result) && gt1.test(result)) {
    result = result.slice(0, -1);
  }
  if (firstCharacterWasLowerCaseY) {
    result = "y" + result.slice(1);
  }
  return result;
}
export {
  stemmer
};
//# sourceMappingURL=stemmer.js.map
