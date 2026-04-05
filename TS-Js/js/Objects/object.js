// objects




// freeze --->  if we use this we cannot chnage the objects value 

// syntax
// object.freeze(user)

// const user ={
//     name :"hemla",
//     age:23,
//     email:"hemla23@gmail.com",
//     role:"admin",
    
//     permissions:{
//         read:"true",
//         write:"false",
//         delete:"false"
//     }
// }


// function haspermission(user , permission){
//     return user.permissions[permission]
// }

// console.log(user.name)
// console.log(user["name"])


// console.log(haspermission(user,"read"))









// const user1 = {
//   name: "Hemla",
//   role: "admin",
//   settings: {
//     theme: "light",
//     notifications: true,
//     language: "en"
//   }
// };



// const user1 = {
//   name: "Hemla",
//   sections: {
//     profile: { visible: true },
//     settings: { visible: false },
//     billing: { visible: true }
//   }
// };


// function issectionvisible(user1, sectionname){
//     if(!user1.sections?.[sectionname]){
//      return "section not found"
//     }
//     else if(user1.sections[sectionname].visible){

        
//         return "visible"
//     }else {
//         return "hidden"
//     }
// }



// function sectionupdate(user1,sectionname,newval){
//     if(!user1.sections?.[sectionname]){
//      return "section not found"
//     }
    
//     let a1=user1.sections[sectionname].visible=newval
    
//     return a1
// }


// console.log(sectionupdate(user1,"settings","false"))

// console.log(issectionvisible(user1,"settings"))

// function getuserfield(user1 ,setting,newval){
//     return user1[setting]=newval
// }

// console.log(getuserfield(user1 ,"theme", "dark"))

// // getUserField(user, "name");   // "Hemla"
// // getUserField(user, "email");  // "hemla23@gmail.com"
// // getUserField(user, "age");    // "Not Found"


























// const user ={
//     name :"hemla",
//     age:23,
//     email:"hemla23@gmail.com",
//     role:"admin",
    
//     permissions:{
//         read:"true",
//         write:"false",
//         delete:"false"
//     }
// }



// user.greeting=function(){
//     console.log("hemlo")
// }
// user.greetingtwo=function(){
//     console.log(`heloo js user, ${this.name}`)
// }

// console.log(user.greetingtwo())












// more about objects



// singleton and literal object 



// | Feature   | Object Literal        | Singleton                   |
// | --------- | --------------------- | --------------------------- |
// | Creation  | `{}`                  | Constructor / shared object |
// | Instances | New object every time | One shared instance         |
// | Memory    | Separate              | Same reference              |
// | Usage     | Normal objects        | Global/shared state         |






//  1 litreal object

// An object literal is when you create an object directly using {}.


// const user = {
//   name: "Hemla",
//   role: "admin"
// };




// 2 Singleton Object



// const user = new Object();

// user.name = "Hemla";
// user.role = "admin";


// -------------- object method----------



// const user ={
//     name :"hemla",
//     age:23,
//     email:"hemla23@gmail.com",
//     role:"admin",
    
//     permissions:{
//         read:"true",
//         write:"false",
//         delete:"false"
//     }
// }


// const objec1={1:"a" , 2:"b"}
// const objec2={3:"c" , 4:"d "}



// const obj3=Object.assign({},objec1,objec2)


// // assign it adds  combine 2 objects

                                                                                                                                                                                                                        


// console.log(obj3)



//  2) keys ---it returns all of keys of an object


// console.log(Object.keys(user))





//  3) keys ---it returns all of values of an object

// console.log(Object.values(user))



//  4) keys --- it converts all in into array and key value is also in array 

// console.log(Object.entries(user))


// 5) hasown

// console.log(Object.hasOwn(user,'name'))

// [
//   [ 'name', 'hemla' ],
//   [ 'age', 23 ],
//   [ 'email', 'hemla23@gmail.com' ],
//   [ 'role', 'admin' ],
//   [ 'permissions', { read: 'true', write: 'false', delete: 'false' } ]
// ]

// 6) In check --- Is this key anywhere on this object

// if object. is undefined. we will get true and empty false

// console.log("name" in user)










// Object.keys(), Object.values(), Object.entries()

// These methods let you turn an object into arrays so you can loop, validate, and process data dynamically.

// Assume:

// const user = {
//   name: "hemla",
//   age: 23,
//   email: "hemla23@gmail.com",
//   role: "admin"
// };

