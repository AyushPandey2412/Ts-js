// // Prototype in js is an entity having state and behavior(properties and method)

// // js object have special property callled Prototype
// // we can set Prototype using  __protot__


// // if object & prototype have same method objects method will be used  




// // creating a prototype



// // const user={
// //     greet(){
// //         console.log("hello")
// //     }
// // }


// // const admin={role:"admin"}


// // admin.__proto__=user


// // admin.greet()








// // class and objects



// // class myclass{

// // constructor(brand){

// //     this.brand=brand
// //     console.log(this.brand)
// // }

// //     start(){
// //         console.log("stat")
// //     } 

// //     newbrand(brand){
// //   this.new2=brand
// //   console.log(this.new2)
// //     }
// // }



// // let myobj=new myclass("Abhay maske"); 

// // console.log(typeof myobj)


// // myobj.start()
// // myobj.newbrand("hemlp")





// // extends keyword is used to inherit the classes and its methods




// // class myclass{

// // constructor(brand){

// //     this.brand=brand
// //     console.log(this.brand)
// // }

// //     start(){
// //         console.log("stat")
// //     } 

// //     newbrand(brand){
// //   this.new2=brand
// //   console.log(this.new2)
// //     }
// // }



// // class class2 extends myclass{

// // constructor(branch){
// //     console.log("enter child constructor")
// //     super(this.brand )
// //     this.branch=branch
// //     console.log("enter child constructor")
// // }

// // workk(){
// //     console.log("solve problems ")
// // }

// // }


// // let obj=new class2("hemlooo")







// function user(username , logincount){
// this.username=username;
// this.logincount=logincount

// return this
// }


// const userOne= new user("utkarsj" , 122)
// const usertwo= new user("utkarsj" , 12)



// console.log(usertwo)













// imp



// A constructor runs every time a new object is created.

// class User {
//   name: string
//   email: string

//   constructor(name: string, email: string) {
//     this.name = name
//     this.email = email
//   }
// }

// const u1 = new User("Ayush", "a@gmail.com")
// const u2 = new User("Ravi", "r@gmail.com")




// Use a constructor only when the object is being born and you need to
// Put required data into it

// Make sure it starts in a valid state

// Set safe defaults


// A constructor is good for:

// Assigning required fields

// Validating invariants (rules that must always be true)

// Setting default values

// Normalizing data

// Preparing internal state





// class User {
//   id: string
//   email: string
//   role: string

//   constructor(id: string, email: string, role?: string) {
//     if (!id) throw new Error("id is required")
//     if (!email.includes("@")) throw new Error("invalid email")

//     this.id = id
//     this.email = email.toLowerCase()
//     this.role = role ?? "user"
//   }
// }



// What it must not do:

// Save to DB

// Call services

// Send emails

// Apply business flows

// Decide system behavior




// An instance is a real object created from a class.
// It represents one concrete entity in memory and has its own independent data and state.

// A class is just a blueprint.
// An instance is the actual thing built from that blueprint.


// Each instance:

// Is created using new

// Belongs to a class

// Has its own copy of fields

// Uses the same methods, but on its own data



// class User {
//   name: string

//   constructor(name: string) {
//     this.name = name
//   }

//   rename(newName: string) {
//     this.name = newName
//   }
// }

// const u1 = new User("Ayush") // instance of User
// const u2 = new User("Ravi")  // another instance of User

// u1.rename("Aman")

// console.log(u1.name) // "Aman"
// console.log(u2.name) // "Ravi"


// Here:

// User → class (blueprint)

// u1, u2 → instances (real objects)

// rename() uses this → “this instance”

// Changing u1 does not affect u2

// That independence is the core meaning of instance.







// Static: A member that belongs to the class itself, not to any one object. It represents rules or behavior about the concept in general.



// Rule to remember:

// If logic needs this (a real object) → instance

// If logic does not need any object → static





// class User {
//   name: string
//   email: string

//   constructor(name: string, email: string) {
//     this.name = name
//     this.email = email
//   }

//   // INSTANCE METHOD → works on ONE user (this instance)
//   changeEmail(newEmail: string) {
//     if (!User.isValidEmail(newEmail)) {
//       throw new Error("Invalid email")
//     }

//     this.email = newEmail
//   }

//   // STATIC METHOD → rule about USERS in general
//   static isValidEmail(email: string) {
//     return email.includes("@")
//   }
// }

// const u1 = new User("Ayush", "a@gmail.com")

// u1.changeEmail("new@gmail.com")   // instance behavior (this user)
// User.isValidEmail("test@gmail.com") // static behavior (users in general)

// changeEmail is instance because it modifies this user.

// isValidEmail is static because it’s just a rule and doesn’t need any user.









// private

//   constructor(id: string, email: string, role?: string) {
//     if (!id) throw new Error("id is required")
//     if (!email.includes("@")) throw new Error("invalid email")

//     this.id = id
//     this.email = email.toLowerCase()
//     this.role = role ?? "user"
//   }







// class BankAccount {
//   private balance: number

//   constructor(initialBalance: number) {
//   if( initialBalance < 0) throw new Error( "you cannot have intial value as negative");
//   this .balance=initialBalance
//   }




