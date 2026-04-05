// using rest in function when we have many inputs like 200 , 300 ,400 


// ...num1  this is a rest operatpr 

// case 1



// function multipleinput(...num1){
//     return num1
// }


// console.log(multipleinput(100,200,300))


// and o/p is always in arrays[ 100, 200, 300 ]



// case :2


// function multipleinput(val1,val2,...num1){
//     return num1
// }


// console.log(multipleinput(100,200,300))



// case 3: passing object in function 

// this is simple in. this there is many problem we can do many things like data and type checking

// const user={
// name:"ayush",
// email:"12@",
// age:888
// }



// function handelobject(objectx){
// console.log(`this is user is great his name is ${objectx.name} and email is ${objectx.email}`)
// }

 
// handelobject(user)





// case 4: passing array in function 


// const mynewarray=[100,22,222,2121]

// function handelarray(getarray){
//  return getarray
// }



// console.log(handelarray(mynewarray))
















// this and arrow function


const user={
    uname:"ayush",
    age:22,


    welcomemessage:function(){
//  console.log(`${this.name}`)
 console.log(`${this.uname}`)
    }
}



user.welcomemessage()