// 1️⃣ Object.keys(obj)

// Returns an array of all keys:

// Object.keys(user);


// Output:

// ["name", "age", "email", "role"]


// Use cases:

// Validate allowed fields

// Count fields

// Loop through keys

// Example (backend validation):

// const allowed = ["name", "age", "email"];
// const incoming = { name: "A", age: 20, role: "admin" };

// const invalid = Object.keys(incoming).filter(
//   key => !allowed.includes(key)
// );

// // invalid → ["role"]

// 2️⃣ Object.values(obj)

// Returns an array of all values:

// Object.values(user);


// Output:

// ["hemla", 23, "hemla23@gmail.com", "admin"]


// Use cases:

// Check if any value is empty

// Run validations on values

// Example:

// const hasEmpty = Object.values(user).some(v => v === "");

// 3️⃣ Object.entries(obj)

// Returns an array of [key, value] pairs:

// Object.entries(user);


// Output:

// [
//   ["name", "hemla"],
//   ["age", 23],
//   ["email", "hemla23@gmail.com"],
//   ["role", "admin"]
// ]


// This is perfect for looping:

// for (const [key, value] of Object.entries(user)) {
//   console.log(key, value);
// }


// Backend use:

// const cleaned = {};

// for (const [k, v] of Object.entries(user)) {
//   if (v != null) cleaned[k] = v;
// }






// deleteting an Object

// we can also use Delete method but it is not good one 
// const user ={
//     name :"hemla",
//     age:23,
//     email:"hemla23@gmail.com",
//     role:"admin",
    
//     permissions:{
//         read:"true",
//         write:"false",
//         delete:"false"
//     }
// }


// const {role, ...safeuser}=user

// console.log(safeuser)



// and want to keep the key and need to delete the value we can use null or undefined


// user.role=undefined



// console.log(user)






// Object Copying & Immutability (Reference vs Copy)



// Object are stored in heap memory so changeing one object changes the original onne also 
// Objects live in heap memory Variables store only a reference (address)


// always use shallow copy insted of direct ref og real object


//  we can use object.assing also 

// const user ={
//     name :"hemla",
//     age:23,
//     email:"hemla23@gmail.com",
//     role:"admin",
    
//     permissions:{
//         read:"true",
//         write:"false",
//         delete:"false"
//     }
// }


// const refrence1= user;


// refrence1.age=22;


// console.log("=====real object", user)
// console.log("====refone",refrence1)





// shallowcopy


// const copy = { ...user };
// copy.age = 22;



// console.log(user); 
// console.log(copy);


// creates a new outer object, but the inner objects are still shared.Copies only the first layer of the objectDoes not copy nested objects


// copy.permissions.read="kal ana kal"

// console.log(user); 
// console.log(copy);



// one solution for above is this one 
// When you want to change something inside a nested object, you must also copy that nested object.

// we use this for most time in dev

// const updated = {
//   ...user,                      // copy outer object
//   permissions: {
//     ...user.permissions,        // copy inner object
//     read: "false"               // change only this
//   }
// };


// second solution is we can use "structuredClone" this does not chhanges anything in real object


// const copy2= structuredClone(user)

// copy2.permissions.read="false"

// console.log(user)
// console.log("copy2",copy2)









// Concept 8: Objects Inside Arrays




// This is where real-world backend logic starts.

// You’ll learn how to:

// Find an object by id

// Update one object inside an array immutably

// Delete an object from an array

// Filter objects by a field

// Check conditions across objects (any / all)

// Sort objects by a property







// const users = [
//   { id: 1, name: "A", active: true },
//   { id: 2, name: "B", active: false }
// ];

// find user with id 2
// update user 1 name to "AA" without mutating
// remove user with id 2
// get only active users



// Find one object

// const user=users.find(u => u.id ===2)
// console.log(user)


// Filter objects

// const activeUsers = users.filter(u => u.active);


// console.log(activeUsers)


// Delete one object (immutable)
// const id=1
// const withoutB = users.filter(u => u.id !== id);

// console.log("delete",withoutB)




// Update one object (immutable)

// const updated = users.map(u =>
//   u.id === 1 ? { ...u, name: "AA" } : u
// );



// Concept 9: Object Transformation (API Shaping)


// const user = {
//   _id: "abc",
//   name: "A",
//   email: "a@x.com",
//   password: "secret",
//   __v: 0
// };

// // API should return:
// {
//   id: "abc",
//   name: "A",
//   email: "a@x.com"
// }










