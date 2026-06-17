import {
    IsNumber,
    IsString,
    IsNotEmpty,
    IsOptional,
    IsPositive,
    IsIn,
} from 'class-validator'
import { Transform } from 'class-transformer'
// ------------------------------------
// INITIATETRANSFERDTO
// This is the shape of the request body when a user
// hits POST /transfers
//
// class-validator decorators automatically reject requests
// that don't match these rules — before your service ever runs
// ------------------------------------
export class InitiateTransferDto{
    @IsNumber()
    @IsPositive()
    amount!: number // Must be a positive number

    @IsString()
    @IsIn(['NGN', 'USD', 'GHS', 'EUR'])
    currency!: string

    @IsString()
    @IsNotEmpty()
    recipientAccount!: string

    @IsString()
    @IsNotEmpty()
    bankCode!: string

    @IsOptional()
    @IsString()
    @Transform(({ value }: { value: any }) => value ?? undefined)
    narration?: string
}