// shallow copy ---> same refene 
// deep copy --> not same  refrence 



// types to decalre Array


// type 1 
// const myARR=[1,2,3,4,5,6,7]



// type 2 

// const myarr2=new Array(1,2,3,4)


// console.log(myarr2.length)









// array methods





// 1 push


// it adds the given value  at last index of array

// const myARR=[1,2,3,4,5,6,7]

// myARR.push(5)

// console.log(myARR)


//  2 pop
//  it removes the last element of array 



//   myARR.pop()
//   console.log(myARR)


// 3  unshift 

// it adds  the given  value at first and  also it chnages index of othet elemts 

// generraly we dont use this method


// myARR.unshift(10)

// console.log(myARR)



// 4 shift 

// it   removes thhe  value from  first index 


// myARR.shift()

// console.log(myARR)




// 5 includes --- it is mostly used in dev time

// it checks wheter the given value exist if exits it returns bool if i.e
 // true or false


//  const a =myARR.includes(1)

//  console.log("includes -->",a)




//  6 indexof

// it retuens the index of given value and if value doesntt exit it returns -


// const a  =myARR.indexOf(5)
// const a  =myARR.indexOf(8)

// console.log(a)



// join
// Adds all the elements of an array into a string, 
// separated by the specified separator string.

// in simple terms it also helps to convert array into string by adding  comma 
// 1,2,3,4,5,6,7     

// console.log(myARR.join())


//  7 slice


// so slice returns a part of array it takes 2 input one starting and end point 
// in o/p it doesnt incluse the end point also it doesnt affect the original array


// const a =myARR.slice(1,4)


// console.log(a)


//  8 splice 
//it incluse the edn pont but it affects the original  array menas iit gives us new array 

// const a =myARR.splice(1,4)

// console.log(a)

 



//  9 concat 

// it  combines 2 array abd gives new array


const newarr=[10,11,12,13,14,15,16,17]

// const a=myARR.concat(newarr)

// console.log(a)



// there is one more way to combine 2  array is using spred operator 
// spread operator is commonly used  in dev insted of concat becaause we cab give multiple values



// const b=[...myARR , ...newarr]

// console.log(b)



// Note: There is many more  things to learn about spread operator we will learn later from docs and all


// 10 Flat 


// it is  used when we have multiple array inside a  array we use this ti make them in  single arrayy 
// also in this we need to pass depth also means how much array we need to make in single 
// for eg [1,2,4,[5,6,7],[9,6,4],6]


// in the above one we hhave given the in we have given Infinity but it is not recommended



// always give the depth value based on the number of array we have 



// const sbarray=[1,2,4,[5,6,7],[9,6,4],6]

// const newr=sbarray.flat(Infinity)
// console.log(newr)





// 11 isARRay  ==used in dev

// it check the given thing that it is array or not  and returns bool
//  eg 



// console.log(Array.isArray(myARR))


// 12 From it converts given thing into array 

// const  str ="ayush pandey  is  gamer"

// console.log(Array.from(str))


// Note
// in this we need  to  learn how we can  convert  the key value pair 
// for eg {name:"ayush"}


// 13   Of

// It is also use to convert the given input into arra but we use this when  we have multiple valriable  


// eg 

// let score  =100
// let score2 =101
// let score3=102

// console.log(Array.of(score,score2,score3))




// need to laern more about isarray , from , of , flat ,flapmap , apply and spread 










































// ---------------------------------------------Array practice ---------------------------------------------------------------------------



const items=["apple" , "banana"]

const newitem="mango"


const addeditem=[...items , newitem]

console.log(addeditem)



const users = ["active", "inactive", "active"]





const  a =users.filter( user => user !== "inactive")

console.log(a)




