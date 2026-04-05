// for (let i = 1; i <= 5; i++) {
//   console.log("\nOuter Loop i =", i, " → starting new row");

//   let row = "";

//   for (let j = 1; j <= i; j++) {
//     console.log("   Inner Loop j =", j, " → adding star");

//     row += "*";
//     console.log("   Current row =", row);
//   }

//   console.log("Row completed →", row);
// }

















// console.log(strlength)
let str="I love Programming"

let reversedword="";
let splitwords=str.split(" ")
for (let i=splitwords.length-1; i>=0; i--){

  reversedword+=splitwords[i] + " "
}

console.log(reversedword)









