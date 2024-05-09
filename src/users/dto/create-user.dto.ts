import { Type } from "class-transformer";
import { IsNotEmpty, IsEmail, IsNotEmptyObject, IsObject, ValidateNested, IsMongoId, IsString } from "class-validator";
import mongoose from "mongoose";
import {ApiProperty} from '@nestjs/swagger'

class Company {
    _id: mongoose.Schema.Types.ObjectId;

    @IsNotEmpty()
    name: string
}

export class CreateUserDto {

    @IsNotEmpty()
    name: string;

    @IsEmail({}, { message: 'Wrong Format!' })
    @IsNotEmpty({ message: 'Email not empty!' })
    email: string;

    @IsNotEmpty()
    password: string;

    @IsNotEmpty()
    age: number;

    @IsNotEmpty()
    gender: string;

    @IsNotEmpty()
    address: string;

    @IsNotEmpty()
    @IsMongoId()
    role: mongoose.Schema.Types.ObjectId;

    @IsNotEmptyObject()
    @IsObject()
    @ValidateNested()
    @Type(() => Company)
    company: Company;
}


export class RegisterUserDto {

    @IsNotEmpty()
    name: string;

    @IsEmail({}, { message: 'Wrong Format!' })
    @IsNotEmpty({ message: 'Email not empty!' })
    email: string;

    @IsNotEmpty()
    password: string;

    @IsNotEmpty()
    age: number;

    @IsNotEmpty()
    gender: string;

    @IsNotEmpty()
    address: string;
}

export class UserLoginDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({ example: '..', description: 'username' })
    readonly username: string;
    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        example: '..',
        description: 'password',
    })
    readonly password: string;
}