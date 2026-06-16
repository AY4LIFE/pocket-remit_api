import {IsString, IsNotEmpty, IsIn} from "class-validator"

// This DTO is used when someone is creating a wallet
// We only need one field - the currenct they want

export class createWalletDto{
    // @IsIn checks that the value is in one of the allowed options
    @IsString()
    @IsNotEmpty()
    @IsIn(["NGN","ngn", "GHS", "ghs", "USD", "usd", "eur", "EUR"], {
        message: "Currency must be one of: NGN, USD, GHS, EUR"
    })
    currency: string = ""
}