import {IsEmail, IsNotEmpty, IsString, MinLength} from "class-validator"


// ----------------------------------------------
// This DTO is used when someone is Registering
// Each decorator above a propert is a RULE
// If the ule is broken, class-validator will collect the error
//------------------------------------------------

export class RegisterDto {
    @IsEmail()      // Must be a valid email format
    email!: string;

    @MinLength(8)   // Password must be at least 8 characters
    password!: string

    @IsString()     // Must be a string
    @IsNotEmpty()   // Cannot be an empty string
    full_name!: string
}

// --------------------------------------------------
// This DTO is used when someone is logging in
// --------------------------------------------------

export class LoginDto{
    @IsEmail()
    email!: string

    @IsString()
    @IsNotEmpty()
    password!: string

}