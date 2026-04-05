// import type { AuthServices } from "../../interface/AuthInterface.ts";
// import type { LoginCredentials, RegisterUser, VerifyPayload } from "../../types/AuthTypes.ts";
// import type { UserLogin } from "../use-cases/auth/LoginUser.ts";
// import type { UserRegister } from "../use-cases/auth/RegisterUser.ts";
// import type { UserVerify } from "../use-cases/auth/VerifyUser.ts";

//       
//   async login(data: LoginCredentials) {
//     await this.loginUser.execute(data);
//   }

//   async register(data: RegisterUser) {
//     await this.registerUser.execute(data);
//   }



//   async verify(data: VerifyPayload) {
//     await this.verifyUser.execute(data);
//   }
// }







// 1. application    → Use-cases & Services (business operations, orchestration)
// 2. domain         → Entities / business models / core logic
// 3. composition    → Wiring / dependency injection (connecting everything)
// 4. infra          → Implementations of ports (DB, email, external APIs)
// 5. interfaces     → Controllers / Adapters (HTTP, CLI, GraphQL)
// 6. routes         → Route definitions (Fastify/Express routing)
// 7. shared         → Utilities, helpers, constants, validation
