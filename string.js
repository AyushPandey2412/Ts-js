// const str="ayush pandey  -----";


// console.log(str.includes("a"))

// console.log(str.startsWith("Q"))


// console.log(str.indexOf("A"))



// const uppserchars=Array.from(str,c => c.toUpperCase())


// // console.log(uppserchars)


// console.log(str.replace(/a/g,"r"))
// // console.log(str.replaceAll("----","coder"))





// console.log(str.split())








// const header="auth=bearer=token123=extra"

// // console.log(header.split("=",2))


// const [key,firstval]=header.split("=",2)

// console.log(key,firstval)



// // question 1
// const str="Ayush Pandey"
// const strlast=str.length-1
// let reversed=""

// for (let i=strlast; i>=0; i--){
// reversed+=str[i];


// }

// console.log(reversed)




// question  2



// const str='Cloud Storage Platform'
// let count=0


// for (let i=0; str[i]!== undefined;  i++){
// count++;
// }

// console.log(count)

// let word=""
// let result=""
// for(i=str.length-1; i>=0; i--){

//     if(str[i]!== ' '){
//    word=str[i]+word
//     }

//     else{

//     result=result+word+" "

//     word=""
//     }

// }
// result=result+word

// console.log(result)

// o/p
// Platform StoragePlatform CloudStoragePlatform




const str = "Javascript";

let str2 = 0;

for (let i = 0; i < str.length; i++) {

    if (
        str[i] === "a" ||
        str[i] === "e" ||
        str[i] === "i" ||
        str[i] === "o" ||
        str[i] === "u"
    ) {
        continue;
    }

    str2++;
}

console.log(str2);