//   public deposit(amount: number) {
//     if (amount <= 0) {
//       throw new Error("Deposit must be positive")
//     }
//     this.balance += amount
//   }

//     public withdraw(amount: number) {
//     if (amount > this.balance) {
//       throw new Error("Insufficient balance")
//     }
//     this.balance -= amount
//   }

//    public getBalance() {
//     return this.balance
//   }
// }



// const acc=new BankAccount(1000)

// console.log(acc.getBalance())








// class BankAccount {
//   #balance

//   constructor(initialBalance) {
//     if (initialBalance < 0) {
//       throw new Error("Initial balance cannot be negative")
//     }
//     this.#balance = initialBalance
//   }

//   deposit(amount) {
//     if (amount <= 0) {
//       throw new Error("Deposit must be positive")
//     }
//     this.#balance += amount
//   }

//   withdraw(amount) {
//     if (amount > this.#balance) {
//       throw new Error("Insufficient balance")
//     }
//     this.#balance -= amount
//   }

//   getBalance() {
    
//     return this.#balance
//   }
// }


// const acc=new BankAccount(1000)

// console.log(acc.getBalance())










// Encapsulation means keeping a class’s data hidden and allowing it to be changed only through safe methods.

// Hide the data. Control how it changes.



// class BankAccount {
//   private balance: number

//   constructor(initial: number) {
//     this.balance = initial
//   }

//   // public method – safe way to change data
//   deposit(amount: number) {
//     if (amount <= 0) throw new Error("Invalid amount")
//     this.balance += amount
//   }

//   // public method – safe way to read data
//   getBalance() {
//     return this.balance
//   }
// }

// const acc = new BankAccount(1000)

// acc.deposit(500)         
// console.log(acc.getBalance()) 
// acc.balance = 99999       // not allowed (private)



// Here:

// balance is hidden (private)

// Outside code cannot change it directly

// All changes go through your rules (deposit)





















// Simple Definition

// Abstraction means giving the user of a class a clear action to call without exposing the internal steps.

// In other words:

// Outside code should say what it wants done

// The class itself decides how it is done

// The caller should not care about the internal complexity.















// class Payment {
//   pay(amount: number) {
//     this.validate(amount)
//     this.connectToGateway()
//     this.charge(amount)
//     this.log()
//   }

//   private validate(amount: number) {
//     if (amount <= 0) throw new Error("Invalid amount")
//   }

//   private connectToGateway() {
//     // connect to Stripe / Razorpay / etc
//   }

//   private charge(amount: number) {
//     // charge user
//   }

//   private log() {
//     // save transaction
//   }
// }



// The easiest way to remember the difference is:

// Encapsulation → hides data

// Abstraction → hides steps / complexity



// Both “hide” something, but they hide different things.














// 3. Inheritance

// “One class becomes a specialized version of another.”

// Inheritance means:

// A class can extend another class and automatically get its behavior.





// class Payment {
//   pay(amount: number) {
//     console.log("Paying", amount)
//   }
// }

// class CardPayment extends Payment {
//   validateCard() {
//     console.log("Validating card")
//   }
// }

// const p = new CardPayment()

// p.pay(500)          // inherited from Payment
// p.validateCard()    // its own method






// compostion


// Composition means building a class by using other objects instead of extending them.

// class OtpService {
//   verify() {
//     console.log("OTP verified")
//   }
// }

// class FraudService {
//   check() {
//     console.log("Fraud check passed")
//   }
// }

// class Gateway {
//   charge(amount: number) {
//     console.log("Charged:", amount)
//   }
// }

// class Payment {
//   constructor(
//     private gateway: Gateway,
//     private otp?: OtpService,
//     private fraud?: FraudService
//   ) {}

//   pay(amount: number) {
//     if (this.otp) this.otp.verify()
//     if (this.fraud) this.fraud.check()

//     this.gateway.charge(amount)
//   }
// }




// inheritance problem




// class AppNotification {
//   send(message: string) {
//     console.log("Base notification:", message)
//   }
// }

// class EmailNotification extends AppNotification {
//   send(message: string) {
//     console.log("Sending EMAIL:", message)
//   }
// }

// class SmsNotification extends AppNotification {
//   send(message: string) {
//     console.log("Sending SMS:", message)
//   }
// }

// // usage
// const email = new EmailNotification()
// const sms = new SmsNotification()

// email.send("Welcome to our app")
// sms.send("Your OTP is 1234")




// Small, focused sender classes
// class EmailSender {
//   send(message: string) {
//     console.log("Sending EMAIL:", message)
//   }
// }

// class SmsSender {
//   send(message: string) {
//     console.log("Sending SMS:", message)
//   }
// }

// // The composed Notifier
// class Notifier {
//   constructor(private sender: { send(message: string): void }) {}

//   notify(message: string) {
//     this.sender.send(message)
//   }
// }

// // Usage
// const emailNotifier = new Notifier(new EmailSender())
// const smsNotifier = new Notifier(new SmsSender())

// emailNotifier.notify("Welcome to our app")
// smsNotifier.notify("Your OTP is 1234")