// OBJECTS — CONCEPT 9
// Object Transformation (API Shaping)

// In real backend work, you almost never send the raw object directly.
// You reshape it before returning it.

// Example raw data (from DB):

// const user = {
//   _id: "abc123",
//   name: "A",
//   email: "a@x.com",
//   password: "secret",
//   __v: 0
// };


// What your API should return:

// {
//   id: "abc123",
//   name: "A",
//   email: "a@x.com"
// }


// So we need to:

// Remove password

// Remove __v

// Rename _id → id

// 1️⃣ Remove unwanted fields
// const { password, __v, ...safe } = user;


// Now safe is:

// {
//   _id: "abc123",
//   name: "A",
//   email: "a@x.com"
// }

// 2️⃣ Rename keys while building response
// const response = {
//   id: safe._id,
//   name: safe.name,
//   email: safe.email
// };


// Final result:

// {
//   id: "abc123",
//   name: "A",
//   email: "a@x.com"
// }


// This is what we return from API.

// 3️⃣ Shorter, real-world pattern

// In production code, this is often written as:

// function toUserResponse(user) {
//   const { password, __v, _id, ...rest } = user;

//   return {
//     id: _id,
//     ...rest
//   };
// }


// Usage:

// const apiUser = toUserResponse(user);

// Why this matters

// Never leak sensitive fields

// Keep API clean and consistent

// Decouple DB structure from API

// Easier frontend integration



// How to compare objects by value

// Using JSON.stringify (for plain objects)

// function isEqual(o1, o2) {
//   return JSON.stringify(o1) === JSON.stringify(o2);
// }








// Object Control
// Object.freeze() and Object.seal()

// These are used to protect objects from accidental changes.

// They answer questions like:

// “I don’t want anyone to modify this config object.”

// “This object should not change at runtime.”

// “Prevent bugs from accidental mutation.”

// 1️⃣ Object.freeze(obj)
// const config = {
//   apiUrl: "https://api.app.com",
//   timeout: 5000
// };

// Object.freeze(config);

// config.timeout = 10000; 
// config.newKey = "x";    


// After freeze:

// You cannot change values

// You cannot add new keys

// You cannot delete keys

// In strict mode, JS throws an error.
// Otherwise, it silently ignores.

// Use it for:

// Config objects

// Constants

// Shared global objects

// 2️⃣ Object.seal(obj)
// const user = {
//   name: "A",
//   age: 20
// };

// Object.seal(user);

// user.age = 21;      
// user.city = "NY"; 
// delete user.name;  


// After seal:

// You can change existing values

// You cannot add or delete keys

// Use it when:

// Structure must stay fixed

// Values can still change















// object questions


// const user = {
//   id: 1,
//   name: "A",
//   email: "a@x.com",
//   password: "secret",
//   token: "abc123"
// };



// // const {password,token,  ...safeuser}=user


// // console.log(safeuser)




// const updatedFiled=(anyobject,key,vals)=>{



// // const a = anyobject[key]=vals
// // console.log(a)
// // return a


// return {
//     ...anyobject, [key]:vals
// }


// }


// const newuser=updatedFiled(user,"name","dhaniya")


// console.log(newuser)








// const user = {
//   name: "A",
//   settings: {
//     theme: "light",
//     notifications: true
//   }
// }




// const safeUpdate={
//   ...user,settings:{
//     ...user.settings, theme:"dark"
//   }
// }



// console.log(safeUpdate)


// const user = {
//   name: "A",
//   settings: {
//     theme: "light",
//     notifications: true
//   }
// }



// const haspermission=(objectx , keys)=>{
 

//   const a =objectx[keys]

// console.log(a)
//   return a
// }


// haspermission(user,"name")

// const data = {
//   name: "A",
//   email: null,
//   age: 20,
//   city: undefined
// };


// // console.log()



// const  a =Object.entries(data).filter(([_ , v])=>v !=null)

// const b =Object.fromEntries(a)



// console.log(b)





// const data = {
//   name: "A",
//   email: null,
//   age: 20,
//   city: undefined
// };

// const a = Object.entries(data).filter(([_, v]) => v != null);
// const b = Object.fromEntries(a);

// console.log(b);



const dbUser = {
  _id: "abc",
  name: "A",
  email: "a@x.com"
};



const reshape={
  id:dbUser._id,
    name: dbUser.name,
  email: dbUser.email

}


console.log(reshape)