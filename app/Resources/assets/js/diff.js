/* global $ */

// TODO: DRY this
// takes an array of strings and returns an object where each string of the array
// is a key of the object and the value is the number of occurences of the string in the array
function array_count(list) {
  var obj = {};
  list = list.sort();
  for (var i = 0; i < list.length; ) {
    for (var j = i + 1; j < list.length; j++) {
      if (list[i] !== list[j]) break;
    }
    obj[list[i]] = j - i;
    i = j;
  }
  return obj;
}

/**
 * contents is an array of content
 * content is a hash of pairs code-qty
 */
export function compute_simple(contents) {
  var ensembles = [];
  for (var decknum = 0; decknum < contents.length; decknum++) {
    var cards = [];
    $.each(contents[decknum], function (code, qty) {
      for (var copynum = 0; copynum < qty; copynum++) {
        cards.push(code);
      }
    });
    ensembles.push(cards);
  }

  var conjunction = [];
  for (var i = 0; i < ensembles[0].length; i++) {
    var code = ensembles[0][i];
    var indexes = [i];
    for (var j = 1; j < ensembles.length; j++) {
      var index = ensembles[j].indexOf(code);
      if (index > -1) indexes.push(index);
      else break;
    }
    if (indexes.length === ensembles.length) {
      conjunction.push(code);
      for (var k = 0; k < indexes.length; k++) {
        ensembles[k].splice(indexes[k], 1);
      }
      i--;
    }
  }

  var listings = [];
  for (var l = 0; l < ensembles.length; l++) {
    listings[l] = array_count(ensembles[l]);
  }
  var intersect = array_count(conjunction);

  return [listings, intersect];
}
